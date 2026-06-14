/**
 * PPT AI Generator - Frontend Logic
 * 10 大创新功能版
 */

// ============================================
// State
// ============================================
let selectedTemplate = null;
let selectedColor = 'blue';
let templates = [];
let isGenerating = false;
let generatedSlidesData = null;
let currentSlideIndex = 0;
let isDarkMode = localStorage.getItem('darkMode') === 'true';
let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');

const TEMPLATE_ICONS = { blueprint: '📐', structure: '🏗️', storytelling: '📖', visual: '🎨', content: '📋', clarity: '✨' };
const TEMPLATE_COLORS = { blueprint: '#3B82F6', structure: '#10B981', storytelling: '#F59E0B', visual: '#8B5CF6', content: '#06B6D4', clarity: '#F43F5E' };
const COLOR_MAP = {
    blue: { primary: '#1A3C6E', accent: '#3B82F6', light: '#EFF6FF' },
    green: { primary: '#065F46', accent: '#10B981', light: '#ECFDF5' },
    purple: { primary: '#5B21B6', accent: '#8B5CF6', light: '#F5F3FF' },
    red: { primary: '#991B1B', accent: '#EF4444', light: '#FEF2F2' },
    orange: { primary: '#92400E', accent: '#F59E0B', light: '#FFFBEB' },
    cyan: { primary: '#155E75', accent: '#06B6D4', light: '#ECFEFF' },
    pink: { primary: '#9D174D', accent: '#EC4899', light: '#FDF2F8' },
    slate: { primary: '#1E293B', accent: '#475569', light: '#F1F5F9' },
};
const POINT_SVG = `<svg viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// ============================================
// DOM
// ============================================
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// ============================================
// Init
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    if (isDarkMode) document.body.classList.add('dark');
    loadTemplates();
    bindEvents();
});

function bindEvents() {
    $('#btnGenerate').addEventListener('click', handleGenerate);
    $('#inputTopic').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) handleGenerate(); });
    $('#btnNew').addEventListener('click', handleNew);
    $('#btnConfig').addEventListener('click', openConfig);
    $('#btnCloseModal').addEventListener('click', closeConfig);
    $('#btnCancelConfig').addEventListener('click', closeConfig);
    $('#btnSaveConfig').addEventListener('click', saveConfig);
    $('#btnTestConnection').addEventListener('click', testConnection);
    $('#btnCloseSlideModal').addEventListener('click', closeSlideModal);
    $('#btnPrevSlide').addEventListener('click', prevSlide);
    $('#btnNextSlide').addEventListener('click', nextSlide);
    $('#btnEdit').addEventListener('click', openEditModal);
    $('#btnCloseEdit').addEventListener('click', () => { $('#modalEdit').style.display = 'none'; });
    $('#btnCancelEdit').addEventListener('click', () => { $('#modalEdit').style.display = 'none'; });
    $('#btnSaveEdit').addEventListener('click', saveEdits);
    $('#btnNotes').addEventListener('click', openNotesModal);
    $('#btnCloseNotes').addEventListener('click', () => { $('#modalNotes').style.display = 'none'; });
    $('#btnCloseNotes2').addEventListener('click', () => { $('#modalNotes').style.display = 'none'; });
    $('#btnPrintNotes').addEventListener('click', printNotes);
    $('#btnPresent').addEventListener('click', openPresentMode);
    $('#presentClose').addEventListener('click', closePresentMode);
    $('#presentPrev').addEventListener('click', () => navigatePresent(-1));
    $('#presentNext').addEventListener('click', () => navigatePresent(1));
    $('#btnHistory').addEventListener('click', openHistoryModal);
    $('#btnCloseHistory').addEventListener('click', () => { $('#modalHistory').style.display = 'none'; });
    $('#btnCloseHistory2').addEventListener('click', () => { $('#modalHistory').style.display = 'none'; });
    $('#btnClearHistory').addEventListener('click', clearHistory);
    $('#btnTheme').addEventListener('click', toggleTheme);

    // Color picker
    $$('.color-option').forEach(opt => {
        opt.addEventListener('click', () => {
            $$('.color-option').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            selectedColor = opt.dataset.color;
        });
    });

    // Modal overlay clicks
    $$('.modal-overlay').forEach(m => {
        m.addEventListener('click', e => { if (e.target === m) m.style.display = 'none'; });
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            $$('.modal-overlay').forEach(m => m.style.display = 'none');
            closePresentMode();
        }
        if ($('#presentOverlay').style.display === 'flex') {
            if (e.key === 'ArrowLeft') navigatePresent(-1);
            if (e.key === 'ArrowRight') navigatePresent(1);
        }
        if ($('#modalSlidePreview').style.display === 'flex') {
            if (e.key === 'ArrowLeft') prevSlide();
            if (e.key === 'ArrowRight') nextSlide();
        }
    });
}

// ============================================
// 1. Theme Toggle (暗色模式)
// ============================================
function toggleTheme() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark', isDarkMode);
    localStorage.setItem('darkMode', isDarkMode);
    showToast(isDarkMode ? '🌙 已切换暗色模式' : '☀️ 已切换亮色模式', 'success');
}

// ============================================
// 2. Templates + Favorites (模板收藏)
// ============================================
async function loadTemplates() {
    try {
        const resp = await fetch('/api/templates');
        const data = await resp.json();
        if (data.success) { templates = data.templates; renderTemplates(); }
    } catch (err) { showToast('加载模板失败', 'error'); }
}

function renderTemplates() {
    // Sort: favorites first
    const sorted = [...templates].sort((a, b) => {
        const af = favorites.includes(a.id) ? 0 : 1;
        const bf = favorites.includes(b.id) ? 0 : 1;
        return af - bf;
    });

    templateGrid.innerHTML = sorted.map(t => {
        const isFav = favorites.includes(t.id);
        return `
        <div class="template-card" data-id="${t.id}" style="--card-accent: ${TEMPLATE_COLORS[t.id]}">
            <div class="check-mark">✓</div>
            <div class="template-card-header">
                <div class="template-icon" style="background: ${TEMPLATE_COLORS[t.id]}15; color: ${TEMPLATE_COLORS[t.id]}">${TEMPLATE_ICONS[t.id] || '📄'}</div>
                <div><h3>${t.name_zh}</h3><span class="template-en">${t.name_en}</span></div>
            </div>
            <p>${t.description}</p>
            <button class="fav-btn ${isFav ? 'active' : ''}" onclick="event.stopPropagation();toggleFav('${t.id}')" title="${isFav ? '取消收藏' : '收藏'}">${isFav ? '⭐' : '☆'}</button>
        </div>`;
    }).join('');

    $$('.template-card').forEach(card => {
        card.addEventListener('click', () => selectTemplate(card.dataset.id));
    });
}

function toggleFav(id) {
    if (favorites.includes(id)) {
        favorites = favorites.filter(f => f !== id);
        showToast('已取消收藏', 'info');
    } else {
        favorites.push(id);
        showToast('⭐ 已收藏', 'success');
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    renderTemplates();
}

function selectTemplate(id) {
    selectedTemplate = id;
    $$('.template-card').forEach(c => c.classList.toggle('selected', c.dataset.id === id));
    $('#sectionColor').style.display = 'block';
}

// ============================================
// 3. History (历史记录)
// ============================================
function saveToHistory(slidesData, downloadUrl) {
    const history = JSON.parse(localStorage.getItem('pptHistory') || '[]');
    history.unshift({
        id: Date.now(),
        title: slidesData.title,
        slideCount: slidesData.slides.length,
        template: selectedTemplate,
        color: selectedColor,
        downloadUrl: downloadUrl,
        date: new Date().toLocaleString('zh-CN'),
        data: slidesData,
    });
    if (history.length > 20) history.pop();
    localStorage.setItem('pptHistory', JSON.stringify(history));
}

function openHistoryModal() {
    const history = JSON.parse(localStorage.getItem('pptHistory') || '[]');
    const list = $('#historyList');

    if (history.length === 0) {
        list.innerHTML = '<div class="history-empty">📂 暂无历史记录</div>';
    } else {
        list.innerHTML = history.map(h => `
            <div class="history-item">
                <div class="history-item-info">
                    <strong>${escapeHtml(h.title)}</strong>
                    <span>${h.slideCount} 页 · ${h.date}</span>
                </div>
                <div class="history-item-actions">
                    <button class="btn btn-secondary" onclick="loadHistory(${h.id})" style="padding:6px 12px;font-size:13px;">加载</button>
                    ${h.downloadUrl ? `<a class="btn btn-primary" href="${h.downloadUrl}" download style="padding:6px 12px;font-size:13px;">下载</a>` : ''}
                </div>
            </div>
        `).join('');
    }
    $('#modalHistory').style.display = 'flex';
}

function loadHistory(id) {
    const history = JSON.parse(localStorage.getItem('pptHistory') || '[]');
    const item = history.find(h => h.id === id);
    if (!item) return;

    generatedSlidesData = item.data;
    selectedTemplate = item.template || 'blueprint';
    selectedColor = item.color || 'blue';
    showResult(item.data, item.downloadUrl || '#');
    $('#modalHistory').style.display = 'none';
    showToast('已加载历史记录', 'success');
}

function clearHistory() {
    localStorage.removeItem('pptHistory');
    $('#historyList').innerHTML = '<div class="history-empty">📂 暂无历史记录</div>';
    showToast('历史记录已清空', 'info');
}

// ============================================
// 4. Generate Flow (流式生成)
// ============================================
async function handleGenerate() {
    if (isGenerating) return;
    const topic = $('#inputTopic').value.trim();
    if (!topic) { showToast('请输入演示主题', 'error'); $('#inputTopic').focus(); return; }
    if (!selectedTemplate) { showToast('请选择一个模板', 'error'); return; }

    isGenerating = true;
    $('#sectionGenerating').style.display = 'block';
    $('#sectionResult').style.display = 'none';
    $('#previewContainerLive').innerHTML = '';
    $('#progressBar').style.width = '0%';
    $('#progressText').textContent = '正在调用 AI 生成内容...';
    $('#generatingTitle').textContent = 'AI 正在生成内容...';
    $('#sectionGenerating').scrollIntoView({ behavior: 'smooth', block: 'start' });

    const btnText = $('#btnGenerate .btn-text');
    const btnLoading = $('#btnGenerate .btn-loading');
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline-flex';
    $('#btnGenerate').disabled = true;

    try {
        const slides = [];
        let title = topic;

        const resp = await fetch('/api/generate-stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                template_id: selectedTemplate,
                topic, audience: $('#inputAudience').value.trim() || '通用受众',
                extra_instructions: $('#inputExtra').value.trim(),
                color: selectedColor,
            }),
        });

        if (!resp.ok) { const e = await resp.json(); showToast(e.error || '生成失败', 'error'); return; }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let sseBuffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            sseBuffer += decoder.decode(value, { stream: true });
            const lines = sseBuffer.split('\n');
            sseBuffer = lines.pop() || '';

            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                try {
                    const event = JSON.parse(line.slice(6));
                    if (event.type === 'slide') {
                        const slide = event.slide;
                        const idx = event.index;
                        slides.push(slide);
                        if (idx === 1) {
                            $('#generatingTitle').textContent = '正在逐页生成内容...';
                            $('#previewContainerLive').innerHTML = renderTitleSlideHTML(topic, '...');
                            setTimeout(() => $$('#previewContainerLive .slide-preview').forEach(el => el.classList.add('visible')), 50);
                        }
                        $('#progressBar').style.width = Math.round(idx / 10 * 80) + '%';
                        $('#progressText').textContent = `已生成第 ${idx} 页: ${slide.title}`;
                        $('#previewContainerLive').insertAdjacentHTML('beforeend', renderContentSlideHTML(slide, idx, '?'));
                        setTimeout(() => { const el = $(`#slide-preview-${idx}`); if (el) el.classList.add('visible'); }, 50);
                        bindSlideClickEvents();
                    } else if (event.type === 'done') {
                        title = event.title || topic;
                        const total = event.total;
                        const sub = $('#previewContainerLive .slide-subtitle');
                        if (sub) sub.textContent = `共 ${total} 页 · AI 智能生成`;
                        $$('#previewContainerLive .slide-page-num').forEach(el => { el.textContent = el.textContent.replace('?', total); });
                        $('#previewContainerLive').insertAdjacentHTML('beforeend', renderEndSlideHTML());
                        setTimeout(() => $$('#previewContainerLive .slide-preview:not(.visible)').forEach(el => el.classList.add('visible')), 50);

                        $('#progressBar').style.width = '85%';
                        $('#progressText').textContent = '正在生成 PPT 文件...';
                        $('#generatingTitle').textContent = '正在生成 PPT 文件...';

                        generatedSlidesData = { title, slides };
                        const pptResp = await fetch('/api/create-ppt', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ slides_data: generatedSlidesData, template_id: selectedTemplate, color: selectedColor }),
                        });
                        const pptData = await pptResp.json();
                        if (pptData.success) {
                            $('#progressBar').style.width = '100%';
                            $('#progressText').textContent = '全部完成！';
                            await sleep(300);
                            showResult(generatedSlidesData, pptData.download_url);
                            saveToHistory(generatedSlidesData, pptData.download_url);
                            showToast('演示文稿生成成功！', 'success');
                        } else { showToast(pptData.error || 'PPT 生成失败', 'error'); }
                    } else if (event.type === 'error') {
                        showToast('AI 错误: ' + event.error, 'error');
                    }
                } catch (e) {}
            }
        }
    } catch (err) {
        showToast('网络错误，请检查连接后重试', 'error');
        console.error(err);
    } finally {
        isGenerating = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        $('#btnGenerate').disabled = false;
    }
}

