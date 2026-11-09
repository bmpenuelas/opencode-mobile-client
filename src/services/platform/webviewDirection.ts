import {
  getWebviewDirection,
  type WebviewDirection,
} from '@/services/storage/uiPreferences'

export function buildDirectionScript(direction: WebviewDirection): string {
  const dirLiteral = JSON.stringify(direction)
  return `(function(){
    var d=${dirLiteral};
    function apply(){
      if(!document.documentElement)return false;
      document.documentElement.dir=d;
      return true;
    }
    if(!apply()){
      if(document.addEventListener)document.addEventListener('DOMContentLoaded',apply,{once:true});
      try{
        var mo=new MutationObserver(function(){if(apply())mo.disconnect();});
        mo.observe(document,{childList:true,subtree:true});
      }catch(e){}
    }
  })();`
}

export function buildWebviewDirectionScript(): string {
  return buildDirectionScript(getWebviewDirection())
}

export function buildPreShowScript(notificationBridgeScript: string): string {
  return `${notificationBridgeScript}\n${buildWebviewDirectionScript()}`
}
