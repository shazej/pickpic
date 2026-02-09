
-- 1. Country PPP table
IF OBJECT_ID('billing.country_pricing', 'U') IS NULL
BEGIN
    CREATE TABLE billing.country_pricing (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        country_code CHAR(2) NOT NULL UNIQUE, -- ISO-2
        country_name NVARCHAR(100) NOT NULL,
        ppp_multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.00,
        currency_code CHAR(3) NOT NULL DEFAULT 'USD',
        rounding_rule NVARCHAR(20) NOT NULL DEFAULT 'round', -- round, floor, ceil
        is_active BIT NOT NULL DEFAULT 1,
        created_at DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
        updated_at DATETIME2(0) NOT NULL DEFAULT SYSDATETIME()
    );

    -- Seed default countries
    INSERT INTO billing.country_pricing (country_code, country_name, ppp_multiplier, currency_code, rounding_rule)
    VALUES 
    ('US', 'United States', 1.00, 'USD', 'round'),
    ('DE', 'Germany', 0.90, 'EUR', 'round'),
    ('IN', 'India', 0.35, 'INR', 'round'),
    ('EG', 'Egypt', 0.30, 'EGP', 'round'),
    ('QA', 'Qatar', 1.00, 'QAR', 'round');
END
GO

-- 2. Add country_code to auth.Users
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('auth.Users') AND name = 'country_code')
BEGIN
    ALTER TABLE auth.Users ADD country_code CHAR(2) NULL;
END
GO

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('auth.Users') AND name = 'country_code')
BEGIN
    -- Default existing users to US for safety
    UPDATE auth.Users SET country_code = 'US' WHERE country_code IS NULL;
END
GO

-- 3. Add locked pricing columns to billing.Subscriptions
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('billing.Subscriptions') AND name = 'base_amount')
BEGIN
    ALTER TABLE billing.Subscriptions ADD base_amount DECIMAL(18,2) NULL;
    ALTER TABLE billing.Subscriptions ADD ppp_multiplier DECIMAL(5,2) NULL;
    ALTER TABLE billing.Subscriptions ADD final_amount DECIMAL(18,2) NULL;
    ALTER TABLE billing.Subscriptions ADD currency CHAR(3) NULL;
END
GO

-- Trigger for UpdatedAt on billing.country_pricing
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_country_pricing_UpdatedAt') DROP TRIGGER billing.trg_country_pricing_UpdatedAt;
GO
CREATE TRIGGER billing.trg_country_pricing_UpdatedAt ON billing.country_pricing AFTER UPDATE AS
BEGIN
    UPDATE billing.country_pricing SET updated_at = SYSDATETIME() FROM billing.country_pricing t INNER JOIN inserted i ON t.id = i.id;
END
GO
