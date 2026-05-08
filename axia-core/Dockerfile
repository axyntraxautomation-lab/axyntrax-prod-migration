# --- Dockerfile para Frontend React-Vite (Axyntrax Core) ---
FROM node:18-alpine

WORKDIR /app

# Copiar configuración de dependencias de node
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el código del frontend
COPY . .

# Exponer el puerto por defecto de Vite
EXPOSE 5173

# Arrancar el servidor de desarrollo de Vite
CMD ["npm", "run", "dev", "--", "--host"]
