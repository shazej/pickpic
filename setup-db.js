
const sql = require('mssql');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env.local' });
// Fallback to .env if .env.local doesn't exist or variables missing
require('dotenv').config();

// Direct connection string to bypass config parsing issues
const config = "Server=162.55.212.193,14315;Database=master;User Id=sa;Password=V3r!fy#92uM@xTq1zR71;TrustServerCertificate=True;MultipleActiveResultSets=true;Encrypt=False";

async function run() {
    try {
        console.log(`Connecting to ${config.server}...`);
        const pool = await sql.connect(config);

        console.log('Connected. creating database if not exists...');
        await pool.query(`
            IF NOT EXISTS(SELECT * FROM sys.databases WHERE name = 'PICKPIC')
            BEGIN
                CREATE DATABASE PICKPIC;
            END
        `);

        console.log('Switching to PICKPIC...');
        await pool.query('USE PICKPIC');

        console.log('Creating tables...');
        // Execute schema parts. We can't execute everything with GO separators in one go via npm mssql usually
        // So we just run specific CREATE TABLEs.

        await pool.query(`
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
        `);

        await pool.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Information')
            BEGIN
                CREATE TABLE Information (
                    Id INT IDENTITY(1,1) PRIMARY KEY,
                    UserId INT FOREIGN KEY REFERENCES Users(Id),
                    Content NVARCHAR(MAX),
                    CreatedAt DATETIME DEFAULT GETDATE()
                );
            END
        `);

        console.log('Database setup complete.');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

run();
