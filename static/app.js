/**
 * PPT AI Generator - 30 Features Edition
 */

// ============================================
// 日志工具
// ============================================
const LOG = {
    info: (tag, msg, data) => {
        const ts = new Date().toLocaleTimeString('zh-CN');
        console.log(`[${ts}] [${tag}] ${msg}`, data || '');
    },
    error: (tag, msg, data) => {
        const ts = new Date().toLocaleTimeString('zh-CN');
        console.error(`[${ts}] [${tag}] ❌ ${msg}`, data || '');
    },
    success: (tag, msg, data) => {
        const ts = new Date().toLocaleTimeString('zh-CN');
        console.log(`[${ts}] [${tag}] ✅ ${msg}`, data || '');
    }
};

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
function toggleTheme(){
    isDarkMode=!isDarkMode;
    document.body.classList.toggle('dark',isDarkMode);
    localStorage.setItem('darkMode',isDarkMode);
    LOG.info('主题', isDarkMode?'切换到暗色模式':'切换到亮色模式');
    showToast(isDarkMode?'🌙 暗色模式':'☀️ 亮色模式','success');
}

// ============================================
// 2. Templates + Favorites
// ============================================
async function loadTemplates(){
    LOG.info('模板', '加载模板列表...');
    try{
        const r=await fetch('/api/templates');
        const d=await r.json();
        if(d.success){
            templates=d.templates;
            LOG.success('模板', `加载成功, ${templates.length} 个模板`);
            renderTemplates();
        }
    }catch(e){
        LOG.error('模板', '加载失败', e);
        showToast('加载模板失败','error');
    }
}
function renderTemplates(){
    LOG.info('模板', '渲染模板列表, 收藏:', favorites);
    const sorted=[...templates].sort((a,b)=>{const af=favorites.includes(a.id)?0:1;const bf=favorites.includes(b.id)?0:1;return af-bf});
    templateGrid.innerHTML=sorted.map(t=>{const f=favorites.includes(t.id);return`<div class="template-card" data-id="${t.id}" style="--card-accent:${TEMPLATE_COLORS[t.id]}"><div class="check-mark">✓</div><div class="template-card-header"><div class="template-icon" style="background:${TEMPLATE_COLORS[t.id]}15;color:${TEMPLATE_COLORS[t.id]}">${TEMPLATE_ICONS[t.id]||'📄'}</div><div><h3>${t.name_zh}</h3><span class="template-en">${t.name_en}</span></div></div><p>${t.description}</p><button class="fav-btn ${f?'active':''}" onclick="event.stopPropagation();toggleFav('${t.id}')">${f?'⭐':'☆'}</button></div>`}).join('');
    $$('.template-card').forEach(c=>{c.addEventListener('click',()=>selectTemplate(c.dataset.id))});
}
function toggleFav(id){
    if(favorites.includes(id)){
        favorites=favorites.filter(f=>f!==id);
        LOG.info('收藏', `取消收藏: ${id}`);
    }else{
        favorites.push(id);
        LOG.info('收藏', `收藏模板: ${id}`);
    }
    localStorage.setItem('favorites',JSON.stringify(favorites));
    renderTemplates();
}
function selectTemplate(id){
    selectedTemplate=id;
    $$('.template-card').forEach(c=>c.classList.toggle('selected',c.dataset.id===id));
    $('#sectionColor').style.display='block';
    LOG.info('模板', `选择模板: ${id}`);
}

