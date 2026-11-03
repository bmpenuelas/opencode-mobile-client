/**
 * Injected WebView fixes for OpenCode Web features that break inside the native
 * InAppBrowser WebView on mobile. Each builder returns a self-contained IIFE
 * string that is injected with `InAppBrowser.executeScript`.
 *
 * These scripts follow the rules in `docs/webview-injection-review.md`:
 * - they only read data already present in the page, never credentials,
 * - they never send anything off the device,
 * - every dynamic value is serialized, and the scripts are plain ES5 so they
 *   parse on every Android/iOS WebView the app supports.
 */

/** Message type used by the download bridge to hand a file to the host. */
export const DEVICE_DOWNLOAD_MESSAGE_TYPE = 'opencode:device-download'

/** Route OpenCode Web serves a raw workspace file from, used by the preview fix. */
export const RAW_FILE_ROUTE = '/api/fs/read/'

/**
 * MIME type for a downloaded file name.
 *
 * Kept self-contained so the host can call it and so the download bridge can
 * embed its source in a WebView when needed.
 */
export function guessDownloadMime(fileName: unknown): string {
  const name = String(fileName == null ? '' : fileName)
  const dot = name.lastIndexOf('.')
  const extension = dot < 0 ? '' : name.slice(dot + 1).toLowerCase()
  const types: Record<string, string> = {
    html: 'text/html',
    htm: 'text/html',
    xhtml: 'application/xhtml+xml',
    svg: 'image/svg+xml',
    md: 'text/markdown',
    markdown: 'text/markdown',
    txt: 'text/plain',
    text: 'text/plain',
    log: 'text/plain',
    json: 'application/json',
    jsonc: 'application/json',
    json5: 'application/json',
    js: 'text/javascript',
    mjs: 'text/javascript',
    cjs: 'text/javascript',
    jsx: 'text/javascript',
    ts: 'text/plain',
    tsx: 'text/plain',
    css: 'text/css',
    scss: 'text/plain',
    less: 'text/plain',
    xml: 'application/xml',
    yaml: 'text/yaml',
    yml: 'text/yaml',
    toml: 'text/plain',
    ini: 'text/plain',
    env: 'text/plain',
    csv: 'text/csv',
    tsv: 'text/tab-separated-values',
    sh: 'text/plain',
    bash: 'text/plain',
    zsh: 'text/plain',
    fish: 'text/plain',
    py: 'text/plain',
    rb: 'text/plain',
    rs: 'text/plain',
    go: 'text/plain',
    java: 'text/plain',
    kt: 'text/plain',
    swift: 'text/plain',
    php: 'text/plain',
    sql: 'text/plain',
    c: 'text/plain',
    h: 'text/plain',
    cpp: 'text/plain',
    hpp: 'text/plain',
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    bmp: 'image/bmp',
    ico: 'image/x-icon',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    m4a: 'audio/mp4',
    ogg: 'audio/ogg',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
    zip: 'application/zip',
    gz: 'application/gzip',
    tgz: 'application/gzip',
    tar: 'application/x-tar',
  }
  return types[extension] || 'application/octet-stream'
}

/**
 * Download bridge.
 *
 * OpenCode Web saves a file by clicking a detached `<a download>` whose `href` is
 * a `blob:` URL, then immediately revoking it. The native InAppBrowser handler
 * saves that blob but, for text types such as `text/html`, only "previews" it
 * inside the WebView (and it guesses `downloadfile.bin` when it cannot read the
 * name), so the file never actually reaches the device.
 *
 * The bridge reads the bytes in the page and streams them to the host in chunks,
 * which saves the real file and opens the device share sheet so the user picks
 * where it goes. Mouse/native downloads and non-anchor downloads are untouched.
 */
export function buildDownloadBridgeScript(): string {
  return `(function(){
    if(window.__oc_downloadBridge)return;
    window.__oc_downloadBridge=true;

    var messageType=${JSON.stringify(DEVICE_DOWNLOAD_MESSAGE_TYPE)};
    var CHUNK=512*1024;
    var MAX_BYTES=64*1024*1024;
    var counter=0;

    function post(payload){
      var app=window.mobileApp;
      if(!app||typeof app.postMessage!=='function')return false;
      try{app.postMessage({detail:payload});return true;}catch(e){return false;}
    }

    function sameOrigin(href){
      try{return new URL(href,window.location.href).origin===window.location.origin;}catch(e){return false;}
    }

    function send(href,name,fallback){
      var id='dl-'+Date.now()+'-'+(++counter);
      fetch(href).then(function(response){
        if(!response.ok)throw new Error('HTTP '+response.status);
        return response.blob();
      }).then(function(blob){
        if(blob.size>MAX_BYTES)throw new Error('download too large');
        if(!post({type:messageType,phase:'start',id:id,fileName:name,mimeType:blob.type||'',size:blob.size}))throw new Error('bridge unavailable');
        var offset=0;
        function next(){
          if(offset>=blob.size){post({type:messageType,phase:'finish',id:id});return;}
          var slice=blob.slice(offset,offset+CHUNK);
          offset+=slice.size;
          var reader=new FileReader();
          reader.onloadend=function(){
            var data=String(reader.result||'').split(',').pop()||'';
            post({type:messageType,phase:'chunk',id:id,base64:data});
            next();
          };
          reader.onerror=function(){post({type:messageType,phase:'error',id:id,message:'read failed'});};
          reader.readAsDataURL(slice);
        }
        next();
      }).catch(function(){try{fallback();}catch(e){}});
    }

    try{
      var click=HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click=function(){
        try{
          var href=this.getAttribute&&this.getAttribute('href');
          if(this.hasAttribute&&this.hasAttribute('download')&&href&&!this.hasAttribute('data-oc-device-download')){
            var absolute=this.href;
            if(href.slice(0,5)==='blob:'||sameOrigin(absolute)){
              var self=this;
              send(absolute,this.getAttribute('download')||'download',function(){click.call(self);});
              return;
            }
          }
        }catch(e){}
        return click.apply(this,arguments);
      };
    }catch(e){}
  })();`
}

