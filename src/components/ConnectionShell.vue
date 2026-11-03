<template>
  <DemoSessionMock
    v-if="demoModeActive && profile"
    :profile-name="profile.name"
  />

  <div v-else class="fixed inset-0 flex flex-col items-center justify-center z-[1] bg-background">
    <div v-if="loading" class="flex flex-col items-center gap-4">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-foreground" />
      <p class="text-sm text-muted-foreground">{{ t('connection.loading') }}</p>
    </div>

    <div v-else-if="errorText" class="flex flex-col items-center gap-4 text-center max-w-[300px]">
      <p class="text-sm text-muted-foreground leading-relaxed">{{ errorText }}</p>
      <div class="flex gap-2">
        <Button @click="retry">{{ t('common.retry') }}</Button>
        <Button variant="outline" @click="goHome">{{ t('common.back') }}</Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import DemoSessionMock from '@/components/DemoSessionMock.vue'
import { InAppBrowser, ToolBarType, BackgroundColor } from '@capgo/capacitor-inappbrowser'
import type { DownloadCompletedEvent, DownloadFailedEvent } from '@capgo/capacitor-inappbrowser'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { useServerStore } from '@/stores/serverStore'
import { useConnectionStore } from '@/stores/connectionStore'
import { registerBackButton, unregisterBackButton } from '@/services/platform/backButton'
import { buildIframeUrl } from '@/services/opencode/url'
import { isDemoModeServer } from '@/services/opencode/demoMode'
import { loadDeviceIntegrationSettings } from '@/services/platform/deviceIntegration'
import { EXTERNAL_LINK_MESSAGE_TYPE, parseExternalLinkUrl } from '@/services/platform/externalLinks'
import {
  buildChatDragBridgeScript,
  buildDownloadBridgeScript,
  buildPreviewFixScript,
} from '@/services/platform/webviewFixes'
import {
  handleDeviceDownloadMessage,
  parseDeviceDownloadMessage,
  resetDeviceDownloads,
  type DeviceDownloadMessage,
} from '@/services/platform/deviceDownloads'
import {
  approveNativeNotificationsFromPrompt,
  denyNativeNotificationsFromPrompt,
  emitNativeNotificationFromWebMessage,
  getNativeNotificationDecision,
  WEB_NOTIFICATION_MESSAGE_TYPE,
} from '@/services/platform/nativeNotifications'
import { useI18n } from '@/i18n'

const route = useRoute()
const router = useRouter()
const serverStore = useServerStore()
const connectionStore = useConnectionStore()
const { t } = useI18n()

const loading = ref(true)
const errorText = ref('')

const serverId = computed(() => route.params.id as string)
const profile = computed(() => serverStore.profiles.find(p => p.id === serverId.value))
const demoModeActive = ref(false)

let browserClosedHandle: any = null
let pageLoadedHandle: any = null
let messageFromWebviewHandle: any = null
let appStateHandle: any = null
let downloadCompletedHandle: any = null
let downloadFailedHandle: any = null
let notificationPromptResolver: ((value: boolean) => void) | null = null
let notificationPromptPromise: Promise<boolean> | null = null

function removeWebviewListeners(): void {
  if (browserClosedHandle) void browserClosedHandle.remove()
  if (pageLoadedHandle) void pageLoadedHandle.remove()
  if (messageFromWebviewHandle) void messageFromWebviewHandle.remove()
  if (appStateHandle) void appStateHandle.remove()
  if (downloadCompletedHandle) void downloadCompletedHandle.remove()
  if (downloadFailedHandle) void downloadFailedHandle.remove()
  browserClosedHandle = null
  pageLoadedHandle = null
  messageFromWebviewHandle = null
  appStateHandle = null
  downloadCompletedHandle = null
  downloadFailedHandle = null
  resetDeviceDownloads()
}

const WEB_NOTIFICATION_PROMPT_RESPONSE_MESSAGE_TYPE = 'opencode:web-notification-prompt-response'

function buildNotificationBridgeScript(): string {
  return `(function(){
    if(window.__oc_nativeNotificationBridge)return;
    window.__oc_nativeNotificationBridge=true;
    function post(payload,attempt){
      var app=window.mobileApp;
      if(app&&typeof app.postMessage==='function'){
        app.postMessage({detail:payload});
        return;
      }
      if(attempt<20)setTimeout(function(){post(payload,attempt+1);},50);
    }
    function send(title,options){
      try{
        options=options||{};
        post({
          type:'${WEB_NOTIFICATION_MESSAGE_TYPE}',
          title:String(title||'OpenCode'),
          body:options.body?String(options.body):'',
          tag:options.tag?String(options.tag):'',
          icon:options.icon?String(options.icon):'',
          silent:Boolean(options.silent)
        },0);
      }catch(e){}
    }
    function MobileNotification(title,options){
      this.title=String(title||'OpenCode');
      this.body=options&&options.body?String(options.body):'';
      this.tag=options&&options.tag?String(options.tag):'';
      this.icon=options&&options.icon?String(options.icon):'';
      this.onclick=null;this.onerror=null;this.onclose=null;this.onshow=null;
      send(title,options);
      var self=this;
      setTimeout(function(){if(typeof self.onshow==='function')self.onshow(new Event('show'));},0);
    }
    MobileNotification.permission='granted';
    MobileNotification.requestPermission=function(callback){
      var promise=Promise.resolve('granted');
      if(typeof callback==='function')promise.then(callback);
      return promise;
    };
    MobileNotification.prototype.close=function(){
      if(typeof this.onclose==='function')this.onclose(new Event('close'));
    };
    MobileNotification.prototype.addEventListener=function(type,listener){
      if(type&&typeof listener==='function')this['on'+type]=listener;
    };
    MobileNotification.prototype.removeEventListener=function(type,listener){
      if(type&&this['on'+type]===listener)this['on'+type]=null;
    };
    MobileNotification.prototype.dispatchEvent=function(event){
      var handler=event&&event.type?this['on'+event.type]:null;
      if(typeof handler==='function')handler.call(this,event);
      return true;
    };
    try{Object.defineProperty(MobileNotification,'name',{value:'Notification'});}catch(e){}
    try{Object.defineProperty(window,'Notification',{configurable:true,writable:true,value:MobileNotification});}
    catch(e){window.Notification=MobileNotification;}
  })();`
}

