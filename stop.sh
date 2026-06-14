#!/bin/bash
# PPT AI Generator - 停止脚本

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PID_FILE="$SCRIPT_DIR/.app.pid"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  PPT AI Generator - 停止${NC}"
echo -e "${CYAN}========================================${NC}"

if [ ! -f "$PID_FILE" ]; then
    echo -e "${YELLOW}⚠ 未找到 PID 文件，尝试查找进程...${NC}"
    PIDS=$(pgrep -f "python3 app.py" 2>/dev/null || true)
    if [ -z "$PIDS" ]; then
        echo -e "${YELLOW}没有找到运行中的服务${NC}"
        exit 0
    fi
    echo -e "找到以下进程: $PIDS"
    for PID in $PIDS; do
        kill "$PID" 2>/dev/null && echo -e "${GREEN}已停止 PID: $PID${NC}"
    done
    exit 0
fi

PID=$(cat "$PID_FILE")

if kill -0 "$PID" 2>/dev/null; then
    echo -e "正在停止服务 (PID: $PID)..."
    kill "$PID"

    # 等待进程退出
    for i in $(seq 1 10); do
        if ! kill -0 "$PID" 2>/dev/null; then
            break
        fi
        sleep 1
    done

    # 强制杀死
    if kill -0 "$PID" 2>/dev/null; then
        echo -e "${YELLOW}进程未响应，强制终止...${NC}"
        kill -9 "$PID" 2>/dev/null
    fi

    rm -f "$PID_FILE"
    echo -e "${GREEN}✅ 服务已停止${NC}"
else
    echo -e "${YELLOW}进程已不存在，清理 PID 文件${NC}"
    rm -f "$PID_FILE"
fi
