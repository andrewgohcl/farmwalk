FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies for Pyproj
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Set environment to production
ENV ENVIRONMENT=production

# Expose port
EXPOSE 5000

# Run with gunicorn
CMD exec gunicorn -c gunicorn_config.py app:app
