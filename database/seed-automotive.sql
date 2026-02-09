
-- Seed Data for Automotive
DECLARE @SellerId UNIQUEIDENTIFIER = NEWID(); /* Unique per run */
DECLARE @SellerProfileId UNIQUEIDENTIFIER = NEWID();

-- 1. Create a Seed Seller in auth.Users (Schema expects GUID users)
-- Check if auth.Users existing?
IF NOT EXISTS (SELECT * FROM auth.Users WHERE email = 'auto_seed@pickpic.com')
BEGIN
    SET @SellerId = NEWID(); -- Use new ID
    INSERT INTO auth.Users (id, email, password_hash, display_name, is_active, created_at, updated_at)
    VALUES (@SellerId, 'auto_seed@pickpic.com', CAST(0x0 AS VARBINARY), 'Q8 Motors', 1, SYSDATETIME(), SYSDATETIME());
    
    INSERT INTO marketplace.SellerProfiles (id, user_id, store_name, bio, created_at, updated_at)
    VALUES (@SellerProfileId, @SellerId, 'Q8 Motors', 'Premium Cars in Kuwait', SYSDATETIME(), SYSDATETIME());
END
ELSE
BEGIN
    SELECT @SellerId = id FROM auth.Users WHERE email = 'auto_seed@pickpic.com';
    SELECT @SellerProfileId = id FROM marketplace.SellerProfiles WHERE user_id = @SellerId; -- Get existing Profile ID
    
    IF @SellerProfileId IS NULL 
    BEGIN
         SET @SellerProfileId = NEWID();
         INSERT INTO marketplace.SellerProfiles (id, user_id, store_name, bio, created_at, updated_at)
         VALUES (@SellerProfileId, @SellerId, 'Q8 Motors', 'Premium Cars in Kuwait', SYSDATETIME(), SYSDATETIME());
    END
END

-- 2. Helper to insert product
-- We will insert raw values for simplicity
-- Currency: KWD

DECLARE @PId UNIQUEIDENTIFIER;
DECLARE @now DATETIME2 = SYSDATETIME();

-- Item 1: Toyota Land Cruiser
SET @PId = NEWID();
INSERT INTO marketplace.Products (id, seller_id, title, description, category, condition, price, currency, status, created_at, updated_at)
VALUES (@PId, @SellerProfileId, N'تويوتا لاند كروزر 2022', N'لاند كروزر جي آر سبورت، كامل المواصفات، صبغ الوكالة، تحت الكفالة.', 'Automotive', 'New', 24500, 'KWD', 'published', @now, @now);

INSERT INTO marketplace.ProductAttributes (id, product_id, attributes_json, created_at, updated_at)
VALUES (NEWID(), @PId, N'{"subcategory": "Cars", "make": "Toyota", "model": "Land Cruiser", "year": 2022, "mileage": 15000, "location": "Shuwaikh"}', @now, @now);

