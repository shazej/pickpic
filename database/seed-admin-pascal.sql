
-- Ensure tables exist in DBO schema

IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE t.name = 'Roles' AND s.name = 'dbo')
BEGIN
    CREATE TABLE dbo.Roles (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(50) NOT NULL UNIQUE
    );
    INSERT INTO dbo.Roles (Name) VALUES ('buyer'), ('seller'), ('admin'), ('super_admin');
    PRINT 'Created dbo.Roles';
END
ELSE
BEGIN
    -- Ensure super_admin role exists in dbo.Roles
    IF NOT EXISTS (SELECT * FROM dbo.Roles WHERE Name = 'super_admin')
    BEGIN
        INSERT INTO dbo.Roles (Name) VALUES ('super_admin');
    END
END

IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE t.name = 'UserRoles' AND s.name = 'dbo')
BEGIN
    CREATE TABLE dbo.UserRoles (
        UserId INT NOT NULL, -- Assuming dbo.Users.Id is INT based on introspection
        RoleId INT NOT NULL,
        PRIMARY KEY (UserId, RoleId),
        FOREIGN KEY (UserId) REFERENCES dbo.Users(Id),
        FOREIGN KEY (RoleId) REFERENCES dbo.Roles(Id)
    );
    PRINT 'Created dbo.UserRoles';
END

-- Seed Super Admin
DECLARE @Email NVARCHAR(255) = 'admin@pickpic.com';
DECLARE @PasswordHash NVARCHAR(255) = '$2b$10$HxRXHK/zJe0K/7U6HfDTkekzgGvW8PwuVx2L/KvtGAqLfhgnCvsFy'; -- 'Admin123!'
DECLARE @UserId INT;
DECLARE @RoleId INT;

SELECT @RoleId = Id FROM dbo.Roles WHERE Name = 'super_admin';

-- Check User
IF NOT EXISTS (SELECT * FROM dbo.Users WHERE Email = @Email)
BEGIN
    -- Assuming dbo.Users has Id (Identity), Email, PasswordHash, FullName, CreatedAt
    INSERT INTO dbo.Users (Email, PasswordHash, FullName, CreatedAt)
    VALUES (@Email, @PasswordHash, 'Super Admin', SYSDATETIMEOFFSET());
    
    SET @UserId = SCOPE_IDENTITY();
    
    INSERT INTO dbo.UserRoles (UserId, RoleId)
    VALUES (@UserId, @RoleId);
    
    PRINT 'Super Admin created in DBO schema.';
END
ELSE
BEGIN
    SELECT @UserId = Id FROM dbo.Users WHERE Email = @Email;
    
    IF NOT EXISTS (SELECT * FROM dbo.UserRoles WHERE UserId = @UserId AND RoleId = @RoleId)
    BEGIN
        INSERT INTO dbo.UserRoles (UserId, RoleId) VALUES (@UserId, @RoleId);
        PRINT 'Existing DBO user promoted to Super Admin.';
    END
END