function jsStringLiteral(value: string): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

function buildExternalLinkScript(): string {
  return `(function(){
    if(window.__oc_externalLinks)return;
    window.__oc_externalLinks=true;
    var origin=null;
    try{origin=window.location.origin;}catch(e){}
    function externalUrl(href){
      var url;
      try{url=new URL(href,window.location.href);}catch(e){return null;}
      if(url.protocol!=='http:'&&url.protocol!=='https:')return null;
      if(origin&&url.origin===origin)return null;
      return url.href;
    }
    document.addEventListener('click',function(event){
      if(event.defaultPrevented)return;
      if(event.button&&event.button!==0)return;
      var node=event.target;
      if(!node||typeof node.closest!=='function')return;
      var anchor=node.closest('a[href]');
      if(!anchor||anchor.hasAttribute('download'))return;
      var url=externalUrl(anchor.getAttribute('href')||'');
      if(!url)return;
      event.preventDefault();
      event.stopPropagation();
      try{window.mobileApp.postMessage({detail:{type:'${EXTERNAL_LINK_MESSAGE_TYPE}',url:url}});}catch(e){}
    },true);
  })();`
}

function buildDeviceClipboardScript(): string {
  return `(function(){
    if(window.__oc_deviceClipboard)return;
    window.__oc_deviceClipboard=true;
    function fallback(text){
      try{
        var area=document.createElement('textarea');
        area.value=text==null?'':String(text);
        area.setAttribute('readonly','');
        area.style.cssText='position:fixed;top:0;left:0;width:1px;height:1px;padding:0;border:0;opacity:0;';
        document.body.appendChild(area);
        var selection=document.getSelection();
        var previous=selection&&selection.rangeCount>0?selection.getRangeAt(0):null;
        area.select();
        area.setSelectionRange(0,area.value.length);
        var copied=false;
        try{copied=document.execCommand('copy');}catch(e){copied=false;}
        document.body.removeChild(area);
        if(previous){selection.removeAllRanges();selection.addRange(previous);}
        return copied;
      }catch(e){return false;}
    }
    var nativeWrite=null;
    try{
      if(navigator.clipboard&&typeof navigator.clipboard.writeText==='function'){
        nativeWrite=navigator.clipboard.writeText.bind(navigator.clipboard);
      }
    }catch(e){}
    var api=navigator.clipboard||{};
    api.writeText=function(text){
      if(nativeWrite){
        try{
          return Promise.resolve(nativeWrite(text)).catch(function(){
            if(fallback(text))return;
            throw new Error('clipboard write failed');
          });
        }catch(e){}
      }
      return fallback(text)?Promise.resolve():Promise.reject(new Error('clipboard write failed'));
    };
    try{Object.defineProperty(navigator,'clipboard',{configurable:true,get:function(){return api;}});}
    catch(e){try{navigator.clipboard=api;}catch(_){}}
  })();`
}

function buildDownloadToastScript(message: string, isError: boolean): string {
  const messageLiteral = jsStringLiteral(message)
  const background = isError ? 'rgba(120,24,24,.96)' : 'rgba(28,28,30,.96)'
  return `(function(){
    var id='oc-device-toast';
    var old=document.getElementById(id);
    if(old)old.remove();
    var style=document.getElementById('oc-device-toast-style');
    if(!style){
      style=document.createElement('style');
      style.id='oc-device-toast-style';
      style.textContent='#oc-device-toast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:2147483647;max-width:82vw;padding:9px 14px;border-radius:10px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;line-height:1.35;color:#fff;background:${background};box-shadow:0 8px 28px rgba(0,0,0,.45);transition:opacity .4s ease;word-break:break-word;}';
      document.head.appendChild(style);
    }
    var toast=document.createElement('div');
    toast.id=id;
    toast.textContent=${messageLiteral};
    document.body.appendChild(toast);
    setTimeout(function(){toast.style.opacity='0';},2600);
    setTimeout(function(){if(toast.parentNode)toast.parentNode.removeChild(toast);},3200);
  })();`
}

async function showDownloadToast(message: string, isError: boolean): Promise<void> {
  try {
    await InAppBrowser.executeScript({ code: buildDownloadToastScript(message, isError) })
  } catch {
    // The web view may already be closing; there is nothing useful to do here.
  }
}

