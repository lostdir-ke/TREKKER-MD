FROM node:lts-buster

# Install dependencies and tools
RUN apt-get update && \
    apt-get install -y \
    ffmpeg \
    imagemagick \
    webp && \
    apt-get upgrade -y && \
    npm i pm2 -g && \
    rm -rf /var/lib/apt/lists/*

# Clone the repository
RUN git clone https://github.com/Beltah254/BELTAH-MD /root/beltah_Bot

# Set working directory
WORKDIR /root/beltah_Bot/

# Copy package.json and install dependencies
COPY package.json .
RUN npm install pm2 -g
RUN npm install --legacy-peer-deps

# Copy all files
COPY . .

# Expose the port
EXPOSE ${PORT}
EXPOSE $PORT

# Start the application
CMD ["node", "index.js"]
