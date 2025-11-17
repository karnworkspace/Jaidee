# Use Node.js LTS version (Debian-based for Puppeteer compatibility)
FROM --platform=linux/amd64 node:18-slim

# Install dependencies for Puppeteer/Chrome and Thai fonts
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    fonts-thai-tlwg \
    fonts-noto-cjk \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including Puppeteer with Chromium)
RUN npm ci --only=production

# Copy source code
COPY . .

# Create directory for SQLite database
RUN mkdir -p /app/data

# Don't skip Chromium download - let Puppeteer install it
# Remove any executable path override to use Puppeteer's bundled Chromium

# Expose port
EXPOSE 3001

# Start the application
CMD ["node", "index.js"]