function buildToolbarScript(status: string, displayUrl: string): string {
  const dotColor =
    status === 'connected' ? '#30d158' :
    status === 'checking' || status === 'reconnecting' ? '#ffd60a' :
    status === 'disconnected' || status === 'unreachable' || status === 'wrong_credentials' || status === 'frame_blocked' ? '#ff453a' :
    '#8e8e8e'

  const pulse = status === 'checking' || status === 'reconnecting'

  const statusLabel =
    status === 'connected' ? t('status.connected') :
    status === 'checking' ? t('status.checking') :
    status === 'reconnecting' ? t('status.reconnecting') :
    status === 'disconnected' ? t('status.disconnected') :
    status === 'auth_required' ? t('status.authRequired') :
    status === 'wrong_credentials' ? t('status.wrongCredentials') :
    status === 'unreachable' ? t('status.unreachable') :
    status === 'frame_blocked' ? t('status.blocked') :
    status

  const statusLabelLiteral = jsStringLiteral(statusLabel)
  const displayUrlLiteral = jsStringLiteral(displayUrl)

  return `(function(){
    if(document.getElementById('oc-tab'))return;
    var s=document.createElement('style');
    s.textContent='#oc-tab{position:fixed;top:0;left:50%;--oc-pull-y:0px;transform:translate3d(-50%,var(--oc-pull-y),0);z-index:2147483647;cursor:pointer;background:#121212;color:rgba(255,255,255,.9);font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;padding:3px 10px 2px;display:flex;align-items:center;gap:5px;user-select:none;white-space:nowrap;border:1px solid rgba(255,255,255,.7);border-top:none;border-radius:0 0 12px 12px;touch-action:none;will-change:transform}#oc-tab:before{content:"";position:absolute;left:-1px;right:-1px;bottom:calc(100% - 1px);height:140px;background:#121212;border-left:1px solid rgba(255,255,255,.7);border-right:1px solid rgba(255,255,255,.7);pointer-events:none}#oc-tab.oc-releasing{transition:transform .52s cubic-bezier(.16,1,.3,1)}#oc-tab.oc-hiding{transition:transform .9s cubic-bezier(.16,1,.3,1)}#oc-tab-label{position:relative;z-index:1}.oc-tab-spinner{position:absolute;left:50%;bottom:calc(100% + 5px);width:20px;height:20px;box-sizing:border-box;border:3px solid rgba(255,255,255,.28);border-top-color:rgba(255,255,255,.9);border-radius:50%;opacity:0;transform:translate3d(-50%,5px,0) scale(.5);transition:opacity .12s,transform .12s;z-index:1;pointer-events:none}#oc-tab.oc-pulling .oc-tab-spinner,#oc-tab.oc-refreshing .oc-tab-spinner{opacity:1;transform:translate3d(-50%,0,0) scale(1);animation:oc-spin .72s linear infinite}#oc-tab.oc-hiding .oc-tab-spinner{animation:none!important;opacity:0!important;transform:translate3d(-50%,5px,0) scale(.45)!important;transition:opacity .9s cubic-bezier(.16,1,.3,1),transform .9s cubic-bezier(.16,1,.3,1)}@keyframes oc-spin{to{transform:translate3d(-50%,0,0) scale(1) rotate(360deg)}}#oc-panel{position:fixed;top:38px;left:50%;transform:translateX(-50%);z-index:2147483647;display:none;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.5);font-family:-apple-system,BlinkMacSystemFont,sans-serif;min-width:230px}#oc-panel.show{display:block}#oc-panel-status{display:flex;align-items:center;gap:8px;padding:12px 16px;font-size:12px;color:#8e8e8e;background:#2c2c2e}#oc-panel-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;background:${dotColor}${pulse ? ';animation:oc-pulse 1.5s infinite' : ''}}@keyframes oc-pulse{0%,100%{opacity:1}50%{opacity:.4}}#oc-panel-url{margin-left:auto;font-size:11px;opacity:.6}#oc-panel-items{background:#1c1c1e}#oc-panel-items button{display:flex;align-items:center;gap:10px;width:100%;padding:8px 16px;border:none;background:transparent;color:#eee;text-align:left;font-size:14px;cursor:pointer;transition:background .15s}#oc-panel-items button:hover{background:rgba(255,255,255,.08)}#oc-panel-close{color:#ff453a!important}#oc-panel-close .oc-lbl{transform:translateY(2px)}#oc-panel-close:hover{background:rgba(255,69,58,.15)!important}.oc-ico{display:inline-flex;align-items:center;justify-content:center;width:32px;font-size:16px;line-height:1}.oc-ico-sm{font-size:11px}.oc-lbl{display:inline-block;line-height:1;padding-left:10px}#oc-panel-items button:nth-child(1) .oc-lbl{transform:translateY(1.5px)}#oc-panel-items button:nth-child(2) .oc-lbl{transform:translateY(2px)}#oc-panel-items button:nth-child(4) .oc-lbl{transform:translateY(1px)}#oc-panel-toggle{display:flex;align-items:center;gap:10px;width:100%;padding:8px 16px;background:transparent;color:#eee;font-size:14px;cursor:pointer}#oc-panel-toggle:hover{background:rgba(255,255,255,.08)}.oc-switch{position:relative;width:22px;height:14px;flex-shrink:0;display:inline-flex;align-items:center;background:#555;border-radius:7px;transition:.2s;cursor:pointer}.oc-switch .oc-knob{position:absolute;left:2px;top:2px;width:10px;height:10px;background:#fff;border-radius:50%;transition:.2s}#oc-panel-toggle input{position:absolute;opacity:0;width:0;height:0;pointer-events:none}#oc-panel-toggle input:checked+.oc-switch,.oc-switch.oc-on{background:#888}#oc-panel-toggle input:checked+.oc-switch .oc-knob,.oc-switch.oc-on .oc-knob{transform:translateX(8px)}div[data-slot="tabs-trigger-wrapper"][data-value="servers"]{display:none!important}div[id$="-content-servers"]{display:none!important}#opencode-titlebar-right .bg-icon-success-base{display:none!important}';
    document.head.appendChild(s);
    var tab=document.createElement('div');tab.id='oc-tab';
    var tabSpinner=document.createElement('span');tabSpinner.className='oc-tab-spinner';tabSpinner.setAttribute('aria-hidden','true');
    var tabLabel=document.createElement('span');tabLabel.id='oc-tab-label';tabLabel.textContent='Options \\u22EE';
    tab.appendChild(tabSpinner);tab.appendChild(tabLabel);
    document.body.appendChild(tab);
    var panel=document.createElement('div');panel.id='oc-panel';
    var statusRow=document.createElement('div');statusRow.id='oc-panel-status';
    var dot=document.createElement('span');dot.id='oc-panel-dot';
    var label=document.createElement('span');label.textContent=${statusLabelLiteral};
    var urlSpan=document.createElement('span');urlSpan.id='oc-panel-url';urlSpan.textContent=${displayUrlLiteral};
    statusRow.appendChild(dot);statusRow.appendChild(label);statusRow.appendChild(urlSpan);
    panel.appendChild(statusRow);
    var items=document.createElement('div');items.id='oc-panel-items';
    var btns=[
      {i:'\\u21BB',l:${jsStringLiteral(t('common.refresh'))},a:'reload'},
      {i:'\\u2190',l:${jsStringLiteral(t('common.back'))},a:'back'},
      {i:'\\u2192',l:${jsStringLiteral(t('menu.forward'))},a:'forward'},
      {i:'\\u2197',l:${jsStringLiteral(t('menu.browser'))},a:'external'},
    ];
    btns.forEach(function(b){var btn=document.createElement('button');var ico=document.createElement('span');ico.className='oc-ico'+(b.a==='forward'?' oc-ico-sm':'');ico.textContent=b.i;btn.appendChild(ico);var lbl=document.createElement('span');lbl.className='oc-lbl';lbl.textContent=b.l;btn.appendChild(lbl);btn.addEventListener('click',function(){panel.classList.remove('show');switch(b.a){case'external':window.open(window.location.href,'_system');break;case'reload':window.location.reload();break;case'back':window.history.back();break;case'forward':window.history.forward();break}});items.appendChild(btn)});
    var tr=document.createElement('label');tr.id='oc-panel-toggle';
    var cb=document.createElement('input');cb.type='checkbox';cb.id='oc-enter-toggle';
    var enterNewline=localStorage.getItem('oc_enter_newline');
    if(enterNewline!=='0'&&enterNewline!=='1'){enterNewline='1';localStorage.setItem('oc_enter_newline','1')}
    var sd=document.createElement('span');sd.className='oc-switch';
    sd.style.cssText='margin:0 5px';
    var knob=document.createElement('span');knob.className='oc-knob';
    sd.appendChild(knob);
    cb.checked=enterNewline==='1';
    sd.classList.toggle('oc-on',cb.checked);
    cb.addEventListener('change',function(){localStorage.setItem('oc_enter_newline',cb.checked?'1':'0');sd.classList.toggle('oc-on',cb.checked);});
    tr.appendChild(cb);
    tr.appendChild(sd);
    var tl=document.createElement('span');tl.className='oc-lbl';tl.textContent=${jsStringLiteral(t('menu.enterNewline'))};
    tr.appendChild(tl);
    items.appendChild(tr);
    var btn=document.createElement('button');btn.id='oc-panel-close';
    var ico=document.createElement('span');ico.className='oc-ico';ico.textContent='\\u2716';
    btn.appendChild(ico);
    var lbl=document.createElement('span');lbl.className='oc-lbl';lbl.textContent=${jsStringLiteral(t('common.close'))};
    btn.appendChild(lbl);
    btn.addEventListener('click',function(){panel.classList.remove('show');if(window.mobileApp)window.mobileApp.close();});
    items.appendChild(btn);var sp=document.createElement('div');sp.style.height='8px';items.appendChild(sp);
    panel.appendChild(items);
    document.body.appendChild(panel);
    var ocPull={tracking:false,axis:null,startX:0,startY:0,offset:0,pointer:'touch',moved:false};
    var suppressClickUntil=0;
    var ocRefreshOffset=32;
    var ocRefreshTriggerOffset=27;
    var ocMinimumSpinMs=300;
    var ocHideMs=900;
    function ocPullOffset(deltaY){return ocRefreshOffset*(1-Math.exp(-deltaY/48));}
    function ocSetPullOffset(offset){ocPull.offset=offset;tab.style.setProperty('--oc-pull-y',offset+'px');if(offset>0){tab.classList.add('oc-pulling')}else{tab.classList.remove('oc-pulling')}}
    function ocResetPull(){tab.classList.remove('oc-pulling','oc-refreshing','oc-hiding');tab.classList.add('oc-releasing');ocSetPullOffset(0);setTimeout(function(){tab.classList.remove('oc-releasing')},340)}
    function ocStartPull(x,y,pointer){if(tab.classList.contains('oc-refreshing'))return;tab.classList.remove('oc-releasing','oc-hiding');ocPull.tracking=true;ocPull.axis=null;ocPull.startX=x;ocPull.startY=y;ocPull.offset=0;ocPull.pointer=pointer;ocPull.moved=false;ocSetPullOffset(0)}
    function ocMovePull(x,y,event){if(!ocPull.tracking)return;var dy=y-ocPull.startY;if(!ocPull.axis){if(dy<8)return;ocPull.axis='y';panel.classList.remove('show')}if(dy<=0){ocSetPullOffset(0);return}ocPull.moved=true;ocSetPullOffset(ocPullOffset(dy));if(event&&event.cancelable)event.preventDefault()}
    function ocEndPull(){if(!ocPull.tracking)return;var shouldReload=ocPull.offset>=ocRefreshTriggerOffset;var shouldSuppressClick=ocPull.moved||ocPull.offset>0||ocPull.axis==='y';ocPull.tracking=false;ocPull.axis=null;if(shouldReload){suppressClickUntil=Date.now()+ocMinimumSpinMs+250;tab.classList.remove('oc-pulling');tab.classList.add('oc-refreshing');ocSetPullOffset(ocRefreshOffset);setTimeout(function(){window.location.reload()},ocMinimumSpinMs)}else{if(shouldSuppressClick)suppressClickUntil=Date.now()+550;ocResetPull()}}
    function ocCancelPull(){if(!ocPull.tracking)return;ocPull.tracking=false;ocPull.axis=null;suppressClickUntil=Date.now()+350;ocResetPull()}
    tab.addEventListener('touchstart',function(e){if(e.touches.length!==1)return;var t=e.touches[0];ocStartPull(t.clientX,t.clientY,'touch')},{passive:false});
    tab.addEventListener('touchmove',function(e){if(e.touches.length!==1)return;var t=e.touches[0];ocMovePull(t.clientX,t.clientY,e)},{passive:false});
    tab.addEventListener('touchend',function(){ocEndPull()});
    tab.addEventListener('touchcancel',function(){ocCancelPull()});
    document.addEventListener('touchmove',function(e){if(ocPull.pointer!=='touch'||e.touches.length!==1)return;var t=e.touches[0];ocMovePull(t.clientX,t.clientY,e)},{passive:false});
    document.addEventListener('touchend',function(){if(ocPull.pointer==='touch')ocEndPull()});
    document.addEventListener('touchcancel',function(){if(ocPull.pointer==='touch')ocCancelPull()});
    tab.addEventListener('mousedown',function(e){if(e.button!==0)return;ocStartPull(e.clientX,e.clientY,'mouse');e.preventDefault()});
    document.addEventListener('mousemove',function(e){if(ocPull.pointer==='mouse')ocMovePull(e.clientX,e.clientY,e)});
    document.addEventListener('mouseup',function(){if(ocPull.pointer==='mouse')ocEndPull()});
    tab.addEventListener('click',function(e){e.stopPropagation();if(Date.now()<suppressClickUntil||ocPull.moved){e.preventDefault();ocPull.moved=false;return}panel.classList.toggle('show')});
    document.addEventListener('click',function(){panel.classList.remove('show')});
    panel.addEventListener('click',function(e){e.stopPropagation()});
  })();
  (function(){
    document.addEventListener('keydown',function(e){
      if(localStorage.getItem('oc_enter_newline')!=='1')return;
      var inp=e.target.closest('[data-component="prompt-input"]');
      if(!inp||e.key!=='Enter'||e.shiftKey)return;
      e.preventDefault();
      e.stopImmediatePropagation();
      document.execCommand('insertLineBreak',false,null);
      inp.dispatchEvent(new Event('input',{bubbles:true}));
    },true);
  })();
  (function(){
    if(window.__oc_mobileSidebarFix)return;
    window.__oc_mobileSidebarFix=true;
    function c(){var n=document.querySelector('[data-component="sidebar-nav-mobile"]');if(!n)return;var o=n.previousElementSibling;if(o&&o.classList.contains('opacity-100'))o.click()}
    document.addEventListener('click',function(e){var t=e.target;while(t&&t!==document){if(t.tagName==='A'&&t.getAttribute('href')&&t.getAttribute('href').includes('/session')){setTimeout(c,0);break}t=t.parentElement}},true);
  })()`
}

