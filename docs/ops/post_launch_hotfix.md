# Post-Launch Safety Net (First Week)

## 1. Monitoring Routine (First 48 Hours)
-   **Hourly**: Check `service-out.log` for restarts.
-   **Hourly**: Verify "New User" signups in DB.
-   **Daily**: Check Backup timestamps.

## 2. Emergency Contacts
-   **System Admin**: admin@lumen-path.com
-   **Dev Lead**: [Phone Number]

## 3. Handling Failures
-   **AI Search Fails**:
    -   Check Qdrant container: `docker ps`
    -   Restart: `docker restart qdrant`
    -   Fallback: Text search still works if AI fails (ensure code handles `try/catch` around vector search).
-   **App Crash**:
    -   NSSM Should auto-restart.
    -   If loop crashing: Check `service-err.log`, rollback code.

## 4. Rollback Plan
If a critical hotfix fails:
1.  Stop Service: `nssm stop PickPicApp`
2.  Checkout previous git commit: `git checkout main` (or previous tag).
3.  Rebuild: `npm run build`
4.  Start Service: `nssm start PickPicApp`

## 5. Hotfix Process
1.  Fix code locally.
2.  Test locally.
3.  Commit/Push to `main`.
4.  Pull on Server.
5.  Rebuild & Restart.
