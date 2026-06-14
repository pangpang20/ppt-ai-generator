#!/bin/bash
# PPT AI Generator - 启动脚本

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# 默认配置
HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-5000}"
PID_FILE="$SCRIPT_DIR/.app.pid"

# 日志目录：优先用项目下的 logs/，不可写则用 /tmp
if [ -w "$SCRIPT_DIR/logs" ] 2>/dev/null; then
    LOG_DIR="$SCRIPT_DIR/logs"
else
    LOG_DIR="/tmp/ppt_gen_logs"
    mkdir -p "$LOG_DIR"
fi
LOG_FILE="$LOG_DIR/app.log"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  PPT AI Generator - 启动${NC}"
echo -e "${CYAN}========================================${NC}"

# 检查是否已在运行
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if kill -0 "$OLD_PID" 2>/dev/null; then
        echo -e "${YELLOW}⚠ 服务已在运行中 (PID: $OLD_PID)${NC}"
        echo -e "${YELLOW}  如需重启，请先执行 ./stop.sh${NC}"
        exit 1
    else
        rm -f "$PID_FILE"
    fi
fi

# 创建日志目录
mkdir -p "$SCRIPT_DIR/logs"
mkdir -p "$SCRIPT_DIR/output"

# 自动查找 python-pptx 安装路径并加入 PYTHONPATH（匹配当前 Python 版本）
PY_VER=$(/usr/bin/python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
PPTX_PATH=$(find /home -name "pptx" -type d -path "*/python${PY_VER}/site-packages/pptx" 2>/dev/null | head -1)
if [ -n "$PPTX_PATH" ]; then
    export PYTHONPATH="$(dirname "$PPTX_PATH"):$PYTHONPATH"
    echo -e "  python-pptx: ${PPTX_PATH}"
fi

# 检查依赖
if ! /usr/bin/python3 -c "import flask" 2>/dev/null; then
    echo -e "${YELLOW}正在安装依赖...${NC}"
    /usr/bin/python3 -m pip install -r requirements.txt
fi

# 启动服务
echo -e "${GREEN}启动服务...${NC}"
echo -e "  地址: http://${HOST}:${PORT}"
echo -e "  日志: ${LOG_FILE}"
echo ""

nohup /usr/bin/python3 app.py > "$LOG_FILE" 2>&1 &
PID=$!
echo "$PID" > "$PID_FILE"

# 等待启动
sleep 2
if kill -0 "$PID" 2>/dev/null; then
    echo -e "${GREEN}✅ 服务启动成功 (PID: $PID)${NC}"
    echo -e "${GREEN}   访问: http://localhost:${PORT}${NC}"
else
    echo -e "${RED}❌ 服务启动失败，请查看日志:${NC}"
    echo -e "${RED}   tail -20 ${LOG_FILE}${NC}"
    rm -f "$PID_FILE"
    exit 1
fi
