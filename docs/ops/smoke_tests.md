# End-to-End Smoke Test Guide

## Overview
Automated tests to verify critical paths:
1.  **Buyer**: Login, Search, View, Chat.
2.  **Seller**: Create Listing.
3.  **Admin**: Approve Listing.

## Prerequisites
-   Node.js installed.
-   `npm install` completed.
-   Playwright browsers installed: `npx playwright install`

## How to Run Tests

### 1. Run on Local Environment
Ensures your local dev server works.
```powershell
# Starts the dev server automatically
npx playwright test
```

### 2. Run against Production
Verifies the deployed Windows Server app.
```powershell
# Set BASE_URL to production
$env:PLAYWRIGHT_TEST_BASE_URL="https://ecom.lumen-path.com"
npx playwright test
```

### 3. Debugging Failures
-   **Show Report**: `npx playwright show-report`
-   **Trace Viewer**: View the `test-results/` folder.
-   **Headed Mode**: Watch execution visually.
    ```powershell
    npx playwright test --headed
    ```

## Expected Output
```text
Running 3 tests using 1 worker
  ✓  1 [chromium] › smoke.spec.ts:4:3 › Buyer: Register, Search, and View Product (5s)
  ✓  2 [chromium] › smoke.spec.ts:25:3 › Seller: Create Listing (4s)
  ✓  3 [chromium] › smoke.spec.ts:44:3 › Admin: Moderate Listing (3s)
  3 passed (12s)
```
