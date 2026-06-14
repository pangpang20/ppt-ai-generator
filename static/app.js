/**
 * PPT AI Generator - Frontend Logic
 */

// ============================================
// State
// ============================================
let selectedTemplate = null;
let templates = [];
let isGenerating = false;

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

// ============================================
// DOM Elements
// ============================================
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const templateGrid = $('#templateGrid');
const sectionTemplate = $('#sectionTemplate');
const sectionInput = $('#sectionInput');
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
const resultDesc = $('#resultDesc');

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

    // Bind click events
    $$('.template-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.dataset.id;
            selectTemplate(id);
        });
    });
}

function selectTemplate(id) {
    selectedTemplate = id;
    $$('.template-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.id === id);
    });
}

// ============================================
// Generate
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

    // Start generating
    isGenerating = true;
    const btnText = btnGenerate.querySelector('.btn-text');
    const btnLoading = btnGenerate.querySelector('.btn-loading');
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline-flex';
    btnGenerate.disabled = true;

    try {
        const resp = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                template_id: selectedTemplate,
                topic: topic,
                audience: inputAudience.value.trim() || '通用受众',
                extra_instructions: inputExtra.value.trim(),
            }),
        });

        const data = await resp.json();

        if (data.success) {
            renderResult(data.data);
            showToast('演示文稿生成成功！', 'success');
        } else {
            showToast(data.error || '生成失败', 'error');
        }
    } catch (err) {
        showToast('网络错误，请检查连接后重试', 'error');
    } finally {
        isGenerating = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        btnGenerate.disabled = false;
    }
}

function renderResult(data) {
    const { title, slides, download_url } = data;

    // Update download bar
    downloadTitle.textContent = title;
    downloadMeta.textContent = `共 ${slides.length} 页`;
    btnDownload.href = download_url;

    // Render preview cards
    previewContainer.innerHTML = slides.map((slide, i) => `
        <div class="preview-card">
            <div class="preview-card-header">
                <span class="preview-slide-num">${i + 1}</span>
                <h4>${escapeHtml(slide.title)}</h4>
            </div>
            <div class="preview-card-body">
                <ul>
                    ${(slide.content || []).map(p => `<li>${escapeHtml(p)}</li>`).join('')}
                </ul>
            </div>
            ${slide.notes ? `
                <div class="preview-card-notes">
                    <strong>备注：</strong>${escapeHtml(slide.notes)}
                </div>
            ` : ''}
        </div>
    `).join('');

    // Show result section
    sectionResult.style.display = 'block';
    sectionResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

// ============================================
// Config Modal
// ============================================
function openConfig() {
    // Load saved config from localStorage
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
    } catch (e) {
        // ignore
    }

    // 显示加载状态
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

function saveConfig() {
    const apiKey = cfgApiKey.value.trim();
    const baseUrl = cfgBaseUrl.value.trim();
    const model = cfgModel.value.trim();

    if (!apiKey) {
        showToast('请输入 API Key', 'error');
        return;
    }

    // Save to localStorage
    localStorage.setItem('mimo_api_key', apiKey);
    localStorage.setItem('mimo_base_url', baseUrl);
    localStorage.setItem('mimo_model', model);

    // Send to backend to update runtime config
    fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey, base_url: baseUrl, model: model }),
    }).catch(() => {}); // Best effort

    showToast('配置已保存', 'success');
    closeConfig();
}

// ============================================
// Reset
// ============================================
function handleNew() {
    sectionResult.style.display = 'none';
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

    // Generate button
    btnGenerate.addEventListener('click', handleGenerate);

    // Enter key in topic input
    inputTopic.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            handleGenerate();
        }
    });

    // New button
    btnNew.addEventListener('click', handleNew);

    // Config modal
    btnConfig.addEventListener('click', openConfig);
    btnCloseModal.addEventListener('click', closeConfig);
    btnCancelConfig.addEventListener('click', closeConfig);
    btnSaveConfig.addEventListener('click', saveConfig);
    btnTestConnection.addEventListener('click', testConnection);

    // Close modal on overlay click
    modalConfig.addEventListener('click', (e) => {
        if (e.target === modalConfig) closeConfig();
    });

    // Escape key closes modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeConfig();
    });
});
