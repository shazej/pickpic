#!/bin/bash
# debug-server.sh

echo "=== 1. Checking System Services ==="
echo "--- Nginx Status ---"
sudo systemctl status nginx --no-pager | grep Active
echo "--- PM2 Status ---"
pm2 status

echo -e "\n=== 2. Checking Listening Ports ==="
# Check if anything is listening on 80, 443, and 3000
sudo netstat -plnt | grep -E '(:80|:443|:3000)'

echo -e "\n=== 3. Checking Firewall (UFW) ==="
if command -v ufw > /dev/null; then
    sudo ufw status verbose
else
    echo "UFW not installed."
fi

echo -e "\n=== 4. Testing Local Connectivity ==="
echo "--- Curl Localhost:3000 (App) ---"
curl -I http://localhost:3000
echo -e "\n--- Curl Localhost:80 (Nginx HTTP) ---"
curl -I http://localhost:80

echo -e "\n=== DIAGNOSIS HINTS ==="
echo "1. If Nginx is NOT active -> 'sudo systemctl start nginx'"
echo "2. If nothing on :3000 -> 'pm2 start ecosystem.config.js'"
echo "3. If ports are open locally but external fails -> CHECK AWS/VPS SECURITY GROUPS."
