/* SportHub Visual Studio 1.2 - admin-only panel. Reuses Supabase Auth / site_content RLS. */
(()=>{'use strict';
if(window.SportHubStudio)return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=(s,p=document)=>p.querySelector(s);
const MB=3_000_000;
let api=null,root=null,selected=null,originalValue=null,originalItem=null,mode='content',previewing=false,blobUrl=null,blocked=false;
const presets=[{id:'default',label:'Giữ bố cục gốc',mode:'default',columns:3},{id:'cards3',label:'Thẻ 3 cột',mode:'grid',columns:3},{id:'cards2',label:'Thẻ 2 cột',mode:'grid',columns:2},{id:'stack',label:'Một cột',mode:'stack',columns:1},{id:'row',label:'Dàn ngang',mode:'row',columns:3}];
const defaultSpec=()=>({mode:'grid',columns:3,gap:20,padding:0,radius:0,bg:'none',align:'start',order:[]});
let design=defaultSpec();
const isImage=n=>n&&(n.tagName==='IMG'||n.dataset.shImageMode?.startsWith('background'));
const srcFromCss=css=>css?.match(/url\(["']?(.*?)["']?\)/)?.[1]?.replace(/["']$/,'')||'';
const imageSource=n=>{if(!n)return'';if(n.tagName==='IMG')return n.getAttribute('src')||'';
 const mode=n.dataset.shImageMode;
 return srcFromCss(getComputedStyle(n,mode==='background-before'?'::before':mode==='background-after'?'::after':null).backgroundImage);
};
const setImage=(n,url)=>{if(!n)return;if(n.tagName==='IMG'){n.src=url;return}
 if(n.dataset.shImageMode?.startsWith('background')){
  const safe=String(url||'').replace(/["'\\\n\r{}<>]/g,'');
  if(n.dataset.shImageMode==='background')n.style.setProperty('background-image','url("'+safe+'")','important');
  else{
   const id='sh-studio-temp-'+n.dataset.shEdit.replace(/[^a-z0-9]/gi,'_');
   let st=document.getElementById(id);if(!st){st=document.createElement('style');st.id=id;document.head.append(st)}
   const pseudo=n.dataset.shImageMode==='background-before'?'before':'after';
   st.textContent='[data-sh-edit="'+n.dataset.shEdit+'"]::'+pseudo+'{background-image:url("'+safe+'")!important}';
  }
 }
};

const removePseudoPreview=n=>{if(!n)return;document.getElementById('sh-studio-temp-'+(n.dataset.shEdit||'').replace(/[^a-z0-9]/gi,'_'))?.remove()};
function setStatus(t,error=false){const n=$('#shs-status',root);if(n){n.textContent=t||'';n.dataset.error=error?'1':'0'}}
function exists(){return !!root&&root.isConnected}
function emitPreview(){if(!selected||mode!=='layout')return;api.content.set(selected.dataset.shLayoutKey,{kind:'text',value:JSON.stringify(design)});previewing=true;api.shApplyLayouts();setStatus('Đang xem thử trên trang. Chưa lưu lên Supabase.');}
function originalText(node){return isImage(node)?imageSource(node):node?.textContent||''}
function clearPreview(){if(selected&&previewing){const key=mode==='layout'?selected.dataset.shLayoutKey:selected.dataset.shEdit;if(originalItem)api.content.set(key,originalItem);else api.content.delete(key);if(mode==='content'){if(isImage(selected)){setImage(selected,originalValue||'');removePseudoPreview(selected)}else selected.textContent=originalValue||'';api.applyContent()}else api.shApplyLayouts()}
previewing=false;if(blobUrl){URL.revokeObjectURL(blobUrl);blobUrl=null}}
function focusNode(node){if(selected)selected.classList.remove('shs-selected');clearPreview();selected=node;originalItem=null;originalValue=null;
if(selected){selected.classList.add('shs-selected');selected.scrollIntoView({behavior:'smooth',block:'center',inline:'nearest'});const key=mode==='layout'?selected.dataset.shLayoutKey:selected.dataset.shEdit;originalItem=api.content.get(key)?{...api.content.get(key)}:null;originalValue=originalText(node);if(mode==='layout'){try{design=originalItem?{...defaultSpec(),...JSON.parse(originalItem.value)}:defaultSpec()}catch{design=defaultSpec()}}}
renderPanel();}
function close(){document.documentElement.classList.remove('shs-design-open');clearPreview();if(selected)selected.classList.remove('shs-selected');selected=null;document.removeEventListener('click',capture,true);document.removeEventListener('keydown',keyHandler,true);root?.remove();root=null;api=null;}
function keyHandler(e){if(e.key==='Escape'&&exists()){e.preventDefault();close()}}
function capture(e){if(!exists()||!api?.user||!api?.sb)return;if(!(e.target instanceof Element)||e.target.closest('#shs-root,#sh-root'))return;
const list=api.shTargets(),candidates=mode==='layout'?list.layouts:list.edits;
const node=mode==='layout'?candidates.filter(n=>n.contains(e.target)).sort((a,b)=>a.querySelectorAll('*').length-b.querySelectorAll('*').length)[0]:candidates.filter(n=>n===e.target||n.contains(e.target)).sort((a,b)=>a.querySelectorAll('*').length-b.querySelectorAll('*').length)[0];
if(!node||!candidates.includes(node)){if(e.target.closest('a,button,input,select,textarea')){e.preventDefault();e.stopImmediatePropagation();setStatus('Đang ở chế độ thiết kế. Đóng bảng để dùng nút của website.')}return;}
e.preventDefault();e.stopImmediatePropagation();focusNode(node)}
function switchMode(m){if(m===mode)return;clearPreview();if(selected)selected.classList.remove('shs-selected');selected=null;mode=m;renderPanel()}
function renderPanel(){if(!exists())return;const tab=$('#shs-tabs',root);tab.querySelectorAll('button').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.mode===mode)));
const body=$('#shs-detail',root);const targets=api.shTargets();
if(!selected){
 const options=(mode==='content'?targets.edits:targets.layouts).slice(0,80);
 body.innerHTML=`<div class="shs-guide"><div class="shs-guide-icon">${mode==='content'?'✎':'▦'}</div><div><h3>${mode==='content'?'Chọn thành phần trên trang':'Chọn vùng cần sắp xếp'}</h3><p>${mode==='content'?'Bấm trực tiếp vào chữ, ảnh hoặc một mục bên dưới.':'Bấm vào nhóm thẻ bên trái hoặc chọn khu vực dưới đây để thử các mẫu bố cục.'}</p></div></div><div class="shs-overview"><strong>${options.length? (mode==='content'?targets.edits.length:targets.layouts.length)+' vị trí đã tìm thấy':'Chưa tìm thấy vị trí phù hợp'}</strong><button type="button" id="shs-refresh">↻ Quét lại</button></div>${options.length?`<label for="shs-filter">Danh sách thành phần</label><input class="shs-input" id="shs-filter" placeholder="Tìm tiêu đề, ảnh hoặc vùng..." aria-label="Lọc danh sách thành phần"><div id="shs-target-list" class="shs-target-list">${options.map((n,i)=>`<button type="button" data-index="${i}"><span>${mode==='layout'?'▦':isImage(n)?'▣':'T'}</span><span class="shs-target-title">${esc((mode==='layout'?(n.getAttribute('class')||n.tagName):isImage(n)?n.getAttribute('alt')||'Hình ảnh':n.textContent.trim()).slice(0,76))}</span></button>`).join('')}</div><p class="shs-small">Danh sách hiển thị tối đa 80 mục để thao tác nhanh. Bạn cũng có thể chọn trực tiếp trên trang.</p>`:`<div class="shs-empty"><h3>Chưa có mục phù hợp</h3><p>Trình quét không tìm thấy thành phần an toàn trên trang này.</p><p>Vui lòng kiểm tra file <code>sporthub-account.js</code> đã cập nhật bản 1.2, không chỉ hai file giao diện Studio. Số phần tử văn bản/ảnh trong DOM: ${document.body.querySelectorAll('h1,h2,h3,h4,p,img').length}.</p></div>`}`;
 $('#shs-refresh',root).onclick=()=>{api.shTargets();renderPanel();setStatus('Đã quét lại thành phần trên trang.')};
 root.querySelectorAll('#shs-target-list [data-index]').forEach(b=>b.onclick=()=>focusNode(options[Number(b.dataset.index)]));
 $('#shs-filter',root)?.addEventListener('input',e=>{const val=e.target.value.toLocaleLowerCase('vi');root.querySelectorAll('#shs-target-list button').forEach(b=>{b.hidden=!b.textContent.toLocaleLowerCase('vi').includes(val)})});
 setStatus('');return
}
if(mode==='content'){const image=isImage(selected);const key=selected.dataset.shEdit;const v=originalItem?.value??originalValue;
body.innerHTML=`<div class="shs-selected-name">Đang chọn: <strong>${image?'Hình ảnh':'Văn bản'}</strong></div><div class="shs-key">${esc(key)}</div><label for="shs-text">${image?'Địa chỉ ảnh HTTPS':'Nội dung mới'}</label>${image?`<input class="shs-input" id="shs-text" value="${esc(v)}"><label for="shs-file">Hoặc chọn ảnh từ máy (JPG / PNG / WebP, tối đa 3 MB)</label><input id="shs-file" type="file" accept="image/jpeg,image/png,image/webp">`:`<textarea class="shs-input" id="shs-text" rows="7" maxlength="10000">${esc(v)}</textarea>`}
<div class="shs-acts"><button type="button" id="shs-preview" class="shs-ghost">Xem thử</button><button type="button" id="shs-save" class="shs-primary">Lưu lên website</button></div><button class="shs-reset" id="shs-cancel" type="button">Bỏ thay đổi chưa lưu</button>`;
$('#shs-preview',root).onclick=previewContent;$('#shs-save',root).onclick=saveContent;$('#shs-cancel',root).onclick=()=>{clearPreview();focusNode(selected);setStatus('Đã bỏ bản xem thử.')};
$('#shs-file',root)?.addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;if(!['image/png','image/jpeg','image/webp'].includes(f.type)||f.size>MB){setStatus('Ảnh phải là JPG, PNG hoặc WebP và không quá 3 MB.',true);e.target.value='';return}if(blobUrl)URL.revokeObjectURL(blobUrl);blobUrl=URL.createObjectURL(f);setImage(selected,blobUrl);previewing=true;setStatus('Đang xem thử ảnh tải lên. Bấm Lưu để đăng ảnh lên website.')});
}else{
const key=selected.dataset.shLayoutKey;
body.innerHTML=`<div class="shs-selected-name">Bố cục khu vực: <strong>${esc(selected.className||selected.tagName)}</strong></div><div class="shs-key">${esc(key)}</div><h3>Gợi ý bố cục</h3><div class="shs-presets">${presets.map(p=>`<button type="button" class="shs-preset" data-preset="${p.id}">${esc(p.label)}</button>`).join('')}</div><h3>Tinh chỉnh thủ công</h3><div class="shs-control"><label for="shs-columns">Số cột</label><output id="shs-col-out">${design.columns}</output><input id="shs-columns" type="range" min="1" max="4" value="${design.columns}"></div><div class="shs-control"><label for="shs-gap">Khoảng cách các khối</label><output id="shs-gap-out">${design.gap}px</output><input id="shs-gap" type="range" min="0" max="64" step="4" value="${design.gap}"></div><div class="shs-control"><label for="shs-padding">Đệm trong khu vực</label><output id="shs-pad-out">${design.padding}px</output><input id="shs-padding" type="range" min="0" max="64" step="4" value="${design.padding}"></div><div class="shs-control"><label for="shs-radius">Bo góc khu vực</label><output id="shs-radius-out">${design.radius||0}px</output><input id="shs-radius" type="range" min="0" max="32" step="2" value="${design.radius||0}"></div><label for="shs-bg">Màu nền</label><select class="shs-input" id="shs-bg"><option value="none">Giữ nền mặc định</option><option value="white">Trắng</option><option value="soft">Đỏ rất nhạt</option><option value="dark">Đen SportHub</option></select><label for="shs-align">Căn nội dung</label><select class="shs-input" id="shs-align"><option value="start">Đầu hàng</option><option value="center">Giữa hàng</option><option value="end">Cuối hàng</option></select><h3>Sắp xếp các khối</h3><div id="shs-sort-items" class="shs-sort-items"></div><div class="shs-acts"><button type="button" id="shs-restore" class="shs-ghost">Bố cục gốc</button><button type="button" id="shs-save" class="shs-primary">Lưu bố cục</button></div><button class="shs-reset" id="shs-cancel" type="button">Hủy bản xem thử</button><p class="shs-small">Tự chuyển về 1 cột trên màn hình nhỏ. Không sửa dữ liệu sản phẩm hoặc tính toán giỏ hàng.</p>`;
$('#shs-bg',root).value=design.bg||'none';$('#shs-align',root).value=design.align||'start';
root.querySelectorAll('[data-preset]').forEach(b=>b.onclick=()=>{const p=presets.find(x=>x.id===b.dataset.preset);design={...design,mode:p.mode,columns:p.columns};syncLayoutControls();emitPreview()});
for(const [id,k,out] of [['#shs-columns','columns','#shs-col-out'],['#shs-gap','gap','#shs-gap-out'],['#shs-padding','padding','#shs-pad-out'],['#shs-radius','radius','#shs-radius-out']])$(id,root).oninput=e=>{design.mode=design.mode==='default'?'grid':design.mode;design[k]=Number(e.target.value);$(out,root).textContent=design[k]+(k==='columns'?'':'px');emitPreview()};
for(const [id,k] of [['#shs-bg','bg'],['#shs-align','align']])$(id,root).onchange=e=>{design.mode=design.mode==='default'?'grid':design.mode;design[k]=e.target.value;emitPreview()};
renderSortItems();$('#shs-save',root).onclick=saveLayout;$('#shs-restore',root).onclick=()=>{design={...design,mode:'default'};syncLayoutControls();emitPreview()};$('#shs-cancel',root).onclick=()=>{clearPreview();focusNode(selected);setStatus('Đã bỏ bản xem thử.')};
}
}
function renderSortItems(){
 const host=$('#shs-sort-items',root);if(!host||!selected)return;
 const n=selected.children.length;if(n<2){host.textContent='Không có nhiều khối để sắp xếp.';return}
 if(!Array.isArray(design.order)||design.order.length!==n||new Set(design.order).size!==n)design.order=Array.from({length:n},(_,i)=>i);
 const first=design.order.slice(0,16);
 host.innerHTML=first.map((idx,pos)=>{const item=selected.children[idx];const desc=(item.querySelector('h2,h3,h4,strong')?.textContent||item.textContent||item.tagName).trim().replace(/\s+/g,' ').slice(0,47);return `<div class="shs-sort-row"><span class="shs-sort-label">${esc(desc)||'Khối '+(idx+1)}</span><button type="button" data-pos="${pos}" data-dir="-1" aria-label="Chuyển lên">↑</button><button type="button" data-pos="${pos}" data-dir="1" aria-label="Chuyển xuống">↓</button></div>`}).join('')+(n>16?'<p class="shs-small">Chỉ hiện 16 khối đầu để tránh thao tác nhầm trên danh sách dài.</p>':'');
 host.querySelectorAll('button').forEach(b=>b.onclick=()=>{const a=Number(b.dataset.pos),to=a+Number(b.dataset.dir);if(to<0||to>=design.order.length)return;[design.order[a],design.order[to]]=[design.order[to],design.order[a]];design.mode=design.mode==='default'?'grid':design.mode;renderSortItems();emitPreview()});
}
function syncLayoutControls(){if(!exists())return;for(const [id,k,out] of [['#shs-columns','columns','#shs-col-out'],['#shs-gap','gap','#shs-gap-out'],['#shs-padding','padding','#shs-pad-out'],['#shs-radius','radius','#shs-radius-out']]){$(id,root).value=design[k];$(out,root).textContent=design[k]+(k==='columns'?'':'px')}$('#shs-bg',root).value=design.bg;$('#shs-align',root).value=design.align}
function previewContent(){if(!selected||mode!=='content')return;const v=$('#shs-text',root).value.trim();if(!v){setStatus('Nội dung không được để trống.',true);return}const image=isImage(selected);if(image&&!/^https:\/\//.test(v)){setStatus('Ảnh phải có URL HTTPS hoặc chọn tệp từ máy.',true);return}api.content.set(selected.dataset.shEdit,{kind:image?'image':'text',value:v});api.applyContent();previewing=true;setStatus('Đang xem thử. Chỉ bấm Lưu khi đã hài lòng.')}
async function saveContent(){if(blocked||!selected)return;const n=selected,k=n.dataset.shEdit,image=isImage(n);let v=$('#shs-text',root).value.trim();const f=$('#shs-file',root)?.files?.[0];if(!v&&!f){setStatus('Bạn cần nhập nội dung hoặc chọn ảnh.',true);return}if(!image&&v.length>10000){setStatus('Nội dung quá dài.',true);return}if(image&&!f&&!/^https:\/\//.test(v)){setStatus('Ảnh cần URL HTTPS.',true);return}
blocked=true;setStatus('Đang lưu lên Supabase...');try{
if(f){if(!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>MB)throw Error('Ảnh không hợp lệ hoặc lớn hơn 3 MB.');const ext={'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[f.type];const name=`${api.user.id}/studio-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;const {error}=await api.sb.storage.from('site-images').upload(name,f,{upsert:false,contentType:f.type});if(error)throw error;v=api.sb.storage.from('site-images').getPublicUrl(name).data.publicUrl}
const item={key:k,kind:image?'image':'text',value:v,updated_by:api.user.id,updated_at:new Date().toISOString()};const {error}=await api.sb.from('site_content').upsert(item,{onConflict:'key'});if(error)throw error;api.content.set(k,item);removePseudoPreview(n);previewing=false;if(blobUrl){URL.revokeObjectURL(blobUrl);blobUrl=null}api.applyContent();originalItem={...item};originalValue=v;$('#shs-text',root).value=v;setStatus('Đã lưu thành công! Tải lại trang hoặc mở ẩn danh để kiểm tra.')}
catch(e){setStatus('Không lưu được: '+String(e.message||e),true)}finally{blocked=false}}
async function saveLayout(){if(blocked||!selected)return;blocked=true;setStatus('Đang lưu bố cục...');const k=selected.dataset.shLayoutKey;try{
let error;if(design.mode==='default'){({error}=await api.sb.from('site_content').delete().eq('key',k));if(!error)api.content.delete(k)}else{const item={key:k,kind:'text',value:JSON.stringify(design),updated_by:api.user.id,updated_at:new Date().toISOString()};({error}=await api.sb.from('site_content').upsert(item,{onConflict:'key'}));if(!error)api.content.set(k,item)}if(error)throw error;api.shApplyLayouts();originalItem=api.content.get(k)?{...api.content.get(k)}:null;previewing=false;setStatus('Đã lưu bố cục cho trang này. Mở ẩn danh để kiểm tra.')}
catch(e){setStatus('Không lưu được: '+String(e.message||e),true)}finally{blocked=false}}
function open(config){if(exists())return;const {sb,user,shTargets,shApplyLayouts,applyContent}=config;if(!sb||!user||!shTargets||!shApplyLayouts||!applyContent)return;api=config;mode='content';selected=null;originalItem=null;previewing=false;
root=document.createElement('div');root.id='shs-root';root.innerHTML=`<aside class="shs-panel" aria-label="SportHub - Trình thiết kế"><div class="shs-header"><span class="shs-brand">S SPORT HUB</span><button type="button" id="shs-close" aria-label="Đóng trình thiết kế">×</button><h2>THIẾT KẾ TRỰC TIẾP</h2><p>Chỉnh nội dung, hình ảnh và bố cục song song với website đang chạy.</p></div><div id="shs-tabs" class="shs-tabs"><button data-mode="content" type="button" aria-selected="true">Chữ & ảnh</button><button data-mode="layout" type="button" aria-selected="false">Bố cục</button></div><div id="shs-detail" class="shs-detail"></div><div class="shs-footer"><p id="shs-status" aria-live="polite"></p><small>SportHub Visual Studio 1.2 · Chỉ dành cho Admin. Thay đổi lưu trên Supabase và có hiệu lực với mọi người.</small></div></aside>`;
document.body.append(root);document.documentElement.classList.add('shs-design-open');$('#shs-close',root).onclick=close;root.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>switchMode(b.dataset.mode));document.addEventListener('click',capture,true);document.addEventListener('keydown',keyHandler,true);renderPanel()}
window.SportHubStudio={open,close,isOpen:exists};
})();
