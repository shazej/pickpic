
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'subscriptions')
BEGIN
    CREATE TABLE subscriptions (
        id NVARCHAR(100) PRIMARY KEY, -- Stripe User ID or Subscription ID? Usually Sub ID.
        user_id UNIQUEIDENTIFIER FOREIGN KEY REFERENCES users(id),
        status NVARCHAR(50), -- active, past_due, canceled
        current_period_end DATETIMEOFFSET,
        plan_id NVARCHAR(100),
        created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
    );
END
GO