// ============================================
// 3. Auto-save Draft
// ============================================
function autoSaveDraft(){
    clearTimeout(draftTimer);
    draftTimer=setTimeout(()=>{
        const draft={topic:$('#inputTopic').value,audience:$('#inputAudience').value,extra:$('#inputExtra').value,template:selectedTemplate,color:selectedColor,ts:Date.now()};
        if(draft.topic){
            localStorage.setItem('draft',JSON.stringify(draft));
            LOG.info('草稿', '自动保存草稿');
        }
    },1000);
}
function checkDraft(){
    const d=localStorage.getItem('draft');
    if(d){
        try{
            const draft=JSON.parse(d);
            if(draft.topic&&Date.now()-draft.ts<86400000){
                LOG.info('草稿', '检测到未保存草稿:', draft.topic);
                $('#draftBanner').style.display='flex';
            }
        }catch(e){}
    }
}
function restoreDraft(){
    const d=localStorage.getItem('draft');
    if(d){
        const draft=JSON.parse(d);
        LOG.info('草稿', '恢复草稿:', draft.topic);
        $('#inputTopic').value=draft.topic||'';
        $('#inputAudience').value=draft.audience||'';
        $('#inputExtra').value=draft.extra||'';
        if(draft.template)selectTemplate(draft.template);
        if(draft.color){
            selectedColor=draft.color;
            $$('.color-option').forEach(o=>o.classList.toggle('selected',o.dataset.color===draft.color));
        }
        $('#draftBanner').style.display='none';
        showToast('草稿已恢复','success');
    }
}
function clearDraft(){
    localStorage.removeItem('draft');
    LOG.info('草稿', '清除草稿');
}

// ============================================
// 4. History
// ============================================
function saveToHistory(slidesData,downloadUrl){
    const h=JSON.parse(localStorage.getItem('pptHistory')||'[]');
    h.unshift({id:Date.now(),title:slidesData.title,slideCount:slidesData.slides.length,template:selectedTemplate,color:selectedColor,downloadUrl,date:new Date().toLocaleString('zh-CN'),data:slidesData});
    if(h.length>20)h.pop();
    localStorage.setItem('pptHistory',JSON.stringify(h));
    LOG.info('历史', `保存到历史记录, 当前 ${h.length} 条`);
}
function openHistoryModal(){
    LOG.info('历史', '打开历史记录');
    const h=JSON.parse(localStorage.getItem('pptHistory')||'[]');
    LOG.info('历史', `共 ${h.length} 条记录`);
    const list=$('#historyList');
    if(!h.length){list.innerHTML='<div class="history-empty">📂 暂无历史记录</div>'}
    else{list.innerHTML=h.map(x=>`<div class="history-item"><div class="history-item-info"><strong>${esc(x.title)}</strong><span>${x.slideCount}页 · ${x.date}</span></div><div class="history-item-actions"><button class="btn btn-secondary" onclick="loadHistory(${x.id})" style="padding:6px 12px;font-size:13px">加载</button>${x.downloadUrl?`<a class="btn btn-primary" href="${x.downloadUrl}" download style="padding:6px 12px;font-size:13px">下载</a>`:''}</div></div>`).join('')}
    $('#modalHistory').style.display='flex';
}
function loadHistory(id){
    LOG.info('历史', `加载历史记录: ${id}`);
    const h=JSON.parse(localStorage.getItem('pptHistory')||'[]');
    const item=h.find(x=>x.id===id);
    if(!item){LOG.error('历史', '未找到记录');return}
    generatedSlidesData=item.data;
    selectedTemplate=item.template||'blueprint';
    selectedColor=item.color||'blue';
    LOG.success('历史', `加载成功: ${item.title}, ${item.slideCount}页`);
    showResult(item.data,item.downloadUrl||'#');
    $('#modalHistory').style.display='none';
    showToast('已加载历史记录','success');
}
function clearHistory(){
    LOG.info('历史', '清空历史记录');
    localStorage.removeItem('pptHistory');
    $('#historyList').innerHTML='<div class="history-empty">📂 暂无历史记录</div>';
    showToast('历史已清空','info');
}

