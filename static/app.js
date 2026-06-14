/**
 * PPT AI Generator - 30 Features Edition
 */
let selectedTemplate=null,selectedColor='blue',templates=[],isGenerating=false,generatedSlidesData=null,currentSlideIndex=0,isDarkMode=localStorage.getItem('darkMode')==='true',favorites=JSON.parse(localStorage.getItem('favorites')||'[]'),draftTimer=null;
const TEMPLATE_ICONS={blueprint:'📐',structure:'🏗️',storytelling:'📖',visual:'🎨',content:'📋',clarity:'✨'};
const TEMPLATE_COLORS={blueprint:'#3B82F6',structure:'#10B981',storytelling:'#F59E0B',visual:'#8B5CF6',content:'#06B6D4',clarity:'#F43F5E'};
const COLOR_MAP={blue:{primary:'#1A3C6E',accent:'#3B82F6',light:'#EFF6FF'},green:{primary:'#065F46',accent:'#10B981',light:'#ECFDF5'},purple:{primary:'#5B21B6',accent:'#8B5CF6',light:'#F5F3FF'},red:{primary:'#991B1B',accent:'#EF4444',light:'#FEF2F2'},orange:{primary:'#92400E',accent:'#F59E0B',light:'#FFFBEB'},cyan:{primary:'#155E75',accent:'#06B6D4',light:'#ECFEFF'},pink:{primary:'#9D174D',accent:'#EC4899',light:'#FDF2F8'},slate:{primary:'#1E293B',accent:'#475569',light:'#F1F5F9'}};
const POINT_SVG=`<svg viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);

// ============================================
// Init
// ============================================
document.addEventListener('DOMContentLoaded',()=>{
    if(isDarkMode)document.body.classList.add('dark');
    loadTemplates();bindEvents();checkDraft();
});

function bindEvents(){
    $('#btnGenerate').addEventListener('click',handleGenerate);
    $('#inputTopic').addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey))handleGenerate()});
    $('#inputTopic').addEventListener('input',autoSaveDraft);
    $('#inputAudience').addEventListener('input',autoSaveDraft);
    $('#inputExtra').addEventListener('input',autoSaveDraft);
    $('#btnNew').addEventListener('click',handleNew);
    $('#btnConfig').addEventListener('click',openConfig);
    $('#btnCloseModal').addEventListener('click',closeConfig);
    $('#btnCancelConfig').addEventListener('click',closeConfig);
    $('#btnSaveConfig').addEventListener('click',saveConfig);
    $('#btnTestConnection').addEventListener('click',testConnection);
    $('#btnCloseSlideModal').addEventListener('click',closeSlideModal);
    $('#btnPrevSlide').addEventListener('click',prevSlide);
    $('#btnNextSlide').addEventListener('click',nextSlide);
    $('#btnEdit').addEventListener('click',openEditModal);
    $('#btnCloseEdit').addEventListener('click',()=>{$('#modalEdit').style.display='none'});
    $('#btnCancelEdit').addEventListener('click',()=>{$('#modalEdit').style.display='none'});
    $('#btnSaveEdit').addEventListener('click',saveEdits);
    $('#btnNotes').addEventListener('click',openNotesModal);
    $('#btnCloseNotes').addEventListener('click',()=>{$('#modalNotes').style.display='none'});
    $('#btnCloseNotes2').addEventListener('click',()=>{$('#modalNotes').style.display='none'});
    $('#btnPrintNotes').addEventListener('click',printNotes);
    $('#btnPresent').addEventListener('click',openPresentMode);
    $('#presentClose').addEventListener('click',closePresentMode);
    $('#presentPrev').addEventListener('click',()=>navigatePresent(-1));
    $('#presentNext').addEventListener('click',()=>navigatePresent(1));
    $('#btnHistory').addEventListener('click',openHistoryModal);
    $('#btnCloseHistory').addEventListener('click',()=>{$('#modalHistory').style.display='none'});
    $('#btnCloseHistory2').addEventListener('click',()=>{$('#modalHistory').style.display='none'});
    $('#btnClearHistory').addEventListener('click',clearHistory);
    $('#btnTheme').addEventListener('click',toggleTheme);
    $('#btnShortcuts').addEventListener('click',()=>{$('#modalShortcuts').style.display='flex'});
    $('#btnCloseShortcuts').addEventListener('click',()=>{$('#modalShortcuts').style.display='none'});
    $('#btnAddSlide').addEventListener('click',()=>{$('#modalAddSlide').style.display='flex'});
    $('#btnCloseAddSlide').addEventListener('click',()=>{$('#modalAddSlide').style.display='none'});
    $('#btnCancelAddSlide').addEventListener('click',()=>{$('#modalAddSlide').style.display='none'});
    $('#btnConfirmAddSlide').addEventListener('click',addNewSlide);
    $('#btnRestoreDraft').addEventListener('click',restoreDraft);
    $('#btnDismissDraft').addEventListener('click',()=>{$('#draftBanner').style.display='none'});
    // Export dropdown
    $('#btnExport').addEventListener('click',e=>{e.stopPropagation();const m=$('#exportMenu');m.style.display=m.style.display==='none'?'block':'none'});
    $('#btnExportMd').addEventListener('click',()=>{exportAs('markdown');$('#exportMenu').style.display='none'});
    $('#btnExportTxt').addEventListener('click',()=>{exportAs('text');$('#exportMenu').style.display='none'});
    $('#btnExportJson').addEventListener('click',()=>{exportAs('json');$('#exportMenu').style.display='none'});
    document.addEventListener('click',()=>{$('#exportMenu').style.display='none'});

    $$('.color-option').forEach(o=>{o.addEventListener('click',()=>{$$('.color-option').forEach(x=>x.classList.remove('selected'));o.classList.add('selected');selectedColor=o.dataset.color})});
    $$('.modal-overlay').forEach(m=>{m.addEventListener('click',e=>{if(e.target===m)m.style.display='none'})});
    document.addEventListener('keydown',e=>{
        if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
        if(e.key==='Escape'){$$('.modal-overlay').forEach(m=>m.style.display='none');closePresentMode()}
        if(e.key==='?'){$('#modalShortcuts').style.display='flex'}
        if(e.key==='t'||e.key==='T')toggleTheme();
        if(e.key==='h'||e.key==='H')openHistoryModal();
        if(e.key===',')openConfig();
        if(generatedSlidesData){
            if(e.key==='e'||e.key==='E')openEditModal();
            if(e.key==='n'||e.key==='N')openNotesModal();
            if(e.key==='p'||e.key==='P')openPresentMode();
        }
        if($('#presentOverlay').style.display==='flex'){if(e.key==='ArrowLeft')navigatePresent(-1);if(e.key==='ArrowRight')navigatePresent(1)}
        if($('#modalSlidePreview').style.display==='flex'){if(e.key==='ArrowLeft')prevSlide();if(e.key==='ArrowRight')nextSlide()}
    });
}

// ============================================
// 1. Theme Toggle
// ============================================
function toggleTheme(){isDarkMode=!isDarkMode;document.body.classList.toggle('dark',isDarkMode);localStorage.setItem('darkMode',isDarkMode);showToast(isDarkMode?'🌙 暗色模式':'☀️ 亮色模式','success')}

// ============================================
// 2. Templates + Favorites
// ============================================
async function loadTemplates(){try{const r=await fetch('/api/templates');const d=await r.json();if(d.success){templates=d.templates;renderTemplates()}}catch(e){showToast('加载模板失败','error')}}
function renderTemplates(){
    const sorted=[...templates].sort((a,b)=>{const af=favorites.includes(a.id)?0:1;const bf=favorites.includes(b.id)?0:1;return af-bf});
    templateGrid.innerHTML=sorted.map(t=>{const f=favorites.includes(t.id);return`<div class="template-card" data-id="${t.id}" style="--card-accent:${TEMPLATE_COLORS[t.id]}"><div class="check-mark">✓</div><div class="template-card-header"><div class="template-icon" style="background:${TEMPLATE_COLORS[t.id]}15;color:${TEMPLATE_COLORS[t.id]}">${TEMPLATE_ICONS[t.id]||'📄'}</div><div><h3>${t.name_zh}</h3><span class="template-en">${t.name_en}</span></div></div><p>${t.description}</p><button class="fav-btn ${f?'active':''}" onclick="event.stopPropagation();toggleFav('${t.id}')">${f?'⭐':'☆'}</button></div>`}).join('');
    $$('.template-card').forEach(c=>{c.addEventListener('click',()=>selectTemplate(c.dataset.id))});
}
function toggleFav(id){if(favorites.includes(id)){favorites=favorites.filter(f=>f!==id)}else{favorites.push(id)}localStorage.setItem('favorites',JSON.stringify(favorites));renderTemplates()}
function selectTemplate(id){selectedTemplate=id;$$('.template-card').forEach(c=>c.classList.toggle('selected',c.dataset.id===id));$('#sectionColor').style.display='block'}

// ============================================
// 3. Auto-save Draft
// ============================================
function autoSaveDraft(){clearTimeout(draftTimer);draftTimer=setTimeout(()=>{const draft={topic:$('#inputTopic').value,audience:$('#inputAudience').value,extra:$('#inputExtra').value,template:selectedTemplate,color:selectedColor,ts:Date.now()};if(draft.topic)localStorage.setItem('draft',JSON.stringify(draft))},1000)}
function checkDraft(){const d=localStorage.getItem('draft');if(d){try{const draft=JSON.parse(d);if(draft.topic&&Date.now()-draft.ts<86400000){$('#draftBanner').style.display='flex'}}catch(e){}}}
function restoreDraft(){const d=localStorage.getItem('draft');if(d){const draft=JSON.parse(d);$('#inputTopic').value=draft.topic||'';$('#inputAudience').value=draft.audience||'';$('#inputExtra').value=draft.extra||'';if(draft.template)selectTemplate(draft.template);if(draft.color){selectedColor=draft.color;$$('.color-option').forEach(o=>o.classList.toggle('selected',o.dataset.color===draft.color))}$('#draftBanner').style.display='none';showToast('草稿已恢复','success')}}
function clearDraft(){localStorage.removeItem('draft')}

// ============================================
// 4. History
// ============================================
function saveToHistory(slidesData,downloadUrl){const h=JSON.parse(localStorage.getItem('pptHistory')||'[]');h.unshift({id:Date.now(),title:slidesData.title,slideCount:slidesData.slides.length,template:selectedTemplate,color:selectedColor,downloadUrl,date:new Date().toLocaleString('zh-CN'),data:slidesData});if(h.length>20)h.pop();localStorage.setItem('pptHistory',JSON.stringify(h))}
function openHistoryModal(){const h=JSON.parse(localStorage.getItem('pptHistory')||'[]');const list=$('#historyList');if(!h.length){list.innerHTML='<div class="history-empty">📂 暂无历史记录</div>'}else{list.innerHTML=h.map(x=>`<div class="history-item"><div class="history-item-info"><strong>${esc(x.title)}</strong><span>${x.slideCount}页 · ${x.date}</span></div><div class="history-item-actions"><button class="btn btn-secondary" onclick="loadHistory(${x.id})" style="padding:6px 12px;font-size:13px">加载</button>${x.downloadUrl?`<a class="btn btn-primary" href="${x.downloadUrl}" download style="padding:6px 12px;font-size:13px">下载</a>`:''}</div></div>`).join('')}$('#modalHistory').style.display='flex'}
function loadHistory(id){const h=JSON.parse(localStorage.getItem('pptHistory')||'[]');const item=h.find(x=>x.id===id);if(!item)return;generatedSlidesData=item.data;selectedTemplate=item.template||'blueprint';selectedColor=item.color||'blue';showResult(item.data,item.downloadUrl||'#');$('#modalHistory').style.display='none';showToast('已加载历史记录','success')}
function clearHistory(){localStorage.removeItem('pptHistory');$('#historyList').innerHTML='<div class="history-empty">📂 暂无历史记录</div>';showToast('历史已清空','info')}

// ============================================
// 5. Generate Flow (Streaming)
// ============================================
async function handleGenerate(){
    if(isGenerating)return;const topic=$('#inputTopic').value.trim();
    if(!topic){showToast('请输入主题','error');$('#inputTopic').focus();return}
    if(!selectedTemplate){showToast('请选择模板','error');return}
    isGenerating=true;clearDraft();
    $('#sectionGenerating').style.display='block';$('#sectionResult').style.display='none';$('#previewContainerLive').innerHTML='';
    $('#progressBar').style.width='0%';$('#progressText').textContent='正在调用 AI...';$('#generatingTitle').textContent='AI 正在生成内容...';
    $('#sectionGenerating').scrollIntoView({behavior:'smooth',block:'start'});
    const bt=$('#btnGenerate .btn-text'),bl=$('#btnGenerate .btn-loading');bt.style.display='none';bl.style.display='inline-flex';$('#btnGenerate').disabled=true;
    try{
        const slides=[];let title=topic;
        const resp=await fetch('/api/generate-stream',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({template_id:selectedTemplate,topic,audience:$('#inputAudience').value.trim()||'通用受众',extra_instructions:$('#inputExtra').value.trim(),color:selectedColor})});
        if(!resp.ok){const e=await resp.json();showToast(e.error||'生成失败','error');return}
        const reader=resp.body.getReader(),decoder=new TextDecoder();let buf='';
        while(true){
            const{done,value}=await reader.read();if(done)break;buf+=decoder.decode(value,{stream:true});const lines=buf.split('\n');buf=lines.pop()||'';
            for(const line of lines){if(!line.startsWith('data: '))continue;try{
                const ev=JSON.parse(line.slice(6));
                if(ev.type==='slide'){const s=ev.slide,i=ev.index;slides.push(s);if(i===1){$('#generatingTitle').textContent='正在逐页生成...';$('#previewContainerLive').innerHTML=renderTitleSlideHTML(topic,'...');setTimeout(()=>$$('.slide-preview').forEach(el=>el.classList.add('visible')),50)}
                    $('#progressBar').style.width=Math.round(i/10*80)+'%';$('#progressText').textContent=`第 ${i} 页: ${s.title}`;$('#previewContainerLive').insertAdjacentHTML('beforeend',renderContentSlideHTML(s,i,'?'));setTimeout(()=>{const el=$(`#slide-preview-${i}`);if(el)el.classList.add('visible')},50);bindSlideClickEvents()}
                else if(ev.type==='done'){title=ev.title||topic;const total=ev.total;const sub=$('#previewContainerLive .slide-subtitle');if(sub)sub.textContent=`共 ${total} 页`;$$('.slide-page-num').forEach(el=>{el.textContent=el.textContent.replace('?',total)});$('#previewContainerLive').insertAdjacentHTML('beforeend',renderEndSlideHTML());setTimeout(()=>$$('.slide-preview:not(.visible)').forEach(el=>el.classList.add('visible')),50);
                    $('#progressBar').style.width='85%';$('#progressText').textContent='正在生成 PPT...';$('#generatingTitle').textContent='正在生成 PPT 文件...';
                    generatedSlidesData={title,slides};
                    const pr=await fetch('/api/create-ppt',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slides_data:generatedSlidesData,template_id:selectedTemplate,color:selectedColor})});const pd=await pr.json();
                    if(pd.success){$('#progressBar').style.width='100%';$('#progressText').textContent='完成！';await sleep(300);showResult(generatedSlidesData,pd.download_url);saveToHistory(generatedSlidesData,pd.download_url);showToast('生成成功！','success')}else{showToast(pd.error||'PPT生成失败','error')}
                }else if(ev.type==='error'){showToast('AI错误: '+ev.error,'error')}
            }catch(e){}}
        }
    }catch(e){showToast('网络错误','error');console.error(e)}finally{isGenerating=false;bt.style.display='inline';bl.style.display='none';$('#btnGenerate').disabled=false}
}

