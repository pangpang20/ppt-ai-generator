import json
import os

# ============================================
# 配置文件路径（持久化存储 API 配置）
# ============================================
CONFIG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "settings.json")

def _load_settings():
    """从文件加载配置"""
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}

def save_settings(api_key=None, base_url=None, model=None):
    """保存配置到文件"""
    settings = _load_settings()
    if api_key is not None:
        settings["api_key"] = api_key
    if base_url is not None:
        settings["base_url"] = base_url
    if model is not None:
        settings["model"] = model
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(settings, f, ensure_ascii=False, indent=2)

# 加载已保存的配置
_saved = _load_settings()

# MiMo API Configuration（优先用保存的配置，其次用环境变量，最后用默认值）
MIMO_API_KEY = _saved.get("api_key") or os.environ.get("MIMO_API_KEY", "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")
MIMO_BASE_URL = _saved.get("base_url") or os.environ.get("MIMO_BASE_URL", "https://token-plan-cn.xiaomimimo.com/v1")
MIMO_MODEL = _saved.get("model") or os.environ.get("MIMO_MODEL", "mimo-v2.5-pro")

# Generation parameters
TEMPERATURE = 0.7
MAX_TOKENS = 4096

# Server config
HOST = "0.0.0.0"
PORT = 5000
DEBUG = True

# Output directory
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)
