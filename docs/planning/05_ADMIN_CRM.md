# Admin CRM System Design

## Overview
An internal tool for PickPic staff to manage users, approve sellers, and moderate content. Built as a separate internal web app or a protected route section of the main Next.js app.

## 1. Tech Stack
-   **Frontend**: Next.js (Admin UI package like `shadcn/ui` + `TanStack Table`).
-   **Backend**: Uses the same FastAPI backend but accesses protected `/admin/*` endpoints.
-   **Auth**: Role-Based Access Control (RBAC). Roles: `SUPER_ADMIN`, `MODERATOR`, `SUPPORT`.

## 2. Key Features & Screens

### A. Dashboard (Home)
-   **Metrics**:
    -   Total Users / Active Today.
    -   Pending Seller Approvals (Count).
    -   Flagged Listings (Count).
    -   Total Revenue / GMV (if tracking transactions).
-   **Charts**: Sign-ups over time, search query volume.

### B. User Management
-   **List View**: Searchable table of users. Columns: Name, Email, Status (Active/Banned), Registered Date.
-   **Detail View**:
    -   User info.
    -   Activity log (Login history, Searches).
    -   Actions: "Reset Password", "Ban User", "Promote to Seller".

### C. Seller Approval Queue
-   **Workflow**:
    1.  User applies -> Status `PENDING`.
    2.  Moderator reviews documents (Business License, ID).
    3.  Moderator clicks "Approve" or "Reject (with reason)".
    4.  System sends email notification.
-   **Screen**: Split view. Document preview on left, verification checklist on right.

### D. Listing Moderation
-   **Automated Flags**: AI marks listings as "NSFW" or "Counterfeit".
-   **Review Interface**:
    -   Grid of reported/flagged images.
    -   Bulk actions: "Approve Selected", "Delete Selected".

### E. Audit Logs
-   **Purpose**: Compliance and security.
-   **Table**: `Time`, `AdminUser`, `Action`, `TargetID`, `IP`.
-   **Example**: `2024-10-12 10:00:00 | admin_alice | APPROVED_SELLER | seller_bob_uuid | 192.168.1.1`

## 3. Integration with Backend
-   **Endpoints**:
    -   `GET /api/v1/admin/stats`
    -   `GET /api/v1/admin/sellers?status=pending`
    -   `PUT /api/v1/admin/sellers/{id}/approve`
-   **Security**: Middleware checks `current_user.role in ['ADMIN', 'MODERATOR']` before executing any endpoint in `/admin`.
