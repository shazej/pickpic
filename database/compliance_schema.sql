/*
Compliance Module Schema
*/

-- 1. Create Schema
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'compliance') EXEC('CREATE SCHEMA [compliance]');
GO

-- 2. Countries
IF OBJECT_ID('compliance.Countries', 'U') IS NULL
BEGIN
    CREATE TABLE compliance.Countries (
        id INT IDENTITY(1,1) PRIMARY KEY,
        iso_code CHAR(2) NOT NULL, -- ISO 3166-1 alpha-2
        name NVARCHAR(100) NOT NULL,
        is_active BIT DEFAULT 1,
        created_at DATETIME2(0) DEFAULT SYSDATETIME(),
        CONSTRAINT UQ_Countries_IsoCode UNIQUE(iso_code)
    );
    -- Seed initial countries
    INSERT INTO compliance.Countries (iso_code, name) VALUES ('KW', 'Kuwait'), ('QA', 'Qatar'), ('AE', 'United Arab Emirates'), ('SA', 'Saudi Arabia');
END
GO

-- 3. Tenants (Multi-tenant support)
IF OBJECT_ID('compliance.Tenants', 'U') IS NULL
BEGIN
    CREATE TABLE compliance.Tenants (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        name NVARCHAR(100) NOT NULL,
        compliance_country_iso CHAR(2) NULL, -- FK to Countries.iso_code logic
        created_at DATETIME2(0) DEFAULT SYSDATETIME(),
        updated_at DATETIME2(0) DEFAULT SYSDATETIME(),
        CONSTRAINT FK_Tenants_Country FOREIGN KEY (compliance_country_iso) REFERENCES compliance.Countries(iso_code)
    );
    -- Seed Default Tenant
    INSERT INTO compliance.Tenants (name, compliance_country_iso) VALUES ('Default Tenant', 'KW');
END
GO

-- 4. Policies
IF OBJECT_ID('compliance.Policies', 'U') IS NULL
BEGIN
    CREATE TABLE compliance.Policies (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        country_id INT NOT NULL,
        version INT NOT NULL,
        status NVARCHAR(20) NOT NULL, -- Draft | Active | Archived
        effective_from DATETIME2(0) NULL,
        notes NVARCHAR(MAX) NULL,
        created_by UNIQUEIDENTIFIER NULL, -- System Admin ID
        created_at DATETIME2(0) DEFAULT SYSDATETIME(),
        updated_by UNIQUEIDENTIFIER NULL,
        updated_at DATETIME2(0) DEFAULT SYSDATETIME(),
        CONSTRAINT FK_Policies_Countries FOREIGN KEY (country_id) REFERENCES compliance.Countries(id),
        CONSTRAINT CHK_Policies_Status CHECK (status IN ('Draft', 'Active', 'Archived'))
    );
    CREATE INDEX IX_Policies_Country_Status ON compliance.Policies(country_id, status);
END
GO

-- 5. Rules
IF OBJECT_ID('compliance.Rules', 'U') IS NULL
BEGIN
    CREATE TABLE compliance.Rules (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        policy_id UNIQUEIDENTIFIER NOT NULL,
        rule_key NVARCHAR(100) NOT NULL,
        rule_type NVARCHAR(20) NOT NULL, -- Text | JSON | Boolean | Enum | Number
        rule_value NVARCHAR(MAX) NULL,
        priority INT DEFAULT 0,
        is_enabled BIT DEFAULT 1,
        updated_by UNIQUEIDENTIFIER NULL,
        updated_at DATETIME2(0) DEFAULT SYSDATETIME(),
        CONSTRAINT FK_Rules_Policies FOREIGN KEY (policy_id) REFERENCES compliance.Policies(id) ON DELETE CASCADE
    );
    CREATE INDEX IX_Rules_Policy_Key ON compliance.Rules(policy_id, rule_key);
END
GO

