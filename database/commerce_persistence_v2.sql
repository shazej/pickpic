/*
Conversational Commerce Persistence Schema
Target: SQL Server 2019+
*/

USE PickPic;
GO

-- 1. AI Schema Tables
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'ai') EXEC('CREATE SCHEMA [ai]');
GO

-- ai.buyer_threads
IF OBJECT_ID('ai.buyer_threads', 'U') IS NULL
BEGIN
    CREATE TABLE ai.buyer_threads (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        user_id UNIQUEIDENTIFIER NULL, -- Allow guest threads
        product_id UNIQUEIDENTIFIER NOT NULL,
        status NVARCHAR(20) NOT NULL DEFAULT 'open', -- open, closed
        created_at DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
        updated_at DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_BuyerThreads_Users FOREIGN KEY (user_id) REFERENCES auth.Users(id) ON DELETE NO ACTION,
        CONSTRAINT FK_BuyerThreads_Products FOREIGN KEY (product_id) REFERENCES marketplace.Products(id) ON DELETE CASCADE
    );
    CREATE INDEX IX_BuyerThreads_User ON ai.buyer_threads(user_id);
    CREATE INDEX IX_BuyerThreads_Product ON ai.buyer_threads(product_id);
END
GO

-- ai.buyer_messages
IF OBJECT_ID('ai.buyer_messages', 'U') IS NULL
BEGIN
    CREATE TABLE ai.buyer_messages (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        thread_id UNIQUEIDENTIFIER NOT NULL,
        role NVARCHAR(20) NOT NULL, -- user, assistant, system
        content NVARCHAR(MAX) NOT NULL,
        citations_json NVARCHAR(MAX) NULL, -- references to attributes/images used
        created_at DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_BuyerMessages_Threads FOREIGN KEY (thread_id) REFERENCES ai.buyer_threads(id) ON DELETE CASCADE
    );
    CREATE INDEX IX_BuyerMessages_Thread_CreatedAt ON ai.buyer_messages(thread_id, created_at);
END
GO

-- 2. Marketplace Schema Tables Extension
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'marketplace') EXEC('CREATE SCHEMA [marketplace]');
GO

-- marketplace.listing_assistant_sessions
IF OBJECT_ID('marketplace.listing_assistant_sessions', 'U') IS NULL
BEGIN
    CREATE TABLE marketplace.listing_assistant_sessions (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        seller_user_id UNIQUEIDENTIFIER NOT NULL,
        draft_product_id UNIQUEIDENTIFIER NOT NULL,
        status NVARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, published, abandoned
        created_at DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
        updated_at DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_ListingAssistantSessions_Users FOREIGN KEY (seller_user_id) REFERENCES auth.Users(id) ON DELETE NO ACTION,
        CONSTRAINT FK_ListingAssistantSessions_Products FOREIGN KEY (draft_product_id) REFERENCES marketplace.Products(id) ON DELETE CASCADE
    );
    CREATE INDEX IX_ListingAssistantSessions_Seller ON marketplace.listing_assistant_sessions(seller_user_id);
END
GO

-- marketplace.listing_assistant_messages
IF OBJECT_ID('marketplace.listing_assistant_messages', 'U') IS NULL
BEGIN
    CREATE TABLE marketplace.listing_assistant_messages (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        session_id UNIQUEIDENTIFIER NOT NULL,
        role NVARCHAR(20) NOT NULL, -- seller, assistant, system
        content NVARCHAR(MAX) NOT NULL,
        structured_update_json NVARCHAR(MAX) NULL, -- field updates made from answer
        created_at DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_ListingAssistantMessages_Sessions FOREIGN KEY (session_id) REFERENCES marketplace.listing_assistant_sessions(id) ON DELETE CASCADE
    );
    CREATE INDEX IX_ListingAssistantMessages_Session_CreatedAt ON marketplace.listing_assistant_messages(session_id, created_at);
END
GO

-- Ensure marketplace.Products supports draft state and other fields
-- (Already mostly exists but ensuring status check)
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CHK_Products_Status_V2')
BEGIN
    -- First drop old constraint if exists
    IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CHK_Products_Status')
        ALTER TABLE marketplace.Products DROP CONSTRAINT CHK_Products_Status;
    
    ALTER TABLE marketplace.Products ADD CONSTRAINT CHK_Products_Status_V2 CHECK (status IN ('draft', 'published', 'sold', 'archived'));
END
GO

-- UpdatedAt Triggers
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_BuyerThreads_UpdatedAt') DROP TRIGGER ai.trg_BuyerThreads_UpdatedAt;
GO
CREATE TRIGGER ai.trg_BuyerThreads_UpdatedAt ON ai.buyer_threads AFTER UPDATE AS
BEGIN
    UPDATE ai.buyer_threads SET updated_at = SYSDATETIME() FROM ai.buyer_threads t INNER JOIN inserted i ON t.id = i.id;
END
GO

IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_ListingAssistantSessions_UpdatedAt_V2') DROP TRIGGER marketplace.trg_ListingAssistantSessions_UpdatedAt_V2;
GO
CREATE TRIGGER marketplace.trg_ListingAssistantSessions_UpdatedAt_V2 ON marketplace.listing_assistant_sessions AFTER UPDATE AS
BEGIN
    UPDATE marketplace.listing_assistant_sessions SET updated_at = SYSDATETIME() FROM marketplace.listing_assistant_sessions t INNER JOIN inserted i ON t.id = i.id;
END
GO
