FROM python:3.10-slim

WORKDIR /app

# Copy requirements from root
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend ./backend

EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
