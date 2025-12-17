# Domain & SSL Configuration Guide

## 1. DNS Configuration
**Provider**: (Your Domain Registrar, e.g., GoDaddy, AWS Route53)

-   **Type**: A Record
-   **Host**: `ecom` (for `ecom.lumen-path.com`)
-   **Value**: `<YOUR_WINDOWS_SERVER_PUBLIC_IP>`
-   **TTL**: 300 seconds (5 mins)

## 2. SSL Strategy: Caddy (Recommended)
We use [Caddy](https://caddyserver.com/) because it handles **Let's Encrypt** automation out of the box on Windows with zero dependency on IIS URL Rewrite.

### Installation
1.  Download Caddy for Windows (amd64) from `caddyserver.com`.
2.  Place `caddy.exe` in `C:\Program Files\Caddy\`.
3.  Add `C:\Program Files\Caddy\` to System PATH.

### Configuration
1.  Use the provided `scripts/ops/Caddyfile`.
2.  Place it at `C:\Program Files\Caddy\Caddyfile`.

### Running Caddy
Run as a service using NSSM or simple command:
```powershell
caddy run --config "C:\Program Files\Caddy\Caddyfile"
```

## 3. Windows Firewall Configuration
Allow external access ONLY to ports 80 and 443. Block 4500 from outside.

```powershell
# 1. Allow HTTP/HTTPS (Incoming)
New-NetFirewallRule -DisplayName "Allow HTTP 80" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Allow HTTPS 443" -Direction Inbound -LocalPort 443 -Protocol TCP -Action Allow

# 2. Block Direct App Access (Port 4500)
# (Optional if you rely on 'default block inbound', but good to be explicit)
New-NetFirewallRule -DisplayName "Block External 4500" -Direction Inbound -LocalPort 4500 -Protocol TCP -Action Block
```

## 4. App Configuration Adjustments
Update `.env.production`:
```ini
NEXT_PUBLIC_APP_URL=https://ecom.lumen-path.com
PORT=4500
```

## 5. Verification
1.  Open browser to `https://ecom.lumen-path.com`
2.  Check Lock Icon -> Connection is Secure (Let's Encrypt).
3.  Check Network Tab -> Headers -> Remote Address is Server IP.
