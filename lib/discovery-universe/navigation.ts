type LinkIntent = {button:number;defaultPrevented:boolean;metaKey:boolean;ctrlKey:boolean;shiftKey:boolean;altKey:boolean};
/** The existing document capture handler may have already committed a home hash.
 * Acknowledge that reached destination; never treat a cancelled, unreached click
 * or a modified/new-tab gesture as navigation. The provider owns final settlement.
 */
export function canHandoffUniverseLink(event:LinkIntent, targetHref:string, currentHref:string):boolean {
  if(event.button!==0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)return false;
  try {
    const current=new URL(currentHref),target=new URL(targetHref,current);
    if(target.origin!==current.origin || !["http:","https:"].includes(target.protocol))return false;
    return !event.defaultPrevented || Boolean(target.hash && target.href===current.href);
  }catch{return false;}
}
