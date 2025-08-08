# Use official Python slim image
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for building Python packages
RUN apt-get update && \
    apt-get install -y --no-install-recommends build-essential gcc libc-dev libffi-dev && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy FastAPI app code
COPY app/ ./app/

# Expose Uvicorn port
EXPOSE 8000

# Launch the ASGI server
# Adjust the module path if your FastAPI instance is defined elsewhere:
# e.g. if FastAPI() is in app/app.py, use "uvicorn app.app:app"
RUN ls
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]