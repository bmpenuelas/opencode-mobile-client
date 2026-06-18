<template>
  <div class="fixed inset-0 flex flex-col items-center justify-center z-[1] bg-background">
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
import { InAppBrowser, ToolBarType, BackgroundColor } from '@capgo/capacitor-inappbrowser'
import { Capacitor } from '@capacitor/core'
import { useServerStore } from '@/stores/serverStore'
import { useConnectionStore } from '@/stores/connectionStore'
import { registerBackButton, unregisterBackButton } from '@/services/platform/backButton'
import { buildIframeUrl } from '@/services/opencode/url'

const route = useRoute()
const router = useRouter()
const serverStore = useServerStore()
const connectionStore = useConnectionStore()

const loading = ref(true)
const errorText = ref('')

const serverId = computed(() => route.params.id as string)
const profile = computed(() => serverStore.profiles.find(p => p.id === serverId.value))

let browserClosedHandle: any = null
let pageLoadedHandle: any = null

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

  return `(function(){
    if(document.getElementById('oc-tab'))return;
    var s=document.createElement('style');
    s.textContent='#oc-tab{position:fixed;top:0;left:50%;transform:translateX(-50%);z-index:2147483647;cursor:pointer;background:#121212;color:rgba(255,255,255,.9);font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;padding:3px 10px 2px;display:flex;align-items:center;gap:5px;user-select:none;white-space:nowrap;border:1px solid rgba(255,255,255,.7);border-top:none;border-radius:0 0 12px 12px}#oc-tab:before{content:"";position:absolute;top:-1px;left:-1px;right:-1px;height:10px;background:linear-gradient(to bottom,#121212,transparent);pointer-events:none;border-radius:inherit}#oc-panel{position:fixed;top:38px;left:50%;transform:translateX(-50%);z-index:2147483647;display:none;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.5);font-family:-apple-system,BlinkMacSystemFont,sans-serif;min-width:230px}#oc-panel.show{display:block}#oc-panel-status{display:flex;align-items:center;gap:8px;padding:12px 16px;font-size:12px;color:#8e8e8e;background:#2c2c2e}#oc-panel-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;background:${dotColor}${pulse ? ';animation:oc-pulse 1.5s infinite' : ''}}@keyframes oc-pulse{0%,100%{opacity:1}50%{opacity:.4}}#oc-panel-url{margin-left:auto;font-size:11px;opacity:.6}#oc-panel-items{background:#1c1c1e}#oc-panel-items button{display:flex;align-items:center;gap:10px;width:100%;padding:8px 16px;border:none;background:transparent;color:#eee;text-align:left;font-size:14px;cursor:pointer;transition:background .15s}#oc-panel-items button:hover{background:rgba(255,255,255,.08)}#oc-panel-close{color:#ff453a!important}#oc-panel-close .oc-lbl{transform:translateY(2px)}#oc-panel-close:hover{background:rgba(255,69,58,.15)!important}.oc-ico{display:inline-flex;align-items:center;justify-content:center;width:22px;font-size:16px;line-height:1}.oc-ico-sm{font-size:11px}.oc-lbl{display:inline-block;line-height:1}#oc-panel-items button:nth-child(1) .oc-lbl{transform:translateY(1.5px)}#oc-panel-items button:nth-child(2) .oc-lbl{transform:translateY(2px)}#oc-panel-items button:nth-child(4) .oc-lbl{transform:translateY(1px)}#oc-panel-toggle{display:flex;align-items:center;gap:10px;width:100%;padding:8px 16px;background:transparent;color:#eee;font-size:14px;cursor:pointer}#oc-panel-toggle:hover{background:rgba(255,255,255,.08)}.oc-switch{position:relative;width:22px;height:14px;flex-shrink:0;display:inline-flex;align-items:center;background:#555;border-radius:7px;transition:.2s;cursor:pointer}.oc-switch .oc-knob{position:absolute;left:2px;top:2px;width:10px;height:10px;background:#fff;border-radius:50%;transition:.2s}#oc-panel-toggle input{position:absolute;opacity:0;width:0;height:0;pointer-events:none}#oc-panel-toggle input:checked+.oc-switch{background:#888}#oc-panel-toggle input:checked+.oc-switch .oc-knob{transform:translateX(8px)}div[data-slot="tabs-trigger-wrapper"][data-value="servers"]{display:none!important}div[id$="-content-servers"]{display:none!important}';
    document.head.appendChild(s);
    var tab=document.createElement('div');tab.id='oc-tab';
    tab.textContent='Options \\u22EE';
    document.body.appendChild(tab);
    var panel=document.createElement('div');panel.id='oc-panel';
    var statusRow=document.createElement('div');statusRow.id='oc-panel-status';
    var dot=document.createElement('span');dot.id='oc-panel-dot';
    var label=document.createElement('span');label.textContent='${statusLabel}';
    var urlSpan=document.createElement('span');urlSpan.id='oc-panel-url';urlSpan.textContent='${displayUrl}';
    statusRow.appendChild(dot);statusRow.appendChild(label);statusRow.appendChild(urlSpan);
    panel.appendChild(statusRow);
    var items=document.createElement('div');items.id='oc-panel-items';
    var btns=[
      {i:'\\u21BB',l:'Reload',a:'reload'},
      {i:'\\u2190',l:'Back',a:'back'},
      {i:'\\u2192',l:'Forward',a:'forward'},
      {i:'\\u2197',l:'Browser',a:'external'},
    ];
    btns.forEach(function(b){var btn=document.createElement('button');var ico=document.createElement('span');ico.className='oc-ico'+(b.a==='forward'?' oc-ico-sm':'');ico.textContent=b.i;btn.appendChild(ico);var lbl=document.createElement('span');lbl.className='oc-lbl';lbl.textContent=b.l;btn.appendChild(lbl);btn.addEventListener('click',function(){panel.classList.remove('show');switch(b.a){case'external':window.open(window.location.href,'_system');break;case'reload':window.location.reload();break;case'back':window.history.back();break;case'forward':window.history.forward();break}});items.appendChild(btn)});
    var tr=document.createElement('label');tr.id='oc-panel-toggle';
    var cb=document.createElement('input');cb.type='checkbox';cb.id='oc-enter-toggle';
    if(localStorage.getItem('oc_enter_newline')!=='0')cb.checked=true;
    cb.addEventListener('change',function(){localStorage.setItem('oc_enter_newline',cb.checked?'1':'0');});
    var sd=document.createElement('span');sd.className='oc-switch';
    var knob=document.createElement('span');knob.className='oc-knob';
    sd.appendChild(knob);
    tr.appendChild(cb);tr.appendChild(sd);
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
    tab.addEventListener('click',function(e){e.stopPropagation();panel.classList.toggle('show')});
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

  if (Capacitor.isNativePlatform()) {
    await openInAppBrowser()
  } else {
    await openInNewTabFallback()
  }
})

onUnmounted(() => {
  unregisterBackButton()
  if (browserClosedHandle) browserClosedHandle.remove()
  if (pageLoadedHandle) pageLoadedHandle.remove()
})

async function openInAppBrowser(): Promise<void> {
  const pw = await serverStore.getPassword(profile.value!.id)
  const url = buildIframeUrl(profile.value!.baseUrl)

  const auth = profile.value!.authEnabled && pw

  browserClosedHandle = await InAppBrowser.addListener('closeEvent', () => {
    connectionStore.disconnect()
    if (pageLoadedHandle) pageLoadedHandle.remove()
    router.push('/')
  })

  pageLoadedHandle = await InAppBrowser.addListener('browserPageLoaded', async () => {
    const displayUrl = profile.value!.baseUrl.replace(/^https?:\/\//, '')
    const script = buildToolbarScript(connectionStore.state, displayUrl)
    await InAppBrowser.executeScript({ code: script })
  })

  await InAppBrowser.openWebView({
    url,
    toolbarType: ToolBarType.BLANK,
    toolbarColor: '#121212',
    backgroundColor: BackgroundColor.BLACK,
    enabledSafeBottomMargin: true,
    disableOverscroll: true,
    activeNativeNavigationForWebview: true,
    ...(auth ? {
      credentials: {
        username: profile.value!.username,
        password: pw!,
      },
    } : {}),
  })
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