/**
 * HTML preview fix.
 *
 * The file explorer previews HTML in a sandboxed `<iframe>` whose `src` is a
 * `blob:` URL. Two things break that on mobile:
 *
 * 1. A `blob:` document inherits the embedding page's CSP, so the strict
 *    `script-src 'self'` served by OpenCode Web blocks inline scripts in the
 *    previewed file (script-driven pages stay blank).
 * 2. Relative URLs inside a blob document resolve against the blob URL, so the
 *    preview's CSS, images and fonts never load. Some Android WebViews also
 *    refuse a `blob:` frame outright.
 *
 * The bridge repoints the frame at the server's raw file route
 * (`/api/fs/read/<path>`). It is served as a normal HTTP document with no
 * inherited policy, its URL keeps the file's directory so relative assets
 * resolve, and `allow-same-origin` lets same-origin fonts load. The sandbox is
 * kept, so the preview still cannot reach into the app.
 */
export function buildPreviewFixScript(): string {
  return `(function(){
    if(window.__oc_previewFix)return;
    window.__oc_previewFix=true;

    var rawRoute=${JSON.stringify(RAW_FILE_ROUTE)};

    function artifactPath(frame){
      var scope=frame.closest?frame.closest('[data-slot="artifact-view"]'):null;
      var label=(scope||document).querySelector('[data-slot="artifact-filename"]');
      if(!label)return '';
      return String(label.getAttribute('title')||label.textContent||'').trim();
    }

    // Keep the directory in the URL so relative assets resolve against it, and
    // encode only the segments (not the separators).
    function rawUrl(path){
      var segments=String(path).replace(/^\\/+/, '').split('/');
      for(var i=0;i<segments.length;i++)segments[i]=encodeURIComponent(segments[i]);
      return rawRoute+segments.join('/');
    }

    function fix(frame){
      if(!frame||frame.tagName!=='IFRAME')return;
      if(frame.getAttribute('sandbox')==null)return;
      if(frame.getAttribute('data-oc-preview-fixed'))return;
      var src=frame.getAttribute('src')||'';
      if(src.slice(0,5)!=='blob:')return;
      var path=artifactPath(frame);
      if(!path)return;
      var url=rawUrl(path);
      frame.setAttribute('data-oc-preview-fixed',url);
      fetch(url,{credentials:'same-origin'}).then(function(response){
        if(!response.ok)throw new Error('raw file unavailable');
        var type=(response.headers.get('content-type')||'').toLowerCase();
        if(type.indexOf('text/html')<0)throw new Error('not markup');
        if(frame.getAttribute('data-oc-preview-fixed')!==url)return;
        var sandbox=frame.getAttribute('sandbox')||'';
        if(sandbox.indexOf('allow-same-origin')<0)frame.setAttribute('sandbox',(sandbox+' allow-same-origin').trim());
        frame.setAttribute('src',url);
      }).catch(function(){});
    }

    function scan(){
      var frames=document.querySelectorAll('iframe[sandbox]');
      for(var i=0;i<frames.length;i++)fix(frames[i]);
    }

    function mount(){
      if(!document.documentElement){setTimeout(mount,30);return;}
      var observer=new MutationObserver(scan);
      try{observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['src','sandbox']});}catch(e){}
      scan();
      setTimeout(scan,300);
      setTimeout(scan,1200);
      setTimeout(scan,3000);
    }
    mount();
  })();`
}

/**
 * Chat drag-and-drop bridge.
 *
 * The composer accepts files through HTML5 drag events, which touch devices never
 * fire. The bridge turns a long-press on a workspace file row into a real drag: it
 * starts a synthetic `dragstart` with a shared `DataTransfer` (so the file tree
 * populates the payload itself), shows a following chip, and dispatches
 * `dragenter`/`dragover`/`drop` on the composer when the finger is released over
 * it. Mouse drags keep using the native events untouched.
 */
