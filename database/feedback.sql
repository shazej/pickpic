
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ai_feedback')
BEGIN
    CREATE TABLE ai_feedback (
        id INT IDENTITY(1,1) PRIMARY KEY,
        search_log_id BIGINT FOREIGN KEY REFERENCES search_logs(id), -- Optional link to search log
        user_id UNIQUEIDENTIFIER FOREIGN KEY REFERENCES users(id),
        score INT NOT NULL, -- 1 like, -1 dislike
        comment NVARCHAR(MAX),
        created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
    );
END
GO
