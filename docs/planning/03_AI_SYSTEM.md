# AI Image Matching System Design

## 1. Core Components

-   **Model**: [OpenAI CLIP (ViT-B/32)](https://github.com/openai/CLIP) or **Hugging Face sentence-transformers/clip-ViT-B-32**.
    -   *Why?* Maps text and images to the same vector space, enabling both Image-to-Image (Reverse Image Search) and Text-to-Image search.
-   **Vector DB**: **Qdrant**.
    -   *Why?* High performance, built-in filtering (payloads), and easy docker deployment.
-   **Inference Engine**: Python 3.11 with `torch` and `pillow`.

## 2. Embedding Pipeline

### Workflow
1.  **Preprocessing**: Resize image to 224x224, normalize pixel values.
2.  **Inference**: Pass tensor through CLIP Visual Encoder.
3.  **Output**: 512-dimensional float vector.
4.  **Normalization**: L2 normalize the vector (crucial for Cosine Similarity).

## 3. Vector Search Logic

We use **Cosine Similarity** to measure distance between vectors.
-   **Distance Metric**: Cosine (or Dot Product if vectors are normalized).
-   **HNSW Index**: Hierarchical Navigable Small World graphs for fast Approximate Nearest Neighbor (ANN) search.

## 4. Ranking Formula

The raw visual similarity is often not enough. We need a hybrid score:

```
Final_Score = (Visual_Similarity * W1) + (Price_Factor * W2) + (Seller_Rating_Factor * W3)
```

Where:
-   `Visual_Similarity`: 0.0 to 1.0 (from Vector DB).
-   `Price_Factor`: Normalized score (lower price = higher score).
-   `W1, W2, W3`: Weights (e.g., 0.7 for visual, 0.2 for price, 0.1 for trust).

**Implementation Strategy**:
1.  Query Vector DB to get Top 100 visual matches (Score > 0.6).
2.  Retrieve metadata (price, rating) for these 100 items from Relational DB (or store in Vector payload).
3.  Re-rank in memory using the formula.

## 5. Implementation (Python Pseudocode)

```python
import torch
from PIL import Image
from transformers import CLIPProcessor, CLIPModel
from qdrant_client import QdrantClient

# 1. Initialization
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
qdrant = QdrantClient("localhost", port=6333)

def generate_embedding(image_path):
    """Generates normalized vector from image."""
    image = Image.open(image_path)
    inputs = processor(images=image, return_tensors="pt")
    
    with torch.no_grad():
        image_features = model.get_image_features(**inputs)
    
    # Normalize features
    image_features = image_features / image_features.norm(p=2, dim=-1, keepdim=True)
    return image_features.cpu().numpy()[0].tolist()

def search_similar_products(query_image_path, top_k=50):
    """End-to-end search pipeline."""
    
    # A. Generate Vector
    query_vector = generate_embedding(query_image_path)
    
    # B. Vector Search (Qdrant)
    # Filter: Only active products
    search_result = qdrant.search(
        collection_name="products",
        query_vector=query_vector,
        query_filter={
            "must": [{"key": "is_active", "match": {"value": True}}]
        },
        limit=top_k
    )
    
    # C. Post-Processing / Ranking
    results = []
    for hit in search_result:
        # hit.payload contains price, title, etc.
        visual_score = hit.score
        price = hit.payload.get('price', 1000000)
        
        # Simple Logic: Boost score if under $50
        boost = 1.1 if price < 50 else 1.0
        
        final_score = visual_score * boost
        
        results.append({
            "id": hit.id,
            "visual_score": visual_score,
            "final_score": final_score,
            "payload": hit.payload
        })
        
    # Sort by final score
    results.sort(key=lambda x: x['final_score'], reverse=True)
    return results
```