-- 6. Knowledge Base
IF OBJECT_ID('compliance.KnowledgeBase', 'U') IS NULL
BEGIN
    CREATE TABLE compliance.KnowledgeBase (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        country_id INT NOT NULL,
        policy_id UNIQUEIDENTIFIER NULL, -- Optional link to specific policy version
        title NVARCHAR(200) NOT NULL,
        content NVARCHAR(MAX) NOT NULL,
        source_refs NVARCHAR(MAX) NULL, -- JSON array of references
        tags NVARCHAR(MAX) NULL, -- comma separated or JSON
        version INT DEFAULT 1,
        status NVARCHAR(20) NOT NULL DEFAULT 'Draft', -- Draft | Active | Archived
        created_by UNIQUEIDENTIFIER NULL,
        created_at DATETIME2(0) DEFAULT SYSDATETIME(),
        updated_by UNIQUEIDENTIFIER NULL,
        updated_at DATETIME2(0) DEFAULT SYSDATETIME(),
        CONSTRAINT FK_KB_Countries FOREIGN KEY (country_id) REFERENCES compliance.Countries(id),
        CONSTRAINT FK_KB_Policies FOREIGN KEY (policy_id) REFERENCES compliance.Policies(id),
        CONSTRAINT CHK_KB_Status CHECK (status IN ('Draft', 'Active', 'Archived'))
    );
    CREATE INDEX IX_KB_Country_Status ON compliance.KnowledgeBase(country_id, status);
END
GO

-- 7. Admin Chat Sessions
IF OBJECT_ID('compliance.AdminChatSessions', 'U') IS NULL
BEGIN
    CREATE TABLE compliance.AdminChatSessions (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        country_id INT NOT NULL,
        created_by UNIQUEIDENTIFIER NULL,
        status NVARCHAR(20) DEFAULT 'Active',
        created_at DATETIME2(0) DEFAULT SYSDATETIME(),
        CONSTRAINT FK_ChatSessions_Countries FOREIGN KEY (country_id) REFERENCES compliance.Countries(id)
    );
END
GO

-- 8. Admin Chat Messages
IF OBJECT_ID('compliance.AdminChatMessages', 'U') IS NULL
BEGIN
    CREATE TABLE compliance.AdminChatMessages (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        session_id UNIQUEIDENTIFIER NOT NULL,
        role NVARCHAR(20) NOT NULL, -- SystemAdmin | Assistant
        message NVARCHAR(MAX) NOT NULL,
        meta_json NVARCHAR(MAX) NULL, -- Citations, extracted rules etc.
        created_at DATETIME2(0) DEFAULT SYSDATETIME(),
        CONSTRAINT FK_ChatMessages_Sessions FOREIGN KEY (session_id) REFERENCES compliance.AdminChatSessions(id) ON DELETE CASCADE
    );
END
GO

-- 9. Triggers
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_Tenants_UpdatedAt') DROP TRIGGER compliance.trg_Tenants_UpdatedAt;
GO
CREATE TRIGGER compliance.trg_Tenants_UpdatedAt ON compliance.Tenants AFTER UPDATE AS
BEGIN
    UPDATE compliance.Tenants SET updated_at = SYSDATETIME() FROM compliance.Tenants t INNER JOIN inserted i ON t.id = i.id;
END
GO

IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_Policies_UpdatedAt') DROP TRIGGER compliance.trg_Policies_UpdatedAt;
GO
CREATE TRIGGER compliance.trg_Policies_UpdatedAt ON compliance.Policies AFTER UPDATE AS
BEGIN
    UPDATE compliance.Policies SET updated_at = SYSDATETIME() FROM compliance.Policies t INNER JOIN inserted i ON t.id = i.id;
END
GO

IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_Rules_UpdatedAt') DROP TRIGGER compliance.trg_Rules_UpdatedAt;
GO
CREATE TRIGGER compliance.trg_Rules_UpdatedAt ON compliance.Rules AFTER UPDATE AS
BEGIN
    UPDATE compliance.Rules SET updated_at = SYSDATETIME() FROM compliance.Rules t INNER JOIN inserted i ON t.id = i.id;
END
GO

IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_KB_UpdatedAt') DROP TRIGGER compliance.trg_KB_UpdatedAt;
GO
CREATE TRIGGER compliance.trg_KB_UpdatedAt ON compliance.KnowledgeBase AFTER UPDATE AS
BEGIN
    UPDATE compliance.KnowledgeBase SET updated_at = SYSDATETIME() FROM compliance.KnowledgeBase t INNER JOIN inserted i ON t.id = i.id;
END
GO