export function buildChatDragBridgeScript(): string {
  return `(function(){
    if(window.__oc_chatDrag)return;
    window.__oc_chatDrag=true;

    var HOLD_MS=350;
    var MOVE_TOLERANCE=10;
    var state=null;

    function composerEl(){
      return document.querySelector('form[data-component="composer"]')||document.querySelector('[data-component="composer"]');
    }

    function rowFrom(event){
      var path=event.composedPath?event.composedPath():[];
      for(var i=0;i<path.length;i++){
        var node=path[i];
        if(node&&node.nodeType===1&&node.dataset&&node.dataset.itemPath)return node;
      }
      var target=event.target;
      while(target&&target.nodeType===1){
        if(target.dataset&&target.dataset.itemPath)return target;
        target=target.parentElement;
      }
      return null;
    }

    function inFileTree(row){
      var node=row;
      while(node){
        if(node.matches&&(node.matches('[data-slot="session-review-v2-sidebar-tree"]')||node.matches('file-tree-container')||node.matches('[data-component="file-tree-v2"]')))return true;
        if(node.parentElement){node=node.parentElement;continue;}
        var root=node.getRootNode&&node.getRootNode();
        node=root&&root.host?root.host:null;
      }
      return false;
    }

    function nameFor(row){
      var path=row.dataset.itemPath||'';
      var parts=path.split(/[\\\\/]/);
      return parts[parts.length-1]||path||'file';
    }

    function makeGhost(name,x,y){
      var ghost=document.createElement('div');
      ghost.textContent=name;
      ghost.setAttribute('aria-hidden','true');
      ghost.style.cssText='position:fixed;left:'+(x+12)+'px;top:'+(y-14)+'px;z-index:2147483647;max-width:220px;padding:6px 10px;border-radius:10px;background:rgba(28,28,30,.96);color:#fff;font:13px/1.3 -apple-system,BlinkMacSystemFont,sans-serif;pointer-events:none;box-shadow:0 8px 28px rgba(0,0,0,.45);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
      document.body.appendChild(ghost);
      return ghost;
    }

    function clear(){
      if(!state)return;
      if(state.timer)clearTimeout(state.timer);
      if(state.ghost)state.ghost.remove();
      state=null;
    }

    function startDrag(){
      if(!state||state.started)return;
      var dataTransfer;
      try{dataTransfer=new DataTransfer();}catch(e){clear();return;}
      state.started=true;
      state.dataTransfer=dataTransfer;
      try{
        state.row.dispatchEvent(new DragEvent('dragstart',{bubbles:true,composed:true,cancelable:true,dataTransfer:dataTransfer}));
      }catch(e){}
      state.ghost=makeGhost(nameFor(state.row),state.x,state.y);
      try{if(navigator.vibrate)navigator.vibrate(10);}catch(e){}
    }

    function overComposer(x,y){
      var el=composerEl();
      if(!el)return false;
      var rect=el.getBoundingClientRect();
      if(!rect.width||!rect.height)return false;
      return x>=rect.left&&x<=rect.right&&y>=rect.top&&y<=rect.bottom;
    }

    function finish(){
      if(!state)return;
      var current=state;
      clear();
      if(!current.started||!current.dataTransfer)return;
      if(!overComposer(current.x,current.y))return;
      var target=composerEl()||document.body;
      try{
        target.dispatchEvent(new DragEvent('dragenter',{bubbles:true,cancelable:true,dataTransfer:current.dataTransfer}));
        target.dispatchEvent(new DragEvent('dragover',{bubbles:true,cancelable:true,dataTransfer:current.dataTransfer}));
        target.dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:current.dataTransfer}));
      }catch(e){}
    }

    document.addEventListener('pointerdown',function(event){
      if(state)return;
      if(event.pointerType&&event.pointerType!=='touch'&&event.pointerType!=='pen')return;
      if(event.button&&event.button>0)return;
      var row=rowFrom(event);
      if(!row||!inFileTree(row))return;
      state={row:row,x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY,started:false,timer:null,ghost:null,dataTransfer:null};
      state.timer=setTimeout(startDrag,HOLD_MS);
    },true);

    document.addEventListener('pointermove',function(event){
      if(!state)return;
      if(!state.started){
        if(Math.abs(event.clientX-state.startX)>MOVE_TOLERANCE||Math.abs(event.clientY-state.startY)>MOVE_TOLERANCE){clear();return;}
        return;
      }
      state.x=event.clientX;
      state.y=event.clientY;
      if(state.ghost){
        state.ghost.style.left=(event.clientX+12)+'px';
        state.ghost.style.top=(event.clientY-14)+'px';
      }
      if(event.cancelable)event.preventDefault();
    },{capture:true,passive:false});

    document.addEventListener('pointerup',function(){if(state)finish();},true);
    document.addEventListener('pointercancel',function(){clear();},true);
  })();`
}