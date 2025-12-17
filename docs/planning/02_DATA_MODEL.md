# PickPic Data Model (PostgreSQL)

## Overview
This schema is designed for PostgreSQL but references Concepts compatible with MSSQL if migration is needed. It handles multi-country/currency via specific columns and lookup tables.

## Entity Relationships (ERD)
- **Users** 1:N **SearchLogs**
- **Users** 1:1 **Sellers** (A user can become a seller)
- **Sellers** 1:N **Products**
- **Products** 1:N **ProductVariants** (Sizes/Colors - optional, assumed simplified for now)
- **Products** 1:N **ProductImages**
- **ProductImages** 1:1 **ImageEmbeddings** (Stored in Vector DB, referenced here by ID or stored as array if using pgvector)
- **Products** 1:N **PriceHistory**
- **Products** N:M **Categories**

## Schema Definition (`schema.sql`)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Locations / Countries
CREATE TABLE countries (
    code CHAR(2) PRIMARY KEY, -- 'US', 'GB'
    name VARCHAR(100) NOT NULL,
    currency_code CHAR(3) NOT NULL, -- 'USD', 'GBP'
    currency_symbol VARCHAR(5)
);

-- 2. Users & Authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- Nullable if social login
    full_name VARCHAR(100),
    phone_number VARCHAR(20),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- 3. Sellers
CREATE TABLE sellers (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    business_name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50),
    address_line1 VARCHAR(255),
    city VARCHAR(100),
    country_code CHAR(2) REFERENCES countries(code),
    rating DECIMAL(3, 2) DEFAULT 0.0,
    is_approved BOOLEAN DEFAULT FALSE, -- Admin approval
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Categories
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    parent_id INT REFERENCES categories(id),
    slug VARCHAR(100) UNIQUE NOT NULL
);

-- 5. Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES sellers(user_id) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    base_price DECIMAL(10, 2) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    stock_quantity INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Product-Category Join
CREATE TABLE product_categories (
    product_id UUID REFERENCES products(id),
    category_id INT REFERENCES categories(id),
    PRIMARY KEY (product_id, category_id)
);

-- 6. Product Images & Embeddings
-- Note: actual vector data might be in Qdrant, but we keep a reference here.
-- If using pgvector, add: embedding vector(512)
CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    url VARCHAR(512) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    vector_id VARCHAR(100), -- Reference to Qdrant Point ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Price History
CREATE TABLE price_history (
    id BIGSERIAL PRIMARY KEY,
    product_id UUID REFERENCES products(id),
    old_price DECIMAL(10, 2),
    new_price DECIMAL(10, 2),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Search Logs (for Analytics)
CREATE TABLE search_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id), -- Nullable for guests
    search_query TEXT, -- Text query
    image_query_url TEXT, -- If visual search
    filters JSONB,
    result_count INT,
    latency_ms INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Admin Audit Logs
CREATE TABLE admin_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    admin_user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL, -- 'APPROVE_SELLER', 'DELETE_PRODUCT'
    target_resource VARCHAR(50), -- 'seller', 'product'
    target_id UUID,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Indexing Strategy

1.  **Products**:
    -   `CREATE INDEX idx_products_seller ON products(seller_id);`
    -   `CREATE INDEX idx_products_created ON products(created_at DESC);`
    -   `CREATE INDEX idx_products_price ON products(base_price, currency);`
2.  **Search & JSON**:
    -   `CREATE INDEX idx_products_title_trgm ON products USING GIN (title gin_trgm_ops);` (Requires pg_trgm for fuzzy text search)
3.  **Audit Logs**:
    -   `CREATE INDEX idx_audit_target ON admin_audit_logs(target_id);`

## Multi-Country & Currency

-   **Currency Storage**: Store explicit `currency` columns alongside amounts. Do not normalize to a single currency at storage time to avoid Forex fluctuation data loss. Convert at display time.
-   **Localization**: Use `countries` table to map sellers to regions. Filter search results by `country_code` to show local inventory.