// ============================================
// 5. Generate Flow (Streaming)
// ============================================
async function handleGenerate(){
    if(isGenerating){LOG.info('生成', '已在生成中，跳过');return}
    const topic=$('#inputTopic').value.trim();
    if(!topic){LOG.error('生成', '未输入主题');showToast('请输入主题','error');$('#inputTopic').focus();return}
    if(!selectedTemplate){LOG.error('生成', '未选择模板');showToast('请选择模板','error');return}

    LOG.info('生成', '========================================');
    LOG.info('生成', '开始生成演示文稿');
    LOG.info('生成', `主题: ${topic}`);
    LOG.info('生成', `模板: ${selectedTemplate}`);
    LOG.info('生成', `颜色: ${selectedColor}`);
    LOG.info('生成', `受众: ${$('#inputAudience').value.trim()||'通用受众'}`);
    LOG.info('生成', `额外: ${$('#inputExtra').value.trim()||'无'}`);

    isGenerating=true;clearDraft();
    $('#sectionGenerating').style.display='block';$('#sectionResult').style.display='none';$('#previewContainerLive').innerHTML='';
    $('#progressBar').style.width='0%';$('#progressText').textContent='正在调用 AI...';$('#generatingTitle').textContent='AI 正在生成内容...';
    $('#sectionGenerating').scrollIntoView({behavior:'smooth',block:'start'});
    const bt=$('#btnGenerate .btn-text'),bl=$('#btnGenerate .btn-loading');bt.style.display='none';bl.style.display='inline-flex';$('#btnGenerate').disabled=true;
    try{
        const slides=[];let title=topic;
        // 立即设置 generatedSlidesData，这样点击预览就能工作
        generatedSlidesData={title,slides};
        LOG.info('生成', '调用流式生成API...');
        const resp=await fetch('/api/generate-stream',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({template_id:selectedTemplate,topic,audience:$('#inputAudience').value.trim()||'通用受众',extra_instructions:$('#inputExtra').value.trim(),color:selectedColor})});
        if(!resp.ok){const e=await resp.json();LOG.error('生成', 'API错误', e);showToast(e.error||'生成失败','error');return}
        LOG.success('生成', '流式连接已建立');
        const reader=resp.body.getReader(),decoder=new TextDecoder();let buf='';
        while(true){
            const{done,value}=await reader.read();if(done)break;buf+=decoder.decode(value,{stream:true});const lines=buf.split('\n');buf=lines.pop()||'';
            for(const line of lines){if(!line.startsWith('data: '))continue;try{
                const ev=JSON.parse(line.slice(6));
                if(ev.type==='slide'){const s=ev.slide,i=ev.index;slides.push(s);
                    generatedSlidesData={title,slides};
                    LOG.info('生成', `收到第 ${i} 页: ${s.title}, 要点数: ${(s.content||[]).length}`);
                    if(i===1){$('#generatingTitle').textContent='正在逐页生成...';$('#previewContainerLive').innerHTML=renderTitleSlideHTML(topic,'...');setTimeout(()=>$$('.slide-preview').forEach(el=>el.classList.add('visible')),50)}
                    $('#progressBar').style.width=Math.round(i/10*80)+'%';$('#progressText').textContent=`第 ${i} 页: ${s.title}`;$('#previewContainerLive').insertAdjacentHTML('beforeend',renderContentSlideHTML(s,i,'?'));setTimeout(()=>{const el=$(`#slide-preview-${i}`);if(el)el.classList.add('visible')},50);bindSlideClickEvents()}
                else if(ev.type==='done'){
                    title=ev.title||topic;const total=ev.total;
                    LOG.success('生成', `AI生成完成, 共 ${total} 页`);
                    generatedSlidesData={title,slides};
                    const sub=$('#previewContainerLive .slide-subtitle');if(sub)sub.textContent=`共 ${total} 页`;$$('.slide-page-num').forEach(el=>{el.textContent=el.textContent.replace('?',total)});
                    $('#previewContainerLive').insertAdjacentHTML('beforeend',renderEndSlideHTML());setTimeout(()=>$$('.slide-preview:not(.visible)').forEach(el=>el.classList.add('visible')),50);
                    $('#progressBar').style.width='85%';$('#progressText').textContent='正在生成 PPT...';$('#generatingTitle').textContent='正在生成 PPT 文件...';
                    LOG.info('生成', '调用PPT生成API...');
                    const pr=await fetch('/api/create-ppt',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slides_data:generatedSlidesData,template_id:selectedTemplate,color:selectedColor})});const pd=await pr.json();
                    if(pd.success){
                        LOG.success('生成', `PPT生成成功: ${pd.download_url}`);
                        $('#progressBar').style.width='100%';$('#progressText').textContent='完成！';
                        await sleep(300);showResult(generatedSlidesData,pd.download_url);saveToHistory(generatedSlidesData,pd.download_url);showToast('生成成功！','success');
                    }else{LOG.error('生成', 'PPT生成失败', pd.error);showToast(pd.error||'PPT生成失败','error')}
                }else if(ev.type==='error'){LOG.error('生成', 'AI错误', ev.error);showToast('AI错误: '+ev.error,'error')}
            }catch(e){}}
        }
    }catch(e){LOG.error('生成', '网络错误', e);showToast('网络错误','error')}finally{isGenerating=false;bt.style.display='inline';bl.style.display='none';$('#btnGenerate').disabled=false;LOG.info('生成', '生成流程结束')}
}

