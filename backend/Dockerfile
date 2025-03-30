FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc default-libmysqlclient-dev pkg-config && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Create necessary directories
RUN mkdir -p /app/app/utils

# Copy the rest of the application
COPY . .

# Create empty __init__.py files in all directories to ensure they're treated as packages
RUN find /app -type d -exec touch {}/__init__.py \; 2>/dev/null || true

# Expose the port
EXPOSE 8000

# Set environment variable to use production config
ENV ENVIRONMENT=development

# For development
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# For production, uncomment this and comment the above CMD
# CMD ["gunicorn", "app.main:app", "-k", "uvicorn.workers.UvicornWorker", "--workers", "4", "--bind", "0.0.0.0:8000"]