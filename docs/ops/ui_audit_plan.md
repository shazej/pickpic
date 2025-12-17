# Full UI Audit Plan

## 1. Scope
Detailed validation of all interactive elements: Buttons, Links, Forms, Dialogs.

## 2. Methodology
For each page, we perform a manual pass (or automated via Playwright Safe Mode) to verify:
1.  **Response**: Click produces feedback (Navigation, Toast, or UI Change).
2.  **State**: Loading spinners allow disabling double-clicks.
3.  **Error Handling**: Network failure shows graceful error.

## 3. UI Action Map (Checklist)

| Page | Action | Expected | Result | Fix |
| :--- | :--- | :--- | :--- | :--- |
| **Home** | `Search Bar` (Enter) | Navigates to `/search?q=...` | ✅ PASS | - |
| **Home** | `Upload Image` (Btn) | Opens File Picker | ✅ PASS | - |
| **Login** | `Submit` | POST /api/auth/signin | ✅ PASS | - |
| **Product** | `Add to Cart` | Update Cart Context | [ ] Pending | |
| **Product** | `Message Seller` | Open Chat Modal | [ ] Pending | |
| **Chat** | `Send` | Socket.emit 'message' | [ ] Pending | |
| **Admin** | `Approve` | POST /api/admin/approve | [ ] Pending | |

## 4. Fix Strategy
1.  **Broken Navigation**: Fix `Link` hrefs.
2.  **API Errors**: Wrap handlers in `try/catch` and `toast.error()`.
3.  **Dead Buttons**: Remove if feature deprecated.

## 5. Automation (Regression)
Run the `smoke.spec.ts` suite. It already covers:
-   Search Submit
-   Chat Open
-   Seller Publish
-   Admin Approve

This acts as the "Safe Mode" regression check.