function showResult(slidesData,downloadUrl){
    LOG.info('结果', `显示结果: ${slidesData.title}, ${slidesData.slides.length}页`);
    $('#downloadTitle').textContent=slidesData.title||'演示文稿';$('#downloadMeta').textContent=`共 ${slidesData.slides.length} 页`;$('#btnDownload').href=downloadUrl;
    const totalWords=slidesData.slides.reduce((a,s)=>a+(s.content||[]).join('').length,0);
    $('#resultStats').textContent=`📊 ${slidesData.slides.length} 页 · ${totalWords} 字 · 模板: ${selectedTemplate}`;
    $('#previewContainer').innerHTML=$('#previewContainerLive').innerHTML;bindSlideClickEvents();
    $('#sectionGenerating').style.display='none';$('#sectionResult').style.display='block';$('#sectionResult').scrollIntoView({behavior:'smooth',block:'start'});
    LOG.success('结果', '结果页面已显示');
}
function handleNew(){
    LOG.info('生成', '重新生成');
    $('#sectionResult').style.display='none';$('#sectionGenerating').style.display='none';$('#previewContainerLive').innerHTML='';$('#inputTopic').value='';$('#inputExtra').value='';$('#sectionInput').scrollIntoView({behavior:'smooth',block:'start'});$('#inputTopic').focus();
}

