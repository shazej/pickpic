
-- 1. billing.Plans
IF OBJECT_ID('billing.Plans', 'U') IS NULL
BEGIN
    CREATE TABLE billing.Plans (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(50) NOT NULL,
        price_id NVARCHAR(100) NULL, -- Stripe Price ID (null for free)
        amount DECIMAL(18,2) NOT NULL DEFAULT 0,
        currency CHAR(3) NOT NULL DEFAULT 'USD',
        listings_limit INT NOT NULL DEFAULT 0,
        ai_scans_limit INT NOT NULL DEFAULT 0,
        features_json NVARCHAR(MAX) NULL, -- JSON array of feature strings
        created_at DATETIME2(0) NOT NULL DEFAULT SYSDATETIME()
    );

    -- Seed base plans
    INSERT INTO billing.Plans (name, price_id, amount, listings_limit, ai_scans_limit, features_json)
    VALUES 
    ('Starter', NULL, 0, 5, 50, '["5 Listings", "Basic Analytics", "Community Support"]'),
    ('Professional', 'price_H1abc234...', 29, 50, 500, '["50 Listings", "Advanced Analytics", "Priority Support", "AI Vision Search"]'),
    ('Enterprise', 'price_H2def567...', 99, 999999, 999999, '["Unlimited Listings", "API Access", "Dedicated Account Manager", "Custom Branding"]');
END
GO

-- 2. billing.Subscriptions
IF OBJECT_ID('billing.Subscriptions', 'U') IS NULL
BEGIN
    CREATE TABLE billing.Subscriptions (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        user_id UNIQUEIDENTIFIER NOT NULL,
        plan_id INT NOT NULL,
        stripe_subscription_id NVARCHAR(255) NULL,
        status NVARCHAR(50) NOT NULL DEFAULT 'active', -- active, trialing, canceled, past_due
        current_period_end DATETIME2(0) NULL,
        cancel_at_period_end BIT NOT NULL DEFAULT 0,
        created_at DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
        updated_at DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_Subscriptions_Users FOREIGN KEY (user_id) REFERENCES auth.Users(id) ON DELETE CASCADE,
        CONSTRAINT FK_Subscriptions_Plans FOREIGN KEY (plan_id) REFERENCES billing.Plans(id)
    );
    CREATE INDEX IX_Subscriptions_User ON billing.Subscriptions(user_id);
END
GO

-- Trigger for UpdatedAt on Subscriptions
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_Subscriptions_UpdatedAt') DROP TRIGGER billing.trg_Subscriptions_UpdatedAt;
GO
CREATE TRIGGER billing.trg_Subscriptions_UpdatedAt ON billing.Subscriptions AFTER UPDATE AS
BEGIN
    UPDATE billing.Subscriptions SET updated_at = SYSDATETIME() FROM billing.Subscriptions t INNER JOIN inserted i ON t.id = i.id;
END
GO
