# Pake Node.js versi 18
FROM node:18-slim

# Set folder kerja
WORKDIR /app

# Copy file package.json dulu
COPY package.json ./

# Instal library secara paksa (tanpa perlu lockfile)
RUN npm install --production

# Copy semua file kodingan lo ke dalam server
COPY . .

# Set Port (Koyeb biasanya pake 8000 atau sesuai settingan)
EXPOSE 8000

# Jalankan aplikasinya
CMD ["node", "api/index.js"]
