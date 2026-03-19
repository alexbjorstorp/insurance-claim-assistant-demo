# ── Stage 1: Build React frontend ────────────────────────────────────────────
FROM node:20-slim AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN VITE_DEMO_MODE=true npx vite build

# ── Stage 2: Python backend + built frontend ──────────────────────────────────
FROM python:3.11-slim

WORKDIR /app/backend

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ .

# Copy React build into the location FastAPI serves static files from
COPY --from=frontend-builder /app/frontend/dist ./static

# Railway injects $PORT at runtime; default to 8000 locally
ENV PORT=8000
ENV DEMO_MODE=true
ENV CORS_ORIGINS=*

EXPOSE $PORT

CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT
