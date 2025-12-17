
# Deploying PickPic on Windows Server

This guide describes how to deploy PickPic as a background service using **NSSM** (Non-Sucking Service Manager) on Windows Server (or Windows 10/11).

## 1. Prerequisites

- **Node.js**: Install the latest LTS version (v18+) from [nodejs.org](https://nodejs.org/).
- **NSSM**: Download from [nssm.cc](https://nssm.cc/download), extract `nssm.exe` (use the `win64` version), and copy it to `C:\Windows\System32` (or add its folder to your PATH).
- **SQL Server**: Access to a running MSSQL instance.

## 2. Prepare the Application

1.  **Navigate to the project directory:**
    ```powershell
    cd C:\inetpub\wwwroot\studioxo
    ```

2.  **Install dependencies:**
    ```powershell
    npm install
    ```

3.  **Configure Environment:**
    Create a `.env.production` file (or just `.env`) with your secrets:
    ```ini
    DB_USER=sa
    DB_PASSWORD=your_secure_password
    DB_SERVER=localhost
    DB_NAME=PickPicDB
    # Port configuration is handled via environment variable in the service
    ```

4.  **Build the application:**
    ```powershell
    npm run build
    ```
    *Ensure the build completes successfully (creates `.next` directory).*

## 3. Configure Windows Firewall

Allow traffic on the application port (4500). Run PowerShell as Administrator:

```powershell
New-NetFirewallRule -DisplayName "PickPic Web App" `
    -Direction Inbound `
    -Action Allow `
    -Protocol TCP `
    -LocalPort 4500
```

## 4. Install Service with NSSM

We will create a service named `PickPicApp`.

1.  **Open Command Prompt or PowerShell as Administrator.**

2.  **Install the service:**
    You can use the GUI by running `nssm install PickPicApp`, or use the command line below for automation.

    **Path**: Path to `node.exe`.
    **Startup Directory**: Your project folder (`C:\inetpub\wwwroot\studioxo`).
    **Arguments**: `server.js` (runs the production server).

    ```powershell
    # Set the Path to Node (adjust if necessary)
    $NodePath = (Get-Command node).Source

    # Create Service
    nssm install PickPicApp $NodePath "server.js"
    nssm set PickPicApp AppDirectory "C:\inetpub\wwwroot\studioxo"
    
    # Set Environment Variables (PORT, NODE_ENV)
    # IMPORTANT: Newlines separate variables
    nssm set PickPicApp AppEnvironmentExtra "NODE_ENV=production`nPORT=4500"
    
    # Set Logs
    nssm set PickPicApp AppStdout "C:\inetpub\wwwroot\studioxo\logs\service-out.log"
    nssm set PickPicApp AppStderr "C:\inetpub\wwwroot\studioxo\logs\service-err.log"
    
    # Set Restart Policy (Restart application if it hangs/crashes)
    nssm set PickPicApp AppExit Default Restart
    nssm set PickPicApp AppRestartDelay 10000
    
    # Configure Startup type to Automatic
    nssm set PickPicApp Start SERVICE_AUTO_START
    ```

3.  **Create Logs Directory:**
    ```powershell
    New-Item -ItemType Directory -Path "C:\inetpub\wwwroot\studioxo\logs" -Force
    ```

## 5. Start and Verify

1.  **Start the service:**
    ```powershell
    nssm start PickPicApp
    ```

2.  **Verify status:**
    ```powershell
    nssm status PickPicApp
    # Should say SERVICE_RUNNING
    ```

3.  **Check Logs:**
    Inspect `C:\inetpub\wwwroot\studioxo\logs\service-out.log` to see startup messages (e.g., "> Ready on http://localhost:4500").

4.  **Access the App:**
    Open `http://localhost:4500` in your browser.

## 6. Maintenance

- **Restart Service:** `nssm restart PickPicApp`
- **Stop Service:** `nssm stop PickPicApp`
- **Edit Configuration:** `nssm edit PickPicApp` (Opens GUI)
- **Remove Service:** `nssm remove PickPicApp confirm`