function showResult(slidesData, downloadUrl) {
    $('#downloadTitle').textContent = slidesData.title || '演示文稿';
    $('#downloadMeta').textContent = `共 ${slidesData.slides.length} 页`;
    $('#btnDownload').href = downloadUrl;
    $('#previewContainer').innerHTML = $('#previewContainerLive').innerHTML;
    bindSlideClickEvents();
    $('#sectionGenerating').style.display = 'none';
    $('#sectionResult').style.display = 'block';
    $('#sectionResult').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function handleNew() {
    $('#sectionResult').style.display = 'none';
    $('#sectionGenerating').style.display = 'none';
    $('#previewContainerLive').innerHTML = '';
    $('#inputTopic').value = '';
    $('#inputExtra').value = '';
    $('#sectionInput').scrollIntoView({ behavior: 'smooth', block: 'start' });
    $('#inputTopic').focus();
}

// ============================================
// 5. Edit Content (在线编辑)
// ============================================
function openEditModal() {
    if (!generatedSlidesData) return;
    const slides = generatedSlidesData.slides;
    const container = $('#editSlides');
    container.innerHTML = slides.map((s, i) => `
        <div class="edit-slide-card">
            <h4>第 ${i + 1} 页</h4>
            <input type="text" class="edit-title" value="${escapeHtml(s.title)}" placeholder="标题">
            <textarea class="edit-content" placeholder="每行一个要点">${(s.content || []).join('\n')}</textarea>
            <input type="text" class="edit-notes" value="${escapeHtml(s.notes || '')}" placeholder="演讲者备注">
        </div>
    `).join('');
    $('#modalEdit').style.display = 'flex';
}

function saveEdits() {
    if (!generatedSlidesData) return;
    const cards = $$('.edit-slide-card');
    cards.forEach((card, i) => {
        if (generatedSlidesData.slides[i]) {
            generatedSlidesData.slides[i].title = card.querySelector('.edit-title').value;
            generatedSlidesData.slides[i].content = card.querySelector('.edit-content').value.split('\n').filter(l => l.trim());
            generatedSlidesData.slides[i].notes = card.querySelector('.edit-notes').value;
        }
    });

    // Re-render preview
    $('#previewContainerLive').innerHTML = '';
    const slides = generatedSlidesData.slides;
    $('#previewContainerLive').innerHTML = renderTitleSlideHTML(generatedSlidesData.title, slides.length);
    slides.forEach((s, i) => {
        $('#previewContainerLive').insertAdjacentHTML('beforeend', renderContentSlideHTML(s, i + 1, slides.length));
    });
    $('#previewContainerLive').insertAdjacentHTML('beforeend', renderEndSlideHTML());
    setTimeout(() => $$('#previewContainerLive .slide-preview').forEach(el => el.classList.add('visible')), 50);
    bindSlideClickEvents();

    $('#previewContainer').innerHTML = $('#previewContainerLive').innerHTML;
    bindSlideClickEvents();

    $('#modalEdit').style.display = 'none';
    showToast('✅ 内容已更新', 'success');
}

// ============================================
// 6. Notes View (演讲者备注)
// ============================================
function openNotesModal() {
    if (!generatedSlidesData) return;
    const slides = generatedSlidesData.slides;
    const container = $('#notesModalBody');
    container.innerHTML = slides.map((s, i) => `
        <div class="note-card">
            <h4><span class="note-num">${i + 1}</span>${escapeHtml(s.title)}</h4>
            <p>${s.notes ? escapeHtml(s.notes) : '<span class="no-note">暂无备注</span>'}</p>
        </div>
    `).join('');
    $('#modalNotes').style.display = 'flex';
}

function printNotes() {
    if (!generatedSlidesData) return;
    const slides = generatedSlidesData.slides;
    const content = slides.map((s, i) =>
        `第 ${i + 1} 页: ${s.title}\n备注: ${s.notes || '无'}\n要点:\n${(s.content || []).map(c => '  - ' + c).join('\n')}\n`
    ).join('\n---\n\n');

    const win = window.open('', '_blank');
    win.document.write(`<pre style="font-family: sans-serif; white-space: pre-wrap; padding: 20px;">演讲者备注 - ${generatedSlidesData.title}\n${'='.repeat(40)}\n\n${content}</pre>`);
    win.document.close();
    win.print();
}

// ============================================
// 7. Present Mode (全屏演示)
// ============================================
let presentIndex = 0;

function openPresentMode() {
    if (!generatedSlidesData) return;
    presentIndex = 0;
    renderPresentSlide();
    $('#presentOverlay').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closePresentMode() {
    $('#presentOverlay').style.display = 'none';
    document.body.style.overflow = '';
}

function navigatePresent(dir) {
    const total = generatedSlidesData.slides.length + 2;
    presentIndex = Math.max(0, Math.min(total - 1, presentIndex + dir));
    renderPresentSlide();
}

function renderPresentSlide() {
    const slides = generatedSlidesData.slides;
    const total = slides.length + 2;
    const idx = presentIndex;

    let html = '';
    const colors = COLOR_MAP[selectedColor] || COLOR_MAP.blue;

    if (idx === 0) {
        html = `<div class="slide-content slide-title-page" style="position:relative;width:100%;height:100%;padding:60px">
            <div class="slide-decorations"><div class="deco-circle"></div><div class="deco-circle"></div></div>
            <div class="slide-main-title" style="font-size:48px">${escapeHtml(generatedSlidesData.title)}</div>
            <div class="slide-subtitle" style="font-size:20px">共 ${slides.length} 页</div>
        </div>`;
    } else if (idx === total - 1) {
        html = `<div class="slide-content slide-end-page" style="width:100%;height:100%;padding:60px">
            <div class="end-title" style="font-size:56px">谢谢</div>
            <div class="end-subtitle" style="font-size:20px">THANK YOU</div>
        </div>`;
    } else {
        const slide = slides[idx - 1];
        const points = (slide.content || []).map(p => `<div class="slide-point" style="font-size:18px;margin-bottom:12px"><div class="point-icon">${POINT_SVG}</div><span>${escapeHtml(p)}</span></div>`).join('');
        html = `<div class="slide-content slide-content-page" style="position:relative;width:100%;height:100%;padding:40px 50px">
            <div class="slide-header" style="margin-bottom:24px;padding-bottom:16px"><div class="slide-num-badge" style="width:40px;height:40px;font-size:18px">${idx}</div><div class="slide-title" style="font-size:28px">${escapeHtml(slide.title)}</div></div>
            <div class="slide-points">${points}</div>
        </div>`;
    }

    $('#presentContainer').innerHTML = `<div class="present-slide">${html}</div>`;
    $('#presentPage').textContent = `${idx + 1} / ${total}`;
}

// ============================================
// 8. Slide Preview Modal
// ============================================
function openSlideModal(slideIndex) {
    if (!generatedSlidesData) return;
    currentSlideIndex = slideIndex;
    renderSlideDetail();
    $('#modalSlidePreview').style.display = 'flex';
}

function closeSlideModal() { $('#modalSlidePreview').style.display = 'none'; }

function renderSlideDetail() {
    const slides = generatedSlidesData.slides;
    const total = slides.length + 2;
    const idx = currentSlideIndex;

    $('#slideModalPage').textContent = `${idx + 1} / ${total}`;
    $('#btnPrevSlide').disabled = idx === 0;
    $('#btnNextSlide').disabled = idx === total - 1;
    $('#btnPrevSlide').style.opacity = idx === 0 ? '0.4' : '1';
    $('#btnNextSlide').style.opacity = idx === total - 1 ? '0.4' : '1';

    if (idx === 0) {
        $('#slideModalTitle').textContent = '标题页';
        $('#slideModalBody').innerHTML = `<div class="detail-slide"><div class="detail-slide-header" style="justify-content:center;text-align:center;flex-direction:column;gap:8px;padding:40px"><div class="detail-slide-title" style="font-size:28px">${escapeHtml(generatedSlidesData.title)}</div><div style="opacity:0.7;font-size:14px">共 ${slides.length} 页</div></div></div>`;
        return;
    }
    if (idx === total - 1) {
        $('#slideModalTitle').textContent = '结束页';
        $('#slideModalBody').innerHTML = `<div class="detail-slide"><div class="detail-slide-header" style="justify-content:center;text-align:center;flex-direction:column;gap:8px;padding:40px"><div class="detail-slide-title" style="font-size:32px">谢谢</div><div style="opacity:0.7;font-size:14px">THANK YOU</div></div></div>`;
        return;
    }

    const slide = slides[idx - 1];
    $('#slideModalTitle').textContent = `第 ${idx} 页 · ${slide.title}`;
    const pointsHTML = (slide.content || []).map(p => `<div class="detail-point"><div class="detail-point-icon">${POINT_SVG}</div><div class="detail-point-text">${escapeHtml(p)}</div></div>`).join('');
    const notesHTML = slide.notes ? `<div class="detail-notes"><div class="detail-notes-label">📝 演讲者备注</div><div class="detail-notes-text">${escapeHtml(slide.notes)}</div></div>` : '';
    $('#slideModalBody').innerHTML = `<div class="detail-slide"><div class="detail-slide-header"><div class="detail-slide-num">${idx}</div><div class="detail-slide-title">${escapeHtml(slide.title)}</div></div><div class="detail-slide-body"><div class="detail-points">${pointsHTML}</div>${notesHTML}</div></div>`;
}

function prevSlide() { if (currentSlideIndex > 0) { currentSlideIndex--; renderSlideDetail(); } }
function nextSlide() { const t = generatedSlidesData ? generatedSlidesData.slides.length + 2 : 0; if (currentSlideIndex < t - 1) { currentSlideIndex++; renderSlideDetail(); } }

function bindSlideClickEvents() {
    $$('.slide-preview').forEach((card, i) => {
        card.onclick = () => openSlideModal(i);
    });
}

// ============================================
// 9. HTML Slide Renderers
// ============================================
function renderTitleSlideHTML(title, totalSlides) {
    return `<div class="slide-preview"><div class="slide-aspect"><div class="slide-content slide-title-page" onclick="openSlideModal(0)" style="cursor:pointer"><div class="slide-decorations"><div class="deco-circle"></div><div class="deco-circle"></div></div><div class="slide-main-title">${escapeHtml(title)}</div><div class="slide-subtitle">共 ${totalSlides} 页 · AI 智能生成</div></div></div><div class="slide-status done"><span class="status-dot"></span>标题页 · 点击预览</div></div>`;
}

function renderTocSlideHTML(slides) {
    const items = slides.map((s, i) => `<div class="toc-item"><span class="toc-num">${i + 1}</span>${escapeHtml(s.title)}</div>`).join('');
    return `<div class="slide-preview"><div class="slide-aspect"><div class="slide-content slide-toc-page" style="padding:0;cursor:pointer" onclick="openSlideModal(1)"><div class="toc-left"><h3>目录</h3><span>CONTENTS</span></div><div class="toc-right">${items}</div></div></div><div class="slide-status done"><span class="status-dot"></span>目录页 · 点击预览</div></div>`;
}

function renderContentSlideHTML(slideData, index, totalSlides) {
    const points = (slideData.content || []).slice(0, 4).map(p => `<div class="slide-point"><div class="point-icon">${POINT_SVG}</div><span>${escapeHtml(p)}</span></div>`).join('');
    const extra = (slideData.content || []).length - 4;
    const hint = extra > 0 ? `<div style="font-size:12px;color:var(--text-muted);margin-top:8px">...还有 ${extra} 个要点</div>` : '';
    return `<div class="slide-preview" id="slide-preview-${index}" style="position:relative"><div class="slide-aspect"><div class="slide-content slide-content-page"><div class="slide-header slide-header-clickable" onclick="openSlideModal(${index})" title="点击查看详情"><div class="slide-num-badge">${index}</div><div class="slide-title">${escapeHtml(slideData.title)}</div><div class="slide-preview-btn"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 12l4-4-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div></div><div class="slide-points">${points}</div>${hint}<div class="slide-page-num">${index} / ${totalSlides}</div></div></div><div class="slide-status"><span class="status-dot"></span>第 ${index} 页 · 点击标题预览详情</div></div>`;
}

function renderEndSlideHTML() {
    return `<div class="slide-preview"><div class="slide-aspect"><div class="slide-content slide-end-page"><div class="end-title">谢谢</div><div class="end-subtitle">THANK YOU</div></div></div><div class="slide-status done"><span class="status-dot"></span>结束页</div></div>`;
}

// ============================================
// Config Modal
// ============================================
function openConfig() {
    cfgApiKey.value = localStorage.getItem('mimo_api_key') || '';
    cfgBaseUrl.value = localStorage.getItem('mimo_base_url') || 'https://token-plan-cn.xiaomimimo.com/v1';
    cfgModel.value = localStorage.getItem('mimo_model') || 'mimo-v2.5-pro';
    testResult.style.display = 'none';
    modalConfig.style.display = 'flex';
}

function closeConfig() { modalConfig.style.display = 'none'; testResult.style.display = 'none'; }

async function testConnection() {
    const apiKey = cfgApiKey.value.trim();
    if (!apiKey) { showToast('请先输入 API Key', 'error'); return; }
    await fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ api_key: apiKey, base_url: cfgBaseUrl.value.trim(), model: cfgModel.value.trim() }) }).catch(() => {});

    const btnText = btnTestConnection.querySelector('.btn-test-text');
    const btnLoading = btnTestConnection.querySelector('.btn-test-loading');
    btnText.style.display = 'none'; btnLoading.style.display = 'inline-flex'; btnTestConnection.disabled = true;
    testResult.style.display = 'none';

    try {
        const resp = await fetch('/api/test-connection', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
        const data = await resp.json();
        testResult.style.display = 'block';
        if (data.success) {
            testResult.className = 'test-result success';
            testResult.innerHTML = `✅ ${escapeHtml(data.message)}`;
            showToast('✅ 连接成功！', 'success');
        } else {
            testResult.className = 'test-result error';
            testResult.innerHTML = `❌ ${escapeHtml(data.error)}`;
            showToast('❌ 连接失败', 'error');
        }
    } catch (err) {
        testResult.style.display = 'block'; testResult.className = 'test-result error';
        testResult.innerHTML = `❌ 网络错误: ${escapeHtml(err.message)}`;
    } finally { btnText.style.display = 'inline'; btnLoading.style.display = 'none'; btnTestConnection.disabled = false; }
}

async function saveConfig() {
    const apiKey = cfgApiKey.value.trim();
    if (!apiKey) { showToast('请输入 API Key', 'error'); return; }
    localStorage.setItem('mimo_api_key', apiKey);
    localStorage.setItem('mimo_base_url', cfgBaseUrl.value.trim());
    localStorage.setItem('mimo_model', cfgModel.value.trim());
    fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ api_key: apiKey, base_url: cfgBaseUrl.value.trim(), model: cfgModel.value.trim() }) }).catch(() => {});
    showToast('配置已保存', 'success'); closeConfig();
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function escapeHtml(t) { const d = document.createElement('div'); d.textContent = t || ''; return d.innerHTML; }
