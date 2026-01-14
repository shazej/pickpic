IF OBJECT_ID('ai_usage', 'U') IS NULL
BEGIN
    CREATE TABLE ai_usage (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        user_id UNIQUEIDENTIFIER NULL, -- Nullable for anonymous/unauthenticated scans if allowed
        model NVARCHAR(100) NOT NULL,
        prompt_tokens INT NOT NULL DEFAULT 0,
        completion_tokens INT NOT NULL DEFAULT 0,
        total_tokens INT NOT NULL DEFAULT 0,
        request_id UNIQUEIDENTIFIER NOT NULL, -- Correlates with GenKit request or internal ID
        latency_ms INT NOT NULL DEFAULT 0,
        route NVARCHAR(255) NOT NULL, -- e.g., 'buyer-chat', 'seller-chat'
        created_at DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_AIUsage_Users FOREIGN KEY (user_id) REFERENCES auth.Users(id) ON DELETE SET NULL
    );
    CREATE INDEX IX_AIUsage_User ON ai_usage(user_id);
    CREATE INDEX IX_AIUsage_Date ON ai_usage(created_at);
END
GO
