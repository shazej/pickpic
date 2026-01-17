
-- Schema: marketplace
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'marketplace') EXEC('CREATE SCHEMA [marketplace]');
GO

-- Table: marketplace.SellerProfiles (was sellers)
IF OBJECT_ID(N'[marketplace].[SellerProfiles]', N'U') IS NOT NULL DROP TABLE [marketplace].[SellerProfiles];
IF OBJECT_ID(N'[marketplace].[sellers]', N'U') IS NOT NULL DROP TABLE [marketplace].[sellers];
GO

CREATE TABLE [marketplace].[SellerProfiles] (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL, -- Link to Auth Users
    store_name NVARCHAR(255) NULL,
    bio NVARCHAR(MAX) NULL,
    location_precision NVARCHAR(255) NULL, -- City/Area
    contact_info NVARCHAR(MAX), -- JSON: { "whatsapp": "...", "phone": "..." }
    approval_status NVARCHAR(50) DEFAULT 'PENDING',
    is_verified BIT DEFAULT 0,
    quality_score FLOAT DEFAULT 1.0,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);
GO

CREATE INDEX IX_SellerProfiles_UserId ON [marketplace].[SellerProfiles](user_id);
GO

-- Table: marketplace.Products (was listings)
IF OBJECT_ID(N'[marketplace].[Products]', N'U') IS NOT NULL DROP TABLE [marketplace].[Products];
IF OBJECT_ID(N'[marketplace].[listings]', N'U') IS NOT NULL DROP TABLE [marketplace].[listings];
GO

CREATE TABLE [marketplace].[Products] (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    seller_id UNIQUEIDENTIFIER NOT NULL,
    title NVARCHAR(255) NULL, 
    description NVARCHAR(MAX) NULL,
    price DECIMAL(18, 2) NULL,
    currency VARCHAR(10) DEFAULT 'KWD',
    condition NVARCHAR(50) NULL, -- New, Used, etc.
    category NVARCHAR(100) NULL,
    
    -- Location
    location_lat FLOAT NULL,
    location_lng FLOAT NULL,
    location_text NVARCHAR(255) NULL,
    
    -- Media (Primary image, others in ProductImages table)
    -- But for simplicity we might keep image_url here too
    
    -- AI Data
    ai_attributes NVARCHAR(MAX) NULL, 
    embedding_id VARCHAR(255) NULL,
    
    status VARCHAR(50) DEFAULT 'ACTIVE', -- DRAFT, ACTIVE, SOLD
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    CONSTRAINT FK_Products_Sellers FOREIGN KEY (seller_id) REFERENCES [marketplace].[SellerProfiles](id)
);
GO

CREATE INDEX IX_Products_Seller ON [marketplace].[Products](seller_id);
CREATE INDEX IX_Products_CreatedAt ON [marketplace].[Products](created_at);
GO

-- Table: marketplace.ProductImages
IF OBJECT_ID(N'[marketplace].[ProductImages]', N'U') IS NOT NULL DROP TABLE [marketplace].[ProductImages];
GO

CREATE TABLE [marketplace].[ProductImages] (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    product_id UNIQUEIDENTIFIER NOT NULL,
    image_url NVARCHAR(MAX) NOT NULL,
    is_primary BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_ProductImages_Product FOREIGN KEY (product_id) REFERENCES [marketplace].[Products](id) ON DELETE CASCADE
);
GO

-- Table: marketplace.ProductAttributes (for extra JSON attributes)
IF OBJECT_ID(N'[marketplace].[ProductAttributes]', N'U') IS NOT NULL DROP TABLE [marketplace].[ProductAttributes];
GO

CREATE TABLE [marketplace].[ProductAttributes] (
    product_id UNIQUEIDENTIFIER PRIMARY KEY,
    attributes_json NVARCHAR(MAX),
    CONSTRAINT FK_ProductAttributes_Product FOREIGN KEY (product_id) REFERENCES [marketplace].[Products](id) ON DELETE CASCADE
);
GO
