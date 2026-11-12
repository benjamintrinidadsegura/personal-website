import { mixMotion, type MotionPoint, type SpacePoint } from "./space";

export type Obstacle = { x: number; y: number; width: number; height: number; fromX?:number;fromY?:number };
export type Flight = { id: string; from: MotionPoint; to: MotionPoint; width: number; height: number };
type Route = Flight & { points: SpacePoint[]; lengths: number[]; distance: number; recess: number[] };
const steps = 32;
const between = (a: number, b: number, t: number) => a + (b-a)*t;
function at(route: Route, t: number): MotionPoint {
  const point = mixMotion(route.from,route.to,t), distance = route.distance*t;
  let travelled = 0;
  for (let i=0;i<route.lengths.length;i++) {
    const length = route.lengths[i];
    if (distance <= travelled+length || i===route.lengths.length-1) {
      const p = length ? Math.min(1,(distance-travelled)/length) : 1;
      point.x=between(route.points[i].x,route.points[i+1].x,p);
      point.y=between(route.points[i].y,route.points[i+1].y,p); break;
    }
    travelled+=length;
  }
  // Retiring objects leave the composition before incoming ones become solid.
  if (route.to.opacity===0) point.opacity=route.from.opacity*Math.max(0,1-t*4);
  if (route.from.opacity<.01 && route.to.opacity>0) point.opacity=route.to.opacity*Math.min(1,t*2);
  return point;
}
function routeOf(flight: Flight, points: SpacePoint[]): Route {
  const rounded: SpacePoint[]=[points[0]];
  for(let i=1;i<points.length-1;i++) {
    const a=points[i-1],b=points[i],c=points[i+1],ab=Math.hypot(b.x-a.x,b.y-a.y),bc=Math.hypot(c.x-b.x,c.y-b.y);
    const radius=Math.min(12,ab/3,bc/3);
    if(!radius)continue;
    const enter={x:b.x+(a.x-b.x)*radius/ab,y:b.y+(a.y-b.y)*radius/ab};
    const leave={x:b.x+(c.x-b.x)*radius/bc,y:b.y+(c.y-b.y)*radius/bc};
    rounded.push(enter);
    for(let j=1;j<=6;j++){const t=j/6;rounded.push({x:(1-t)**2*enter.x+2*(1-t)*t*b.x+t*t*leave.x,y:(1-t)**2*enter.y+2*(1-t)*t*b.y+t*t*leave.y});}
  }
  rounded.push(points[points.length-1]);points=rounded;
  const lengths=points.slice(1).map((p,i)=>Math.hypot(p.x-points[i].x,p.y-points[i].y));
  return {...flight,points,lengths,distance:lengths.reduce((a,b)=>a+b,0),recess:Array(steps+1).fill(1)};
}
function intersects(a: SpacePoint,b: SpacePoint,r: Obstacle): boolean {
  let low=0,high=1;
  for (const [v,d,min,max] of [[a.x,b.x-a.x,r.x,r.x+r.width],[a.y,b.y-a.y,r.y,r.y+r.height]]) {
    if (Math.abs(d)<.001) { if(v<=min || v>=max) return false; }
    else { const l=(min-v)/d,h=(max-v)/d;low=Math.max(low,Math.min(l,h));high=Math.min(high,Math.max(l,h));if(low>=high)return false; }
  }
  return true;
}
function occupied(a: Route,b: Route,t: number): boolean {
  const p=at(a,t),q=at(b,t);
  if(p.opacity<.4 || q.opacity<.4)return false;
  // Conservative rectangular envelopes include slight rotation and a small clearance.
  return Math.abs(p.x-q.x)<(a.width*p.scale+b.width*q.scale)*.54+5
    && Math.abs(p.y-q.y)<(a.height*p.scale+b.height*q.scale)*.54+5;
}
function searchOccupied(route:Route,obstacle:Obstacle,t:number):boolean {
  const p=at(route,t);if(p.opacity<.4)return false;
  const x=between(obstacle.fromX??obstacle.x,obstacle.x,t),y=between(obstacle.fromY??obstacle.y,obstacle.y,t);
  // Clearance also covers the small width change of the moving focus lens.
  const rx=route.width*p.scale*.56+30,ry=route.height*p.scale*.56+12;
  return p.x+rx>x && p.x-rx<x+obstacle.width && p.y+ry>y && p.y-ry<y+obstacle.height;
}
/** Bounded planning on intent changes, never during a render frame. */
export function planFlights(flights: readonly Flight[], obstacle: Obstacle, room: {width:number;height:number}): Route[] {
  const planned: Route[]=[];
  for(const flight of flights) {
    const {from,to}=flight;
    if(to.opacity===0) { planned.push(routeOf(flight,[from,{...from}]));continue; }
    const sx=Math.max(from.scale,to.scale)*flight.width*.56+10,sy=Math.max(from.scale,to.scale)*flight.height*.56+10;
    const left=obstacle.x-sx,right=obstacle.x+obstacle.width+sx,top=obstacle.y-sy,bottom=obstacle.y+obstacle.height+sy;
    const candidates: SpacePoint[][]=[[from,to]];
    for(const y of [Math.max(sy,top-12),Math.min(room.height-sy,bottom+12)]) candidates.push([from,{x:from.x,y},{x:to.x,y},to]);
    for(const x of [Math.max(sx,left-12),Math.min(room.width-sx,right+12)]) candidates.push([from,{x,y:from.y},{x,y:to.y},to]);
    candidates.push([from,{x:left,y:top},{x:right,y:top},to],[from,{x:left,y:bottom},{x:right,y:bottom},to],
      [from,{x:right,y:top},{x:left,y:top},to],[from,{x:right,y:bottom},{x:left,y:bottom},to]);
    const expanded={x:left,y:top,width:right-left,height:bottom-top};
    const routes=candidates.map(points=>routeOf(flight,points));
    const cost=(r: Route)=>{
      const wall=r.points.slice(1).filter(p=>p.x<sx || p.x>room.width-sx || p.y<sy || p.y>room.height-sy).length;
      const moving=obstacle.fromX!==undefined || obstacle.fromY!==undefined;
      const lens=moving ? Array.from({length:steps-1},(_,i)=>i+1).filter(i=>searchOccupied(r,obstacle,i/steps)).length
        : r.points.slice(1).filter((p,i)=>intersects(r.points[i],p,expanded)).length;
      let collisions=0;
      for(const other of planned)for(let i=1;i<steps;i++)if(occupied(r,other,i/steps))collisions++;
      // Never trade the room boundary for a decorative detour over the page header.
      return r.distance+wall*10000000+lens*20000+collisions*500;
    };
    const ranked=routes.map(route=>({route,cost:cost(route)})).sort((a,b)=>a.cost-b.cost);
    planned.push(ranked[0].route);
  }
  // Crowded/interrupted starts may have no clear route. Recede the lower-priority
  // surface briefly instead of painting two solid interactive objects through one another.
  for(let a=0;a<planned.length;a++)for(let b=a+1;b<planned.length;b++)for(let i=1;i<steps;i++) {
    if(!occupied(planned[a],planned[b],i/steps))continue;
    const r=planned[b];
    for(let j=Math.max(1,i-2);j<=Math.min(steps-1,i+2);j++)r.recess[j]=Math.min(r.recess[j],.12+Math.abs(i-j)*.16);
  }
  for(const r of planned)for(let i=1;i<steps;i++)if(searchOccupied(r,obstacle,i/steps)) {
    for(let j=Math.max(1,i-2);j<=Math.min(steps-1,i+2);j++)r.recess[j]=Math.min(r.recess[j],.08+Math.abs(i-j)*.12);
  }
  return planned;
}
export function sampleFlight(route: ReturnType<typeof planFlights>[number], progress: number): MotionPoint {
  const t=Math.max(0,Math.min(1,progress)),p=at(route,t),index=Math.min(steps-1,Math.floor(t*steps));
  p.opacity*=between(route.recess[index],route.recess[index+1],t*steps-index);
  return p;
}
