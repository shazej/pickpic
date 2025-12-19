
-- Refactored Super Admin Schema (UUID Compatible)

-- Schema: audit
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'audit') EXEC('CREATE SCHEMA [audit]');

-- Table: audit.events
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[audit].[events]') AND type in (N'U'))
BEGIN
    CREATE TABLE [audit].[events] (
        id INT IDENTITY(1,1) PRIMARY KEY,
        actor_id UNIQUEIDENTIFIER NOT NULL, -- UUID to match auth.Users
        action VARCHAR(100) NOT NULL, 
        entity_type VARCHAR(50) NOT NULL, 
        entity_id VARCHAR(100) NULL, 
        details NVARCHAR(MAX) NULL, 
        ip_address VARCHAR(45) NULL,
        created_at DATETIME2 DEFAULT GETDATE()
    );
    CREATE INDEX IX_audit_events_actor ON [audit].[events](actor_id);
    CREATE INDEX IX_audit_events_created_at ON [audit].[events](created_at);
END

-- Schema: moderation
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'moderation') EXEC('CREATE SCHEMA [moderation]');

-- Table: moderation.reports
-- Check if exists, if created with INT reporter_id, we might need to alter or drop. 
-- For now, IF NOT EXISTS is safe, but if it exists with INT, it will break at runtime.
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[moderation].[reports]') AND type in (N'U'))
BEGIN
    CREATE TABLE [moderation].[reports] (
        id INT IDENTITY(1,1) PRIMARY KEY,
        reporter_id UNIQUEIDENTIFIER NOT NULL, -- UUID
        target_type VARCHAR(50) NOT NULL, 
        target_id VARCHAR(100) NOT NULL,
        reason_category VARCHAR(50) NOT NULL,
        details NVARCHAR(MAX) NULL,
        status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'REVIEWING', 'RESOLVED', 'DISMISSED')),
        resolution_notes NVARCHAR(MAX) NULL,
        resolved_by UNIQUEIDENTIFIER NULL, -- UUID
        resolved_at DATETIME2 NULL,
        created_at DATETIME2 DEFAULT GETDATE()
    );
    CREATE INDEX IX_moderation_reports_status ON [moderation].[reports](status);
END

-- Schema: content
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'content') EXEC('CREATE SCHEMA [content]');

-- Table: content.faq_categories
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[content].[faq_categories]') AND type in (N'U'))
BEGIN
    CREATE TABLE [content].[faq_categories] (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        display_order INT DEFAULT 0,
        is_visible BIT DEFAULT 1,
        created_at DATETIME2 DEFAULT GETDATE()
    );
END

-- Table: content.faq_items
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[content].[faq_items]') AND type in (N'U'))
BEGIN
    CREATE TABLE [content].[faq_items] (
        id INT IDENTITY(1,1) PRIMARY KEY,
        category_id INT NOT NULL,
        question NVARCHAR(255) NOT NULL,
        answer NVARCHAR(MAX) NOT NULL,
        display_order INT DEFAULT 0,
        is_visible BIT DEFAULT 1,
        created_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (category_id) REFERENCES [content].[faq_categories](id)
    );
END

-- Schema: settings
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'settings') EXEC('CREATE SCHEMA [settings]');

-- Table: settings.feature_flags
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[settings].[feature_flags]') AND type in (N'U'))
BEGIN
    CREATE TABLE [settings].[feature_flags] (
        key_name VARCHAR(100) PRIMARY KEY,
        is_enabled BIT DEFAULT 0,
        description NVARCHAR(255) NULL,
        updated_at DATETIME2 DEFAULT GETDATE(),
        updated_by UNIQUEIDENTIFIER NULL -- UUID
    );
END

-- Table: settings.system_config
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[settings].[system_config]') AND type in (N'U'))
BEGIN
    CREATE TABLE [settings].[system_config] (
        key_name VARCHAR(100) PRIMARY KEY,
        value NVARCHAR(MAX) NULL,
        type VARCHAR(20) DEFAULT 'STRING', 
        description NVARCHAR(255) NULL,
        updated_at DATETIME2 DEFAULT GETDATE()
    );
END

-- Schema: ai
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'ai') EXEC('CREATE SCHEMA [ai]');

-- Table: ai.prompts
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[ai].[prompts]') AND type in (N'U'))
BEGIN
    CREATE TABLE [ai].[prompts] (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        version INT NOT NULL,
        prompt_text NVARCHAR(MAX) NOT NULL,
        is_active BIT DEFAULT 0,
        created_by UNIQUEIDENTIFIER NULL, -- UUID
        created_at DATETIME2 DEFAULT GETDATE()
    );
    CREATE UNIQUE INDEX UX_ai_prompts_name_version ON [ai].[prompts](name, version);
END

-- Schema: localization
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'localization') EXEC('CREATE SCHEMA [localization]');

-- Table: localization.languages
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[localization].[languages]') AND type in (N'U'))
BEGIN
    CREATE TABLE [localization].[languages] (
        code VARCHAR(10) PRIMARY KEY, 
        name NVARCHAR(50) NOT NULL,
        is_rtl BIT DEFAULT 0,
        is_active BIT DEFAULT 1
    );
END

-- Table: localization.translation_keys
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[localization].[translation_keys]') AND type in (N'U'))
BEGIN
    CREATE TABLE [localization].[translation_keys] (
        id INT IDENTITY(1,1) PRIMARY KEY,
        key_name VARCHAR(255) NOT NULL UNIQUE,
        description NVARCHAR(255) NULL
    );
END

-- Table: localization.translation_values
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[localization].[translation_values]') AND type in (N'U'))
BEGIN
    CREATE TABLE [localization].[translation_values] (
        id INT IDENTITY(1,1) PRIMARY KEY,
        key_id INT NOT NULL,
        language_code VARCHAR(10) NOT NULL,
        value NVARCHAR(MAX) NOT NULL,
        FOREIGN KEY (key_id) REFERENCES [localization].[translation_keys](id),
        FOREIGN KEY (language_code) REFERENCES [localization].[languages](code)
    );
    CREATE UNIQUE INDEX UX_localization_values ON [localization].[translation_values](key_id, language_code);
END

-- Seed Initial Data
IF NOT EXISTS (SELECT * FROM [settings].[feature_flags] WHERE key_name = 'maintenance_mode')
BEGIN
    INSERT INTO [settings].[feature_flags] (key_name, is_enabled, description) VALUES ('maintenance_mode', 0, 'Put the site in maintenance mode');
END

IF NOT EXISTS (SELECT * FROM [localization].[languages] WHERE code = 'en')
BEGIN
    INSERT INTO [localization].[languages] (code, name, is_rtl, is_active) VALUES ('en', 'English', 0, 1);
END