// ============================================
// 6. Edit Content
// ============================================
function openEditModal(){
    if(!generatedSlidesData)return;
    LOG.info('编辑', '打开编辑弹窗');
    const slides=generatedSlidesData.slides;
    LOG.info('编辑', `共 ${slides.length} 页可编辑`);
    $('#editSlides').innerHTML=slides.map((s,i)=>`<div class="edit-slide-card"><h4><span>第 ${i+1} 页</span><div class="edit-actions"><button onclick="aiExpandSlide(${i})" title="AI扩展">🤖扩展</button><button onclick="aiSimplifySlide(${i})" title="AI精简">✂️精简</button><button onclick="deleteSlide(${i})" title="删除">🗑️</button><button onclick="moveSlide(${i},-1)" title="上移">⬆️</button><button onclick="moveSlide(${i},1)" title="下移">⬇️</button></div></h4><input type="text" class="edit-title" value="${esc(s.title)}"><textarea class="edit-content">${(s.content||[]).join('\n')}</textarea><input type="text" class="edit-notes" value="${esc(s.notes||'')}" placeholder="备注"></div>`).join('');$('#modalEdit').style.display='flex';
}
function saveEdits(){
    if(!generatedSlidesData)return;
    LOG.info('编辑', '保存编辑内容');
    $$('.edit-slide-card').forEach((c,i)=>{if(generatedSlidesData.slides[i]){generatedSlidesData.slides[i].title=c.querySelector('.edit-title').value;generatedSlidesData.slides[i].content=c.querySelector('.edit-content').value.split('\n').filter(l=>l.trim());generatedSlidesData.slides[i].notes=c.querySelector('.edit-notes').value}});
    refreshPreview();$('#modalEdit').style.display='none';
    LOG.success('编辑', '保存成功');
    showToast('✅ 已保存','success');
}
function deleteSlide(i){
    LOG.info('编辑', `删除第 ${i+1} 页`);
    if(generatedSlidesData.slides.length<=1){showToast('至少保留一页','error');return}
    generatedSlidesData.slides.splice(i,1);openEditModal();showToast('已删除','info');
}
function moveSlide(i,dir){
    LOG.info('编辑', `移动第 ${i+1} 页 ${dir>0?'下移':'上移'}`);
    const s=generatedSlidesData.slides;if(i+dir<0||i+dir>=s.length)return;[s[i],s[i+dir]]=[s[i+dir],s[i]];openEditModal();
}
async function aiExpandSlide(i){
    const s=generatedSlidesData.slides[i];
    LOG.info('AI扩展', `扩展第 ${i+1} 页: ${s.title}`);
    showToast('🤖 AI 扩展中...','info');
    try{const r=await fetch('/api/ai-expand',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:s.title,content:s.content})});const d=await r.json();if(d.success){generatedSlidesData.slides[i].content=d.content;LOG.success('AI扩展', `扩展成功, ${d.content.length}个要点`);openEditModal();showToast('✅ 已扩展','success')}else{LOG.error('AI扩展', d.error);showToast(d.error,'error')}}catch(e){LOG.error('AI扩展', e);showToast('扩展失败','error')}}
