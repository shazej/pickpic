# Windows IIS Deployment Guide

This guide will help you deploy the Next.js application on your Windows VPS using IIS as a reverse proxy.

## 1. Prerequisites (Install these on the Server)
Connect to your server via Remote Desktop (RDP) and install:

1.  **Node.js (LTS)**: [Download here](https://nodejs.org/en/download/).
2.  **IIS URL Rewrite Module**: [Download here](https://www.iis.net/downloads/microsoft/url-rewrite).
3.  **Application Request Routing (ARR)**: [Download here](https://www.iis.net/downloads/microsoft/application-request-routing).

> **IMPORTANT**: After installing ARR, open IIS Manager, click on the Server Node -> Application Request Routing Cache -> Server Proxy Settings -> Check **"Enable proxy"**.

## 2. Prepare the Application
1.  Copy your project folder to the server (e.g., `C:\inetpub\wwwroot\studioxo`).
2.  Open PowerShell/CMD in that folder.
3.  Install dependencies and build:
    ```powershell
    npm install
    npm run build
    ```
4.  Test if it works:
    ```powershell
    npm start
    ```
    (You should see "Ready on http://localhost:3000").
    **Press Ctrl+C to stop it for now.**

## 3. Configure process management
To keep the app running in the background, install PM2 globally:

```powershell
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
```
*(If `ecosystem.config.js` causes issues on Windows, just use: `pm2 start npm --name "studioxo" -- start`)*

## 4. Configure IIS
1.  Open **IIS Manager**.
2.  Right-click **Sites** -> **Add Website**.
    *   **Site name**: studioxo
    *   **Physical path**: `C:\inetpub\wwwroot\studioxo` (or wherever you put the files).
    *   **Port**: 80 (or your specific port).
3.  **IMPORTANT**: The `web.config` file I created in your project should technically exist in the physical path.
    *   This file tells IIS to forward all traffic to `http://localhost:3000`.

## 5. Verify
Open http://localhost (or your server IP) in the browser. You should see your Next.js app.