function buildMobileComposerFixScript(): string {
  return `(function(){
    if(window.__oc_mobileComposerFix)return;
    window.__oc_mobileComposerFix=true;

    var composerSelector='[data-component="prompt-input-v2"]';
    var submitSelector='[data-action="prompt-submit"]';
    var compactWidth=560;
    var observed=new WeakMap();
    var refreshQueued=false;

    function installStyle(){
      if(document.getElementById('oc-mobile-composer-fix-style'))return;
      var style=document.createElement('style');
      style.id='oc-mobile-composer-fix-style';
      style.textContent='[data-component="prompt-input-v2"][data-oc-mobile-composer-compact] [data-oc-mobile-composer-row]{display:flex!important;min-width:0!important;min-height:48px!important;height:auto!important;padding:4px 6px 4px 8px!important}[data-component="prompt-input-v2"][data-oc-mobile-composer-compact] [data-oc-mobile-composer-controls-host]{position:relative!important;display:flex!important;min-width:0!important;flex:1 1 auto!important;align-self:stretch!important;align-items:center!important}[data-component="prompt-input-v2"][data-oc-mobile-composer-compact] [data-oc-mobile-composer-controls]{display:flex!important;width:100%!important;min-width:0!important;overflow-x:auto!important;overflow-y:hidden!important;overscroll-behavior-x:contain;scrollbar-width:none;-webkit-overflow-scrolling:touch;touch-action:pan-x}[data-component="prompt-input-v2"][data-oc-mobile-composer-compact] [data-oc-mobile-composer-controls]::-webkit-scrollbar{display:none}[data-component="prompt-input-v2"][data-oc-mobile-composer-compact] [data-oc-mobile-composer-controls]>*{flex:0 0 auto!important;min-width:max-content!important}[data-component="prompt-input-v2"][data-oc-mobile-composer-compact] [data-oc-mobile-composer-send-host]{display:flex!important;flex:0 0 40px!important;min-width:40px!important;margin-left:4px!important;align-items:center!important;justify-content:center!important}[data-component="prompt-input-v2"][data-oc-mobile-composer-compact] [data-action="prompt-submit"][data-oc-mobile-composer-send]{position:static!important;z-index:auto!important;box-sizing:border-box!important;flex:0 0 40px!important;width:40px!important;min-width:40px!important;height:40px!important;margin-left:0!important;touch-action:manipulation}[data-component="prompt-input-v2"][data-oc-mobile-composer-compact] [data-oc-mobile-composer-scroll]{position:absolute!important;top:0!important;bottom:0!important;z-index:1!important;display:flex!important;width:40px!important;padding:0!important;align-items:center!important;border:0!important;background:transparent!important;color:var(--v2-icon-icon-muted,currentColor)!important;font:26px/1 -apple-system,BlinkMacSystemFont,sans-serif!important;touch-action:manipulation!important;cursor:pointer!important}[data-component="prompt-input-v2"][data-oc-mobile-composer-compact] [data-oc-mobile-composer-scroll] span{display:block!important;transform:translateY(-1px)!important}[data-component="prompt-input-v2"][data-oc-mobile-composer-compact] [data-oc-mobile-composer-scroll="left"]{left:0!important;justify-content:flex-start!important;background-image:linear-gradient(to right,var(--v2-background-bg-base,#1c1c1e),transparent)!important}[data-component="prompt-input-v2"][data-oc-mobile-composer-compact] [data-oc-mobile-composer-scroll="right"]{right:0!important;justify-content:flex-end!important;padding-right:8px!important;background-image:linear-gradient(to left,var(--v2-background-bg-base,#1c1c1e),transparent)!important}[data-component="prompt-input-v2"][data-oc-mobile-composer-compact] [data-oc-mobile-composer-scroll][hidden]{display:none!important}';
      document.head.appendChild(style);
    }

    function findRow(composer,submit){
      var row=submit.parentElement;
      while(row&&row!==composer){
        // The observer also sees the nodes we add. Prefer the original
        // scroll container on later passes so we never wrap it again.
        var patchedControls=row.querySelector('[data-oc-mobile-composer-controls]');
        if(patchedControls&&!patchedControls.contains(submit)){
          var patchedHost=patchedControls.parentElement;
          if(patchedHost&&patchedHost!==row&&!patchedHost.contains(submit)){
            return {row:row,controls:patchedControls,host:patchedHost};
          }
        }
        var promptControls=row.querySelector('[data-slot="prompt-controls"]');
        if(promptControls&&!promptControls.contains(submit)){
          var promptControlsHost=promptControls.parentElement;
          if(promptControlsHost&&promptControlsHost!==row&&!promptControlsHost.contains(submit)){
            return {row:row,controls:promptControls,host:promptControlsHost};
          }
        }
        var children=Array.prototype.slice.call(row.children);
        var controls=null;
        for(var i=0;i<children.length;i++){
          var child=children[i];
          if(child!==submit&&!child.contains(submit)){
            controls=child;
            break;
          }
        }
        if(controls)return {row:row,controls:controls,host:controls};
        row=row.parentElement;
      }
      return null;
    }

    function setCompact(composer){
      var width=composer.getBoundingClientRect().width;
      if(width>0&&width<=compactWidth)composer.setAttribute('data-oc-mobile-composer-compact','');
      else composer.removeAttribute('data-oc-mobile-composer-compact');
    }

    function ensureControlsHost(layout){
      if(layout.host!==layout.controls)return layout.host;
      var host=document.createElement('div');
      layout.controls.parentNode.insertBefore(host,layout.controls);
      host.appendChild(layout.controls);
      return host;
    }

    function scrollControls(controls,direction){
      var amount=Math.max(controls.clientWidth-32,1);
      if(typeof controls.scrollBy==='function')controls.scrollBy({left:direction*amount,behavior:'smooth'});
      else controls.scrollLeft+=direction*amount;
    }

    function ensureScrollButton(host,controls,direction){
      var side=direction<0?'left':'right';
      var button=host.querySelector('[data-oc-mobile-composer-scroll="'+side+'"]');
      if(button)return button;
      button=document.createElement('button');
      button.type='button';
      button.setAttribute('data-oc-mobile-composer-scroll',side);
      button.setAttribute('aria-label','Scroll prompt controls '+side);
      var glyph=document.createElement('span');
      glyph.setAttribute('aria-hidden','true');
      glyph.textContent=direction<0?'\u2039':'\u203a';
      button.appendChild(glyph);
      button.hidden=true;
      button.addEventListener('click',function(event){
        event.preventDefault();
        event.stopPropagation();
        scrollControls(controls,direction);
      });
      host.appendChild(button);
      return button;
    }

    function updateScrollButtons(composer,controls,leftButton,rightButton){
      if(!composer.hasAttribute('data-oc-mobile-composer-compact')){
        leftButton.hidden=true;
        rightButton.hidden=true;
        return;
      }
      var container=controls.getBoundingClientRect();
      var hasLeft=false;
      var hasRight=false;
      var children=controls.children;
      for(var i=0;i<children.length;i++){
        var bounds=children[i].getBoundingClientRect();
        if(bounds.left<container.left-1)hasLeft=true;
        if(bounds.right>container.right+1)hasRight=true;
      }
      if(!hasLeft&&!hasRight&&controls.scrollWidth>controls.clientWidth+1){
        hasLeft=controls.scrollLeft>1;
        hasRight=controls.scrollLeft<controls.scrollWidth-controls.clientWidth-1;
      }
      leftButton.hidden=!hasLeft;
      rightButton.hidden=!hasRight;
    }

    function patchComposer(composer){
      var submit=composer.querySelector(submitSelector);
      if(!submit)return;
      var layout=findRow(composer,submit);
      if(!layout)return;
      layout.host=ensureControlsHost(layout);
      layout.row.setAttribute('data-oc-mobile-composer-row','');
      layout.controls.setAttribute('data-oc-mobile-composer-controls','');
      layout.host.setAttribute('data-oc-mobile-composer-controls-host','');
      var submitHost=submit.parentElement;
      if(submitHost&&submitHost!==layout.row)submitHost.setAttribute('data-oc-mobile-composer-send-host','');
      submit.setAttribute('data-oc-mobile-composer-send','');
      setCompact(composer);
      var leftButton=ensureScrollButton(layout.host,layout.controls,-1);
      var rightButton=ensureScrollButton(layout.host,layout.controls,1);
      var update=function(){updateScrollButtons(composer,layout.controls,leftButton,rightButton)};
      update();
      var previous=observed.get(composer);
      if(!previous||previous.controls!==layout.controls){
        observed.set(composer,{controls:layout.controls});
        if(window.ResizeObserver){
          var resizeObserver=new ResizeObserver(function(){setCompact(composer);update()});
          resizeObserver.observe(composer);
          resizeObserver.observe(layout.controls);
        }
        layout.controls.addEventListener('scroll',update,{passive:true});
        var controlsObserver=new MutationObserver(function(){requestAnimationFrame(update)});
        controlsObserver.observe(layout.controls,{childList:true,subtree:true,characterData:true});
      }
      requestAnimationFrame(update);
    }

    function refresh(){
      var composers=document.querySelectorAll(composerSelector);
      for(var i=0;i<composers.length;i++)patchComposer(composers[i]);
    }

    function scheduleRefresh(){
      if(refreshQueued)return;
      refreshQueued=true;
      requestAnimationFrame(function(){refreshQueued=false;refresh()});
    }

    function mount(){
      if(!document.head||!document.body){setTimeout(mount,50);return;}
      installStyle();
      refresh();
      var observer=new MutationObserver(scheduleRefresh);
      observer.observe(document.body,{childList:true,subtree:true});
      setTimeout(refresh,250);
      setTimeout(refresh,1000);
    }
    mount();
  })();`
}

