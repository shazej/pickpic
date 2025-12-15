USE master;
GO

IF NOT EXISTS(SELECT * FROM sys.databases WHERE name = 'PICKPIC')
BEGIN
    CREATE DATABASE PICKPIC;
END
GO

USE PICKPIC;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE Users (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Email NVARCHAR(255) NOT NULL UNIQUE,
        PasswordHash NVARCHAR(255) NOT NULL,
        FullName NVARCHAR(255),
        CreatedAt DATETIME DEFAULT GETDATE()
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Information')
BEGIN
    CREATE TABLE Information (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT FOREIGN KEY REFERENCES Users(Id),
        Content NVARCHAR(MAX),
        CreatedAt DATETIME DEFAULT GETDATE()
    );
END
GO
