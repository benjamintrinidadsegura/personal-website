import { edgeAnchor, labConnection, mixMotion, type LabScene, type MotionPoint } from "./space";
import { planFlights, sampleFlight, type Obstacle } from "./choreography";

export type LabMotion = { stop: () => void; pan: (x: number) => void; release: () => void; finish: () => void };
/** Finite, interruptible motion: shared coordinates drive transforms and paths. No frame-time layout reads. */
export function startLabMotion(root: HTMLElement, scene: LabScene, memory: Map<string, MotionPoint>): LabMotion {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const compact = matchMedia("(max-width: 1199px)");
  const initial = memory.size === 0;
  const elements = [...root.querySelectorAll<HTMLElement>("[data-lab-object]")].map(element => ({
    id: element.dataset.labObject!, element,
    button: element.querySelector<HTMLButtonElement>("button")!,
    path: root.querySelector<SVGPathElement>('[data-connection="' + element.dataset.labObject + '"]')!,
    width: 0, height: 0,
  }));
  const lens = root.querySelector<HTMLElement>("[data-search-lens]")!;
  const svg = root.querySelector<SVGSVGElement>("svg[data-space-strings]")!;
  const center = root.querySelector<HTMLElement>("[data-search-center]") ?? lens;
  const targets = new Map<string, MotionPoint>();
  let origin = { x: 0, y: 0 }, liveOrigin={x:0,y:0},lensWidth = 0, lensHeight = 0;
  let frame = 0, stopped = false, panX = 0, geometry = "";
  let anchorFrom: MotionPoint | undefined, extentFrom: MotionPoint | undefined, connectionProgress = 1;
  let room={width:0,height:0},obstacle:Obstacle={x:0,y:0,width:0,height:0};
  const activeId=scene.nodes.find(node=>node.index===scene.selectedIndex)?.item.id;

  const draw = () => {
    center.style.transform="translateX(-50%) translate3d("+(liveOrigin.x-origin.x)+"px,"+(liveOrigin.y-origin.y)+"px,0)";
    const selected = scene.focus ? memory.get(activeId ?? "") : undefined;
    const selectedRecord = selected ? elements.find(record => record.id === activeId) : undefined;
    const anchorTarget = selected ?? { ...liveOrigin, opacity:1, scale:1, turn:0 };
    const extentTarget = { x:selectedRecord ? selectedRecord.width * selected!.scale : lensWidth,
      y:selectedRecord ? selectedRecord.height * selected!.scale : lensHeight, opacity:1, scale:1, turn:0 };
    // A connection's source migrates with the same finite flight as its objects.
    // Preserve its actual intermediate geometry when Focus or a query interrupts it.
    const anchor = mixMotion(anchorFrom ?? anchorTarget, anchorTarget, connectionProgress);
    const extent = mixMotion(extentFrom ?? extentTarget, extentTarget, connectionProgress);
    memory.set("@anchor",anchor); memory.set("@extent",extent);
    for (const record of elements) {
      const point = memory.get(record.id);
      if (!point) continue;
      record.element.style.transform = "translate3d(" + point.x + "px," + point.y + "px,0) translate(-50%,-50%) rotate(" + point.turn + "deg) scale(" + point.scale + ")";
      record.element.style.opacity = String(point.opacity);
      record.element.style.setProperty("--live-scale", String(point.scale));
      const targetWorld = compact.matches ? scene.world.compact : scene.world.wide;
      const world = memory.get("@world") ?? {x:room.width * targetWorld.x / 100,y:targetWorld.y};
      record.element.style.setProperty("--art-dx", ((world.x - point.x) / point.scale) + "px");
      record.element.style.setProperty("--art-dy", ((world.y - point.y) / point.scale) + "px");
      record.element.style.pointerEvents = point.opacity < .2 ? "none" : "";
      record.element.style.visibility = point.opacity > .005 || targets.get(record.id)?.opacity === 1 ? "visible" : "hidden";
      const migrating = record.id !== activeId;
      const source = migrating ? anchor : liveOrigin;
      const end = edgeAnchor(source, point, record.width * point.scale, record.height * point.scale, point.turn);
      const start = edgeAnchor(point, source, migrating ? extent.x : lensWidth, migrating ? extent.y : lensHeight, migrating ? anchor.turn : 0);
      record.path.setAttribute("d", labConnection(start, end));
      record.path.style.opacity = String(point.opacity);
      if (record.id === activeId) {
        root.style.setProperty("--light-x", point.x + "px");
        root.style.setProperty("--light-y", point.y + "px");
      }
    }
  };
  const animate = (instant = false) => {
    cancelAnimationFrame(frame);
    const from = new Map(memory);
    const worldTarget = compact.matches ? scene.world.compact : scene.world.wide;
    const worldTo = { x:room.width * worldTarget.x / 100, y:worldTarget.y, opacity:1, scale:1, turn:0 };
    const worldFrom = from.get("@world") ?? worldTo;
    const fromOrigin=memory.get("@lens")??{...origin,opacity:1,scale:1,turn:0};
    anchorFrom = memory.get("@anchor") ?? fromOrigin;
    extentFrom = memory.get("@extent");
    const changed = [...targets].some(([id,target]) => {
      const point = memory.get(id);
      return !point || Object.keys(target).some(key => Math.abs(target[key as keyof MotionPoint] - point[key as keyof MotionPoint]) > .001);
    });
    const animated = !instant && !reduced.matches && changed;
    const flights=animated ? planFlights([...targets].map(([id,to])=>{
      const record=elements.find(record=>record.id===id)!;
      return {id,from:from.get(id)??to,to,width:record.width,height:record.height};
    }).sort((a,b)=>Number(b.id===activeId)-Number(a.id===activeId)),obstacle,room) : [];
    // One shared deadline for objects, lens and connections. Small gestures settle
    // sooner; detours receive time proportional to their actual planned distance.
    const travel = Math.max(0,...flights.filter(flight => flight.to.opacity > 0).map(flight => flight.distance));
    const duration = !animated ? 0 : scene.direction === "atlas" ? Math.round(Math.min(320,180 + travel * .18)) : 460;
    const began=performance.now();
    const step = (now: number) => {
      if (stopped) return;
      const elapsed = duration ? Math.min(1, (now - began) / duration) : 1;
      const eased = scene.direction === "atlas"
        ? (1 - (1 + 8 * elapsed) * Math.exp(-8 * elapsed)) / (1 - 9 * Math.exp(-8))
        : 1 - Math.pow(1 - elapsed, 3);
      memory.set("@world", mixMotion(worldFrom, worldTo, eased));
      connectionProgress = eased;
      const lensPoint=mixMotion(fromOrigin,{...origin,opacity:1,scale:1,turn:0},eased);
      memory.set("@lens",lensPoint);liveOrigin=lensPoint;
      if(duration) for(const flight of flights)memory.set(flight.id,sampleFlight(flight,eased));
      else for (const [id, target] of targets) memory.set(id, mixMotion(from.get(id) ?? target, target, eased));
      draw();
      if (elapsed < 1) frame = requestAnimationFrame(step);
      else if(typeof document!=="undefined" && typeof innerHeight==="number"){
        const selected=elements.find(record=>record.id===activeId && document.activeElement===record.button);
        if(selected){
          // One completion-time read keeps a transformed keyboard target visible.
          const visible=selected.button.querySelector?.("strong")??selected.button,bounds=visible.getBoundingClientRect();
          if(bounds.top<85 || bounds.bottom>innerHeight-8)visible.scrollIntoView({block:"nearest",behavior:"instant"});
        }
      }
    };
    step(began);
  };
  const measure = (force = false) => {
    if (stopped) return;
    // All geometry is read together, only on a scene change or resize.
    // Keep an exiting object's last silhouette while React retires its search role.
    // These presentation-only attributes never change search membership or ranking.
    for(const record of elements){
      const node=scene.nodes.find(node=>node.item.id===record.id);
      if(node){record.element.dataset.motionRole=node.role;record.element.dataset.motionSurface=node.desktop.x>=50?"paper":"navy";}
    }
    const previousTransform=center.style.transform;
    center.style.transform="translateX(-50%)";
    const bounds = root.getBoundingClientRect();
    if (scene.direction === "atlas" && typeof innerHeight === "number" && typeof lens.offsetTop === "number") {
      const before=lens.getBoundingClientRect(),controls=center.getBoundingClientRect();
      center.style.top = Math.max(150, bounds.height / 2 - (before.top-controls.top) - before.height/2) + "px";
    }
    const input = lens.getBoundingClientRect(),search=center.getBoundingClientRect();
    const measuredTitle=elements.find(record=>record.id===activeId)?.button.querySelector?.("strong");
    const signature = [measuredTitle?.offsetHeight,measuredTitle?.offsetTop,bounds.width,bounds.height,input.left-bounds.left,input.top-bounds.top,input.width,input.height,search.height,compact.matches].join("|");
    if (!force && signature === geometry) {center.style.transform=previousTransform;return;}
    geometry = signature;
    // A focus world can collapse the introduction. Rebase the existing frame in
    // document coordinates so the surviving object and lens do not teleport.
    const location={x:bounds.left+(typeof scrollX==="number"?scrollX:0),y:bounds.top+(typeof scrollY==="number"?scrollY:0)};
    const previousRoom=memory.get("@room");
    if(previousRoom){
      const dx=previousRoom.x-location.x,dy=previousRoom.y-location.y;
      if(Math.abs(dx)>.01||Math.abs(dy)>.01)for(const[id,point]of memory)if(id!=="@room" && id!=="@extent" && id!=="@world" && !id.startsWith("@size:") && !id.startsWith("@title:"))memory.set(id,{...point,x:point.x+dx,y:point.y+dy});
    }
    memory.set("@room",{...location,opacity:1,scale:1,turn:0});
    room={width:bounds.width,height:bounds.height};
    origin = { x: input.left - bounds.left + input.width / 2, y: input.top - bounds.top + input.height / 2 };
    const previousOrigin=memory.get("@lens")??origin;
    obstacle={x:search.left-bounds.left,y:search.top-bounds.top,width:search.width,height:search.height,
      fromX:search.left-bounds.left+previousOrigin.x-origin.x,fromY:search.top-bounds.top+previousOrigin.y-origin.y};
    lensWidth = input.width; lensHeight = input.height;
    for (const record of elements) {
      record.width = record.button.offsetWidth; record.height = record.button.offsetHeight;
      const title = record.button.querySelector?.("strong");
      if (title) record.element.style.setProperty("--title-height", title.offsetHeight + "px");
      const previousSize = memory.get("@size:" + record.id), point = memory.get(record.id);
      // A caption can become the headline during an interrupted search. Preserve
      // its painted size before planning the flight with the new CSS dimensions.
      if (previousSize && point && point.opacity > .01 && record.width && record.height) {
        const ratio = Math.min(previousSize.x / record.width, previousSize.y / record.height), scale=point.scale * ratio;
        const oldTitle=memory.get("@title:"+record.id), offset=title?{x:title.offsetLeft-record.width/2,y:title.offsetTop-record.height/2}:null;
        memory.set(record.id,{...point,scale,x:point.x+(oldTitle&&offset?oldTitle.x*point.scale-offset.x*scale:0),y:point.y+(oldTitle&&offset?oldTitle.y*point.scale-offset.y*scale:0)});
      }
      if(title)memory.set("@title:"+record.id,{x:title.offsetLeft-record.width/2,y:title.offsetTop-record.height/2,opacity:1,scale:1,turn:0});
      memory.set("@size:" + record.id, { x:record.width, y:record.height, opacity:1, scale:1, turn:0 });
    }
    const selectedNode=scene.nodes.find(node=>node.item.id===activeId),selectedRecord=elements.find(record=>record.id===activeId);
    const selectedTitle=selectedRecord?.button.querySelector?.("strong");
    if(selectedNode&&selectedRecord&&selectedTitle){
      const position=compact.matches?selectedNode.compact:selectedNode.desktop;
      const top=position.y*bounds.height/(compact.matches?640:760)-selectedRecord.height/2+selectedTitle.offsetTop;
      root.parentElement?.style.setProperty("--focus-copy-y",(top+selectedTitle.offsetHeight+24)+"px");
      root.parentElement?.style.setProperty("--compact-focus-y",(search.top-bounds.top+search.height+24)+"px");
    }
    svg.setAttribute("viewBox", "0 0 " + bounds.width + " " + bounds.height);
    for (const record of elements) {
      const node = scene.nodes.find(node => node.item.id === record.id);
      const previous = memory.get(record.id);
      record.element.inert = !node || compact.matches && (node.role === "note" || scene.focus && node.relation);
      if (node) {
        const position = compact.matches ? node.compact : node.desktop;
        const scale = scene.focus ? compact.matches ? node.focusCompactScale : node.focusScale : compact.matches ? node.compactScale : node.scale;
        const target = { x: bounds.width * position.x / 100, y: scene.canvas ? position.y * bounds.height / (compact.matches ? 640 : 760) : position.y, opacity: compact.matches && (node.role === "note" || scene.focus && node.relation) ? 0 : node.depth, scale, turn: node.index === scene.selectedIndex ? 0 : node.turn };
        targets.set(record.id, target);
        if (!previous || previous.opacity < .01) memory.set(record.id, initial ? target : { ...target, x: origin.x + (target.x - origin.x) * .88, y: origin.y + (target.y - origin.y) * .88, opacity: 0, scale: .92 });
      } else {
        const base = previous ?? { ...origin, scale: .92, turn: 0, opacity: 0 };
        const target = { ...base, opacity: 0, scale: .92 };
        if (base.opacity > .01) { target.x = origin.x + (base.x - origin.x) * 1.04; target.y = Math.min(bounds.height-35,origin.y + (base.y-origin.y)*1.04); }
        targets.set(record.id,target);
        if (!previous) memory.set(record.id,target);
      }
    }
    animate();
  };
  const observer = new ResizeObserver(() => measure());
  observer.observe(root);
  observer.observe(lens);
  observer.observe(center);
  const title=elements.find(record=>record.id===activeId)?.button.querySelector?.("strong");
  if(title)observer.observe(title);
  const onPreference = () => measure(true);
  reduced.addEventListener("change", onPreference);
  compact.addEventListener("change", onPreference);
  measure(true);
  return {
    stop() {
      stopped = true; cancelAnimationFrame(frame); observer.disconnect();
      reduced.removeEventListener("change", onPreference); compact.removeEventListener("change", onPreference);
    },
    pan(x) {
      cancelAnimationFrame(frame);
      const delta = x - panX; panX = x;
      for (const [id, point] of memory) if(!id.startsWith("@"))memory.set(id, { ...point, x: point.x + delta });
      draw();
    },
    release() { panX = 0; animate(); },
    finish() { animate(true); },
  };
}