function ellipsize(value: string, maxLength = 140): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value
}

function getNotificationPromptPreview(detail: unknown): string {
  const record = detail && typeof detail === 'object' ? detail as Record<string, unknown> : {}
  const title = typeof record.title === 'string' ? record.title.trim() : ''
  const body = typeof record.body === 'string' ? record.body.trim() : ''
  return ellipsize([title, body].filter(Boolean).join('\n') || 'OpenCode notification')
}

function buildNotificationApprovalPromptScript(preview: string): string {
  return `(function(){
    function mount(){
    if(!document.body){setTimeout(mount,50);return;}
    var old=document.getElementById('oc-notification-permission-modal');
    if(old)old.remove();
    var style=document.createElement('style');
    style.id='oc-notification-permission-style';
    style.textContent='#oc-notification-permission-modal{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.54);display:flex;align-items:center;justify-content:center;padding:20px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#f5f5f7}#oc-notification-permission-box{width:min(330px,100%);background:#1c1c1e;border:1px solid rgba(255,255,255,.14);border-radius:14px;box-shadow:0 16px 44px rgba(0,0,0,.5);overflow:hidden}#oc-notification-permission-content{padding:18px 18px 14px;display:flex;flex-direction:column;gap:12px}#oc-notification-permission-title{font-size:17px;font-weight:700;line-height:1.25;text-align:center}#oc-notification-permission-message{font-size:13px;line-height:1.38;color:rgba(245,245,247,.78);text-align:center}#oc-notification-permission-preview{font-size:13px;line-height:1.35;color:#fff;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:10px;white-space:pre-wrap;word-break:break-word;max-height:88px;overflow:hidden}#oc-notification-permission-foot{font-size:12px;line-height:1.3;color:rgba(245,245,247,.58);text-align:center}#oc-notification-permission-actions{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid rgba(255,255,255,.12)}#oc-notification-permission-actions button{appearance:none;border:0;background:transparent;color:#0a84ff;font-size:16px;padding:13px 8px;font-weight:600}#oc-notification-permission-actions button:first-child{border-right:1px solid rgba(255,255,255,.12);font-weight:500;color:rgba(245,245,247,.8)}';
    document.head.appendChild(style);
    var modal=document.createElement('div');
    modal.id='oc-notification-permission-modal';
    modal.innerHTML='<div id="oc-notification-permission-box"><div id="oc-notification-permission-content"><div id="oc-notification-permission-title">${t('settings.notifications')}</div><div id="oc-notification-permission-message">${t('settings.notificationDescription')}</div><div id="oc-notification-permission-preview"></div></div><div id="oc-notification-permission-actions"><button type="button" data-choice="no">${t('common.cancel')}</button><button type="button" data-choice="yes">${t('common.confirm')}</button></div></div>';
    modal.querySelector('#oc-notification-permission-preview').textContent=${JSON.stringify(preview)};
    function respond(accepted){
      try{window.mobileApp&&window.mobileApp.postMessage&&window.mobileApp.postMessage({detail:{type:'${WEB_NOTIFICATION_PROMPT_RESPONSE_MESSAGE_TYPE}',accepted:accepted}});}catch(e){}
      modal.remove();
    }
    modal.querySelector('[data-choice="yes"]').addEventListener('click',function(){respond(true);});
    modal.querySelector('[data-choice="no"]').addEventListener('click',function(){respond(false);});
    document.body.appendChild(modal);
    }
    mount();
  })();`
}

