// Qdrant Vector Database Client
// Single collection for all product searches (text, voice, image)

import { QdrantClient } from '@qdrant/js-client-rest';

// Initialize Qdrant client
const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL || 'http://localhost:6333',
  apiKey: process.env.QDRANT_API_KEY || undefined,
});

// Collection name
const PRODUCTS_COLLECTION = 'products';

// Vector dimensions (OpenAI text-embedding-3-small)
const VECTOR_SIZE = 1536;

// ============================================
// HELPER FUNCTIONS
// ============================================

// Check if collection exists
async function collectionExists(name: string): Promise<boolean> {
  try {
    await qdrant.getCollection(name);
    return true;
  } catch (error: unknown) {
    const err = error as { status?: number };
    if (err?.status === 404) return false;
    throw error;
  }
}

// ============================================
// INITIALIZATION
// ============================================

// Initialize collections on startup
export async function initializeQdrant(): Promise<void> {
  const exists = await collectionExists(PRODUCTS_COLLECTION);

  if (!exists) {
    console.log('📦 Creating Qdrant "products" collection...');

    await qdrant.createCollection(PRODUCTS_COLLECTION, {
      vectors: {
        size: VECTOR_SIZE,
        distance: 'Cosine',
      },
      optimizers_config: {
        indexing_threshold: 10000,
      },
      on_disk_payload: true,
    });

    // Create payload indexes for filtered search
    const indexes = [
      { field_name: 'country_code', field_schema: 'keyword' as const },
      { field_name: 'category_slug', field_schema: 'keyword' as const },
      { field_name: 'price', field_schema: 'float' as const },
      { field_name: 'status', field_schema: 'keyword' as const },
      { field_name: 'region_id', field_schema: 'integer' as const },
    ];

    for (const index of indexes) {
      await qdrant.createPayloadIndex(PRODUCTS_COLLECTION, index);
    }

    console.log('✅ Qdrant "products" collection initialized');
  } else {
    console.log('✅ Qdrant "products" collection already exists');
  }
}

// ============================================
// PRODUCT INDEXING
// ============================================

interface ProductPayload {
  product_id: string;
  seller_id: string;
  title: string;
  title_ar?: string;
  description?: string;
  price: number;
  currency: string;
  category_slug: string;
  country_code: string;
  region_id?: number;
  status: string;
  created_at: string;
  [key: string]: unknown;
}

// Add or update product in vector index
export async function indexProduct(
  productId: string,
  embedding: number[],
  payload: ProductPayload
): Promise<void> {
  await qdrant.upsert(PRODUCTS_COLLECTION, {
    wait: true,
    points: [
      {
        id: productId,
        vector: embedding,
        payload,
      },
    ],
  });
}

// Delete product from index
export async function deleteProductFromIndex(productId: string): Promise<void> {
  await qdrant.delete(PRODUCTS_COLLECTION, {
    wait: true,
    points: [productId],
  });
}

// ============================================
// SEARCH
// ============================================

interface SearchFilters {
  country_code: string;
  category_slug?: string;
  min_price?: number;
  max_price?: number;
  region_id?: number;
}

interface SearchResult {
  id: string;
  score: number;
  payload: ProductPayload;
}

// Ensure collection exists before search (lazy init)
let _initialized = false;
async function ensureCollection(): Promise<void> {
  if (_initialized) return;
  const exists = await collectionExists(PRODUCTS_COLLECTION);
  if (!exists) {
    await initializeQdrant();
  }
  _initialized = true;
}

// Search products with vector similarity and filters
export async function searchProducts(
  queryEmbedding: number[],
  filters: SearchFilters,
  limit: number = 10
): Promise<SearchResult[]> {
  // Ensure collection exists (creates if missing)
  await ensureCollection();

  // Build filter conditions
  const must: Array<Record<string, unknown>> = [
    { key: 'country_code', match: { value: filters.country_code } },
    { key: 'status', match: { value: 'active' } },
  ];

  if (filters.category_slug) {
    must.push({ key: 'category_slug', match: { value: filters.category_slug } });
  }

  if (filters.region_id) {
    must.push({ key: 'region_id', match: { value: filters.region_id } });
  }

  // Price range filter
  if (filters.min_price !== undefined || filters.max_price !== undefined) {
    const range: Record<string, number> = {};
    if (filters.min_price !== undefined) range.gte = filters.min_price;
    if (filters.max_price !== undefined) range.lte = filters.max_price;
    must.push({ key: 'price', range });
  }

  // Execute search
  const results = await qdrant.search(PRODUCTS_COLLECTION, {
    vector: queryEmbedding,
    filter: { must },
    limit,
    with_payload: true,
  });

  return results.map((r) => ({
    id: r.id as string,
    score: r.score,
    payload: r.payload as ProductPayload,
  }));
}

// ============================================
// HEALTH CHECK
// ============================================

export async function checkQdrantConnection(): Promise<boolean> {
  try {
    await qdrant.getCollections();
    return true;
  } catch {
    return false;
  }
}

export { qdrant, PRODUCTS_COLLECTION };
