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
import { useI18n } from '@/i18n'
import { getWebviewDirection } from '@/services/storage/uiPreferences'
import {
  buildPreShowScript,
  buildWebviewDirectionScript,
} from '@/services/platform/webviewDirection'
import { buildToolbarScript, jsStringLiteral } from '@/services/platform/webviewToolbar'

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
      button.setAttribute('aria-label',${jsStringLiteral(t('menu.scrollControls'))}+' '+(side==='left'?${jsStringLiteral(t('menu.scrollLeft'))}:${jsStringLiteral(t('menu.scrollRight'))}));
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
  return ellipsize([title, body].filter(Boolean).join('\n') || t('connection.notificationFallback'))
}

function buildNotificationApprovalPromptScript(preview: string): string {
  return `(function(){
    function mount(){
    if(!document.body){setTimeout(mount,50);return;}
    var old=document.getElementById('oc-notification-permission-modal');
    if(old)old.remove();
    var style=document.createElement('style');
    style.id='oc-notification-permission-style';
    style.textContent='#oc-notification-permission-modal{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.54);display:flex;align-items:center;justify-content:center;padding:20px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#f5f5f7}#oc-notification-permission-box{width:min(330px,100%);background:#1c1c1e;border:1px solid rgba(255,255,255,.14);border-radius:14px;box-shadow:0 16px 44px rgba(0,0,0,.5);overflow:hidden}#oc-notification-permission-content{padding:18px 18px 14px;display:flex;flex-direction:column;gap:12px}#oc-notification-permission-title{font-size:17px;font-weight:700;line-height:1.25;text-align:center}#oc-notification-permission-message{font-size:13px;line-height:1.38;color:rgba(245,245,247,.78);text-align:center}#oc-notification-permission-preview{font-size:13px;line-height:1.35;color:#fff;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:10px;white-space:pre-wrap;word-break:break-word;max-height:88px;overflow:hidden}#oc-notification-permission-foot{font-size:12px;line-height:1.3;color:rgba(245,245,247,.58);text-align:center}#oc-notification-permission-actions{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid rgba(255,255,255,.12)}#oc-notification-permission-actions button{appearance:none;border:0;background:transparent;color:#0a84ff;font-size:16px;padding:13px 8px;font-weight:600}#oc-notification-permission-actions button:first-child{border-inline-end:1px solid rgba(255,255,255,.12);font-weight:500;color:rgba(245,245,247,.8)}';
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
    await InAppBrowser.executeScript({ code: buildToolbarScript(connectionStore.state, displayUrl, getWebviewDirection() === 'rtl') })
    await InAppBrowser.executeScript({ code: buildWebviewDirectionScript() })
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
      isPresentAfterPageLoad: true,
      preShowScriptInjectionTime: 'documentStart',
      preShowScript: buildPreShowScript(buildNotificationBridgeScript()),
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
