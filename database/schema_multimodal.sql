USE PickPicDB;
GO

-- 12. Seller Assistant Sessions
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'listing_assistant_sessions')
BEGIN
    CREATE TABLE listing_assistant_sessions (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        seller_user_id UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES users(id),
        draft_product_id UNIQUEIDENTIFIER, -- Can be linked to products table if draft is persisted there
        status NVARCHAR(50) DEFAULT 'active', -- active, completed, abandoned
        current_step NVARCHAR(50),
        context_data NVARCHAR(MAX), -- JSON blob for running context
        created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
        updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
    );
END
GO

-- 13. Seller Assistant Conversation History (for context)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'listing_assistant_conversation')
BEGIN
    CREATE TABLE listing_assistant_conversation (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        session_id UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES listing_assistant_sessions(id),
        role NVARCHAR(20) NOT NULL, -- 'system', 'assistant', 'user'
        content NVARCHAR(MAX),
        message_type NVARCHAR(20) DEFAULT 'text', -- 'text', 'question', 'answer'
        meta_data NVARCHAR(MAX), -- JSON for structured Q/A data
        created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
    );
END
GO

-- 14. Search Analytics / Events
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'search_events')
BEGIN
    CREATE TABLE search_events (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        user_id UNIQUEIDENTIFIER FOREIGN KEY REFERENCES users(id), -- Nullable
        query_type NVARCHAR(20) NOT NULL, -- 'text', 'audio', 'video', 'image'
        raw_query NVARCHAR(MAX), -- Text or transcript or file path
        parsed_intent NVARCHAR(MAX), -- JSON
        result_count INT,
        latency_ms INT,
        created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
    );
END
GO
