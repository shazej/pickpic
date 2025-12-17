# PickPic 90-Day MVP Roadmap

## Phase 1: Core AI Search Engine (Days 1–30)
**Goal**: A working visual search demo with dummy data.

-   **Week 1**:
    -   [ ] Setup Windows Server environment (Docker, NSSM).
    -   [ ] Configure PostgreSQL and Qdrant instances.
    -   [ ] Initialize Next.js Repo and FastAPI Skeleton.
-   **Week 2**:
    -   [ ] Implement CLIP Embedding pipeline (Python).
    -   [ ] Create "Product Upload" script to populate Vector DB with 10k sample images.
-   **Week 3**:
    -   [ ] Build "Image Search" API endpoint (Upload -> Vector -> Search -> Return Results).
    -   [ ] Build basic Next.js Search UI (Drag & Drop image).
-   **Week 4**:
    -   [ ] Optimization: Tune vector search params (HNSW).
    -   [ ] Demo Day: Internal test of visual search accuracy.

## Phase 2: Seller Platform & Data ingestion (Days 31–60)
**Goal**: Real sellers can sign up and list products.

-   **Week 5**:
    -   [ ] Implement User Auth (Login/Register) with JWT.
    -   [ ] Build Seller Onboarding (Business details form).
-   **Week 6**:
    -   [ ] Build "Manage Listings" Dashboard for sellers.
    -   [ ] CRUD APIs for Products (SQL + Async Vector Indexing).
-   **Week 7**:
    -   [ ] Image Processing: Resizing, S3/Local storage integration.
    -   [ ] Categories & Keyword Search (Hybrid Search).
-   **Week 8**:
    -   [ ] Beta Launch: Invite 5 friendly sellers to upload real catalogs.

## Phase 3: Admin, Analytics & Hardening (Days 61–90)
**Goal**: Production readiness and compliance.

-   **Week 9**:
    -   [ ] Build Admin Dashboard (Approve Sellers, Moderate Content).
    -   [ ] Implement Audit Logs.
-   **Week 10**:
    -   [ ] Security Audit: Rate limiting, Input validation, Firewall rules.
    -   [ ] Load Testing: Simulating 100 concurrent searches.
-   **Week 11**:
    -   [ ] Analytics: "Zero Result" tracking, Search latency monitoring.
    -   [ ] Documentation & Legal (Privacy Policy, Terms).
-   **Week 12 (Go-Live)**:
    -   [ ] Final Database Wipe (remove test data).
    -   [ ] Deployment to Production Windows Server.
    -   [ ] DNS Switch & Soft Launch.

## KPIs for MVP
1.  **Search Latency**: < 1 second for p95.
2.  **Accuracy**: Top 5 results contain at least 4 visually relevant items.
3.  **Scale**: Support 100,000 SKUs in Qdrant without degradation.
