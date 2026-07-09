<template>
  <DemoSessionMock
    v-if="demoModeActive && profile"
    :profile-name="profile.name"
  />

  <div v-else class="fixed inset-0 flex flex-col items-center justify-center z-[1] bg-background">
    <div v-if="loading" class="flex flex-col items-center gap-4">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-foreground" />
      <p class="text-sm text-muted-foreground">Loading OpenCode...</p>
    </div>

    <div v-else-if="errorText" class="flex flex-col items-center gap-4 text-center max-w-[300px]">
      <p class="text-sm text-muted-foreground leading-relaxed">{{ errorText }}</p>
      <div class="flex gap-2">
        <Button @click="retry">Retry</Button>
        <Button variant="outline" @click="goHome">Back</Button>
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
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { useServerStore } from '@/stores/serverStore'
import { useConnectionStore } from '@/stores/connectionStore'
import { registerBackButton, unregisterBackButton } from '@/services/platform/backButton'
import { buildIframeUrl } from '@/services/opencode/url'
import { isDemoModeServer } from '@/services/opencode/demoMode'
import {
  approveNativeNotificationsFromPrompt,
  denyNativeNotificationsFromPrompt,
  emitNativeNotificationFromWebMessage,
  getNativeNotificationDecision,
  WEB_NOTIFICATION_MESSAGE_TYPE,
} from '@/services/platform/nativeNotifications'

const route = useRoute()
const router = useRouter()
const serverStore = useServerStore()
const connectionStore = useConnectionStore()

const loading = ref(true)
const errorText = ref('')

const serverId = computed(() => route.params.id as string)
const profile = computed(() => serverStore.profiles.find(p => p.id === serverId.value))
const demoModeActive = ref(false)

let browserClosedHandle: any = null
let pageLoadedHandle: any = null
let messageFromWebviewHandle: any = null
let appStateHandle: any = null
let notificationPromptResolver: ((value: boolean) => void) | null = null
let notificationPromptPromise: Promise<boolean> | null = null

function removeWebviewListeners(): void {
  if (browserClosedHandle) void browserClosedHandle.remove()
  if (pageLoadedHandle) void pageLoadedHandle.remove()
  if (messageFromWebviewHandle) void messageFromWebviewHandle.remove()
  if (appStateHandle) void appStateHandle.remove()
  browserClosedHandle = null
  pageLoadedHandle = null
  messageFromWebviewHandle = null
  appStateHandle = null
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

function buildToolbarScript(status: string, displayUrl: string): string {
  const dotColor =
    status === 'connected' ? '#30d158' :
    status === 'checking' || status === 'reconnecting' ? '#ffd60a' :
    status === 'disconnected' || status === 'unreachable' || status === 'wrong_credentials' || status === 'frame_blocked' ? '#ff453a' :
    '#8e8e8e'

  const pulse = status === 'checking' || status === 'reconnecting'

  const statusLabel =
    status === 'connected' ? 'Connected' :
    status === 'checking' ? 'Checking' :
    status === 'reconnecting' ? 'Reconnecting' :
    status === 'disconnected' ? 'Disconnected' :
    status === 'auth_required' ? 'Auth Required' :
    status === 'wrong_credentials' ? 'Wrong Credentials' :
    status === 'unreachable' ? 'Unreachable' :
    status === 'frame_blocked' ? 'Blocked' :
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
      {i:'\\u21BB',l:'Refresh',a:'reload'},
      {i:'\\u2190',l:'Back',a:'back'},
      {i:'\\u2192',l:'Forward',a:'forward'},
      {i:'\\u2197',l:'Browser',a:'external'},
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
    var tl=document.createElement('span');tl.className='oc-lbl';tl.textContent='Enter = newline';
    tr.appendChild(tl);
    items.appendChild(tr);
    var btn=document.createElement('button');btn.id='oc-panel-close';
    var ico=document.createElement('span');ico.className='oc-ico';ico.textContent='\\u2716';
    btn.appendChild(ico);
    var lbl=document.createElement('span');lbl.className='oc-lbl';lbl.textContent='Close';
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
    modal.innerHTML='<div id="oc-notification-permission-box"><div id="oc-notification-permission-content"><div id="oc-notification-permission-title">OpenCode has emitted a notification</div><div id="oc-notification-permission-message">Would you like to receive OpenCode notifications as native notifications on your phone?</div><div id="oc-notification-permission-preview"></div><div id="oc-notification-permission-foot">You can always change this in Settings.</div></div><div id="oc-notification-permission-actions"><button type="button" data-choice="no">No</button><button type="button" data-choice="yes">Yes</button></div></div>';
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

onMounted(async () => {
  await serverStore.load()
  if (!profile.value) { router.push('/'); return }
  registerBackButton(handleBackButton)

  const connected = await connectionStore.connect(profile.value.id)
  if (!connected) {
    loading.value = false
    errorText.value = connectionStore.lastError ?? 'Server unreachable'
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

  browserClosedHandle = await InAppBrowser.addListener('closeEvent', () => {
    connectionStore.disconnect()
    removeWebviewListeners()
    resolveNotificationPrompt(false)
    router.push('/')
  })

  messageFromWebviewHandle = await InAppBrowser.addListener('messageFromWebview', (event) => {
    if (event.detail?.type === WEB_NOTIFICATION_PROMPT_RESPONSE_MESSAGE_TYPE) {
      resolveNotificationPrompt(Boolean(event.detail.accepted))
      return
    }

    if (event.detail?.type === WEB_NOTIFICATION_MESSAGE_TYPE) {
      void handleWebviewNotificationMessage(event.detail)
    }
  })

  pageLoadedHandle = await InAppBrowser.addListener('browserPageLoaded', async () => {
    const displayUrl = profile.value!.baseUrl.replace(/^https?:\/\//, '')
    await InAppBrowser.executeScript({ code: buildToolbarScript(connectionStore.state, displayUrl) })
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
  } catch (error) {
    removeWebviewListeners()
    loading.value = false
    errorText.value = error instanceof Error
      ? `Could not open the web viewer: ${error.message}`
      : 'Could not open the web viewer.'
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
  errorText.value = 'Opened in a new tab. Close it and return here.'
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
    errorText.value = connectionStore.lastError ?? 'Server unreachable'
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
