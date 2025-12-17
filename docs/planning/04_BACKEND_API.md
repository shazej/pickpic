# PickPic Backend API (FastAPI)

## Overview
This component handles the heavy lifting: AI processing, database transactions, and secure business logic. It runs on Port 8000 (default) behind a reverse proxy.

## 1. Project Structure

```text
backend/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── endpoints/
│   │   │   │   ├── auth.py       # Login, Register, OTP
│   │   │   │   ├── products.py   # CRUD for Products
│   │   │   │   ├── search.py     # Vector Search endpoints
│   │   │   │   └── sellers.py    # Seller management
│   │   │   └── api.py           # Router aggregation
│   ├── core/
│   │   ├── config.py            # Env vars (DB_URL, SECRET_KEY)
│   │   └── security.py          # JWT, Password Hashing
│   ├── db/
│   │   ├── base.py
│   │   └── session.py           # SQL Alchemy / SQLModel setup
│   ├── models/                  # SQLAlchemy / SQLModel Classes
│   │   ├── user.py
│   │   └── product.py
│   ├── schemas/                 # Pydantic Models (Request/Response)
│   │   ├── token.py
│   │   └── product.py
│   ├── services/
│   │   ├── embedding.py         # CLIP Inference logic
│   │   └── vector_db.py         # Qdrant client wrapper
│   └── main.py                  # Entry point
├── alembic/                      # Migrations
├── requirements.txt
└── Dockerfile
```

## 2. Key Dependencies
-   `fastapi`, `uvicorn`: Web server.
-   `sqlalchemy`, `alembic`: ORM & Migrations.
-   `pydantic`: Validation.
-   `python-jose`, `passlib`: Security & Auth.
-   `torch`, `transformers`: AI.
-   `qdrant-client`: Vector DB.

## 3. Example Implementation

### `main.py`
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_router
from app.core.config import settings

app = FastAPI(title="PickPic API", version="1.0.0")

# CORS (Allow Frontend communication)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Next.js Frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
def health_check():
    return {"status": "ok", "version": "1.0.0"}
```

### `api/v1/endpoints/search.py`
```python
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from typing import List
from app.schemas.product import ProductOut
from app.services.embedding import generate_embedding
from app.services.vector_db import search_vectors
from app.db.session import get_db
from sqlalchemy.orm import Session

router = APIRouter()

@router.post("/image", response_model=List[ProductOut])
async def search_by_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # 1. Read file
    content = await file.read()
    
    # 2. Generate Embedding (CPU intensive, might offload to Celery in prod)
    vector = generate_embedding(content)
    
    # 3. Search Vector DB
    # Returns list of product IDs and scores
    matches = search_vectors(vector, top_k=20)
    
    if not matches:
        return []

    # 4. Fetch Details from SQL
    product_ids = [m.id for m in matches]
    products = db.query(Product).filter(Product.id.in_(product_ids)).all()
    
    # Re-order based on match score...
    
    return products
```

## 4. Security Best Practices
1.  **JWT Authentication**: Stateless auth. Access tokens expire short-term (15-30m), Refresh tokens long-term (7d).
2.  **Password Hashing**: Use `bcrypt` (via passlib).
3.  **Input Validation**: Strict Pydantic models preventing extra fields or injection.
4.  **Rate Limiting**: Use `slowapi` or Redis to limit search endpoints (expensive) to avoid DoS.
5.  **File Uploads**: Validate Magic Bytes of images (don't trust extensions). Limit size to 5MB.
