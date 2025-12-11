#!/bin/bash

# Configuration
# Usage: ./deploy.sh <HOST_IP> [USER] [KEY_PATH]

IP=$1
USER=${2:-ubuntu}
KEY=${3:-/Users/shazej/Downloads/testt.pem}

if [ -z "$IP" ]; then
  echo "❌ Error: Host IP is required."
  echo "Usage: ./deploy.sh <HOST_IP> [USER] [KEY_PATH]"
  echo "Example: ./deploy.sh 123.45.67.89 ubuntu /path/to/key.pem"
  exit 1
fi

echo "🚀 Deploying to $USER@$IP using key $KEY..."

# 1. Connection Check
echo "📡 Checking connection..."
ssh -o StrictHostKeyChecking=no -i "$KEY" "$USER@$IP" "echo '✅ Connection successful'" || {
    echo "❌ Failed to connect. Please check IP, Username, and Key."
    exit 1
}

# 2. Install Docker (if not present)
echo "🐳 Checking Docker installation..."
ssh -i "$KEY" "$USER@$IP" "command -v docker >/dev/null 2>&1 || { 
    echo 'Installing Docker...'; 
    curl -fsSL https://get.docker.com | sh; 
    sudo usermod -aG docker \$USER; 
    echo 'Docker installed.'; 
}"

# 3. Sync Files
echo "📂 Syncing project files..."
# Create directory
ssh -i "$KEY" "$USER@$IP" "mkdir -p ~/studioxo"
# Rsync (excluding heavy/unnecessary folders)
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude '.git' \
    --exclude '.env.local' \
    -e "ssh -i $KEY" \
    . "$USER@$IP:~/studioxo"

# 4. Build & Run
echo "🏗️  Building and Starting Application..."
ssh -i "$KEY" "$USER@$IP" "cd ~/studioxo && docker compose down && docker compose up --build -d"

echo "✅ Deployment successful!"
echo "🌍 App should be live at http://$IP:3000"
