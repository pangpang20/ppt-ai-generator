"""
PPT Generator - 使用 python-pptx 生成专业演示文稿
"""
import os
import uuid
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

# Color schemes for different templates
COLOR_SCHEMES = {
    "blueprint": {
        "primary": RGBColor(0x1A, 0x3C, 0x6E),     # Deep blue
        "accent": RGBColor(0x3B, 0x82, 0xF6),      # Bright blue
        "bg": RGBColor(0xFF, 0xFF, 0xFF),
        "text": RGBColor(0x1E, 0x29, 0x3B),
        "light": RGBColor(0xEF, 0xF6, 0xFF),
    },
    "structure": {
        "primary": RGBColor(0x06, 0x5F, 0x46),     # Teal
        "accent": RGBColor(0x10, 0xB9, 0x81),      # Green
        "bg": RGBColor(0xFF, 0xFF, 0xFF),
        "text": RGBColor(0x1E, 0x29, 0x3B),
        "light": RGBColor(0xEC, 0xFD, 0xF5),
    },
    "storytelling": {
        "primary": RGBColor(0x7C, 0x2D, 0x12),     # Warm brown
        "accent": RGBColor(0xF5, 0x9E, 0x0B),      # Amber
        "bg": RGBColor(0xFF, 0xFF, 0xFF),
        "text": RGBColor(0x1E, 0x29, 0x3B),
        "light": RGBColor(0xFF, 0xFB, 0xEB),
    },
    "visual": {
        "primary": RGBColor(0x5B, 0x21, 0xB6),     # Purple
        "accent": RGBColor(0x8B, 0x5C, 0xF6),      # Violet
        "bg": RGBColor(0xFF, 0xFF, 0xFF),
        "text": RGBColor(0x1E, 0x29, 0x3B),
        "light": RGBColor(0xF5, 0xF3, 0xFF),
    },
    "content": {
        "primary": RGBColor(0x0E, 0x74, 0x90),     # Cyan
        "accent": RGBColor(0x06, 0xB6, 0xD4),      # Light cyan
        "bg": RGBColor(0xFF, 0xFF, 0xFF),
        "text": RGBColor(0x1E, 0x29, 0x3B),
        "light": RGBColor(0xEC, 0xFE, 0xFF),
    },
    "clarity": {
        "primary": RGBColor(0xBE, 0x12, 0x3C),     # Rose
        "accent": RGBColor(0xF4, 0x3F, 0x5E),      # Pink
        "bg": RGBColor(0xFF, 0xFF, 0xFF),
        "text": RGBColor(0x1E, 0x29, 0x3B),
        "light": RGBColor(0xFF, 0xF1, 0xF2),
    },
}


def _add_shape_bg(slide, color, left=0, top=0, width=None, height=None):
    """给幻灯片添加背景色块"""
    prs_width = Inches(13.333)
    prs_height = Inches(7.5)
    w = width or prs_width
    h = height or prs_height
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, w, h)
    shape.fill.solid()
    shape.fill.fore_color.rgb = color
    shape.line.fill.background()
    return shape


def _add_accent_bar(slide, color, left, top, width, height):
    """添加装饰性色条"""
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = color
    shape.line.fill.background()
    return shape


def _set_text(text_frame, text, font_size=18, color=None, bold=False, alignment=PP_ALIGN.LEFT):
    """设置文本框内容"""
    text_frame.clear()
    text_frame.word_wrap = True
    p = text_frame.paragraphs[0]
    p.alignment = alignment
    run = p.add_run()
    run.text = text
    run.font.size = Pt(font_size)
    run.font.bold = bold
    if color:
        run.font.color.rgb = color
    return p


def _add_bullet_points(text_frame, points, font_size=16, color=None, spacing=Pt(8)):
    """添加要点列表"""
    text_frame.clear()
    text_frame.word_wrap = True
    for i, point in enumerate(points):
        if i == 0:
            p = text_frame.paragraphs[0]
        else:
            p = text_frame.add_paragraph()
        p.alignment = PP_ALIGN.LEFT
        p.space_after = spacing
        p.level = 0

        # Bullet symbol
        run_bullet = p.add_run()
        run_bullet.text = "●  "
        run_bullet.font.size = Pt(font_size - 2)
        run_bullet.font.color.rgb = color or RGBColor(0x3B, 0x82, 0xF6)

        # Content text
        run = p.add_run()
        run.text = point
        run.font.size = Pt(font_size)
        if color:
            run.font.color.rgb = color


def generate_title_slide(prs, title, subtitle, colors):
    """生成标题页"""
    slide = prs.slides.add_slide(prs.slide_layouts[6])  # Blank layout

    # Background
    _add_shape_bg(slide, colors["primary"])

    # Accent bar at top
    _add_accent_bar(slide, colors["accent"], Inches(0), Inches(0),
                    Inches(13.333), Inches(0.15))

    # Decorative circle
    circle = slide.shapes.add_shape(MSO_SHAPE.OVAL,
                                     Inches(10.5), Inches(0.8), Inches(2.5), Inches(2.5))
    circle.fill.solid()
    circle.fill.fore_color.rgb = colors["accent"]
    circle.fill.fore_color.brightness = 0.3
    circle.line.fill.background()

    # Title text
    txBox = slide.shapes.add_textbox(Inches(1), Inches(2.2), Inches(9), Inches(2))
    tf = txBox.text_frame
    tf.word_wrap = True
    _set_text(tf, title, font_size=40, color=RGBColor(0xFF, 0xFF, 0xFF), bold=True)

    # Subtitle
    txBox2 = slide.shapes.add_textbox(Inches(1), Inches(4.5), Inches(9), Inches(1.2))
    tf2 = txBox2.text_frame
    tf2.word_wrap = True
    _set_text(tf2, subtitle, font_size=18, color=RGBColor(0xCB, 0xD5, 0xE1))

    # Bottom accent line
    _add_accent_bar(slide, colors["accent"], Inches(1), Inches(4.2),
                    Inches(2), Inches(0.06))

    return slide


def generate_content_slide(prs, slide_data, slide_index, total_slides, colors):
    """生成内容页"""
    slide = prs.slides.add_slide(prs.slide_layouts[6])  # Blank layout

    # White background (default)
    # Left accent bar
    _add_accent_bar(slide, colors["primary"], Inches(0), Inches(0),
                    Inches(0.08), Inches(7.5))

    # Top light background strip
    _add_shape_bg(slide, colors["light"], Inches(0), Inches(0),
                  Inches(13.333), Inches(1.6))

    # Slide number
    txNum = slide.shapes.add_textbox(Inches(11.8), Inches(0.3), Inches(1.2), Inches(0.6))
    tfNum = txNum.text_frame
    _set_text(tfNum, f"{slide_index}/{total_slides}",
              font_size=12, color=RGBColor(0x94, 0xA3, 0xB8), alignment=PP_ALIGN.RIGHT)

    # Title
    txTitle = slide.shapes.add_textbox(Inches(0.8), Inches(0.35), Inches(10.5), Inches(1))
    tfTitle = txTitle.text_frame
    tfTitle.word_wrap = True
    _set_text(tfTitle, slide_data.get("title", ""),
              font_size=28, color=colors["primary"], bold=True)

    # Title underline
    _add_accent_bar(slide, colors["accent"], Inches(0.8), Inches(1.35),
                    Inches(1.5), Inches(0.05))

    # Content bullet points
    content = slide_data.get("content", [])
    if content:
        txContent = slide.shapes.add_textbox(Inches(0.8), Inches(1.8), Inches(11), Inches(4.5))
        tfContent = txContent.text_frame
        tfContent.word_wrap = True
        _add_bullet_points(tfContent, content, font_size=18, color=colors["text"])

    # Notes (speaker notes)
    notes = slide_data.get("notes", "")
    if notes:
        notes_slide = slide.notes_slide
        notes_tf = notes_slide.notes_text_frame
        notes_tf.text = notes

    # Bottom decorative line
    _add_accent_bar(slide, colors["accent"], Inches(0.8), Inches(6.9),
                    Inches(11.7), Inches(0.02))

    return slide


def generate_end_slide(prs, colors):
    """生成结束页"""
    slide = prs.slides.add_slide(prs.slide_layouts[6])

    _add_shape_bg(slide, colors["primary"])
    _add_accent_bar(slide, colors["accent"], Inches(0), Inches(0),
                    Inches(13.333), Inches(0.15))

    # Thank you text
    txBox = slide.shapes.add_textbox(Inches(2), Inches(2.5), Inches(9), Inches(1.5))
    tf = txBox.text_frame
    _set_text(tf, "谢谢", font_size=44,
              color=RGBColor(0xFF, 0xFF, 0xFF), bold=True, alignment=PP_ALIGN.CENTER)

    txBox2 = slide.shapes.add_textbox(Inches(2), Inches(4.2), Inches(9), Inches(1))
    tf2 = txBox2.text_frame
    _set_text(tf2, "THANK YOU", font_size=20,
              color=RGBColor(0xCB, 0xD5, 0xE1), alignment=PP_ALIGN.CENTER)

    return slide


def generate_ppt(slides_data, template_id="blueprint", output_dir=None):
    """
    生成PPT文件

    Args:
        slides_data: dict, 包含 title 和 slides 列表
            {
                "title": "演示标题",
                "slides": [
                    {
                        "slide_number": 1,
                        "title": "页标题",
                        "content": ["要点1", "要点2"],
                        "notes": "备注"
                    }
                ]
            }
        template_id: str, 模板ID
        output_dir: str, 输出目录

    Returns:
        str: 生成的PPT文件路径
    """
    if output_dir is None:
        from config import OUTPUT_DIR
        output_dir = OUTPUT_DIR

    colors = COLOR_SCHEMES.get(template_id, COLOR_SCHEMES["blueprint"])
    title = slides_data.get("title", "演示文稿")
    slides = slides_data.get("slides", [])

    # Create presentation (16:9)
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    # Title slide
    subtitle = f"共 {len(slides)} 页 · AI 自动生成"
    generate_title_slide(prs, title, subtitle, colors)

    # Content slides
    for i, slide_data in enumerate(slides):
        generate_content_slide(prs, slide_data, i + 1, len(slides), colors)

    # End slide
    generate_end_slide(prs, colors)

    # Save
    filename = f"ppt_{uuid.uuid4().hex[:8]}.pptx"
    filepath = os.path.join(output_dir, filename)
    prs.save(filepath)

    return filepath
