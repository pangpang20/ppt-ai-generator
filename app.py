"""
PPT AI Generator - Flask Backend
基于小米 MiMo AI 的 PPT 生成器
"""
import json
import logging
import os
import re
import sys
import traceback

import requests
from flask import Flask, jsonify, render_template, request, send_file

from config import OUTPUT_DIR
from ppt_generator import generate_ppt
from templates_config import TEMPLATES, get_template_by_id

# ============================================
# Logging 配置
# ============================================
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger("ppt_gen")

app = Flask(__name__)


def call_mimo_ai(system_prompt, user_prompt):
    """
    调用 MiMo API 生成内容
    """
    import config

    url = f"{config.MIMO_BASE_URL}/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {config.MIMO_API_KEY}",
    }
    payload = {
        "model": config.MIMO_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": config.TEMPERATURE,
        "max_tokens": config.MAX_TOKENS,
    }

    logger.info("=" * 60)
    logger.info("调用 MiMo API")
    logger.info(f"  URL: {url}")
    logger.info(f"  Model: {config.MIMO_MODEL}")
    logger.info(f"  API Key: {config.MIMO_API_KEY[:10]}...{config.MIMO_API_KEY[-4:]}" if len(config.MIMO_API_KEY) > 14 else f"  API Key: {config.MIMO_API_KEY}")
    logger.info(f"  System Prompt 长度: {len(system_prompt)} 字符")
    logger.info(f"  User Prompt 长度: {len(user_prompt)} 字符")
    logger.debug(f"  User Prompt 内容:\n{user_prompt[:500]}...")

    try:
        logger.info("发送请求中...")
        resp = requests.post(url, headers=headers, json=payload, timeout=120)
        logger.info(f"  响应状态码: {resp.status_code}")

        # 记录响应内容（用于调试）
        resp_text = resp.text[:2000]
        logger.debug(f"  响应内容: {resp_text}")

        if resp.status_code != 200:
            logger.error(f"  API 返回非200: {resp.status_code}")
            logger.error(f"  响应体: {resp.text}")
            resp.raise_for_status()

        data = resp.json()
        logger.info(f"  响应JSON keys: {list(data.keys())}")

        # Extract content from response
        if "choices" not in data:
            logger.error(f"  响应中没有 'choices' 字段: {json.dumps(data, ensure_ascii=False)[:500]}")
            raise ValueError(f"API 响应格式错误，缺少 'choices' 字段")

        content = data["choices"][0]["message"]["content"]
        logger.info(f"  AI 返回内容长度: {len(content)} 字符")
        logger.debug(f"  AI 返回内容:\n{content[:1000]}")

        result = parse_ai_response(content)
        logger.info(f"  解析结果: {len(result.get('slides', []))} 页幻灯片")
        logger.info("=" * 60)
        return result

    except requests.exceptions.Timeout:
        logger.error("  请求超时 (120秒)")
        raise
    except requests.exceptions.ConnectionError as e:
        logger.error(f"  连接失败: {e}")
        raise
    except requests.exceptions.HTTPError as e:
        logger.error(f"  HTTP 错误: {e}")
        if e.response is not None:
            logger.error(f"  响应状态码: {e.response.status_code}")
            logger.error(f"  响应内容: {e.response.text[:1000]}")
        raise
    except Exception as e:
        logger.error(f"  未知错误: {e}")
        logger.error(traceback.format_exc())
        raise


def parse_ai_response(content):
    """
    解析AI返回的内容，提取JSON数据
    """
    content = content.strip()
    logger.debug(f"解析 AI 响应，长度: {len(content)}")

    # Remove markdown code block if present
    if content.startswith("```"):
        content = re.sub(r"^```(?:json)?\s*\n?", "", content)
        content = re.sub(r"\n?```\s*$", "", content)
        content = content.strip()

    # Try to find JSON object in the content
    json_match = re.search(r'\{[\s\S]*\}', content)
    if json_match:
        try:
            data = json.loads(json_match.group())
            if "title" in data and "slides" in data:
                logger.info(f"  JSON 解析成功: 标题='{data['title']}', {len(data['slides'])} 页")
                return data
        except json.JSONDecodeError as e:
            logger.warning(f"  JSON 解析失败: {e}")

    # Fallback: parse manually
    logger.info("  使用后备解析方案")
    return fallback_parse(content)


