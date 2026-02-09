-- PostgreSQL Production Schema for PickPic

-- 1. Create Schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS marketplace;
CREATE SCHEMA IF NOT EXISTS ai;
CREATE SCHEMA IF NOT EXISTS audit;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================
-- AUTH SCHEMA
-- =============================================

-- auth.Users
CREATE TABLE IF NOT EXISTS auth.Users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash BYTEA NULL, -- For compatibility with VARBINARY
    display_name TEXT NULL,
    phone TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- auth.Roles
CREATE TABLE IF NOT EXISTS auth.Roles (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- auth.UserRoles
CREATE TABLE IF NOT EXISTS auth.UserRoles (
    user_id UUID NOT NULL REFERENCES auth.Users(id) ON DELETE CASCADE,
    role_id INT NOT NULL REFERENCES auth.Roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

-- =============================================
-- MARKETPLACE SCHEMA
-- =============================================

-- marketplace.SellerProfiles
CREATE TABLE IF NOT EXISTS marketplace.SellerProfiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.Users(id),
    store_name TEXT NOT NULL,
    bio TEXT NULL,
    location_lat DECIMAL(9,6) NULL,
    location_lng DECIMAL(9,6) NULL,
    location_geohash TEXT NULL,
    location_precision TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS IX_SellerProfiles_Geohash ON marketplace.SellerProfiles(location_geohash);

-- marketplace.Products
CREATE TABLE IF NOT EXISTS marketplace.Products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES marketplace.SellerProfiles(id),
    title TEXT NOT NULL,
    description TEXT NULL,
    category TEXT NULL,
    condition TEXT NULL,
    price DECIMAL(18,2) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'draft', -- draft, published, sold, archived
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT CHK_Products_Status CHECK (status IN ('draft', 'published', 'sold', 'archived'))
);

CREATE INDEX IF NOT EXISTS IX_Products_SellerId ON marketplace.Products(seller_id);
CREATE INDEX IF NOT EXISTS IX_Products_Category ON marketplace.Products(category) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS IX_Products_Status ON marketplace.Products(status);

-- marketplace.ProductImages
CREATE TABLE IF NOT EXISTS marketplace.ProductImages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES marketplace.Products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    blurhash TEXT NULL,
    width INT NULL,
    height INT NULL,
    mime_type TEXT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS IX_ProductImages_ProductId ON marketplace.ProductImages(product_id);
CREATE INDEX IF NOT EXISTS IX_ProductImages_Primary ON marketplace.ProductImages(product_id) WHERE is_primary = TRUE;

-- marketplace.ProductAttributes
CREATE TABLE IF NOT EXISTS marketplace.ProductAttributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES marketplace.Products(id) ON DELETE CASCADE,
    attributes_json JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS IX_ProductAttributes_ProductId ON marketplace.ProductAttributes(product_id);

-- marketplace.Favorites
CREATE TABLE IF NOT EXISTS marketplace.Favorites (
    user_id UUID NOT NULL REFERENCES auth.Users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES marketplace.Products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, product_id)
);

-- marketplace.MessageThreads
CREATE TABLE IF NOT EXISTS marketplace.MessageThreads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_user_id UUID NOT NULL REFERENCES auth.Users(id),
    seller_user_id UUID NOT NULL REFERENCES auth.Users(id),
    product_id UUID NOT NULL REFERENCES marketplace.Products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT UQ_MessageThreads UNIQUE(buyer_user_id, seller_user_id, product_id)
);

CREATE INDEX IF NOT EXISTS IX_MessageThreads_Buyer ON marketplace.MessageThreads(buyer_user_id);
CREATE INDEX IF NOT EXISTS IX_MessageThreads_Seller ON marketplace.MessageThreads(seller_user_id);

-- marketplace.Messages
CREATE TABLE IF NOT EXISTS marketplace.Messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES marketplace.MessageThreads(id) ON DELETE CASCADE,
    sender_user_id UUID NOT NULL REFERENCES auth.Users(id),
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS IX_Messages_Thread_CreatedAt ON marketplace.Messages(thread_id, created_at);

-- =============================================
-- AI SCHEMA
-- =============================================

-- ai.ImageEmbeddings
CREATE TABLE IF NOT EXISTS ai.ImageEmbeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_image_id UUID NOT NULL UNIQUE REFERENCES marketplace.ProductImages(id) ON DELETE CASCADE,
    model_name TEXT NOT NULL,
    embedding vector(1536), -- Native vector support
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- AUDIT SCHEMA
-- =============================================

-- audit.SearchEvents
CREATE TABLE IF NOT EXISTS audit.SearchEvents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NULL REFERENCES auth.Users(id) ON DELETE SET NULL,
    query_type TEXT NOT NULL, -- 'visual', 'text'
    metadata_json JSONB NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS IX_SearchEvents_CreatedAt ON audit.SearchEvents(created_at);
CREATE INDEX IF NOT EXISTS IX_SearchEvents_UserId ON audit.SearchEvents(user_id);

-- marketplace.ProductReviews
CREATE TABLE IF NOT EXISTS marketplace.ProductReviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES marketplace.Products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.Users(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS IX_ProductReviews_ProductId ON marketplace.ProductReviews(product_id);

-- Seed Data
INSERT INTO auth.Roles (name) VALUES ('buyer'), ('seller'), ('admin') ON CONFLICT (name) DO NOTHING;