async function aiSimplifySlide(i){
    const s=generatedSlidesData.slides[i];
    LOG.info('AI精简', `精简第 ${i+1} 页: ${s.title}`);
    showToast('✂️ AI 精简中...','info');
    try{const r=await fetch('/api/ai-simplify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({content:s.content})});const d=await r.json();if(d.success){generatedSlidesData.slides[i].content=d.content;LOG.success('AI精简', `精简成功, ${d.content.length}个要点`);openEditModal();showToast('✅ 已精简','success')}else{LOG.error('AI精简', d.error);showToast(d.error,'error')}}catch(e){LOG.error('AI精简', e);showToast('精简失败','error')}}
function refreshPreview(){
    if(!generatedSlidesData)return;
    LOG.info('预览', '刷新预览');
    $('#previewContainerLive').innerHTML='';const s=generatedSlidesData.slides;
    $('#previewContainerLive').innerHTML=renderTitleSlideHTML(generatedSlidesData.title,s.length);s.forEach((x,i)=>$('#previewContainerLive').insertAdjacentHTML('beforeend',renderContentSlideHTML(x,i+1,s.length)));$('#previewContainerLive').insertAdjacentHTML('beforeend',renderEndSlideHTML());setTimeout(()=>$$('.slide-preview').forEach(el=>el.classList.add('visible')),50);bindSlideClickEvents();$('#previewContainer').innerHTML=$('#previewContainerLive').innerHTML;bindSlideClickEvents();
    LOG.success('预览', '预览已刷新');
}

// ============================================
// 7. Add Slide
// ============================================
function addNewSlide(){
    const title=$('#newSlideTitle').value.trim();const content=$('#newSlideContent').value.split('\n').filter(l=>l.trim());
    if(!title){showToast('请输入标题','error');return}
    LOG.info('添加页面', `标题: ${title}, 要点数: ${content.length}`);
    const newSlide={slide_number:generatedSlidesData.slides.length+1,title,content,notes:''};
    if($('#newSlidePosition').value==='start'){generatedSlidesData.slides.unshift(newSlide);LOG.info('添加页面', '插入到开头')}else{generatedSlidesData.slides.push(newSlide);LOG.info('添加页面', '添加到末尾')}
    refreshPreview();$('#modalAddSlide').style.display='none';$('#newSlideTitle').value='';$('#newSlideContent').value='';
    LOG.success('添加页面', '添加成功');
    showToast('✅ 已添加','success');
}

// ============================================
// 8. Notes View
// ============================================
function openNotesModal(){
    if(!generatedSlidesData)return;
    LOG.info('备注', '打开备注弹窗');
    $('#notesModalBody').innerHTML=generatedSlidesData.slides.map((s,i)=>`<div class="note-card"><h4><span class="note-num">${i+1}</span>${esc(s.title)}</h4><p>${s.notes?esc(s.notes):'<span class="no-note">暂无备注</span>'}</p></div>`).join('');$('#modalNotes').style.display='flex';
}
function printNotes(){
    if(!generatedSlidesData)return;
    LOG.info('备注', '打印备注');
    const content=generatedSlidesData.slides.map((s,i)=>`第${i+1}页: ${s.title}\n备注: ${s.notes||'无'}\n要点:\n${(s.content||[]).map(c=>'  - '+c).join('\n')}\n`).join('\n---\n\n');const win=window.open('','_blank');win.document.write(`<pre style="font-family:sans-serif;white-space:pre-wrap;padding:20px">演讲者备注 - ${generatedSlidesData.title}\n${'='.repeat(40)}\n\n${content}</pre>`);win.document.close();win.print();
}

// ============================================
// 9. Present Mode
// ============================================
let presentIndex=0;
function openPresentMode(){
    if(!generatedSlidesData)return;
    LOG.info('演示', '打开全屏演示模式');
    presentIndex=0;renderPresentSlide();$('#presentOverlay').style.display='flex';document.body.style.overflow='hidden';
}
function closePresentMode(){
    LOG.info('演示', '关闭演示模式');
    $('#presentOverlay').style.display='none';document.body.style.overflow='';
}
function navigatePresent(dir){
    const total=generatedSlidesData.slides.length+2;presentIndex=Math.max(0,Math.min(total-1,presentIndex+dir));
    LOG.info('演示', `翻页: 第 ${presentIndex+1}/${total} 页`);
    renderPresentSlide();
}
function renderPresentSlide(){const slides=generatedSlidesData.slides,total=slides.length+2,idx=presentIndex;let html='';
    if(idx===0){html=`<div class="slide-content slide-title-page" style="width:100%;height:100%;padding:60px"><div class="slide-decorations"><div class="deco-circle"></div><div class="deco-circle"></div></div><div class="slide-main-title" style="font-size:48px">${esc(generatedSlidesData.title)}</div><div class="slide-subtitle" style="font-size:20px">共 ${slides.length} 页</div></div>`}
    else if(idx===total-1){html=`<div class="slide-content slide-end-page" style="width:100%;height:100%;padding:60px"><div class="end-title" style="font-size:56px">谢谢</div><div class="end-subtitle" style="font-size:20px">THANK YOU</div></div>`}
    else{const s=slides[idx-1];const pts=(s.content||[]).map(p=>`<div class="slide-point" style="font-size:18px;margin-bottom:12px"><div class="point-icon">${POINT_SVG}</div><span>${esc(p)}</span></div>`).join('');html=`<div class="slide-content slide-content-page" style="width:100%;height:100%;padding:40px 50px"><div class="slide-header" style="margin-bottom:24px"><div class="slide-num-badge" style="width:40px;height:40px;font-size:18px">${idx}</div><div class="slide-title" style="font-size:28px">${esc(s.title)}</div></div><div class="slide-points">${pts}</div></div>`}
    $('#presentContainer').innerHTML=`<div class="present-slide">${html}</div>`;$('#presentPage').textContent=`${idx+1} / ${total}`}

// ============================================
// 10. Export
// ============================================
async function exportAs(format){
    if(!generatedSlidesData)return;
    LOG.info('导出', `导出格式: ${format}`);
    if(format==='json'){
        LOG.info('导出', '导出JSON');
        downloadFile(JSON.stringify(generatedSlidesData,null,2),'ppt-content.json','application/json');
        LOG.success('导出', 'JSON导出成功');
        return;
    }
    try{
        const r=await fetch(`/api/export-${format}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slides_data:generatedSlidesData})});
        const d=await r.json();
        if(d.success){
            if(format==='markdown'){downloadFile(d.markdown,'presentation.md','text/markdown');LOG.success('导出', 'Markdown导出成功')}
            else if(format==='text'){downloadFile(d.text,'presentation.txt','text/plain');LOG.success('导出', '纯文本导出成功')}
        }else{LOG.error('导出', d.error);showToast(d.error,'error')}
    }catch(e){LOG.error('导出', e);showToast('导出失败','error')}}
function downloadFile(content,filename,type){
    LOG.info('下载', `文件: ${filename}, 类型: ${type}`);
    const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);
}

// ============================================
// 11. Slide Preview Modal
// ============================================
function openSlideModal(i){
    if(!generatedSlidesData||!generatedSlidesData.slides||!generatedSlidesData.slides.length){LOG.error('预览', '无数据');return}
    const total=generatedSlidesData.slides.length+2;
    if(i<0||i>=total){LOG.error('预览', `索引越界: ${i}/${total}`);return}
    currentSlideIndex=i;
    LOG.info('预览', `打开第 ${i+1}/${total} 页预览`);
    renderSlideDetail();
    $('#modalSlidePreview').style.display='flex';
}
function closeSlideModal(){LOG.info('预览', '关闭预览');$('#modalSlidePreview').style.display='none'}
function renderSlideDetail(){
    if(!generatedSlidesData||!generatedSlidesData.slides)return;
    const slides=generatedSlidesData.slides,total=slides.length+2,idx=currentSlideIndex;
    if(idx<0||idx>=total)return;
    LOG.info('预览', `渲染第 ${idx+1}/${total} 页`);
    $('#slideModalPage').textContent=`${idx+1} / ${total}`;$('#btnPrevSlide').disabled=idx===0;$('#btnNextSlide').disabled=idx===total-1;$('#btnPrevSlide').style.opacity=idx===0?0.4:1;$('#btnNextSlide').style.opacity=idx===total-1?0.4:1;
    if(idx===0){$('#slideModalTitle').textContent='标题页';$('#slideModalBody').innerHTML=`<div class="detail-slide"><div class="detail-slide-header" style="justify-content:center;flex-direction:column;gap:8px;padding:40px"><div class="detail-slide-title" style="font-size:28px">${esc(generatedSlidesData.title)}</div><div style="opacity:0.7">共 ${slides.length} 页</div></div></div>`;return}
    if(idx===total-1){$('#slideModalTitle').textContent='结束页';$('#slideModalBody').innerHTML=`<div class="detail-slide"><div class="detail-slide-header" style="justify-content:center;flex-direction:column;gap:8px;padding:40px"><div class="detail-slide-title" style="font-size:32px">谢谢</div><div style="opacity:0.7">THANK YOU</div></div></div>`;return}
    const s=slides[idx-1];if(!s)return;
    $('#slideModalTitle').textContent=`第 ${idx} 页 · ${s.title||''}`;
    const pts=(s.content||[]).map(p=>`<div class="detail-point"><div class="detail-point-icon">${POINT_SVG}</div><div class="detail-point-text">${esc(p)}</div></div>`).join('');
    const notes=s.notes?`<div class="detail-notes"><div class="detail-notes-label">📝 备注</div><div class="detail-notes-text">${esc(s.notes)}</div></div>`:'';
    const actions=`<div class="detail-actions"><button class="btn btn-secondary" onclick="aiExpandSlide(${idx-1});closeSlideModal()" style="padding:6px 12px;font-size:13px">🤖 AI扩展</button><button class="btn btn-secondary" onclick="aiSimplifySlide(${idx-1});closeSlideModal()" style="padding:6px 12px;font-size:13px">✂️ AI精简</button></div>`;
    $('#slideModalBody').innerHTML=`<div class="detail-slide"><div class="detail-slide-header"><div class="detail-slide-num">${idx}</div><div class="detail-slide-title">${esc(s.title||'')}</div></div><div class="detail-slide-body"><div class="detail-points">${pts}</div>${notes}${actions}</div></div>`;
}
function prevSlide(){if(currentSlideIndex>0){currentSlideIndex--;LOG.info('预览', '上一页');renderSlideDetail()}}
function nextSlide(){const t=generatedSlidesData?generatedSlidesData.slides.length+2:0;if(currentSlideIndex<t-1){currentSlideIndex++;LOG.info('预览', '下一页');renderSlideDetail()}}
function bindSlideClickEvents(){
    const count=$$('.slide-preview').length;
    LOG.info('事件', `绑定 ${count} 个幻灯片点击事件`);
    $$('.slide-preview').forEach((c,i)=>{c.onclick=()=>openSlideModal(i)});
}

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
function openConfig(){
    LOG.info('配置', '打开配置弹窗');
    cfgApiKey.value=localStorage.getItem('mimo_api_key')||'';
    cfgBaseUrl.value=localStorage.getItem('mimo_base_url')||'https://token-plan-cn.xiaomimimo.com/v1';
    cfgModel.value=localStorage.getItem('mimo_model')||'mimo-v2.5-pro';
    testResult.style.display='none';
    $('#modalConfig').style.display='flex';
}
function closeConfig(){LOG.info('配置', '关闭配置弹窗');$('#modalConfig').style.display='none';testResult.style.display='none'}
async function testConnection(){
    const k=cfgApiKey.value.trim();
    if(!k){showToast('请输入Key','error');return}
    LOG.info('配置', '测试连接...');
    await fetch('/api/config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({api_key:k,base_url:cfgBaseUrl.value.trim(),model:cfgModel.value.trim()})}).catch(()=>{});
    const bt=btnTestConnection.querySelector('.btn-test-text'),bl=btnTestConnection.querySelector('.btn-test-loading');bt.style.display='none';bl.style.display='inline-flex';btnTestConnection.disabled=true;testResult.style.display='none';
    try{
        const r=await fetch('/api/test-connection',{method:'POST',headers:{'Content-Type':'application/json'}});
        const d=await r.json();
        testResult.style.display='block';
        if(d.success){
            testResult.className='test-result success';testResult.innerHTML=`✅ ${esc(d.message)}`;
            LOG.success('配置', '连接成功');
            showToast('✅ 连接成功','success');
        }else{
            testResult.className='test-result error';testResult.innerHTML=`❌ ${esc(d.error)}`;
            LOG.error('配置', '连接失败', d.error);
        }
    }catch(e){
        testResult.style.display='block';testResult.className='test-result error';testResult.innerHTML=`❌ ${esc(e.message)}`;
        LOG.error('配置', '连接错误', e);
    }finally{bt.style.display='inline';bl.style.display='none';btnTestConnection.disabled=false}
}
async function saveConfig(){
    const k=cfgApiKey.value.trim();
    if(!k){showToast('请输入Key','error');return}
    LOG.info('配置', '保存配置');
    localStorage.setItem('mimo_api_key',k);localStorage.setItem('mimo_base_url',cfgBaseUrl.value.trim());localStorage.setItem('mimo_model',cfgModel.value.trim());
    fetch('/api/config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({api_key:k,base_url:cfgBaseUrl.value.trim(),model:cfgModel.value.trim()})}).catch(()=>{});
    LOG.success('配置', '配置已保存');
    showToast('已保存','success');closeConfig();
}
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
function esc(t){const d=document.createElement('div');d.textContent=t||'';return d.innerHTML}
