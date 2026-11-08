import { t } from '@/i18n'

export function jsStringLiteral(value: string): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

export function buildToolbarScript(status: string, displayUrl: string, rtl: boolean): string {
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
  const directionLiteral = jsStringLiteral(rtl ? 'rtl' : 'ltr')
  const backGlyph = rtl ? '\\u2192' : '\\u2190'
  const forwardGlyph = rtl ? '\\u2190' : '\\u2192'

  return `(function(){
    if(document.getElementById('oc-tab'))return;
    var s=document.createElement('style');
    s.textContent='#oc-tab{position:fixed;top:0;left:50%;--oc-pull-y:0px;transform:translate3d(-50%,var(--oc-pull-y),0);z-index:2147483647;cursor:pointer;background:#121212;color:rgba(255,255,255,.9);font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;padding:3px 10px 2px;display:flex;align-items:center;gap:5px;user-select:none;white-space:nowrap;border:1px solid rgba(255,255,255,.7);border-top:none;border-radius:0 0 12px 12px;touch-action:none;will-change:transform}#oc-tab:before{content:"";position:absolute;left:-1px;right:-1px;bottom:calc(100% - 1px);height:140px;background:#121212;border-left:1px solid rgba(255,255,255,.7);border-right:1px solid rgba(255,255,255,.7);pointer-events:none}#oc-tab.oc-releasing{transition:transform .52s cubic-bezier(.16,1,.3,1)}#oc-tab.oc-hiding{transition:transform .9s cubic-bezier(.16,1,.3,1)}#oc-tab-label{position:relative;z-index:1}.oc-tab-spinner{position:absolute;left:50%;bottom:calc(100% + 5px);width:20px;height:20px;box-sizing:border-box;border:3px solid rgba(255,255,255,.28);border-top-color:rgba(255,255,255,.9);border-radius:50%;opacity:0;transform:translate3d(-50%,5px,0) scale(.5);transition:opacity .12s,transform .12s;z-index:1;pointer-events:none}#oc-tab.oc-pulling .oc-tab-spinner,#oc-tab.oc-refreshing .oc-tab-spinner{opacity:1;transform:translate3d(-50%,0,0) scale(1);animation:oc-spin .72s linear infinite}#oc-tab.oc-hiding .oc-tab-spinner{animation:none!important;opacity:0!important;transform:translate3d(-50%,5px,0) scale(.45)!important;transition:opacity .9s cubic-bezier(.16,1,.3,1),transform .9s cubic-bezier(.16,1,.3,1)}@keyframes oc-spin{to{transform:translate3d(-50%,0,0) scale(1) rotate(360deg)}}#oc-panel{position:fixed;top:38px;left:50%;transform:translateX(-50%);z-index:2147483647;display:none;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.5);font-family:-apple-system,BlinkMacSystemFont,sans-serif;min-width:230px}#oc-panel.show{display:block}#oc-panel-status{display:flex;align-items:center;gap:8px;padding:12px 16px;font-size:12px;color:#8e8e8e;background:#2c2c2e}#oc-panel-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;background:${dotColor}${pulse ? ';animation:oc-pulse 1.5s infinite' : ''}}@keyframes oc-pulse{0%,100%{opacity:1}50%{opacity:.4}}#oc-panel-url{margin-left:auto;font-size:11px;opacity:.6}#oc-panel-items{background:#1c1c1e}#oc-panel-items button{display:flex;align-items:center;gap:10px;width:100%;padding:8px 16px;border:none;background:transparent;color:#eee;text-align:left;font-size:14px;cursor:pointer;transition:background .15s}#oc-panel-items button:hover{background:rgba(255,255,255,.08)}#oc-panel-close{color:#ff453a!important}#oc-panel-close .oc-lbl{transform:translateY(2px)}#oc-panel-close:hover{background:rgba(255,69,58,.15)!important}.oc-ico{display:inline-flex;align-items:center;justify-content:center;width:32px;font-size:16px;line-height:1}.oc-ico-sm{font-size:11px}.oc-lbl{display:inline-block;line-height:1;padding-left:10px}#oc-panel-items button:nth-child(1) .oc-lbl{transform:translateY(1.5px)}#oc-panel-items button:nth-child(2) .oc-lbl{transform:translateY(2px)}#oc-panel-items button:nth-child(4) .oc-lbl{transform:translateY(1px)}#oc-panel-toggle{display:flex;align-items:center;gap:10px;width:100%;padding:8px 16px;background:transparent;color:#eee;font-size:14px;cursor:pointer}#oc-panel-toggle:hover{background:rgba(255,255,255,.08)}.oc-switch{position:relative;width:22px;height:14px;flex-shrink:0;display:inline-flex;align-items:center;background:#555;border-radius:7px;transition:.2s;cursor:pointer}.oc-switch .oc-knob{position:absolute;left:2px;top:2px;width:10px;height:10px;background:#fff;border-radius:50%;transition:.2s}#oc-panel-toggle input{position:absolute;opacity:0;width:0;height:0;pointer-events:none}#oc-panel-toggle input:checked+.oc-switch,.oc-switch.oc-on{background:#888}#oc-panel-toggle input:checked+.oc-switch .oc-knob,.oc-switch.oc-on .oc-knob{transform:translateX(8px)}div[data-slot="tabs-trigger-wrapper"][data-value="servers"]{display:none!important}div[id$="-content-servers"]{display:none!important}#opencode-titlebar-right .bg-icon-success-base{display:none!important}#oc-panel[dir="rtl"]{direction:rtl;text-align:right}#oc-panel[dir="rtl"] #oc-panel-url{margin-left:0;margin-right:auto;direction:ltr;unicode-bidi:isolate}#oc-panel[dir="rtl"] #oc-panel-items button{text-align:right}#oc-panel[dir="rtl"] .oc-lbl{padding-left:0;padding-right:10px}#oc-panel[dir="rtl"] .oc-switch .oc-knob{left:auto;right:2px}#oc-panel[dir="rtl"] #oc-panel-toggle input:checked+.oc-switch .oc-knob,#oc-panel[dir="rtl"] .oc-switch.oc-on .oc-knob{transform:translateX(-8px)}';
    document.head.appendChild(s);
    var tab=document.createElement('div');tab.id='oc-tab';
    var tabSpinner=document.createElement('span');tabSpinner.className='oc-tab-spinner';tabSpinner.setAttribute('aria-hidden','true');
    var tabLabel=document.createElement('span');tabLabel.id='oc-tab-label';tabLabel.textContent=${jsStringLiteral(t('menu.options'))}+' \\u22EE';
    tab.appendChild(tabSpinner);tab.appendChild(tabLabel);
    document.body.appendChild(tab);
    var panel=document.createElement('div');panel.id='oc-panel';panel.setAttribute('dir',${directionLiteral});
    var statusRow=document.createElement('div');statusRow.id='oc-panel-status';
    var dot=document.createElement('span');dot.id='oc-panel-dot';
    var label=document.createElement('span');label.textContent=${statusLabelLiteral};
    var urlSpan=document.createElement('span');urlSpan.id='oc-panel-url';urlSpan.textContent=${displayUrlLiteral};
    statusRow.appendChild(dot);statusRow.appendChild(label);statusRow.appendChild(urlSpan);
    panel.appendChild(statusRow);
    var items=document.createElement('div');items.id='oc-panel-items';
    var btns=[
      {i:'\\u21BB',l:${jsStringLiteral(t('common.refresh'))},a:'reload'},
      {i:'${backGlyph}',l:${jsStringLiteral(t('common.back'))},a:'back'},
      {i:'${forwardGlyph}',l:${jsStringLiteral(t('menu.forward'))},a:'forward'},
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

