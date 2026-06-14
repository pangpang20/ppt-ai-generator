import os

# MiMo API Configuration
# 修改以下配置来设置你的 MiMo API
MIMO_API_KEY = os.environ.get("MIMO_API_KEY", "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")
MIMO_BASE_URL = os.environ.get("MIMO_BASE_URL", "https://token-plan-cn.xiaomimimo.com/v1")
MIMO_MODEL = os.environ.get("MIMO_MODEL", "mimo-v2.5-pro")

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
