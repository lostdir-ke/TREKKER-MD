FROM node:lts-buster

# Install dependencies and PM2
RUN apt-get update && \
  apt-get install -y ffmpeg imagemagick webp && \
  npm i pm2 -g && \
  rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json .
RUN npm install --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# Expose the port (Vercel uses port 3000 by default)
ENV PORT=3000
EXPOSE 3000

# Start the application with PM2
CMD ["pm2-runtime", "index.js", "--name", "beltah-web", "--max-memory-restart", "490M"]
