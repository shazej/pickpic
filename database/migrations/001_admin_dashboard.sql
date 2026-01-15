-- Migration: 001_admin_dashboard
-- Description: Adds Seller Approval fields and Content Moderation tables

USE PickPic;
GO

-- 1. Update marketplace.SellerProfiles
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[marketplace].[SellerProfiles]') AND name = 'status')
BEGIN
    ALTER TABLE marketplace.SellerProfiles ADD status NVARCHAR(20) NOT NULL DEFAULT 'PENDING';
    ALTER TABLE marketplace.SellerProfiles ADD CONSTRAiNT CHK_SellerProfiles_Status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'));
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[marketplace].[SellerProfiles]') AND name = 'reject_reason')
BEGIN
    ALTER TABLE marketplace.SellerProfiles ADD reject_reason NVARCHAR(MAX) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[marketplace].[SellerProfiles]') AND name = 'reviewed_by')
BEGIN
    ALTER TABLE marketplace.SellerProfiles ADD reviewed_by UNIQUEIDENTIFIER NULL;
    ALTER TABLE marketplace.SellerProfiles ADD CONSTRAINT FK_SellerProfiles_Reviewer FOREIGN KEY (reviewed_by) REFERENCES auth.Users(id);
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[marketplace].[SellerProfiles]') AND name = 'reviewed_at')
BEGIN
    ALTER TABLE marketplace.SellerProfiles ADD reviewed_at DATETIME2(0) NULL;
END
GO

-- 2. Create moderation.flags TABLE
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'moderation') EXEC('CREATE SCHEMA [moderation]');
GO

IF OBJECT_ID('moderation.flags', 'U') IS NULL
BEGIN
    CREATE TABLE moderation.flags (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        target_type NVARCHAR(50) NOT NULL, -- 'product', 'message', 'seller'
        target_id NVARCHAR(100) NOT NULL,
        reason NVARCHAR(MAX) NOT NULL,
        reporter_id UNIQUEIDENTIFIER NULL,
        status NVARCHAR(20) NOT NULL DEFAULT 'OPEN', -- OPEN, RESOLVED, DISMISSED
        resolved_by UNIQUEIDENTIFIER NULL,
        resolved_at DATETIME2(0) NULL,
        created_at DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
        updated_at DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_Flags_Reporter FOREIGN KEY (reporter_id) REFERENCES auth.Users(id) ON DELETE SET NULL,
        CONSTRAINT FK_Flags_Resolver FOREIGN KEY (resolved_by) REFERENCES auth.Users(id) ON DELETE NO ACTION,
        CONSTRAINT CHK_Flags_Status CHECK (status IN ('OPEN', 'RESOLVED', 'DISMISSED'))
    );
    CREATE INDEX IX_Flags_Status ON moderation.flags(status);
    CREATE INDEX IX_Flags_Target ON moderation.flags(target_type, target_id);
END
GO

-- 3. Create marketplace.ProductModeration (or just extend Products, but let's keep it separate or clean)
-- Decision: Add moderation_status to marketplace.Products directly for simplicity as per common pattern, 
-- but Plan said "Create ProductModeration table or extend products". 
-- Extending Products is easier for querying "Approved Products".
-- Let's check if we want a separate table. The plan had "Create/Update ProductModeration".
-- I will add columns to Products to make filtering easier (e.g. valid listings).

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[marketplace].[Products]') AND name = 'moderation_status')
BEGIN
    ALTER TABLE marketplace.Products ADD moderation_status NVARCHAR(20) NOT NULL DEFAULT 'PENDING';
    ALTER TABLE marketplace.Products ADD CONSTRAINT CHK_Products_ModerationStatus CHECK (moderation_status IN ('PENDING', 'APPROVED', 'REJECTED', 'FLAGGED'));
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[marketplace].[Products]') AND name = 'flagged_count')
BEGIN
    ALTER TABLE marketplace.Products ADD flagged_count INT NOT NULL DEFAULT 0;
END
GO

-- Ensure Super Admin Role exists
IF NOT EXISTS (SELECT * FROM auth.Roles WHERE name = 'super_admin')
BEGIN
    INSERT INTO auth.Roles (name) VALUES ('super_admin');
END
GO
