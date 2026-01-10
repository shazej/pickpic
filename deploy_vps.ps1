# Deploy Script for StudioXO
Write-Host "Starting Deployment..." -ForegroundColor Green

# 1. Setup Directories
$webDir = "C:\inetpub\wwwroot\studioxo"
if (Test-Path $webDir) {
    Remove-Item $webDir -Recurse -Force -ErrorAction SilentlyContinue
}
New-Item -ItemType Directory -Force -Path $webDir | Out-Null
Set-Location $webDir

# 2. Clone Repository
Write-Host "Cloning Repository (You may be asked for GitHub Login)..." -ForegroundColor Yellow
git clone -b pickpic-1 https://github.com/shazej/pickpic.git .

if (-not (Test-Path "package.json")) {
    Write-Error "Clone Failed! contents of dir:"
    ls
    exit 1
}

# 3. Install & Build
Write-Host "Installing Dependencies..." -ForegroundColor Cyan
npm install
Write-Host "Building Next.js..." -ForegroundColor Cyan
npm run build

# 4. Start PM2
Write-Host "Starting Application..." -ForegroundColor Green
pm2 delete studioxo -ErrorAction SilentlyContinue
pm2 start npm --name "studioxo" -- start
pm2 save

# 5. Firewall
Write-Host "Opening Firewall Port 3000..." -ForegroundColor Yellow
New-NetFirewallRule -DisplayName "NextJS" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue

Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "Visit: http://localhost:3000"
