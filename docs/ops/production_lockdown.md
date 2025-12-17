# Production Configuration Lockdown

## 1. Environment Variables (`.env.production`)
- [ ] **DB Defaults**: Ensure `DB_USER` is NOT `sa`. Use a dedicated service account.
- [ ] **Secrets**: Ensure `NEXTAUTH_SECRET`, `JWT_SECRET` are random 64-char strings.
- [ ] **Debug**: Set `NEXT_PUBLIC_DEBUG=false` or remove entirely.

## 2. Server Configuration
- [ ] **NSSM Service**:
    -   `AppEnvironmentExtra`: `NODE_ENV=production`
    -   `AppStdout`: Log file path is valid.
    -   `AppStderr`: Log file path is valid.
- [ ] **SQL Server**:
    -   Firewall: Only allow connection from localhost (or App Server IP).
    -   Disable `sa` login if possible.

## 3. Application Code
- [ ] **Console Logs**: Remove `console.log` in critical loops. (Use a logger lib).
- [ ] **Error Handling**: Ensure API returns generic 500 errors to users, not stack traces.
- [ ] **Port Binding**: Ensure listening on `localhost:4500` (not `0.0.0.0` if using Reverse Proxy).

## 4. Verification
1.  Run `npm run build` locally to catch type errors.
2.  Start service.
3.  Access `/api/health` -> should return 200.
