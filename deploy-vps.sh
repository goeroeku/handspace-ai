#!/bin/bash

# Deploy script untuk VPS
# Usage: ./deploy-vps.sh [vps-user@vps-host] [vps-path]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
VPS_USER_HOST=${1:-"user@your-vps.com"}
VPS_PATH=${2:-"/var/www/handspace-ai"}
LOCAL_DIST="dist"

echo -e "${GREEN}🚀 Starting deployment to VPS...${NC}\n"

# Check if dist folder exists
if [ ! -d "$LOCAL_DIST" ]; then
    echo -e "${RED}❌ Error: dist/ folder not found!${NC}"
    echo -e "${YELLOW}💡 Run 'npm run build' first to create production files.${NC}\n"
    exit 1
fi

# Build production files if not exists
if [ ! -f "$LOCAL_DIST/index.html" ]; then
    echo -e "${YELLOW}📦 Building production files...${NC}"
    npm run build
    echo -e "${GREEN}✅ Build completed${NC}\n"
fi

# Create logs directory on VPS
echo -e "${YELLOW}📁 Creating directories on VPS...${NC}"
ssh $VPS_USER_HOST "mkdir -p $VPS_PATH/logs"

# Copy files to VPS
echo -e "${YELLOW}📤 Uploading files to VPS...${NC}"
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '*.log' \
    $LOCAL_DIST/ $VPS_USER_HOST:$VPS_PATH/

# Copy ecosystem.config.js and package.json to VPS
echo -e "${YELLOW}📤 Uploading config files...${NC}"
scp ecosystem.config.js package.json $VPS_USER_HOST:$VPS_PATH/

# Install dependencies and restart PM2 on VPS
echo -e "${YELLOW}🔧 Setting up on VPS...${NC}"
ssh $VPS_USER_HOST << EOF
    cd $VPS_PATH
    
    # http-server is already in devDependencies, no need to install globally
    
    # Install PM2 if not exists
    if ! command -v pm2 &> /dev/null; then
        echo "Installing PM2 globally..."
        npm install -g pm2
    fi
    
    # Stop existing PM2 process if running
    pm2 stop handspace-ai 2>/dev/null || true
    pm2 delete handspace-ai 2>/dev/null || true
    
    # Start with PM2
    pm2 start ecosystem.config.js
    pm2 save
    
    echo "PM2 process started!"
    pm2 list
EOF

echo -e "\n${GREEN}✅ Deployment completed successfully!${NC}\n"
echo -e "${GREEN}📋 Useful commands:${NC}"
echo -e "  View logs:     ssh $VPS_USER_HOST 'cd $VPS_PATH && pm2 logs handspace-ai'"
echo -e "  Restart:       ssh $VPS_USER_HOST 'cd $VPS_PATH && pm2 restart handspace-ai'"
echo -e "  Stop:          ssh $VPS_USER_HOST 'cd $VPS_PATH && pm2 stop handspace-ai'"
echo -e "  Status:        ssh $VPS_USER_HOST 'cd $VPS_PATH && pm2 status'"
echo -e "\n"

