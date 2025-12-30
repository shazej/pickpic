/*
Commerce and Notifications Schema
Target: SQL Server 2019+
*/

USE PickPic;
GO

-- 1. Schemas
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'notifications') EXEC('CREATE SCHEMA [notifications]');
GO

-- 2. Tables

-- marketplace.Orders
IF OBJECT_ID('marketplace.Orders', 'U') IS NULL
BEGIN
    CREATE TABLE marketplace.Orders (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        buyer_id UNIQUEIDENTIFIER NOT NULL,
        total_amount DECIMAL(18,2) NOT NULL,
        currency CHAR(3) NOT NULL DEFAULT 'USD',
        status NVARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, paid, processing, shipped, delivered, cancelled
        payment_status NVARCHAR(50) NOT NULL DEFAULT 'unpaid', -- unpaid, paid, refunded, failed
        shipping_address_json NVARCHAR(MAX) NULL, -- Snapshot of address
        created_at DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
        updated_at DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_Orders_Buyer FOREIGN KEY (buyer_id) REFERENCES auth.Users(id) ON DELETE NO ACTION
    );
    CREATE INDEX IX_Orders_Buyer ON marketplace.Orders(buyer_id);
    CREATE INDEX IX_Orders_Status ON marketplace.Orders(status);
END
GO

-- marketplace.OrderItems
IF OBJECT_ID('marketplace.OrderItems', 'U') IS NULL
BEGIN
    CREATE TABLE marketplace.OrderItems (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        order_id UNIQUEIDENTIFIER NOT NULL,
        product_id UNIQUEIDENTIFIER NOT NULL,
        seller_id UNIQUEIDENTIFIER NOT NULL, -- Denormalized for easy seller queries
        quantity INT NOT NULL DEFAULT 1,
        unit_price DECIMAL(18,2) NOT NULL, -- Snapshot price
        total_price DECIMAL(18,2) NOT NULL,
        created_at DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_OrderItems_Order FOREIGN KEY (order_id) REFERENCES marketplace.Orders(id) ON DELETE CASCADE,
        CONSTRAINT FK_OrderItems_Product FOREIGN KEY (product_id) REFERENCES marketplace.Products(id) ON DELETE NO ACTION, -- Keep record even if product deleted? Or Set Null?
        CONSTRAINT FK_OrderItems_Seller FOREIGN KEY (seller_id) REFERENCES auth.Users(id) ON DELETE NO ACTION
    );
    CREATE INDEX IX_OrderItems_Order ON marketplace.OrderItems(order_id);
    CREATE INDEX IX_OrderItems_Seller ON marketplace.OrderItems(seller_id);
END
GO

-- marketplace.Payments
IF OBJECT_ID('marketplace.Payments', 'U') IS NULL
BEGIN
    CREATE TABLE marketplace.Payments (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        order_id UNIQUEIDENTIFIER NOT NULL,
        provider NVARCHAR(50) NOT NULL, -- 'stripe'
        provider_transaction_id NVARCHAR(255) NULL, -- Stripe PaymentIntent ID
        amount DECIMAL(18,2) NOT NULL,
        currency CHAR(3) NOT NULL,
        status NVARCHAR(50) NOT NULL, -- pending, succeeded, failed
        metadata_json NVARCHAR(MAX) NULL,
        created_at DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
        updated_at DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_Payments_Order FOREIGN KEY (order_id) REFERENCES marketplace.Orders(id) ON DELETE CASCADE
    );
    CREATE INDEX IX_Payments_Order ON marketplace.Payments(order_id);
    CREATE INDEX IX_Payments_ProviderId ON marketplace.Payments(provider_transaction_id);
END
GO

-- notifications.Notifications
IF OBJECT_ID('notifications.Notifications', 'U') IS NULL
BEGIN
    CREATE TABLE notifications.Notifications (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        user_id UNIQUEIDENTIFIER NOT NULL,
        type NVARCHAR(50) NOT NULL, -- 'order_placed', 'order_shipped', 'message', 'system'
        title NVARCHAR(255) NOT NULL,
        body NVARCHAR(MAX) NULL,
        link NVARCHAR(255) NULL, -- Deep link
        is_read BIT NOT NULL DEFAULT 0,
        data_json NVARCHAR(MAX) NULL, -- Extra context
        created_at DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_Notifications_User FOREIGN KEY (user_id) REFERENCES auth.Users(id) ON DELETE CASCADE
    );
    CREATE INDEX IX_Notifications_User_Read ON notifications.Notifications(user_id, is_read);
END
GO

-- 3. UPDATED_AT Triggers
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_Orders_UpdatedAt') DROP TRIGGER marketplace.trg_Orders_UpdatedAt;
GO
CREATE TRIGGER marketplace.trg_Orders_UpdatedAt ON marketplace.Orders AFTER UPDATE AS
BEGIN
    UPDATE marketplace.Orders SET updated_at = SYSDATETIME() FROM marketplace.Orders t INNER JOIN inserted i ON t.id = i.id;
END
GO

IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_Payments_UpdatedAt') DROP TRIGGER marketplace.trg_Payments_UpdatedAt;
GO
CREATE TRIGGER marketplace.trg_Payments_UpdatedAt ON marketplace.Payments AFTER UPDATE AS
BEGIN
    UPDATE marketplace.Payments SET updated_at = SYSDATETIME() FROM marketplace.Payments t INNER JOIN inserted i ON t.id = i.id;
END
GO
