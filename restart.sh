#!/bin/bash
# PPT AI Generator - 重启脚本

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  PPT AI Generator - 重启${NC}"
echo -e "${CYAN}========================================${NC}"

"$SCRIPT_DIR/stop.sh"
sleep 1
"$SCRIPT_DIR/start.sh"
