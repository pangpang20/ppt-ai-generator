# 逐页生成 + HTML 预览方案

## 目标
1. 先调用 AI 获取内容（JSON）
2. 前端逐页渲染 HTML 预览卡片（带动画）
3. 每页渲染完后自动生成 PPT
4. 最后显示下载按钮

## 流程

```
用户点击生成 → 后端调用 AI 获取 JSON → 返回给前端
    → 前端逐页渲染 HTML 卡片（每页有动画）
    → 全部渲染完后调用后端生成 PPT
    → 显示下载按钮
```

## 后端改动 (app.py)

1. **新增 `/api/generate-content`** — 只调用 AI，返回 JSON，不生成 PPT
2. **新增 `/api/create-ppt`** — 接收 JSON 内容，生成 PPT 文件，返回下载链接
3. **保留 `/api/generate`** — 旧接口兼容

## 前端改动

### HTML (index.html)
- 新增 `sectionGenerating` 区域，用于逐页展示
- 每页用 HTML 卡片模拟 PPT 样式

### CSS (style.css)
- 逐页出现动画（fadeInUp）
- HTML 预览卡片样式（模拟 PPT 外观）

### JS (app.js)
- 点击生成后：
  1. 调用 `/api/generate-content` 获取内容
  2. 逐页创建 HTML 卡片，每页间隔 500ms
  3. 全部完成后调用 `/api/create-ppt` 生成文件
  4. 显示下载按钮

## HTML 预览卡片设计
- 宽高比 16:9
- 标题区域 + 要点列表
- 每个要点带图标
- 页码显示
- 与 PPT 样式一致的配色