def fallback_parse(content):
    """
    当JSON解析失败时的后备解析方案
    """
    lines = content.strip().split("\n")
    title = "演示文稿"
    slides = []
    current_slide = None

    for line in lines:
        line = line.strip()
        if not line:
            continue

        if line.startswith("# ") or line.startswith("标题：") or line.startswith("主题："):
            title = line.lstrip("# ").replace("标题：", "").replace("主题：", "").strip()
            continue

        slide_match = re.match(
            r'^(?:第\s*(\d+)\s*页|Slide\s*(\d+)|(\d+)[\.、]|\#\#\s*(\d+))',
            line
        )
        if slide_match:
            if current_slide:
                slides.append(current_slide)
            slide_title = re.sub(
                r'^(?:第\s*\d+\s*页[:：]?\s*|Slide\s*\d+[:：]?\s*|\d+[\.、]\s*|\#\#\s*\d+[:：]?\s*)',
                '', line
            ).strip()
            current_slide = {
                "slide_number": len(slides) + 1,
                "title": slide_title or f"第 {len(slides) + 1} 页",
                "content": [],
                "notes": "",
            }
            continue

        if line.startswith(("- ", "• ", "● ", "* ", "· ")):
            point = line.lstrip("-•●*· ").strip()
            if current_slide:
                current_slide["content"].append(point)
            continue

        num_match = re.match(r'^(\d+)[\.、]\s*(.+)', line)
        if num_match:
            if current_slide:
                current_slide["content"].append(num_match.group(2).strip())
            continue

        if current_slide and len(line) > 2:
            if len(current_slide["content"]) == 0 and len(line) < 50:
                current_slide["title"] = line
            else:
                current_slide["content"].append(line)

    if current_slide:
        slides.append(current_slide)

    if not slides:
        slides = [
            {
                "slide_number": 1,
                "title": "概述",
                "content": [content[:100] + "..." if len(content) > 100 else content],
                "notes": "",
            }
        ]

    return {"title": title, "slides": slides}


@app.route("/")
def index():
    """主页"""
    return render_template("index.html")


@app.route("/api/templates", methods=["GET"])
def get_templates():
    """获取所有模板列表"""
    template_list = []
    for t in TEMPLATES:
        template_list.append({
            "id": t["id"],
            "name_zh": t["name_zh"],
            "name_en": t["name_en"],
            "icon": t["icon"],
            "description": t["description"],
        })
    return jsonify({"success": True, "templates": template_list})


@app.route("/api/config", methods=["POST"])
def update_config():
    """运行时更新 API 配置"""
    import config
    body = request.get_json()
    if not body:
        return jsonify({"success": False, "error": "无效数据"}), 400

    old_key = config.MIMO_API_KEY[:10] + "..." if len(config.MIMO_API_KEY) > 10 else config.MIMO_API_KEY
    old_url = config.MIMO_BASE_URL
    old_model = config.MIMO_MODEL

    if "api_key" in body:
        config.MIMO_API_KEY = body["api_key"]
    if "base_url" in body:
        config.MIMO_BASE_URL = body["base_url"].rstrip("/")
    if "model" in body:
        config.MIMO_MODEL = body["model"]

    # 持久化保存到文件
    config.save_settings(
        api_key=config.MIMO_API_KEY,
        base_url=config.MIMO_BASE_URL,
        model=config.MIMO_MODEL,
    )

    new_key = config.MIMO_API_KEY[:10] + "..." if len(config.MIMO_API_KEY) > 10 else config.MIMO_API_KEY
    logger.info(f"配置更新（已持久化）:")
    logger.info(f"  API Key: {old_key} -> {new_key}")
    logger.info(f"  Base URL: {old_url} -> {config.MIMO_BASE_URL}")
    logger.info(f"  Model: {old_model} -> {config.MIMO_MODEL}")

    return jsonify({"success": True, "message": "配置已保存"})


