FROM node:20-alpine

# Set Port untuk Hugging Face Spaces
ENV PORT=7860

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy seluruh source code
COPY . .

# Build TypeScript menjadi JavaScript (production ready)
RUN npm run build

# Memberikan hak akses folder /app ke user 'node'
RUN chown -R node:node /app

# Berpindah ke user 'node' (UID 1000) - DIWAJIBKAN oleh Hugging Face Spaces
USER node

EXPOSE 7860

# Jalankan kode hasil build
CMD ["npm", "start"]