
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'search_logs')
BEGIN
    CREATE TABLE search_logs (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        user_id UNIQUEIDENTIFIER FOREIGN KEY REFERENCES auth.Users(id),
        search_query NVARCHAR(MAX),
        image_query_url NVARCHAR(MAX),
        filters NVARCHAR(MAX),
        result_count INT,
        latency_ms INT,
        created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ai_feedback')
BEGIN
    CREATE TABLE ai_feedback (
        id INT IDENTITY(1,1) PRIMARY KEY,
        search_log_id BIGINT FOREIGN KEY REFERENCES search_logs(id), -- Optional link to search log
        user_id UNIQUEIDENTIFIER FOREIGN KEY REFERENCES auth.Users(id),
        score INT NOT NULL, -- 1 like, -1 dislike
        comment NVARCHAR(MAX),
        created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
    );
END
GO
