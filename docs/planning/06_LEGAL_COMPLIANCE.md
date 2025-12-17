# Legal & Compliance Framework

## 1. Core Principles
PickPic operates as a neutral technology platform connecting buyers and sellers using AI. To ensure trust and legal compliance, we adhere to the following strict rules:

### A. Anti-Manipulation Policy
-   **No Price Manipulation**: The platform **never** alters the price set by the seller. Prices displayed must match the seller's input exactly.
-   **No Forced API Usage**: Sellers are encouraged but not required to use APIs. Manual upload tools must remain available and functional without degradation.
-   **Organic Ranking**: Search results are ranked primarily by **Visual Relevance** and **User Preferences** (e.g., sort by price low-high). We do not artificially down-rank sellers unless they violate Terms of Service (illegal content, fraud).

### B. Data Integrity & Scraping
-   **User-Submitted Only**: We do not scrape external websites to populate our catalog. All content must be explicitly provided by authorized sellers or users.
-   **Ownership**: Sellers retain copyright of their images. By uploading, they grant PickPic a license to display and index the images for search purposes.

## 2. Data Protection

### A. Data Retention
-   **Embeddings**: Vector embeddings of product images are retained as long as the product is active.
-   **User Images**: Images uploaded by users for search queries are:
    -   Processed in memory (RAM) to generate embeddings.
    -   **Deleted** immediately after the search request completes (unless user opts-in to "Search History").
    -   *Policy*: "We do not store your search photos."
-   **Logs**: Server logs (IPs, User Agents) are retained for 90 days for security auditing, then anonymized.

### B. Transparency
-   **Algorithm Disclosure**: We maintain a public help page explaining broadly how ranking works (e.g., "We match the visual features of your upload to our database...").

## 3. Audit Trail (Internal)
-   **Admin Actions**: Every administrative action (approval, ban, deletion) is logged immutably in the `admin_audit_logs` table (PostgreSQL).
-   **Access Control**: Direct database access is restricted to Chief Technical Staff. All other access is via the API with logged credentials.

## 4. Operational Guardrails
-   **Rate Limiting**: To prevent abuse and ensure fair resource usage.
-   **Takedown Mechanisms**: A clear process for Copyright/DMCA takedowns (e.g., `trust@pickpic.com` or in-app form). Content is hidden immediately pending review.
