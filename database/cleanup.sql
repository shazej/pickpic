
IF OBJECT_ID('sp_CleanupLogs', 'P') IS NOT NULL
    DROP PROCEDURE sp_CleanupLogs;
GO

CREATE PROCEDURE sp_CleanupLogs
AS
BEGIN
    SET NOCOUNT ON;

    -- Delete search logs older than 90 days
    DELETE FROM search_logs 
    WHERE created_at < DATEADD(day, -90, SYSDATETIMEOFFSET());

    -- Delete AI feedback for orphaned logs (optional, but good hygiene)
    DELETE FROM ai_feedback
    WHERE search_log_id NOT IN (SELECT id FROM search_logs);

    PRINT 'Cleanup completed.';
END
GO