async function askForNativeNotificationApproval(detail: unknown): Promise<boolean> {
  if (notificationPromptPromise) return notificationPromptPromise

  notificationPromptPromise = new Promise((resolve) => {
    notificationPromptResolver = resolve
  })
  const promptPromise = notificationPromptPromise

  try {
    await InAppBrowser.executeScript({ code: buildNotificationApprovalPromptScript(getNotificationPromptPreview(detail)) })
  } catch {
    resolveNotificationPrompt(false)
  }
  return promptPromise
}

function resolveNotificationPrompt(accepted: boolean): void {
  notificationPromptResolver?.(accepted)
  notificationPromptResolver = null
  notificationPromptPromise = null
}

async function handleWebviewNotificationMessage(detail: unknown): Promise<void> {
  const decision = await getNativeNotificationDecision()
  if (decision === 'ignore') return

  if (decision === 'ask') {
    const accepted = await askForNativeNotificationApproval(detail)
    if (!accepted) {
      await denyNativeNotificationsFromPrompt()
      return
    }

    const granted = await approveNativeNotificationsFromPrompt()
    if (!granted) return
  }

  await emitNativeNotificationFromWebMessage(detail, profile.value?.name ?? 'OpenCode')
}

function handleDownloadCompleted(event: DownloadCompletedEvent): void {
  const name = event.fileName || t('common.file')
  void showDownloadToast(t('connection.downloaded', { name }), false)
}

