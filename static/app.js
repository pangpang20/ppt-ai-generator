/**
 * PPT AI Generator - Frontend Logic
 * 逐页生成 + HTML 预览版
 */

// ============================================
// State
// ============================================
let selectedTemplate = null;
let templates = [];
let isGenerating = false;
let generatedSlidesData = null;

// Template icon map
const TEMPLATE_ICONS = {
    blueprint: '📐',
    structure: '🏗️',
    storytelling: '📖',
    visual: '🎨',
    content: '📋',
    clarity: '✨',
};

// Template accent colors
const TEMPLATE_COLORS = {
    blueprint: '#3B82F6',
    structure: '#10B981',
    storytelling: '#F59E0B',
    visual: '#8B5CF6',
    content: '#06B6D4',
    clarity: '#F43F5E',
};

// 要点图标 SVG
const POINT_SVG = `<svg viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// ============================================
// DOM Elements
// ============================================
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const templateGrid = $('#templateGrid');
const sectionTemplate = $('#sectionTemplate');
const sectionInput = $('#sectionInput');
const sectionGenerating = $('#sectionGenerating');
const sectionResult = $('#sectionResult');
const inputTopic = $('#inputTopic');
const inputAudience = $('#inputAudience');
const inputExtra = $('#inputExtra');
const btnGenerate = $('#btnGenerate');
const btnNew = $('#btnNew');
const btnDownload = $('#btnDownload');
const downloadTitle = $('#downloadTitle');
const downloadMeta = $('#downloadMeta');
const previewContainer = $('#previewContainer');
const previewContainerLive = $('#previewContainerLive');
const progressBar = $('#progressBar');
const progressText = $('#progressText');
const generatingTitle = $('#generatingTitle');
const generatingDesc = $('#generatingDesc');

// Config modal
const modalConfig = $('#modalConfig');
const btnConfig = $('#btnConfig');
const btnCloseModal = $('#btnCloseModal');
const btnCancelConfig = $('#btnCancelConfig');
const btnSaveConfig = $('#btnSaveConfig');
const btnTestConnection = $('#btnTestConnection');
const cfgApiKey = $('#cfgApiKey');
const cfgBaseUrl = $('#cfgBaseUrl');
const cfgModel = $('#cfgModel');
const testResult = $('#testResult');

// Toast
const toastContainer = $('#toastContainer');

// ============================================
// Toast
// ============================================
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

// ============================================
// Templates
// ============================================
async function loadTemplates() {
    try {
        const resp = await fetch('/api/templates');
        const data = await resp.json();
        if (data.success) {
            templates = data.templates;
            renderTemplates();
        }
    } catch (err) {
        showToast('加载模板失败，请刷新页面', 'error');
    }
}

function renderTemplates() {
    templateGrid.innerHTML = templates.map(t => `
        <div class="template-card" data-id="${t.id}" style="--card-accent: ${TEMPLATE_COLORS[t.id] || '#3B82F6'}">
            <div class="check-mark">✓</div>
            <div class="template-card-header">
                <div class="template-icon" style="background: ${TEMPLATE_COLORS[t.id] || '#3B82F6'}15; color: ${TEMPLATE_COLORS[t.id] || '#3B82F6'}">
                    ${TEMPLATE_ICONS[t.id] || '📄'}
                </div>
                <div>
                    <h3>${t.name_zh}</h3>
                    <span class="template-en">${t.name_en}</span>
                </div>
            </div>
            <p>${t.description}</p>
        </div>
    `).join('');

    $$('.template-card').forEach(card => {
        card.addEventListener('click', () => selectTemplate(card.dataset.id));
    });
}

function selectTemplate(id) {
    selectedTemplate = id;
    $$('.template-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.id === id);
    });
}

// ============================================
// HTML Slide Preview Renderers
// ============================================

function renderTitleSlideHTML(title, totalSlides) {
    return `
    <div class="slide-preview" style="animation-delay: 0s">
        <div class="slide-aspect">
            <div class="slide-content slide-title-page">
                <div class="slide-decorations">
                    <div class="deco-circle"></div>
                    <div class="deco-circle"></div>
                </div>
                <div class="slide-main-title">${escapeHtml(title)}</div>
                <div class="slide-subtitle">共 ${totalSlides} 页 · AI 智能生成</div>
            </div>
        </div>
        <div class="slide-status done">
            <span class="status-dot"></span>
            标题页
        </div>
    </div>`;
}

function renderTocSlideHTML(slides) {
    const items = slides.map((s, i) =>
        `<div class="toc-item"><span class="toc-num">${i + 1}</span>${escapeHtml(s.title)}</div>`
    ).join('');

    return `
    <div class="slide-preview" style="animation-delay: 0.1s">
        <div class="slide-aspect">
            <div class="slide-content slide-toc-page" style="padding:0">
                <div class="toc-left">
                    <h3>目录</h3>
                    <span>CONTENTS</span>
                </div>
                <div class="toc-right">${items}</div>
            </div>
        </div>
        <div class="slide-status done">
            <span class="status-dot"></span>
            目录页
        </div>
    </div>`;
}

function renderContentSlideHTML(slideData, index, totalSlides) {
    const points = (slideData.content || []).slice(0, 4).map(p =>
        `<div class="slide-point">
            <div class="point-icon">${POINT_SVG}</div>
            <span>${escapeHtml(p)}</span>
        </div>`
    ).join('');

    const extraCount = (slideData.content || []).length - 4;
    const moreHint = extraCount > 0 ? `<div style="font-size:12px;color:var(--text-muted);margin-top:8px;">...还有 ${extraCount} 个要点</div>` : '';

    return `
    <div class="slide-preview" id="slide-preview-${index}" style="position:relative">
        <div class="slide-aspect">
            <div class="slide-content slide-content-page">
                <div class="slide-header">
                    <div class="slide-num-badge">${index}</div>
                    <div class="slide-title">${escapeHtml(slideData.title)}</div>
                </div>
                <div class="slide-points">${points}</div>
                ${moreHint}
                <div class="slide-page-num">${index} / ${totalSlides}</div>
            </div>
        </div>
        <div class="slide-status">
            <span class="status-dot"></span>
            第 ${index} 页
        </div>
        <div class="click-hint">🔍 点击查看详情</div>
    </div>`;
}

function renderEndSlideHTML() {
    return `
    <div class="slide-preview">
        <div class="slide-aspect">
            <div class="slide-content slide-end-page">
                <div class="end-title">谢谢</div>
                <div class="end-subtitle">THANK YOU</div>
            </div>
        </div>
        <div class="slide-status done">
            <span class="status-dot"></span>
            结束页
        </div>
    </div>`;
}

// ============================================
// Main Generate Flow
// ============================================
async function handleGenerate() {
    if (isGenerating) return;

    const topic = inputTopic.value.trim();
    if (!topic) {
        showToast('请输入演示主题', 'error');
        inputTopic.focus();
        return;
    }

    if (!selectedTemplate) {
        showToast('请选择一个模板', 'error');
        return;
    }

    isGenerating = true;

    // 切换到生成中界面
    sectionGenerating.style.display = 'block';
    sectionResult.style.display = 'none';
    previewContainerLive.innerHTML = '';
    progressBar.style.width = '0%';
    progressText.textContent = '正在调用 AI 生成内容...';
    generatingTitle.textContent = 'AI 正在生成内容...';
    sectionGenerating.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // 禁用按钮
    const btnText = btnGenerate.querySelector('.btn-text');
    const btnLoading = btnGenerate.querySelector('.btn-loading');
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline-flex';
    btnGenerate.disabled = true;

    try {
        // 使用 SSE 流式接收
        const slides = [];
        let title = topic;
        let totalSlides = 0;
        let receivedTitle = false;

        // 通过 fetch + ReadableStream 实现 SSE（因为需要 POST）
        const resp = await fetch('/api/generate-stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                template_id: selectedTemplate,
                topic: topic,
                audience: inputAudience.value.trim() || '通用受众',
                extra_instructions: inputExtra.value.trim(),
            }),
        });

        if (!resp.ok) {
            const err = await resp.json();
            showToast(err.error || '生成失败', 'error');
            sectionGenerating.style.display = 'none';
            return;
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let sseBuffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            sseBuffer += decoder.decode(value, { stream: true });

            // 解析 SSE 事件
            const lines = sseBuffer.split('\n');
            sseBuffer = lines.pop() || ''; // 保留不完整的行

            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                try {
                    const event = JSON.parse(line.slice(6));

                    if (event.type === 'slide') {
                        // 收到一页内容，立即渲染
                        const slide = event.slide;
                        const idx = event.index;
                        slides.push(slide);
                        totalSlides = slides.length;

                        // 第一页到达时，先渲染标题页
                        if (idx === 1) {
                            generatingTitle.textContent = '正在逐页生成内容...';
                            // 先渲染标题页（用临时标题）
                            previewContainerLive.innerHTML = renderTitleSlideHTML(topic, '...');
                            setTimeout(() => {
                                previewContainerLive.querySelectorAll('.slide-preview').forEach(el => el.classList.add('visible'));
                            }, 50);
                        }

                        // 更新标题页的页数
                        if (idx === 1 && !receivedTitle) {
                            // 不需要等，直接继续
                        }

                        progressBar.style.width = Math.round(idx / 10 * 80) + '%';
                        progressText.textContent = `已生成第 ${idx} 页: ${slide.title}`;

                        // 渲染这一页
                        previewContainerLive.insertAdjacentHTML('beforeend', renderContentSlideHTML(slide, idx, '?'));
                        setTimeout(() => {
                            const el = document.getElementById(`slide-preview-${idx}`);
                            if (el) el.classList.add('visible');
                        }, 50);

                        bindSlideClickEvents();

                    } else if (event.type === 'done') {
                        // 全部完成
                        title = event.title || topic;
                        totalSlides = event.total;

                        // 更新标题页
                        const titleSlide = previewContainerLive.querySelector('.slide-title-page');
                        if (titleSlide) {
                            const sub = titleSlide.querySelector('.slide-subtitle');
                            if (sub) sub.textContent = `共 ${totalSlides} 页 · AI 智能生成`;
                        }

                        // 更新所有页码
                        previewContainerLive.querySelectorAll('.slide-page-num').forEach(el => {
                            el.textContent = el.textContent.replace('?', totalSlides);
                        });

                        // 渲染结束页
                        previewContainerLive.insertAdjacentHTML('beforeend', renderEndSlideHTML());
                        setTimeout(() => {
                            previewContainerLive.querySelectorAll('.slide-preview:not(.visible)').forEach(el => el.classList.add('visible'));
                        }, 50);

                        progressBar.style.width = '85%';
                        progressText.textContent = '页面渲染完成，正在生成 PPT 文件...';
                        generatingTitle.textContent = '正在生成 PPT 文件...';

                        // 生成 PPT 文件
                        generatedSlidesData = { title: title, slides: slides };

                        const pptResp = await fetch('/api/create-ppt', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                slides_data: generatedSlidesData,
                                template_id: selectedTemplate,
                            }),
                        });

                        const pptData = await pptResp.json();

                        if (pptData.success) {
                            progressBar.style.width = '100%';
                            progressText.textContent = '全部完成！';
                            generatingTitle.textContent = '生成完成！';
                            await sleep(300);
                            showResult(generatedSlidesData, pptData.download_url);
                            showToast('演示文稿生成成功！', 'success');
                        } else {
                            showToast(pptData.error || 'PPT 生成失败', 'error');
                        }

                    } else if (event.type === 'error') {
                        showToast('AI 错误: ' + event.error, 'error');
                    }
                } catch (e) {
                    // 忽略解析错误
                }
            }
        }

    } catch (err) {
        showToast('网络错误，请检查连接后重试', 'error');
        console.error(err);
    } finally {
        isGenerating = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        btnGenerate.disabled = false;
    }
}

function showResult(slidesData, downloadUrl) {
    const { title, slides } = slidesData;

    // 更新下载栏
    downloadTitle.textContent = title || '演示文稿';
    downloadMeta.textContent = `共 ${slides.length} 页`;
    btnDownload.href = downloadUrl;

    // 复制预览卡片到结果区域
    previewContainer.innerHTML = previewContainerLive.innerHTML;

    // 绑定点击事件
    bindSlideClickEvents();

    // 切换到结果界面
    sectionGenerating.style.display = 'none';
    sectionResult.style.display = 'block';
    sectionResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// Slide Preview Modal (点击预览详情)
// ============================================
let currentSlideIndex = 0;

const modalSlidePreview = $('#modalSlidePreview');
const slideModalTitle = $('#slideModalTitle');
const slideModalBody = $('#slideModalBody');
const slideModalPage = $('#slideModalPage');
const btnCloseSlideModal = $('#btnCloseSlideModal');
const btnPrevSlide = $('#btnPrevSlide');
const btnNextSlide = $('#btnNextSlide');

function openSlideModal(slideIndex) {
    if (!generatedSlidesData || !generatedSlidesData.slides) return;
    currentSlideIndex = slideIndex;
    renderSlideDetail();
    modalSlidePreview.style.display = 'flex';
}

function closeSlideModal() {
    modalSlidePreview.style.display = 'none';
}

function renderSlideDetail() {
    const slides = generatedSlidesData.slides;
    const total = slides.length + 2; // +2 for title and end slide
    const idx = currentSlideIndex;

    slideModalPage.textContent = `${idx + 1} / ${total}`;
    btnPrevSlide.disabled = idx === 0;
    btnNextSlide.disabled = idx === total - 1;
    btnPrevSlide.style.opacity = idx === 0 ? '0.4' : '1';
    btnNextSlide.style.opacity = idx === total - 1 ? '0.4' : '1';

    // 标题页
    if (idx === 0) {
        slideModalTitle.textContent = '标题页';
        slideModalBody.innerHTML = `
        <div class="detail-slide">
            <div class="detail-slide-header" style="justify-content: center; text-align: center; flex-direction: column; gap: 8px; padding: 40px;">
                <div class="detail-slide-title" style="font-size: 28px;">${escapeHtml(generatedSlidesData.title)}</div>
                <div style="opacity: 0.7; font-size: 14px;">共 ${slides.length} 页 · AI 智能生成</div>
            </div>
        </div>`;
        return;
    }

    // 结束页
    if (idx === total - 1) {
        slideModalTitle.textContent = '结束页';
        slideModalBody.innerHTML = `
        <div class="detail-slide">
            <div class="detail-slide-header" style="justify-content: center; text-align: center; flex-direction: column; gap: 8px; padding: 40px;">
                <div class="detail-slide-title" style="font-size: 32px;">谢谢</div>
                <div style="opacity: 0.7; font-size: 14px;">THANK YOU</div>
            </div>
        </div>`;
        return;
    }

    // 内容页 (idx 1 ~ total-2 对应 slides[0] ~ slides[total-3])
    const slideIdx = idx - 1;
    const slide = slides[slideIdx];
    if (!slide) return;

    slideModalTitle.textContent = `第 ${slideIdx + 1} 页 · ${slide.title}`;

    const pointsHTML = (slide.content || []).map((p, i) => `
        <div class="detail-point">
            <div class="detail-point-icon">${POINT_SVG}</div>
            <div class="detail-point-content">
                <div class="detail-point-text">${escapeHtml(p)}</div>
            </div>
        </div>
    `).join('');

    const notesHTML = slide.notes ? `
        <div class="detail-notes">
            <div class="detail-notes-label">📝 演讲者备注</div>
            <div class="detail-notes-text">${escapeHtml(slide.notes)}</div>
        </div>
    ` : '';

    slideModalBody.innerHTML = `
    <div class="detail-slide">
        <div class="detail-slide-header">
            <div class="detail-slide-num">${slideIdx + 1}</div>
            <div class="detail-slide-title">${escapeHtml(slide.title)}</div>
        </div>
        <div class="detail-slide-body">
            <div class="detail-points">${pointsHTML}</div>
            ${notesHTML}
        </div>
    </div>`;
}

function prevSlide() {
    if (currentSlideIndex > 0) {
        currentSlideIndex--;
        renderSlideDetail();
    }
}

function nextSlide() {
    const total = generatedSlidesData ? generatedSlidesData.slides.length + 2 : 0;
    if (currentSlideIndex < total - 1) {
        currentSlideIndex++;
        renderSlideDetail();
    }
}

function bindSlideClickEvents() {
    // 为所有预览卡片绑定点击事件
    document.querySelectorAll('.slide-preview').forEach((card, i) => {
        card.addEventListener('click', () => openSlideModal(i));
    });
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

function closeConfig() {
    modalConfig.style.display = 'none';
    testResult.style.display = 'none';
}

async function testConnection() {
    const apiKey = cfgApiKey.value.trim();
    const baseUrl = cfgBaseUrl.value.trim();
    const model = cfgModel.value.trim();

    if (!apiKey) {
        showToast('请先输入 API Key', 'error');
        cfgApiKey.focus();
        return;
    }

    // 先保存配置到后端
    try {
        await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_key: apiKey, base_url: baseUrl, model }),
        });
    } catch (e) {}

    const btnText = btnTestConnection.querySelector('.btn-test-text');
    const btnLoading = btnTestConnection.querySelector('.btn-test-loading');
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline-flex';
    btnTestConnection.disabled = true;
    testResult.style.display = 'none';

    try {
        const resp = await fetch('/api/test-connection', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        const data = await resp.json();

        testResult.style.display = 'block';
        if (data.success) {
            testResult.className = 'test-result success';
            testResult.innerHTML = `<span class="result-icon">✅</span> ${escapeHtml(data.message)}`;
            if (data.reply) {
                testResult.innerHTML += `<br><span style="opacity:0.7;font-size:12px;">AI 回复: ${escapeHtml(data.reply)}</span>`;
            }
            showToast('✅ 连接成功！', 'success');
        } else {
            testResult.className = 'test-result error';
            testResult.innerHTML = `<span class="result-icon">❌</span> ${escapeHtml(data.error)}`;
            showToast('❌ 连接失败：' + data.error, 'error');
        }
    } catch (err) {
        testResult.style.display = 'block';
        testResult.className = 'test-result error';
        testResult.innerHTML = `<span class="result-icon">❌</span> 网络错误: ${escapeHtml(err.message)}`;
        showToast('❌ 网络错误：' + err.message, 'error');
    } finally {
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        btnTestConnection.disabled = false;
    }
}

async function saveConfig() {
    const apiKey = cfgApiKey.value.trim();
    const baseUrl = cfgBaseUrl.value.trim();
    const model = cfgModel.value.trim();

    if (!apiKey) {
        showToast('请输入 API Key', 'error');
        return;
    }

    localStorage.setItem('mimo_api_key', apiKey);
    localStorage.setItem('mimo_base_url', baseUrl);
    localStorage.setItem('mimo_model', model);

    fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey, base_url: baseUrl, model: model }),
    }).catch(() => {});

    showToast('配置已保存', 'success');
    closeConfig();
}

// ============================================
// Reset
// ============================================
function handleNew() {
    sectionResult.style.display = 'none';
    sectionGenerating.style.display = 'none';
    previewContainerLive.innerHTML = '';
    inputTopic.value = '';
    inputExtra.value = '';
    sectionInput.scrollIntoView({ behavior: 'smooth', block: 'start' });
    inputTopic.focus();
}

// ============================================
// Init
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    loadTemplates();

    btnGenerate.addEventListener('click', handleGenerate);

    inputTopic.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) handleGenerate();
    });

    btnNew.addEventListener('click', handleNew);

    btnConfig.addEventListener('click', openConfig);
    btnCloseModal.addEventListener('click', closeConfig);
    btnCancelConfig.addEventListener('click', closeConfig);
    btnSaveConfig.addEventListener('click', saveConfig);
    btnTestConnection.addEventListener('click', testConnection);

    modalConfig.addEventListener('click', (e) => {
        if (e.target === modalConfig) closeConfig();
    });

    // Slide preview modal
    btnCloseSlideModal.addEventListener('click', closeSlideModal);
    btnPrevSlide.addEventListener('click', prevSlide);
    btnNextSlide.addEventListener('click', nextSlide);
    modalSlidePreview.addEventListener('click', (e) => {
        if (e.target === modalSlidePreview) closeSlideModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeConfig();
            closeSlideModal();
        }
        if (modalSlidePreview.style.display === 'flex') {
            if (e.key === 'ArrowLeft') prevSlide();
            if (e.key === 'ArrowRight') nextSlide();
        }
    });
});