@app.route("/api/test-connection", methods=["POST"])
def test_connection():
    """
    测试 MiMo API 连接
    发送一条简单的请求验证 API Key、URL、Model 是否正确
    """
    import config

    logger.info("=" * 60)
    logger.info("[测试连接] 开始")
    logger.info("=" * 60)

    url = f"{config.MIMO_BASE_URL}/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {config.MIMO_API_KEY}",
    }
    payload = {
        "model": config.MIMO_MODEL,
        "messages": [{"role": "user", "content": "你好，请回复OK"}],
        "max_tokens": 10,
    }

    # 脱敏后的 key 用于日志
    masked_key = config.MIMO_API_KEY[:10] + "..." + config.MIMO_API_KEY[-4:] if len(config.MIMO_API_KEY) > 14 else "***"

    logger.debug(f"[测试连接] 请求详情:")
    logger.debug(f"  URL: {url}")
    logger.debug(f"  Method: POST")
    logger.debug(f"  Headers: {{'Content-Type': 'application/json', 'Authorization': 'Bearer {masked_key}'}}")
    logger.debug(f"  Payload: {json.dumps(payload, ensure_ascii=False)}")
    logger.info(f"[测试连接] API Key: {masked_key}")
    logger.info(f"[测试连接] Base URL: {config.MIMO_BASE_URL}")
    logger.info(f"[测试连接] Model: {config.MIMO_MODEL}")

    try:
        logger.info(f"[测试连接] 正在发送请求到 {url} ...")
        resp = requests.post(url, headers=headers, json=payload, timeout=30)

        logger.info(f"[测试连接] 收到响应")
        logger.info(f"  状态码: {resp.status_code}")
        logger.debug(f"  响应 Headers: {dict(resp.headers)}")
        logger.debug(f"  响应 Body: {resp.text[:1000]}")

        if resp.status_code == 200:
            data = resp.json()
            logger.debug(f"[测试连接] 响应 JSON: {json.dumps(data, ensure_ascii=False, indent=2)[:1000]}")

            reply = ""
            if "choices" in data and len(data["choices"]) > 0:
                reply = data["choices"][0].get("message", {}).get("content", "")

            logger.info(f"[测试连接] ✅ 连接成功!")
            logger.info(f"  AI 回复: {reply[:100]}")
            logger.info(f"  模型: {config.MIMO_MODEL}")
            logger.info("=" * 60)

            return jsonify({
                "success": True,
                "message": f"连接成功！模型: {config.MIMO_MODEL}",
                "reply": reply[:100],
            })
        else:
            error_msg = resp.text[:500]
            logger.warning(f"[测试连接] ❌ 连接失败: HTTP {resp.status_code}")
            logger.warning(f"  错误响应: {error_msg}")

            # 尝试解析错误信息
            try:
                err_data = resp.json()
                logger.debug(f"  错误 JSON: {json.dumps(err_data, ensure_ascii=False, indent=2)}")
                if "error" in err_data:
                    err_obj = err_data["error"]
                    if isinstance(err_obj, dict):
                        error_msg = err_obj.get("message", error_msg)
                    else:
                        error_msg = str(err_obj)
            except Exception:
                pass

            logger.info("=" * 60)
            return jsonify({
                "success": False,
                "error": f"HTTP {resp.status_code}: {error_msg[:200]}",
            })

    except requests.exceptions.Timeout:
        logger.error(f"[测试连接] ❌ 连接超时 (30秒)")
        logger.error(f"  URL: {url}")
        logger.error(f"  可能原因: API 地址不可达、网络延迟过高")
        logger.info("=" * 60)
        return jsonify({"success": False, "error": "连接超时（30秒），请检查网络或 API 地址"})
    except requests.exceptions.ConnectionError as e:
        logger.error(f"[测试连接] ❌ 连接失败")
        logger.error(f"  URL: {url}")
        logger.error(f"  错误详情: {e}")
        logger.error(f"  可能原因: API 地址错误、DNS 解析失败、服务器拒绝连接")
        logger.info("=" * 60)
        return jsonify({"success": False, "error": f"无法连接到服务器，请检查 API 地址是否正确"})
    except Exception as e:
        logger.error(f"[测试连接] ❌ 未知错误: {type(e).__name__}: {e}")
        logger.error(traceback.format_exc())
        logger.info("=" * 60)
        return jsonify({"success": False, "error": f"测试失败: {str(e)}"})