function handleDownloadFailed(event: DownloadFailedEvent): void {
  const name = event.fileName || t('common.file')
  void showDownloadToast(t('connection.downloadFailed', { name }), true)
}

/**
 * Saves a file streamed from the WebView and opens the share sheet so the user
 * picks where it goes (Files, Drive, a chat app, ...). This is the path used for
 * `<a download>` clicks; it replaces the plugin's in-WebView text preview.
 */
async function handleDeviceDownload(message: DeviceDownloadMessage): Promise<void> {
  try {
    const result = await handleDeviceDownloadMessage(message)
    if (!result) return
    void showDownloadToast(t('connection.downloadReady', { name: result.fileName }), false)
  } catch {
    void showDownloadToast(t('connection.downloadFailed', { name: t('common.file') }), true)
  }
}

/**
 * Opens a tapped external link in the device browser.
 *
 * On Android the in-app browser tab is launched in the device's default
 * browser package (the plugin pins the custom tab when `preventDeeplink` is
 * set). On iOS the plugin presents its browser sheet over the app.
 */
async function openUrlInDefaultBrowser(url: string): Promise<void> {
  try {
    await InAppBrowser.open({ url, preventDeeplink: true })
  } catch {
    // No browser could handle the link; keep the user in the current session.
  }
}

onMounted(async () => {
  await serverStore.load()
  if (!profile.value) { router.push('/'); return }
  registerBackButton(handleBackButton)

  const connected = await connectionStore.connect(profile.value.id)
  if (!connected) {
    loading.value = false
    errorText.value = connectionStore.lastError ?? t('connection.unreachable')
    return
  }

  connectionStore.lastWebviewServerId = profile.value.id
  demoModeActive.value = await isCurrentProfileDemoMode()

  if (demoModeActive.value) {
    loading.value = false
    return
  }

  if (Capacitor.isNativePlatform()) {
    await openInAppBrowser()
  } else {
    await openInNewTabFallback()
  }
})

onUnmounted(() => {
  unregisterBackButton()
  removeWebviewListeners()
  resolveNotificationPrompt(false)
})

async function isCurrentProfileDemoMode(): Promise<boolean> {
  if (!profile.value?.authEnabled) return false
  const pw = await serverStore.getPassword(profile.value.id)
  return isDemoModeServer({
    baseUrl: profile.value.baseUrl,
    username: profile.value.username,
    password: pw,
  })
}

