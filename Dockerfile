# --- Build frontend ---
FROM node:18 AS frontend
WORKDIR /app/frontend
COPY frontend/ ./
RUN npm install && npm run build

# --- Backend with Python ---
FROM python:3.11-slim AS backend
WORKDIR /app

# Copy backend source
COPY backend/ ./backend/

# Copy built frontend into backend (to serve static files)
COPY --from=frontend /app/frontend/dist ./frontend/dist

# Install dependencies
RUN pip install --no-cache-dir -r backend/requirements.txt uvicorn

# Expose FastAPI port
EXPOSE 8080

# Start FastAPI server
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]
