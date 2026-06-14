# 6 PPT Generation Templates

# 通用的 JSON 格式说明（所有模板共用）
_JSON_FORMAT = (
    '请严格按以下JSON格式输出，不要输出其他内容：\n'
    '{{\n'
    '  "title": "演示文稿主标题",\n'
    '  "slides": [\n'
    '    {{\n'
    '      "slide_number": 1,\n'
    '      "title": "幻灯片标题",\n'
    '      "content": [\n'
    '        "核心观点或结论（一句话概括）",\n'
    '        "具体说明：展开描述关键信息、数据或案例",\n'
    '        "具体说明：补充细节、背景或方法论",\n'
    '        "具体说明：提供实例、数据支撑或对比分析",\n'
    '        "具体说明：阐述影响、价值或应用场景",\n'
    '        "行动建议或关键结论"\n'
    '      ],\n'
    '      "notes": "演讲者备注：详细说明本页的讲解要点、过渡语和需要强调的内容"\n'
    '    }}\n'
    '  ]\n'
    '}}'
)

# 通用的内容要求说明
_CONTENT_REQUIREMENT = (
    "内容要求：\n"
    "1. 每页必须包含 5-8 个要点，内容要详实丰富\n"
    "2. 每个要点要具体，包含数据、案例、方法或细节，不能只是空泛的标题\n"
    "3. 第1个要点是核心结论，后续要点展开说明\n"
    "4. 每条要点控制在 15-50 个字，要有信息量\n"
    "5. 演讲者备注要详细（50-100字），包含讲解思路和过渡语\n"
    "6. 总共生成 6-10 页幻灯片\n"
)

