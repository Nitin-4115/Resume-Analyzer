# Use an official lightweight Python image
FROM python:3.10-slim

# Set work directory
WORKDIR /app

# Copy requirements file
COPY backend/requirements.txt ./requirements.txt

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend ./backend

# Expose port
EXPOSE 8000

# Start FastAPI with Uvicorn
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
