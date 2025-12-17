# PickPic Backups & Disaster Recovery Guide

## 1. Backup Strategy (MSSQL)

### Policy
-   **Full Backups**: DAILY at 02:00 AM.
-   **Transaction Log Backups**: HOURLY (if Recovery Model is FULL).
-   **Retention**: 30 Days locally (or moved to offsite storage).
-   **Storage**: `C:\Backups\PickPicDB` (Ensure this is a separate physical disk if possible).

### Prerequisites
-   SQL Server Agent Service (or Windows Task Scheduler).
-   PowerShell with `Invoke-Sqlcmd` module OR `sqlcmd` utility.

## 2. Backup Scripts

### A. T-SQL Script (`scripts/ops/backup.sql`)
Save this file for manual execution or usage within SQL Agent.

```sql
DECLARE @BackupPath NVARCHAR(500);
DECLARE @BackupName NVARCHAR(500);
DECLARE @DateStamp NVARCHAR(20);

SET @DateStamp = FORMAT(GETDATE(), 'yyyyMMdd_HHmm');
SET @BackupPath = 'C:\Backups\PickPicDB\PickPicDB_Full_' + @DateStamp + '.bak';
SET @BackupName = 'PickPicDB-Full Database Backup';

BACKUP DATABASE [PickPicDB] 
TO DISK = @BackupPath 
WITH NOFORMAT, NOINIT, 
NAME = @BackupName, 
SKIP, NOREWIND, NOUNLOAD, COMPRESSION, SCOPE_USER, STATS = 10;
GO
```

### B. PowerShell Script (`scripts/ops/db_backup.ps1`)
Use this with Windows Task Scheduler.

```powershell
$Date = Get-Date -Format "yyyyMMdd_HHmm"
$BackupDir = "C:\Backups\PickPicDB"
$DbName = "PickPicDB"
$BackupFile = "$BackupDir\$DbName`_Full_$Date.bak"

# Create Directory if not exists
if (!(Test-Path -Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir
}

# Cleanup Old Backups (>30 Days)
Get-ChildItem -Path $BackupDir -Filter "*.bak" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | Remove-Item

# Execute Backup via SqlCmd (Assume Trusted Connection)
$Query = "BACKUP DATABASE [$DbName] TO DISK = '$BackupFile' WITH COMPRESSION, INIT, STATS = 10"
Invoke-Sqlcmd -Query $Query -ServerInstance "localhost" -TrustServerCertificate

Write-Output "Backup taken: $BackupFile"
```

## 3. Restore Procedure

### A. Full Restore (Disaster Recovery)
If the database is corrupted or lost:

1.  **Stop the App Service**:
    `nssm stop PickPicApp`
2.  **Locate Latest Backup**: e.g., `PickPicDB_Full_20251216_0200.bak`
3.  **Execute Restore (T-SQL)**:
    ```sql
    USE [master];
    -- Close connections
    ALTER DATABASE [PickPicDB] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    
    RESTORE DATABASE [PickPicDB] 
    FROM DISK = 'C:\Backups\PickPicDB\PickPicDB_Full_20251216_0200.bak' 
    WITH REPLACE;
    
    ALTER DATABASE [PickPicDB] SET MULTI_USER;
    ```
4.  **Restart App Service**:
    `nssm start PickPicApp`

### B. Point-in-Time Restore
*Requires Full Recovery Model and Log Backups chain.*
*(For MVP, we use Simple Recovery Model unless strict PITR is required. If required, restore Full backup with NORECOVERY, then apply Log backups sequentially).*

## 4. Application Data & Secrets

### Environment Variables
-   **Critical**: `.env.production` contains DB credentials and Encryption Keys.
-   **Backup**: Copy `C:\inetpub\wwwroot\studioxo\.env.production` to `C:\Backups\Config\`.
-   **Automation**: Add to the PowerShell daily backup script.

### User Uploads
-   **Path**: `C:\inetpub\wwwroot\studioxo\public\uploads` (if local storage).
-   **Strategy**: Robocopy to Backup Drive.
    ```powershell
    robocopy "C:\inetpub\wwwroot\studioxo\public\uploads" "C:\Backups\Uploads" /MIR /R:3 /W:5
    ```

## 5. Disaster Recovery Checklist

| Scenario | Action |
| :--- | :--- |
| **Server Crash (OS Failure)** | 1. Provision new Windows Server.<br>2. Install SQL Server, Node.js, NSSM.<br>3. Restore `C:\Backups` from offsite storage.<br>4. Run Restore T-SQL.<br>5. Copy App Code & `.env`.<br>6. Start Service. |
| **Disk Failure** | Replace Disk -> Restore Backups -> Restart SQL Service. |
| **Corrupt Backup** | Try previous day's backup. (Hence 30-day retention). |
| **Human Deletion** | "Stop the presses" (Stop App). Restore backup to `PickPicDB_Restore_Test`. Extract deleted rows and insert back to Main DB. |

## 6. Verification
*Date Executed: 2025-12-16*
-   [ ] **Test Backup**: Run `scripts/ops/db_backup.ps1`.
-   [ ] **Simulate Data Loss**: `DROP TABLE test_table`.
-   [ ] **Test Restore**: Run Restore T-SQL.
-   [ ] **Validation**: `SELECT * FROM test_table`.