function showResult(slidesData,downloadUrl){
    $('#downloadTitle').textContent=slidesData.title||'演示文稿';$('#downloadMeta').textContent=`共 ${slidesData.slides.length} 页`;$('#btnDownload').href=downloadUrl;
    // Stats
    const totalWords=slidesData.slides.reduce((a,s)=>a+(s.content||[]).join('').length,0);
    $('#resultStats').textContent=`📊 ${slidesData.slides.length} 页 · ${totalWords} 字 · 模板: ${selectedTemplate}`;
    $('#previewContainer').innerHTML=$('#previewContainerLive').innerHTML;bindSlideClickEvents();
    $('#sectionGenerating').style.display='none';$('#sectionResult').style.display='block';$('#sectionResult').scrollIntoView({behavior:'smooth',block:'start'});
}
function handleNew(){$('#sectionResult').style.display='none';$('#sectionGenerating').style.display='none';$('#previewContainerLive').innerHTML='';$('#inputTopic').value='';$('#inputExtra').value='';$('#sectionInput').scrollIntoView({behavior:'smooth',block:'start'});$('#inputTopic').focus()}

// ============================================
// 6. Edit Content
// ============================================
function openEditModal(){if(!generatedSlidesData)return;const slides=generatedSlidesData.slides;$('#editSlides').innerHTML=slides.map((s,i)=>`<div class="edit-slide-card"><h4><span>第 ${i+1} 页</span><div class="edit-actions"><button onclick="aiExpandSlide(${i})" title="AI扩展">🤖扩展</button><button onclick="aiSimplifySlide(${i})" title="AI精简">✂️精简</button><button onclick="deleteSlide(${i})" title="删除">🗑️</button><button onclick="moveSlide(${i},-1)" title="上移">⬆️</button><button onclick="moveSlide(${i},1)" title="下移">⬇️</button></div></h4><input type="text" class="edit-title" value="${esc(s.title)}"><textarea class="edit-content">${(s.content||[]).join('\n')}</textarea><input type="text" class="edit-notes" value="${esc(s.notes||'')}" placeholder="备注"></div>`).join('');$('#modalEdit').style.display='flex'}
function saveEdits(){if(!generatedSlidesData)return;$$('.edit-slide-card').forEach((c,i)=>{if(generatedSlidesData.slides[i]){generatedSlidesData.slides[i].title=c.querySelector('.edit-title').value;generatedSlidesData.slides[i].content=c.querySelector('.edit-content').value.split('\n').filter(l=>l.trim());generatedSlidesData.slides[i].notes=c.querySelector('.edit-notes').value}});refreshPreview();$('#modalEdit').style.display='none';showToast('✅ 已保存','success')}
function deleteSlide(i){if(generatedSlidesData.slides.length<=1){showToast('至少保留一页','error');return}generatedSlidesData.slides.splice(i,1);openEditModal();showToast('已删除','info')}
function moveSlide(i,dir){const s=generatedSlidesData.slides;if(i+dir<0||i+dir>=s.length)return;[s[i],s[i+dir]]=[s[i+dir],s[i]];openEditModal()}
async function aiExpandSlide(i){const s=generatedSlidesData.slides[i];showToast('🤖 AI 扩展中...','info');try{const r=await fetch('/api/ai-expand',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:s.title,content:s.content})});const d=await r.json();if(d.success){generatedSlidesData.slides[i].content=d.content;openEditModal();showToast('✅ 已扩展','success')}else{showToast(d.error,'error')}}catch(e){showToast('扩展失败','error')}}
async function aiSimplifySlide(i){const s=generatedSlidesData.slides[i];showToast('✂️ AI 精简中...','info');try{const r=await fetch('/api/ai-simplify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({content:s.content})});const d=await r.json();if(d.success){generatedSlidesData.slides[i].content=d.content;openEditModal();showToast('✅ 已精简','success')}else{showToast(d.error,'error')}}catch(e){showToast('精简失败','error')}}
function refreshPreview(){if(!generatedSlidesData)return;$('#previewContainerLive').innerHTML='';const s=generatedSlidesData.slides;$('#previewContainerLive').innerHTML=renderTitleSlideHTML(generatedSlidesData.title,s.length);s.forEach((x,i)=>$('#previewContainerLive').insertAdjacentHTML('beforeend',renderContentSlideHTML(x,i+1,s.length)));$('#previewContainerLive').insertAdjacentHTML('beforeend',renderEndSlideHTML());setTimeout(()=>$$('.slide-preview').forEach(el=>el.classList.add('visible')),50);bindSlideClickEvents();$('#previewContainer').innerHTML=$('#previewContainerLive').innerHTML;bindSlideClickEvents()}

// ============================================
// 7. Add Slide
// ============================================
function addNewSlide(){const title=$('#newSlideTitle').value.trim();const content=$('#newSlideContent').value.split('\n').filter(l=>l.trim());if(!title){showToast('请输入标题','error');return}const newSlide={slide_number:generatedSlidesData.slides.length+1,title,content,notes:''};if($('#newSlidePosition').value==='start'){generatedSlidesData.slides.unshift(newSlide)}else{generatedSlidesData.slides.push(newSlide)}refreshPreview();$('#modalAddSlide').style.display='none';$('#newSlideTitle').value='';$('#newSlideContent').value='';showToast('✅ 已添加','success')}

// ============================================
// 8. Notes View
// ============================================
function openNotesModal(){if(!generatedSlidesData)return;$('#notesModalBody').innerHTML=generatedSlidesData.slides.map((s,i)=>`<div class="note-card"><h4><span class="note-num">${i+1}</span>${esc(s.title)}</h4><p>${s.notes?esc(s.notes):'<span class="no-note">暂无备注</span>'}</p></div>`).join('');$('#modalNotes').style.display='flex'}
function printNotes(){if(!generatedSlidesData)return;const content=generatedSlidesData.slides.map((s,i)=>`第${i+1}页: ${s.title}\n备注: ${s.notes||'无'}\n要点:\n${(s.content||[]).map(c=>'  - '+c).join('\n')}\n`).join('\n---\n\n');const win=window.open('','_blank');win.document.write(`<pre style="font-family:sans-serif;white-space:pre-wrap;padding:20px">演讲者备注 - ${generatedSlidesData.title}\n${'='.repeat(40)}\n\n${content}</pre>`);win.document.close();win.print()}

// ============================================
// 9. Present Mode
// ============================================
let presentIndex=0;
function openPresentMode(){if(!generatedSlidesData)return;presentIndex=0;renderPresentSlide();$('#presentOverlay').style.display='flex';document.body.style.overflow='hidden'}
function closePresentMode(){$('#presentOverlay').style.display='none';document.body.style.overflow=''}
function navigatePresent(dir){const total=generatedSlidesData.slides.length+2;presentIndex=Math.max(0,Math.min(total-1,presentIndex+dir));renderPresentSlide()}
function renderPresentSlide(){const slides=generatedSlidesData.slides,total=slides.length+2,idx=presentIndex;let html='';
    if(idx===0){html=`<div class="slide-content slide-title-page" style="width:100%;height:100%;padding:60px"><div class="slide-decorations"><div class="deco-circle"></div><div class="deco-circle"></div></div><div class="slide-main-title" style="font-size:48px">${esc(generatedSlidesData.title)}</div><div class="slide-subtitle" style="font-size:20px">共 ${slides.length} 页</div></div>`}
    else if(idx===total-1){html=`<div class="slide-content slide-end-page" style="width:100%;height:100%;padding:60px"><div class="end-title" style="font-size:56px">谢谢</div><div class="end-subtitle" style="font-size:20px">THANK YOU</div></div>`}
    else{const s=slides[idx-1];const pts=(s.content||[]).map(p=>`<div class="slide-point" style="font-size:18px;margin-bottom:12px"><div class="point-icon">${POINT_SVG}</div><span>${esc(p)}</span></div>`).join('');html=`<div class="slide-content slide-content-page" style="width:100%;height:100%;padding:40px 50px"><div class="slide-header" style="margin-bottom:24px"><div class="slide-num-badge" style="width:40px;height:40px;font-size:18px">${idx}</div><div class="slide-title" style="font-size:28px">${esc(s.title)}</div></div><div class="slide-points">${pts}</div></div>`}
    $('#presentContainer').innerHTML=`<div class="present-slide">${html}</div>`;$('#presentPage').textContent=`${idx+1} / ${total}`}

// ============================================
// 10. Export
// ============================================
async function exportAs(format){if(!generatedSlidesData)return;
    if(format==='json'){downloadFile(JSON.stringify(generatedSlidesData,null,2),'ppt-content.json','application/json');return}
    try{const r=await fetch(`/api/export-${format}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slides_data:generatedSlidesData})});const d=await r.json();if(d.success){if(format==='markdown')downloadFile(d.markdown,'presentation.md','text/markdown');else if(format==='text')downloadFile(d.text,'presentation.txt','text/plain')}else{showToast(d.error,'error')}}catch(e){showToast('导出失败','error')}}
function downloadFile(content,filename,type){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url)}

// ============================================
// 11. Slide Preview Modal
// ============================================
function openSlideModal(i){if(!generatedSlidesData)return;currentSlideIndex=i;renderSlideDetail();$('#modalSlidePreview').style.display='flex'}
function closeSlideModal(){$('#modalSlidePreview').style.display='none'}
function renderSlideDetail(){const slides=generatedSlidesData.slides,total=slides.length+2,idx=currentSlideIndex;
    $('#slideModalPage').textContent=`${idx+1} / ${total}`;$('#btnPrevSlide').disabled=idx===0;$('#btnNextSlide').disabled=idx===total-1;$('#btnPrevSlide').style.opacity=idx===0?0.4:1;$('#btnNextSlide').style.opacity=idx===total-1?0.4:1;
    if(idx===0){$('#slideModalTitle').textContent='标题页';$('#slideModalBody').innerHTML=`<div class="detail-slide"><div class="detail-slide-header" style="justify-content:center;flex-direction:column;gap:8px;padding:40px"><div class="detail-slide-title" style="font-size:28px">${esc(generatedSlidesData.title)}</div><div style="opacity:0.7">共 ${slides.length} 页</div></div></div>`;return}
    if(idx===total-1){$('#slideModalTitle').textContent='结束页';$('#slideModalBody').innerHTML=`<div class="detail-slide"><div class="detail-slide-header" style="justify-content:center;flex-direction:column;gap:8px;padding:40px"><div class="detail-slide-title" style="font-size:32px">谢谢</div><div style="opacity:0.7">THANK YOU</div></div></div>`;return}
    const s=slides[idx-1];$('#slideModalTitle').textContent=`第 ${idx} 页 · ${s.title}`;
    const pts=(s.content||[]).map(p=>`<div class="detail-point"><div class="detail-point-icon">${POINT_SVG}</div><div class="detail-point-text">${esc(p)}</div></div>`).join('');
    const notes=s.notes?`<div class="detail-notes"><div class="detail-notes-label">📝 备注</div><div class="detail-notes-text">${esc(s.notes)}</div></div>`:'';
    const actions=`<div class="detail-actions"><button class="btn btn-secondary" onclick="aiExpandSlide(${idx-1});closeSlideModal()" style="padding:6px 12px;font-size:13px">🤖 AI扩展</button><button class="btn btn-secondary" onclick="aiSimplifySlide(${idx-1});closeSlideModal()" style="padding:6px 12px;font-size:13px">✂️ AI精简</button></div>`;
    $('#slideModalBody').innerHTML=`<div class="detail-slide"><div class="detail-slide-header"><div class="detail-slide-num">${idx}</div><div class="detail-slide-title">${esc(s.title)}</div></div><div class="detail-slide-body"><div class="detail-points">${pts}</div>${notes}${actions}</div></div>`}
function prevSlide(){if(currentSlideIndex>0){currentSlideIndex--;renderSlideDetail()}}
function nextSlide(){const t=generatedSlidesData?generatedSlidesData.slides.length+2:0;if(currentSlideIndex<t-1){currentSlideIndex++;renderSlideDetail()}}
function bindSlideClickEvents(){$$('.slide-preview').forEach((c,i)=>{c.onclick=()=>openSlideModal(i)})}

// ============================================
// 12. Content Statistics
// ============================================
function getStats(){if(!generatedSlidesData)return null;const s=generatedSlidesData.slides;const words=s.reduce((a,x)=>a+(x.content||[]).join('').length,0);const points=s.reduce((a,x)=>a+(x.content||[]).length,0);return{pages:s.length,words,points}}

// ============================================
// HTML Renderers
// ============================================
function renderTitleSlideHTML(title,total){return`<div class="slide-preview"><div class="slide-aspect"><div class="slide-content slide-title-page" onclick="openSlideModal(0)" style="cursor:pointer"><div class="slide-decorations"><div class="deco-circle"></div><div class="deco-circle"></div></div><div class="slide-main-title">${esc(title)}</div><div class="slide-subtitle">共 ${total} 页 · AI 智能生成</div></div></div><div class="slide-status done"><span class="status-dot"></span>标题页 · 点击预览</div></div>`}
function renderContentSlideHTML(slideData,index,total){const pts=(slideData.content||[]).slice(0,4).map(p=>`<div class="slide-point"><div class="point-icon">${POINT_SVG}</div><span>${esc(p)}</span></div>`).join('');const extra=(slideData.content||[]).length-4;const hint=extra>0?`<div style="font-size:12px;color:var(--text-muted);margin-top:8px">...还有 ${extra} 个要点</div>`:'';return`<div class="slide-preview" id="slide-preview-${index}"><div class="slide-aspect"><div class="slide-content slide-content-page"><div class="slide-header slide-header-clickable" onclick="openSlideModal(${index})"><div class="slide-num-badge">${index}</div><div class="slide-title">${esc(slideData.title)}</div><div class="slide-preview-btn"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 12l4-4-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div></div><div class="slide-points">${pts}</div>${hint}<div class="slide-page-num">${index} / ${total}</div></div></div><div class="slide-status"><span class="status-dot"></span>第 ${index} 页 · 点击标题预览</div></div>`}
function renderEndSlideHTML(){return`<div class="slide-preview"><div class="slide-aspect"><div class="slide-content slide-end-page"><div class="end-title">谢谢</div><div class="end-subtitle">THANK YOU</div></div></div><div class="slide-status done"><span class="status-dot"></span>结束页</div></div>`}

// ============================================
// Config
// ============================================
function openConfig(){cfgApiKey.value=localStorage.getItem('mimo_api_key')||'';cfgBaseUrl.value=localStorage.getItem('mimo_base_url')||'https://token-plan-cn.xiaomimimo.com/v1';cfgModel.value=localStorage.getItem('mimo_model')||'mimo-v2.5-pro';testResult.style.display='none';modalConfig.style.display='flex'}
function closeConfig(){modalConfig.style.display='none';testResult.style.display='none'}
async function testConnection(){const k=cfgApiKey.value.trim();if(!k){showToast('请输入Key','error');return}await fetch('/api/config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({api_key:k,base_url:cfgBaseUrl.value.trim(),model:cfgModel.value.trim()})}).catch(()=>{});const bt=btnTestConnection.querySelector('.btn-test-text'),bl=btnTestConnection.querySelector('.btn-test-loading');bt.style.display='none';bl.style.display='inline-flex';btnTestConnection.disabled=true;testResult.style.display='none';try{const r=await fetch('/api/test-connection',{method:'POST',headers:{'Content-Type':'application/json'}});const d=await r.json();testResult.style.display='block';if(d.success){testResult.className='test-result success';testResult.innerHTML=`✅ ${esc(d.message)}`;showToast('✅ 连接成功','success')}else{testResult.className='test-result error';testResult.innerHTML=`❌ ${esc(d.error)}`}}catch(e){testResult.style.display='block';testResult.className='test-result error';testResult.innerHTML=`❌ ${esc(e.message)}`}finally{bt.style.display='inline';bl.style.display='none';btnTestConnection.disabled=false}}
async function saveConfig(){const k=cfgApiKey.value.trim();if(!k){showToast('请输入Key','error');return}localStorage.setItem('mimo_api_key',k);localStorage.setItem('mimo_base_url',cfgBaseUrl.value.trim());localStorage.setItem('mimo_model',cfgModel.value.trim());fetch('/api/config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({api_key:k,base_url:cfgBaseUrl.value.trim(),model:cfgModel.value.trim()})}).catch(()=>{});showToast('已保存','success');closeConfig()}
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
function esc(t){const d=document.createElement('div');d.textContent=t||'';return d.innerHTML}
