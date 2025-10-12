# Use Python base image
FROM python:3.10

# Set working directory
WORKDIR /app

# Copy dependencies
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Set up transformers cache directory
ENV TRANSFORMERS_CACHE=/app/.cache/transformers
ENV HF_HOME=/app/.cache/huggingface
RUN mkdir -p /app/.cache/transformers /app/.cache/huggingface

# Pre-download FinBERT model (optional but recommended - saves startup time)
# This downloads ~400MB model during build, comment out if you prefer runtime download
RUN python -c "from transformers import AutoTokenizer, AutoModelForSequenceClassification; \
    print('Downloading FinBERT model...'); \
    AutoTokenizer.from_pretrained('yiyanghkust/finbert-tone'); \
    AutoModelForSequenceClassification.from_pretrained('yiyanghkust/finbert-tone'); \
    print('FinBERT model downloaded successfully')" || echo "Model download failed, will download at runtime"

# Pre-download sentence-transformers model for pattern analysis
RUN python -c "from sentence_transformers import SentenceTransformer; \
    print('Downloading sentence-transformers model...'); \
    SentenceTransformer('all-MiniLM-L6-v2'); \
    print('Sentence-transformers model downloaded successfully')" || echo "Model download failed, will download at runtime"

# Copy the app code
COPY . .

# Expose port
EXPOSE 8000

# Start FastAPI server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]