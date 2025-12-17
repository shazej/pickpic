# PickPic System Architecture & Tech Stack

## 1. System Architecture

### High-Level Diagram (Text-Based)

```mermaid
graph TD
    UserClient[Mobile App / Web App] -->|HTTPS| LoadBalancer[IIS / Nginx (Windows)]
    LoadBalancer --> Frontend[Next.js Web Server]
    LoadBalancer --> API[FastAPI Backend Service]
    
    subgraph "Windows Server Environment"
        Frontend -->|SSR/BFF| API
        API -->|Read/Write| RelationalDB[(PostgreSQL / MSSQL)]
        API -->|Vector Search| VectorDB[(Qdrant / Milvus)]
        API -->|Images| FileStorage[Local SSD / MinIO / S3 Proxy]
        
        API -->|Async Tasks| TaskQueue[Redis / RabbitMQ]
        TaskQueue --> AIWorker[AI Inference Worker (Python)]
        AIWorker -->|Load Model| ModelStore[Local Disk]
    end

    Admin[Admin Dashboard] -->|Internal Network| API
```

### Component Responsibilities

1.  **Frontend (Web App)**: 
    -   **Tech**: Next.js (React).
    -   **Role**: User interface for browsing, searching, and uploading images. Server-side rendering (SSR) for SEO. Acts as the primary entry point for web users.
2.  **Mobile App**:
    -   **Tech**: React Native or Flutter.
    -   **Role**: Native experience for iOS/Android. Consumes the same API as the web frontend.
3.  **Backend API**:
    -   **Tech**: FastAPI (Python).
    -   **Role**: Core business logic, authentication, request validation, orchestration of search requests, interaction with databases.
4.  **AI Image Matching Engine**:
    -   **Tech**: PyTorch / TensorFlow, serving via FastAPI or a dedicated model server (TorchServe) if scale increases.
    -   **Role**: Generating embeddings from images using CLIP or similar models. Background processing of bulk uploads.
5.  **Vector Database**:
    -   **Tech**: Qdrant (Docker).
    -   **Role**: Storing high-dimensional image embeddings and performing approximate nearest neighbor (ANN) search.
6.  **Relational Database**:
    -   **Tech**: PostgreSQL (Docker) or MSSQL (Native).
    -   **Role**: Structured data (Users, Sellers, Products, Transaction Logs, Metadata).
7.  **Admin Dashboard**:
    -   **Tech**: React / Next.js (Internal Tool).
    -   **Role**: User management, content moderation, system monitoring.

### Data Flow: Image Upload to Result

1.  **Upload**: User uploads an image via Web/Mobile App.
2.  **Receive**: API receives the image, validates file type/size.
3.  **Store**: Image is saved to File Storage (Disk/Object Store).
4.  **Queue**: API pushes a job `(image_path, user_id)` to the Task Queue.
5.  **Process**: AI Worker picks up the job, loads the image, runs inference (CLIP), generates an embedding vector (e.g., 512f).
6.  **Index**: Worker saves the vector to the Vector DB linked to the `image_id`.
7.  **Search (If Query)**: If this was a search request, the generated vector is immediately used to query the Vector DB for `top_k` nearest neighbors.
8.  **Enrich**: The list of matching IDs is sent to the Relational DB to fetch product details (price, seller, desc).
9.  **Response**: Aggregated results are returned to the user.

## 2. Windows-Friendly Tech Stack Recommendation

**Core Requirement**: Windows Server compatibility.

| Component | Recommendation | Why for Windows Server? |
| :--- | :--- | :--- |
| **Backend Framework** | **FastAPI (Python)** | Python 3.11 runs natively on Windows. FastAPI is high-performance, async (ASGI), and integrates perfectly with AI ecosystem (PyTorch/numpy). |
| **AI/ML Stack** | **PyTorch + SentenceTransformers** | Best-in-class support for CLIP models. Works well on Windows with CUDA (if GPU available) or CPU. |
| **Vector Database** | **Qdrant (via Docker)** | Qdrant is written in Rust, extremely fast, resource-efficient. Runs seamlessly in Docker Desktop on Windows. |
| **Relational Database** | **PostgreSQL (via Docker)** | While MSSQL is the "native" choice, Postgres is requested. Running it via Docker ensures environment consistency and easy updates. |
| **Image Storage** | **Local Filesystem** (served via IIS/Nginx) or **MinIO (Docker)** | Low latency implementation for on-premise/hybrid. MinIO provides an S3-compatible API running locally. |
| **Frontend** | **Next.js** | Already in use. Excellent for SEO/Performance. Node.js runs natively on Windows. |
| **Process Manager** | **NSSM** (Non-Sucking Service Manager) | The gold standard for keeping Node.js/Python scripts running as Windows Services. |
| **Web Server / Proxy** | **IIS** (Internet Information Services) | Native Windows web server. Can utilize ARR (Application Request Routing) to reverse proxy to Next.js (port 3000) and FastAPI (port 8000). |
| **Monitoring** | **Prometheus + Grafana** (Docker) | Standard observability stack. Runs lightly in containers. |

**Deployment Strategy**:
1.  **Docker Desktop**: Host database services (Postgres, Qdrant, Redis, MinIO) in containers for isolation and ease of management.
2.  **Native Windows Services**: Run the stateless logic (Next.js Node process, FastAPI Python process) directly on the OS managed by **NSSM**. This avoids some file-system performance overhead of Docker on Windows for heavy I/O app code.
