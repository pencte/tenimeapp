# Pake Node.js versi 20 (LTS) supaya support fitur 'File'
FROM node:20-slim

# Set folder kerja
WORKDIR /app

# Copy file package.json
COPY package.json ./

# Instal library (Docker gak butuh lockfile)
RUN npm install --production

# Copy semua file kodingan lo
COPY . .

# Set Port ke 8000
EXPOSE 8000

# Jalankan aplikasinya
CMD ["node", "api/index.js"]
