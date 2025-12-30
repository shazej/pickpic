/*
PickPic OAuth and Account Linking Migration
Target: SQL Server 2019+
*/

USE PickPic;
GO

-- 1. Update auth.Users
IF COL_LENGTH('auth.Users', 'language') IS NULL
BEGIN
    ALTER TABLE auth.Users ADD language NVARCHAR(10) DEFAULT 'en';
END
GO

-- 2. Create auth.oauth_accounts
IF OBJECT_ID('auth.oauth_accounts', 'U') IS NULL
BEGIN
    CREATE TABLE auth.oauth_accounts (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        user_id UNIQUEIDENTIFIER NOT NULL,
        provider NVARCHAR(50) NOT NULL,
        provider_account_id NVARCHAR(255) NOT NULL,
        access_token_encrypted NVARCHAR(MAX) NULL,
        refresh_token_encrypted NVARCHAR(MAX) NULL,
        token_expires_at DATETIME2(0) NULL,
        created_at DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_oauth_accounts_Users FOREIGN KEY (user_id) REFERENCES auth.Users(id) ON DELETE CASCADE,
        CONSTRAINT UQ_oauth_accounts_provider_id UNIQUE(provider, provider_account_id)
    );
    CREATE INDEX IX_oauth_accounts_user_id ON auth.oauth_accounts(user_id);
END
GO

-- 3. Create auth.sessions
IF OBJECT_ID('auth.sessions', 'U') IS NULL
BEGIN
    CREATE TABLE auth.sessions (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        user_id UNIQUEIDENTIFIER NOT NULL,
        session_token NVARCHAR(255) NOT NULL,
        created_at DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
        expires_at DATETIME2(0) NOT NULL,
        revoked_at DATETIME2(0) NULL,
        CONSTRAINT FK_sessions_Users FOREIGN KEY (user_id) REFERENCES auth.Users(id) ON DELETE CASCADE,
        CONSTRAINT UQ_sessions_token UNIQUE(session_token)
    );
    CREATE INDEX IX_sessions_user_id ON auth.sessions(user_id);
END
GO

-- 4. Create audit.events (if not already handled or need specific structure)
IF OBJECT_ID('audit.events', 'U') IS NULL
BEGIN
    CREATE TABLE audit.events (
        id INT IDENTITY(1,1) PRIMARY KEY,
        actor_id UNIQUEIDENTIFIER NOT NULL,
        action NVARCHAR(100) NOT NULL, 
        entity_type NVARCHAR(50) NOT NULL, 
        entity_id NVARCHAR(100) NULL, 
        details NVARCHAR(MAX) NULL, 
        ip_address NVARCHAR(45) NULL,
        created_at DATETIME2(0) NOT NULL DEFAULT SYSDATETIME()
    );
    CREATE INDEX IX_audit_events_actor ON audit.events(actor_id);
    CREATE INDEX IX_audit_events_created_at ON audit.events(created_at);
END
ELSE
BEGIN
    -- Ensure actor_id matches user_id type if it exists but was different
    -- (The production_schema.sql already has INT identity for id and UNIQUEIDENTIFIER for actor_id)
    -- So we just leave it be or adjust if needed.
    PRINT 'audit.events already exists';
END
GO