async function openInAppBrowser(): Promise<void> {
  const isIOS = Capacitor.getPlatform() === 'ios'
  const pw = await serverStore.getPassword(profile.value!.id)
  const auth = profile.value!.authEnabled && pw
  const url = isIOS && auth
    ? buildIframeUrl(profile.value!.baseUrl, profile.value!.username, pw!)
    : buildIframeUrl(profile.value!.baseUrl)
  const { enabled: deviceIntegration, openLinksInBrowser } = await loadDeviceIntegrationSettings()

  browserClosedHandle = await InAppBrowser.addListener('closeEvent', () => {
    connectionStore.disconnect()
    removeWebviewListeners()
    resolveNotificationPrompt(false)
    router.push('/')
  })

  if (deviceIntegration) {
    downloadCompletedHandle = await InAppBrowser.addListener('downloadCompleted', handleDownloadCompleted)
    downloadFailedHandle = await InAppBrowser.addListener('downloadFailed', handleDownloadFailed)
  }

  messageFromWebviewHandle = await InAppBrowser.addListener('messageFromWebview', (event) => {
    if (event.detail?.type === WEB_NOTIFICATION_PROMPT_RESPONSE_MESSAGE_TYPE) {
      resolveNotificationPrompt(Boolean(event.detail.accepted))
      return
    }

    if (event.detail?.type === WEB_NOTIFICATION_MESSAGE_TYPE) {
      void handleWebviewNotificationMessage(event.detail)
      return
    }

    const download = parseDeviceDownloadMessage(event.detail)
    if (download) {
      void handleDeviceDownload(download)
      return
    }

    const externalUrl = parseExternalLinkUrl(event.detail)
    if (externalUrl) void openUrlInDefaultBrowser(externalUrl)
  })

  pageLoadedHandle = await InAppBrowser.addListener('browserPageLoaded', async () => {
    const displayUrl = profile.value!.baseUrl.replace(/^https?:\/\//, '')
    if (deviceIntegration) {
      await InAppBrowser.executeScript({ code: buildDeviceClipboardScript() })
      await InAppBrowser.executeScript({ code: buildDownloadBridgeScript() })
    }
    if (openLinksInBrowser) {
      await InAppBrowser.executeScript({ code: buildExternalLinkScript() })
    }
    await InAppBrowser.executeScript({ code: buildPreviewFixScript() })
    await InAppBrowser.executeScript({ code: buildChatDragBridgeScript() })
    await InAppBrowser.executeScript({ code: buildToolbarScript(connectionStore.state, displayUrl) })
    await InAppBrowser.executeScript({ code: buildMobileComposerFixScript() })
    await InAppBrowser.executeScript({
      code: `(function(){
        var patterns=['Error: ServerSync','Error: Settings context','settings context must be used'];
        var hidden=new Set;
        function hideErrors(){
          var all=document.querySelectorAll('textarea');
          for(var i=0;i<all.length;i++){
            var ta=all[i];
            if(ta.style.display==='none')continue;
            var val=(ta.value||'').toLowerCase();
            for(var j=0;j<patterns.length;j++){
              if(val.indexOf(patterns[j].toLowerCase())===-1)continue;
              var key=ta.id||ta.name||ta.getAttribute('data-slot')||i;
              if(hidden.has(key))continue;
              hidden.add(key);
              ta.style.display='none';
              var p=ta.parentElement;
              while(p&&p!==document.body){
                if(p.children.length===1){p.style.display='none';p=p.parentElement}
                else break;
              }
              var root=document.getElementById('root');
              if(root&&root.firstElementChild&&root.firstElementChild.contains(ta))root.firstElementChild.style.display='none';
            }
          }
        }
        hideErrors();
        var obs=new MutationObserver(function(){hideErrors()});
        try{obs.observe(document.body,{childList:true,subtree:true})}catch(e){}
        setInterval(hideErrors,3000);
        setTimeout(function(){try{obs.disconnect()}catch(e){}},120000);
      })();`
    })
  })

  appStateHandle = await App.addListener('appStateChange', (state) => {
    if (state.isActive) {
      InAppBrowser.executeScript({
        code: `(function(){
          var dot = document.querySelector('#opencode-titlebar-right > div > div > div:nth-child(1) > button > div > div.bg-icon-critical-base');
          if (dot) { window.location.reload(); }
        })();`
      }).catch(() => {})
    }
  })

  try {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    await InAppBrowser.openWebView({
      url,
      toolbarType: ToolBarType.BLANK,
      toolbarColor: isDark ? '#121212' : '#f8f8f8',
      backgroundColor: isDark ? BackgroundColor.BLACK : BackgroundColor.WHITE,
      isInspectable: true,
      useTopInset: false,
      enabledSafeBottomMargin: true,
      disableOverscroll: true,
      activeNativeNavigationForWebview: true,
      handleDownloads: deviceIntegration,
      isPresentAfterPageLoad: true,
      preShowScriptInjectionTime: 'documentStart',
      preShowScript: buildNotificationBridgeScript(),
      ...(auth && !isIOS ? {
        credentials: {
          username: profile.value!.username,
          password: pw!,
        },
      } : {}),
    })
  } catch {
    removeWebviewListeners()
    loading.value = false
    errorText.value = t('connection.openFailed')
  }
}

async function openInNewTabFallback(): Promise<void> {
  const pw = await serverStore.getPassword(profile.value!.id)
  const url = buildIframeUrl(
    profile.value!.baseUrl,
    profile.value!.authEnabled ? profile.value!.username : undefined,
    profile.value!.authEnabled && pw ? pw : undefined,
  )
  window.open(url, '_blank')
  loading.value = false
  errorText.value = t('connection.opened')
}

async function retry(): Promise<void> {
  errorText.value = ''
  loading.value = true
  if (!profile.value) { goHome(); return }
  const connected = await connectionStore.connect(profile.value.id)
  if (connected) {
    connectionStore.lastWebviewServerId = profile.value.id
    demoModeActive.value = await isCurrentProfileDemoMode()
    if (demoModeActive.value) {
      loading.value = false
      return
    }
    if (Capacitor.isNativePlatform()) {
      await openInAppBrowser()
    } else {
      await openInNewTabFallback()
    }
  } else {
    loading.value = false
    errorText.value = connectionStore.lastError ?? t('connection.unreachable')
  }
}

function goHome(): void { connectionStore.disconnect(); router.push('/') }
async function handleBackButton(): Promise<boolean> {
  try { await InAppBrowser.close() } catch {}
  connectionStore.disconnect()
  router.push('/')
  return true
}
</script>
