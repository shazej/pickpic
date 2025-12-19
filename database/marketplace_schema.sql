
-- Schema: marketplace
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'marketplace') EXEC('CREATE SCHEMA [marketplace]');
GO

-- Table: marketplace.sellers
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[marketplace].[sellers]') AND type in (N'U'))
BEGIN
    CREATE TABLE [marketplace].[sellers] (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        contact_info NVARCHAR(MAX), -- JSON: { "whatsapp": "...", "phone": "...", "email": "..." }
        is_verified BIT DEFAULT 0,
        quality_score FLOAT DEFAULT 1.0,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
    );
END
GO

-- Table: marketplace.listings
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[marketplace].[listings]') AND type in (N'U'))
BEGIN
    CREATE TABLE [marketplace].[listings] (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        seller_id UNIQUEIDENTIFIER NOT NULL,
        title NVARCHAR(255) NULL, -- AI Generated or User refined
        description NVARCHAR(MAX) NULL, -- AI Generated
        price DECIMAL(18, 2) NULL,
        currency VARCHAR(10) DEFAULT 'USD',
        
        -- Location
        location_lat FLOAT NULL,
        location_lng FLOAT NULL,
        location_text NVARCHAR(255) NULL,
        
        -- Media
        image_url NVARCHAR(MAX) NULL,
        
        -- AI Data
        ai_attributes NVARCHAR(MAX) NULL, -- JSON: { color: 'red', material: 'leather', category: 'furniture' }
        embedding_id VARCHAR(255) NULL, -- Reference to Vector Store ID if needed
        
        status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, SOLD, HIDDEN
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        
        CONSTRAINT FK_Listings_Sellers FOREIGN KEY (seller_id) REFERENCES [marketplace].[sellers](id)
    );
    
    CREATE INDEX IX_marketplace_listings_seller ON [marketplace].[listings](seller_id);
    CREATE INDEX IX_marketplace_listings_created_at ON [marketplace].[listings](created_at);
END
GO
