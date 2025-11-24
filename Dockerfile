FROM python:3.10-alpine

LABEL maintainer="Mission Control"
LABEL description="Antigravity Engine v1.0"

WORKDIR /app

# Hardening: Install curl for healthchecks
RUN apk add --no-cache curl gcc python3-dev musl-dev linux-headers

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "engine.gateway:app", "--host", "0.0.0.0", "--port", "8000"]