@app.route("/api/generate", methods=["POST"])
def generate():
    """
    生成PPT
    """
    logger.info("=" * 60)
    logger.info("收到生成请求")

    try:
        body = request.get_json()
        if not body:
            logger.warning("请求体为空")
            return jsonify({"success": False, "error": "请提供请求数据"}), 400

        template_id = body.get("template_id", "")
        topic = body.get("topic", "")
        audience = body.get("audience", "通用受众")
        extra = body.get("extra_instructions", "")

        logger.info(f"  模板: {template_id}")
        logger.info(f"  主题: {topic}")
        logger.info(f"  受众: {audience}")
        logger.info(f"  额外要求: {extra}")

        if not template_id:
            logger.warning("未选择模板")
            return jsonify({"success": False, "error": "请选择模板"}), 400
        if not topic:
            logger.warning("未输入主题")
            return jsonify({"success": False, "error": "请输入主题"}), 400

        template = get_template_by_id(template_id)
        if not template:
            logger.warning(f"无效的模板ID: {template_id}")
            return jsonify({"success": False, "error": "无效的模板ID"}), 400

        # Build prompts
        system_prompt = template["system_prompt"]
        extra_text = f"额外要求：{extra}" if extra else ""
        user_prompt = template["user_prompt_template"].format(
            topic=topic,
            audience=audience,
            extra=extra_text,
        )

        logger.info("开始调用 AI...")
        # Call MiMo AI
        slides_data = call_mimo_ai(system_prompt, user_prompt)

        logger.info("开始生成 PPT 文件...")
        # Generate PPT file
        ppt_path = generate_ppt(slides_data, template_id)
        filename = os.path.basename(ppt_path)
        logger.info(f"  PPT 文件: {filename}")

        result = {
            "success": True,
            "data": {
                "title": slides_data.get("title", topic),
                "slides": slides_data.get("slides", []),
                "download_url": f"/api/download/{filename}",
            },
        }
        logger.info("生成完成，返回结果")
        logger.info("=" * 60)
        return jsonify(result)

    except requests.exceptions.Timeout:
        logger.error("AI 服务响应超时")
        return jsonify({"success": False, "error": "AI 服务响应超时，请稍后重试"}), 504
    except requests.exceptions.ConnectionError as e:
        logger.error(f"无法连接到 AI 服务: {e}")
        return jsonify({"success": False, "error": "无法连接到 AI 服务，请检查配置"}), 502
    except requests.exceptions.HTTPError as e:
        status = e.response.status_code if e.response else 500
        resp_text = e.response.text[:500] if e.response else "无响应"
        logger.error(f"AI 服务 HTTP 错误: {status}")
        logger.error(f"  响应: {resp_text}")
        return jsonify({"success": False, "error": f"AI 服务错误: {status} - {resp_text}"}), 502
    except ValueError as e:
        logger.error(f"数据解析错误: {e}")
        return jsonify({"success": False, "error": f"数据解析错误: {str(e)}"}), 502
    except Exception as e:
        logger.error(f"生成失败: {e}")
        logger.error(traceback.format_exc())
        return jsonify({"success": False, "error": f"生成失败: {str(e)}"}), 500


@app.route("/api/preview", methods=["POST"])
def preview():
    """
    仅生成预览（不调用AI，不生成PPT），用于测试前端展示
    """
    body = request.get_json()
    slides_data = body.get("slides_data", {})
    return jsonify({"success": True, "data": slides_data})


@app.route("/api/download/<filename>", methods=["GET"])
def download(filename):
    """下载生成的PPT文件"""
    logger.info(f"[下载] 请求文件: {filename}")

    if not filename.endswith(".pptx") or ".." in filename or "/" in filename:
        logger.warning(f"[下载] 无效的文件名: {filename}")
        return jsonify({"success": False, "error": "无效的文件名"}), 400

    filepath = os.path.join(OUTPUT_DIR, filename)
    logger.debug(f"[下载] 文件路径: {filepath}")
    logger.debug(f"[下载] 文件存在: {os.path.exists(filepath)}")

    if not os.path.exists(filepath):
        logger.warning(f"[下载] 文件不存在: {filepath}")
        return jsonify({"success": False, "error": "文件不存在"}), 404

    try:
        logger.info(f"[下载] 开始发送文件: {filename}")
        return send_file(
            filepath,
            as_attachment=True,
            attachment_filename=filename,
            mimetype="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        )
    except Exception as e:
        logger.error(f"[下载] 发送文件失败: {e}")
        logger.error(traceback.format_exc())
        return jsonify({"success": False, "error": f"下载失败: {str(e)}"}), 500


if __name__ == "__main__":
    import config
    logger.info("=" * 60)
    logger.info("PPT AI Generator 启动中...")
    logger.info(f"  地址: http://{config.HOST}:{config.PORT}")
    logger.info(f"  MiMo API: {config.MIMO_BASE_URL}")
    logger.info(f"  模型: {config.MIMO_MODEL}")
    logger.info(f"  API Key: {config.MIMO_API_KEY[:10]}..." if len(config.MIMO_API_KEY) > 10 else f"  API Key: {config.MIMO_API_KEY}")
    logger.info("=" * 60)
    app.run(host=config.HOST, port=config.PORT, debug=config.DEBUG)