TEMPLATES = [
    {
        "id": "blueprint",
        "name_zh": "演示文稿蓝图",
        "name_en": "Presentation Blueprint",
        "icon": "blueprint",
        "description": "创建演示蓝图：明确目标、受众、核心信息、幻灯片流程及页数规划。",
        "system_prompt": (
            "你是一名专业的演示文稿顾问，擅长为复杂主题创建结构化的演示蓝图。"
            "你的内容要详实、有深度，每个要点都要包含具体的信息和细节，不能泛泛而谈。"
            "你需要输出严格格式的JSON。"
        ),
        "user_prompt_template": (
            "请针对主题「{topic}」创建一份详细的演示蓝图。\n"
            "受众：{audience}\n"
            "要求：明确演示目标、受众画像、核心信息、幻灯片流程以及页数规划。"
            "整体结构应逻辑清晰、具有吸引力，并保持专业性。"
            "内容要深入、具体，包含实际可操作的建议和数据支撑。\n"
            "{extra}\n"
            + _CONTENT_REQUIREMENT + "\n" + _JSON_FORMAT
        ),
    },
    {
        "id": "structure",
        "name_zh": "结构与流程架构设计",
        "name_en": "Structure and Flow Architect",
        "icon": "structure",
        "description": "逐页设计演示结构，确保从开篇到结尾自然流畅地展开。",
        "system_prompt": (
            "你是一名演示文稿结构设计师，擅长设计逻辑严密、层次分明的演示结构。"
            "每页内容要丰富详实，包含具体的论点、论据和案例。"
        ),
        "user_prompt_template": (
            "请为「{topic}」设计一份详细的逐页演示结构。\n"
            "受众：{audience}\n"
            "要求：针对每一页幻灯片，编写清晰的标题和详实的内容要点，"
            "确保整个演示从开篇到结尾能够自然流畅地展开。"
            "每页要有明确的展示目的，内容包含具体数据、案例和分析。\n"
            "{extra}\n"
            + _CONTENT_REQUIREMENT + "\n" + _JSON_FORMAT
        ),
    },
    {
        "id": "storytelling",
        "name_zh": "基于故事线的演示设计",
        "name_en": "Storytelling-Based Presentation",
        "icon": "story",
        "description": "将主题转化为具有叙事结构的演示文稿：引入、问题、洞察、解决方案、总结。",
        "system_prompt": (
            "你是一名演示文稿叙事专家，擅长用讲故事的方式组织演示内容。"
            "你需要按照「引入→问题→洞察→解决方案→总结」的结构，让内容有感染力。"
            "每个要点要有具体的案例、数据或场景描述。"
        ),
        "user_prompt_template": (
            "请将「{topic}」转化为一份具有清晰叙事结构的演示文稿。\n"
            "受众：{audience}\n"
            "要求：按照引入/吸引点、问题、洞察、解决方案、总结的结构，"
            "在保持专业性的同时，用生动的案例和数据让内容更具吸引力和感染力。\n"
            "{extra}\n"
            + _CONTENT_REQUIREMENT + "\n" + _JSON_FORMAT
        ),
    },
    {
        "id": "visual",
        "name_zh": "视觉方向与设计指导",
        "name_en": "Visual Direction and Design",
        "icon": "visual",
        "description": "为每页提供专业的视觉设计指导，推荐版式布局、图表和视觉元素。",
        "system_prompt": (
            "你是一名演示文稿视觉设计顾问，擅长将信息转化为视觉化的表达。"
            "你需要在内容中包含视觉设计建议（如图表类型、布局方式等）。"
            "内容要详实，包含具体的数据和案例。"
        ),
        "user_prompt_template": (
            "请为关于「{topic}」的演示文稿生成详细内容，并为每一页提供视觉设计指导。\n"
            "受众：{audience}\n"
            "要求：推荐合适的版式布局、图表、架构图、图标以及视觉元素，"
            "以提升信息表达清晰度，并打造简洁、现代化的视觉风格。"
            "内容要包含具体数据和案例。\n"
            "{extra}\n"
            + _CONTENT_REQUIREMENT + "\n" + _JSON_FORMAT
        ),
    },
    {
        "id": "content",
        "name_zh": "逐页内容生成器",
        "name_en": "Slide Content Generator",
        "icon": "content",
        "description": "为每一页生成完整的展示内容，编写简洁、适合直接展示的要点。",
        "system_prompt": (
            "你是一名专业的演示文稿内容撰写专家，擅长将复杂信息转化为清晰的演示要点。"
            "你的内容要详实丰富，每个要点都要有具体的信息量，不能只是空泛的标题。"
            "包含数据、案例、方法和细节。"
        ),
        "user_prompt_template": (
            "请为关于「{topic}」的演示文稿生成每一页的详细内容。\n"
            "受众：{audience}\n"
            "要求：编写详实、有深度的要点，包含具体数据、案例和分析，"
            "确保内容表达清晰、专业，有说服力。\n"
            "{extra}\n"
            + _CONTENT_REQUIREMENT + "\n" + _JSON_FORMAT
        ),
    },
    {
        "id": "clarity",
        "name_zh": "清晰化与简化编辑器",
        "name_en": "Clarity and Simplification Editor",
        "icon": "clarity",
        "description": "审阅并改写内容，减少文字量，强化核心观点，确保每页只传递一个明确信息。",
        "system_prompt": (
            "你是一名演示文稿内容优化专家，擅长将复杂内容提炼为清晰有力的演示要点。"
            "你需要精简文字但保留关键信息，每页围绕一个核心观点展开。"
            "要点要精炼但有信息量。"
        ),
        "user_prompt_template": (
            "请审阅以下演示文稿内容，并重新改写使其更适合用于幻灯片展示。\n"
            "主题：{topic}\n"
            "受众：{audience}\n"
            "原始内容：{extra}\n"
            "要求：精简文字但保留核心信息，强化关键观点，"
            "确保每页围绕一个明确信息展开，内容要具体有深度。\n"
            + _CONTENT_REQUIREMENT + "\n" + _JSON_FORMAT
        ),
    },
]

def get_template_by_id(template_id):
    """根据ID获取模板"""
    for t in TEMPLATES:
        if t["id"] == template_id:
            return t
    return None
