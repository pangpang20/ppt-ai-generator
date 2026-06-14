# PPT AI Generator - Implementation Plan

## Overview
Build a web application that uses AI (Xiaomi MiMo) to generate PPT presentations from 6 professional templates based on user-provided keywords/prompts.

## Architecture

```
Frontend (HTML/CSS/JS)  →  Flask Backend  →  MiMo API (AI)
                              ↓
                         python-pptx → .pptx file → Download
```

## Tech Stack
- **Frontend**: Vanilla HTML + CSS + JavaScript (single page, no framework)
- **Backend**: Flask (Python 3.7, already installed)
- **AI**: Xiaomi MiMo API (OpenAI-compatible endpoint)
- **PPT Generation**: python-pptx (needs `pip install`)
- **Dependencies**: requests (already installed)

## Directory Structure
```
/opt/cyl/ppt_gen/
├── app.py                  # Flask backend, all API routes
├── config.py               # MiMo API configuration (token, endpoint, model)
├── ppt_generator.py        # python-pptx PPT generation logic
├── templates_config.py     # 6 template definitions (prompts, metadata)
├── requirements.txt        # Python dependencies
├── static/
│   ├── style.css           # All styling
│   └── app.js              # Frontend logic
├── templates/
│   └── index.html          # Main HTML page
└── output/                 # Generated PPT files (temp)
```

## Implementation Steps

### Step 1: Install Dependencies
- `pip install python-pptx`

### Step 2: Backend - Config (`config.py`)
- MiMo API base URL, API key, model name
- Default settings (temperature, max_tokens)
- Easy to modify via environment variables or direct edit

### Step 3: Backend - Template Definitions (`templates_config.py`)
- Define 6 templates with:
  - `id`, `name_zh`, `name_en`, `description`
  - `system_prompt`: instructions for the AI
  - `user_prompt_template`: with `[topic]` and `[audience]` placeholders
  - `output_schema`: expected JSON structure from AI

### Step 4: Backend - PPT Generator (`ppt_generator.py`)
- Function: `generate_ppt(slides_data, template_id, output_path)`
- Uses python-pptx to create professional slides:
  - Title slide with topic
  - Content slides with bullet points
  - Summary/conclusion slide
- Professional styling: color scheme, fonts, layouts
- Different visual styles per template

### Step 5: Backend - Flask App (`app.py`)
Routes:
- `GET /` → serve index.html
- `GET /api/templates` → list all 6 templates
- `POST /api/generate` → main generation endpoint
  - Input: `{ template_id, topic, audience?, extra_instructions? }`
  - Process: call MiMo API → parse response → generate PPT
  - Output: `{ success, download_url, preview_slides }`
- `GET /api/download/<filename>` → serve generated .pptx file

### Step 6: Frontend - HTML (`templates/index.html`)
- Header with title
- Template selection grid (6 cards with icons)
- Input form: topic, audience (optional), extra instructions
- Generate button with loading state
- Preview area for generated slide content
- Download button

### Step 7: Frontend - CSS (`static/style.css`)
- Modern, clean design
- Responsive layout
- Card-based template selection
- Loading animations
- Professional color scheme

### Step 8: Frontend - JS (`static/app.js`)
- Fetch and render templates
- Form submission and API call
- Loading state management
- Preview rendering
- Download handling

## AI Integration Details

MiMo API call format (OpenAI-compatible):
```python
POST {BASE_URL}/v1/chat/completions
Headers: Authorization: Bearer {API_KEY}
Body: {
    "model": "mimo-v2.5-pro",
    "messages": [
        {"role": "system", "content": "..."},
        {"role": "user", "content": "..."}
    ],
    "temperature": 0.7,
    "max_tokens": 4096
}
```

AI is asked to return structured JSON:
```json
{
    "title": "演示标题",
    "slides": [
        {
            "slide_number": 1,
            "title": "页标题",
            "content": ["要点1", "要点2", "要点3"],
            "notes": "演讲者备注"
        }
    ]
}
```

## PPT Styling
- 16:9 aspect ratio
- Professional color palette (dark blue + accent colors)
- Clean typography
- Consistent layout across slides
- Title slide with gradient background
- Content slides with structured bullet points
