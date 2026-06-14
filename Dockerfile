FROM python:3.11-slim

LABEL maintainer="PPT AI Generator"
LABEL description="基于 MiMo AI 的 PPT 生成器"

# 设置工作目录
WORKDIR /app

# 安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY app.py config.py ppt_generator.py templates_config.py ./
COPY static/ ./static/
COPY templates/ ./templates/

# 创建输出和日志目录
RUN mkdir -p /app/output /app/logs

# 环境变量（可通过 docker run -e 覆盖）
ENV MIMO_API_KEY=""
ENV MIMO_BASE_URL="https://api.mimo.ai/v1"
ENV MIMO_MODEL="mimo-v2.5-pro"
ENV HOST="0.0.0.0"
ENV PORT="5000"

# 暴露端口
EXPOSE 5000

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD curl -f http://localhost:5000/api/templates || exit 1

# 启动命令
CMD ["python3", "app.py"]
