#!/bin/bash

# setup-pm2.sh
# Usage: ./setup-pm2.sh <DOMAIN_NAME>
# Example: ./setup-pm2.sh myapp.com

DOMAIN=${1:-ecom.lumen-path.com}

echo "Configuring for domain: $DOMAIN"

echo "--- Updating System ---"
sudo apt update && sudo apt upgrade -y

echo "--- Installing Node.js (v20) ---"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

echo "--- Installing PM2 ---"
sudo npm install -g pm2

echo "--- Installing Nginx ---"
sudo apt install -y nginx

echo "--- Configuring Nginx ---"
# Open Firewall ports for HTTP/HTTPS
if command -v ufw > /dev/null; then
    sudo ufw allow 'Nginx Full'
    sudo ufw allow OpenSSH
    sudo ufw --force enable
fi

# Create Nginx config block
sudo tee /etc/nginx/sites-available/$DOMAIN > /dev/null <<EOL
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL

# Enable site
sudo ln -s /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

echo "--- Installing Certbot (SSL) ---"
sudo apt install -y certbot python3-certbot-nginx

echo "--- Generating SSL Certificate ---"
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN

echo "--- Setup Complete! ---"
echo "1. Upload your code to the server."
echo "2. Run 'npm install && npm run build'."
echo "3. Start app with: 'pm2 start ecosystem.config.js'"