INSERT INTO marketplace.ProductImages (id, product_id, image_url, is_primary, created_at)
VALUES (NEWID(), @PId, 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=800', 1, @now);


-- Item 2: Nissan Patrol
SET @PId = NEWID();
INSERT INTO marketplace.Products (id, seller_id, title, description, category, condition, price, currency, status, created_at, updated_at)
VALUES (@PId, @SellerProfileId, N'باترول بلاتينيوم 2023', N'باترول بلاتينيوم مكينة كبيرة، سيرفس منتظم، بحالة ممتازة.', 'Automotive', 'Used', 18900, 'KWD', 'published', DATEADD(day, -2, @now), @now);

INSERT INTO marketplace.ProductAttributes (id, product_id, attributes_json, created_at, updated_at)
VALUES (NEWID(), @PId, N'{"subcategory": "Cars", "make": "Nissan", "model": "Patrol", "year": 2023, "mileage": 5000, "location": "Salmiya"}', @now, @now);

INSERT INTO marketplace.ProductImages (id, product_id, image_url, is_primary, created_at)
VALUES (NEWID(), @PId, 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800', 1, @now);


-- Item 3: Mercedes G63
SET @PId = NEWID();
INSERT INTO marketplace.Products (id, seller_id, title, description, category, condition, price, currency, status, created_at, updated_at)
VALUES (@PId, @SellerProfileId, N'مرسيدس جي كلاس 2021', N'جي 63 نايت باكج، اللون اسود مطفي من الوكالة.', 'Automotive', 'Used', 52000, 'KWD', 'published', DATEADD(day, -5, @now), @now);

INSERT INTO marketplace.ProductAttributes (id, product_id, attributes_json, created_at, updated_at)
VALUES (NEWID(), @PId, N'{"subcategory": "Cars", "make": "Mercedes-Benz", "model": "G-Class", "year": 2021, "mileage": 22000, "location": "Jabriya"}', @now, @now);

INSERT INTO marketplace.ProductImages (id, product_id, image_url, is_primary, created_at)
VALUES (NEWID(), @PId, 'https://images.unsplash.com/photo-1520031441872-265e4ff70366?auto=format&fit=crop&w=800', 1, @now);


-- Item 4: Toyota Prado
SET @PId = NEWID();
INSERT INTO marketplace.Products (id, seller_id, title, description, category, condition, price, currency, status, created_at, updated_at)
VALUES (@PId, @SellerProfileId, N'برادو TXL 2018', N'برادو 6 سلندر، فتحة، ثلاجة، شرط الفحص.', 'Automotive', 'Used', 7800, 'KWD', 'published', DATEADD(day, -1, @now), @now);

INSERT INTO marketplace.ProductAttributes (id, product_id, attributes_json, created_at, updated_at)
VALUES (NEWID(), @PId, N'{"subcategory": "Cars", "make": "Toyota", "model": "Prado", "year": 2018, "mileage": 95000, "location": "Hawally"}', @now, @now);

INSERT INTO marketplace.ProductImages (id, product_id, image_url, is_primary, created_at)
VALUES (NEWID(), @PId, 'https://images.unsplash.com/photo-1533473359331-0135ef1bcfb0?auto=format&fit=crop&w=800', 1, @now);


-- Item 5: Ford Mustang
SET @PId = NEWID();
INSERT INTO marketplace.Products (id, seller_id, title, description, category, condition, price, currency, status, created_at, updated_at)
VALUES (@PId, @SellerProfileId, N'فورد موستانج 5.0 2019', N'جير عادي، اضافات كربون فايبر، اقزوز كورسا.', 'Automotive', 'Used', 8500, 'KWD', 'published', DATEADD(day, -10, @now), @now);

INSERT INTO marketplace.ProductAttributes (id, product_id, attributes_json, created_at, updated_at)
VALUES (NEWID(), @PId, N'{"subcategory": "Cars", "make": "Ford", "model": "Mustang", "year": 2019, "mileage": 40000, "location": "Riggai"}', @now, @now);

INSERT INTO marketplace.ProductImages (id, product_id, image_url, is_primary, created_at)
VALUES (NEWID(), @PId, 'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=800', 1, @now);


-- Item 6: Harley Davidson (Motorcycle)
SET @PId = NEWID();
INSERT INTO marketplace.Products (id, seller_id, title, description, category, condition, price, currency, status, created_at, updated_at)
VALUES (@PId, @SellerProfileId, N'هارلي ديفيدسون فات بوي', N'موديل 2020، بحالة الوكالة، سيرفس حديث.', 'Automotive', 'Used', 5500, 'KWD', 'published', DATEADD(day, -3, @now), @now);

INSERT INTO marketplace.ProductAttributes (id, product_id, attributes_json, created_at, updated_at)
VALUES (NEWID(), @PId, N'{"subcategory": "Motorcycles", "make": "Harley Davidson", "model": "Fat Boy", "year": 2020, "mileage": 8000, "location": "Jabriya"}', @now, @now);

INSERT INTO marketplace.ProductImages (id, product_id, image_url, is_primary, created_at)
VALUES (NEWID(), @PId, 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800', 1, @now);


-- Item 7: Polaris RZR (ATV)
SET @PId = NEWID();
INSERT INTO marketplace.Products (id, seller_id, title, description, category, condition, price, currency, status, created_at, updated_at)
VALUES (@PId, @SellerProfileId, N'بولاريس RZR 1000', N'تيربو، سماعات سقف، ليتات، جاهزة للموسم.', 'Automotive', 'Used', 4200, 'KWD', 'published', DATEADD(day, -7, @now), @now);

INSERT INTO marketplace.ProductAttributes (id, product_id, attributes_json, created_at, updated_at)
VALUES (NEWID(), @PId, N'{"subcategory": "ATVs", "make": "Polaris", "model": "RZR", "year": 2021, "mileage": 0, "location": "Khiran"}', @now, @now);

INSERT INTO marketplace.ProductImages (id, product_id, image_url, is_primary, created_at)
VALUES (NEWID(), @PId, 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800', 1, @now);


-- Item 8: Car Wash Service
SET @PId = NEWID();
INSERT INTO marketplace.Products (id, seller_id, title, description, category, condition, price, currency, status, created_at, updated_at)
VALUES (@PId, @SellerProfileId, N'غسيل سيارات متنقل VIP', N'غسيل وتلميع سيارات امام المنزل، مواد امريكية، عمالة مدربة.', 'Automotive', 'Service', 15, 'KWD', 'published', DATEADD(day, -1, @now), @now);

INSERT INTO marketplace.ProductAttributes (id, product_id, attributes_json, created_at, updated_at)
VALUES (NEWID(), @PId, N'{"subcategory": "Services", "location": "All Kuwait"}', @now, @now);

INSERT INTO marketplace.ProductImages (id, product_id, image_url, is_primary, created_at)
VALUES (NEWID(), @PId, 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=800', 1, @now);


-- Item 9: BMW X5
SET @PId = NEWID();
INSERT INTO marketplace.Products (id, seller_id, title, description, category, condition, price, currency, status, created_at, updated_at)
VALUES (@PId, @SellerProfileId, N'بي ام دبليو X5 2023', N'كت M power، شاشة عريضة، رادار، اوتو بارك.', 'Automotive', 'Used', 26500, 'KWD', 'published', DATEADD(day, -4, @now), @now);

INSERT INTO marketplace.ProductAttributes (id, product_id, attributes_json, created_at, updated_at)
VALUES (NEWID(), @PId, N'{"subcategory": "Cars", "make": "BMW", "model": "X5", "year": 2023, "mileage": 9000, "location": "Shuwaikh"}', @now, @now);

INSERT INTO marketplace.ProductImages (id, product_id, image_url, is_primary, created_at)
VALUES (NEWID(), @PId, 'https://images.unsplash.com/photo-1616422285623-13ff0162193c?auto=format&fit=crop&w=800', 1, @now);


-- Item 10: Range Rover Vogue
SET @PId = NEWID();
INSERT INTO marketplace.Products (id, seller_id, title, description, category, condition, price, currency, status, created_at, updated_at)
VALUES (@PId, @SellerProfileId, N'رنج روفر فوج 2022', N'اوتوبيوغرافي، لون مميز، صبغ وكالة.', 'Automotive', 'Used', 45000, 'KWD', 'published', DATEADD(day, -6, @now), @now);

INSERT INTO marketplace.ProductAttributes (id, product_id, attributes_json, created_at, updated_at)
VALUES (NEWID(), @PId, N'{"subcategory": "Cars", "make": "Land Rover", "model": "Range Rover", "year": 2022, "mileage": 18000, "location": "Shuwaikh"}', @now, @now);

INSERT INTO marketplace.ProductImages (id, product_id, image_url, is_primary, created_at)
VALUES (NEWID(), @PId, 'https://images.unsplash.com/photo-1606220838315-056192d5e927?auto=format&fit=crop&w=800', 1, @now);
