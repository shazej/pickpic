# Let's Encrypt SSL Setup for PickPic
# Run this script as Administrator
# This uses win-acme to get SSL certificates from Let's Encrypt

$DOMAIN = "pickpic.lumen-path.com"
$EMAIL = "admin@lumen-path.com"  # Change this to your email
$NGINX_PATH = "c:\inetpub\wwwroot\pickpic\nginx-install\nginx-1.24.0"
$SSL_PATH = "$NGINX_PATH\ssl"
$WEBROOT = "$NGINX_PATH\html"
$WACS_PATH = "c:\tools\win-acme"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Let's Encrypt SSL Setup for PickPic" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Domain: $DOMAIN" -ForegroundColor Yellow
Write-Host "SSL Path: $SSL_PATH" -ForegroundColor Yellow
Write-Host "WebRoot: $WEBROOT" -ForegroundColor Yellow
Write-Host ""

# Ensure directories exist
New-Item -ItemType Directory -Force -Path $SSL_PATH | Out-Null
New-Item -ItemType Directory -Force -Path "$WEBROOT\.well-known\acme-challenge" | Out-Null

Write-Host "Step 1: Starting nginx to handle ACME challenge..." -ForegroundColor Green
Write-Host ""

# Check if nginx is running
$nginxProcess = Get-Process -Name nginx -ErrorAction SilentlyContinue
if ($nginxProcess) {
    Write-Host "Nginx is already running." -ForegroundColor Yellow
} else {
    Write-Host "Starting nginx..." -ForegroundColor Yellow
    Start-Process -FilePath "$NGINX_PATH\nginx.exe" -WorkingDirectory $NGINX_PATH -WindowStyle Hidden
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "Step 2: Running win-acme to obtain certificate..." -ForegroundColor Green
Write-Host "This will open an interactive menu." -ForegroundColor Yellow
Write-Host ""
Write-Host "Follow these steps in the menu:" -ForegroundColor Cyan
Write-Host "  1. Enter 'N' for new certificate" -ForegroundColor White
Write-Host "  2. Enter '2' for manual input" -ForegroundColor White
Write-Host "  3. Enter your domain: $DOMAIN" -ForegroundColor White
Write-Host "  4. Select 'http-01' validation (filesystem)" -ForegroundColor White
Write-Host "  5. Set the webroot to: $WEBROOT" -ForegroundColor White
Write-Host "  6. Select PEM files for nginx" -ForegroundColor White
Write-Host "  7. Set output path to: $SSL_PATH" -ForegroundColor White
Write-Host ""

# Run win-acme
& "$WACS_PATH\wacs.exe"

Write-Host ""
Write-Host "Step 3: Verifying certificates..." -ForegroundColor Green

if ((Test-Path "$SSL_PATH\$DOMAIN-chain.pem") -or (Test-Path "$SSL_PATH\fullchain.pem")) {
    Write-Host "SUCCESS: SSL certificates obtained!" -ForegroundColor Green
    
    # Rename files if needed for nginx
    if (Test-Path "$SSL_PATH\$DOMAIN-chain.pem") {
        Copy-Item "$SSL_PATH\$DOMAIN-chain.pem" "$SSL_PATH\fullchain.pem" -Force
        Copy-Item "$SSL_PATH\$DOMAIN-key.pem" "$SSL_PATH\privkey.pem" -Force
    }
    
    Write-Host ""
    Write-Host "Reloading nginx with new certificates..." -ForegroundColor Yellow
    & "$NGINX_PATH\nginx.exe" -s reload
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "SSL SETUP COMPLETE!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your site is now available at:" -ForegroundColor Cyan
    Write-Host "  https://$DOMAIN" -ForegroundColor White
    Write-Host ""
    Write-Host "Certificate auto-renewal is configured." -ForegroundColor Yellow
} else {
    Write-Host "WARNING: Could not verify certificates." -ForegroundColor Yellow
    Write-Host "Please check the win-acme output for errors." -ForegroundColor Yellow
}
