# --- Dockerfile para Backend Flask (Axyntrax API) ---
FROM python:3.10-slim

WORKDIR /app

# Instalar dependencias del sistema necesarias
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copiar requerimientos e instalar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código del backend
COPY . .

# Exponer puertos de API y Webhook
EXPOSE 5001
EXPOSE 5000

# Comando para ejecutar el backend API REST
CMD ["python", "axia_api.py"]
