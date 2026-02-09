const sql = require('mssql');

const config = "Server=162.55.212.193,1434;Database=pickpic;User Id=sa;Password=V3r!fy#92uM@xTq1zR71;TrustServerCertificate=True;MultipleActiveResultSets=true;Encrypt=False";

async function addListings() {
    try {
        console.log('Connecting to database...');
        const pool = await sql.connect(config);
        console.log('Connected.');

        // 1. Get SellerProfileId for Q8 Motors
        const sellerResult = await pool.request().query("SELECT id FROM marketplace.SellerProfiles WHERE store_name = 'Q8 Motors'");
        if (sellerResult.recordset.length === 0) {
            console.error('Seller "Q8 Motors" not found. Please run seed-automotive.sql first.');
            process.exit(1);
        }
        const sellerProfileId = sellerResult.recordset[0].id;
        console.log(`Using SellerProfileId: ${sellerProfileId}`);

        const listings = [
            {
                title: 'مرسيدس CLA 200 2021',
                description: 'نظيف ماشي 52 الف شرط الفحص cla200 مرسيدس',
                price: 8500,
                attributes: {
                    subcategory: 'Cars',
                    make: 'Mercedes-Benz',
                    model: 'CLA 200',
                    year: 2021,
                    mileage: 52000,
                    location: 'Hawalli',
                    color: 'Dark Blue',
                    body: 'Sedan',
                    features: ['Panoramic']
                },
                imageUrl: '/images/listings/mercedes-cla.png'
            },
            {
                title: 'وانيت مازدا 2015',
                description: 'وانيت مازدا 2015 بحاله ممتازه جير عادي شرط الفحص جام تماتيك فير عادي',
                price: 1300,
                attributes: {
                    subcategory: 'Trucks',
                    make: 'Mazda',
                    model: 'BT-50',
                    year: 2015,
                    mileage: 270000,
                    location: 'Jaber Al-ahmed',
                    color: 'White',
                    body: 'Truck',
                    transmission: 'Manual'
                },
                imageUrl: '/images/listings/mazda-bt50.png'
            }
        ];

        for (const listing of listings) {
            const productId = require('crypto').randomUUID();
            const now = new Date().toISOString();

            console.log(`Adding ${listing.title}...`);

            // Insert Product
            await pool.request()
                .input('id', sql.UniqueIdentifier, productId)
                .input('seller_id', sql.UniqueIdentifier, sellerProfileId)
                .input('title', sql.NVarChar, listing.title)
                .input('description', sql.NVarChar, listing.description)
                .input('category', sql.NVarChar, 'Automotive')
                .input('condition', sql.NVarChar, 'Used')
                .input('price', sql.Decimal(18, 2), listing.price)
                .input('currency', sql.NVarChar, 'KWD')
                .input('status', sql.NVarChar, 'published')
                .input('created_at', sql.DateTime2, now)
                .input('updated_at', sql.DateTime2, now)
                .query(`
                    INSERT INTO marketplace.Products (id, seller_id, title, description, category, condition, price, currency, status, created_at, updated_at)
                    VALUES (@id, @seller_id, @title, @description, @category, @condition, @price, @currency, @status, @created_at, @updated_at)
                `);

            // Insert Attributes
            await pool.request()
                .input('id', sql.UniqueIdentifier, require('crypto').randomUUID())
                .input('product_id', sql.UniqueIdentifier, productId)
                .input('attributes_json', sql.NVarChar, JSON.stringify(listing.attributes))
                .input('created_at', sql.DateTime2, now)
                .input('updated_at', sql.DateTime2, now)
                .query(`
                    INSERT INTO marketplace.ProductAttributes (id, product_id, attributes_json, created_at, updated_at)
                    VALUES (@id, @product_id, @attributes_json, @created_at, @updated_at)
                `);

            // Insert Image
            await pool.request()
                .input('id', sql.UniqueIdentifier, require('crypto').randomUUID())
                .input('product_id', sql.UniqueIdentifier, productId)
                .input('image_url', sql.NVarChar, listing.imageUrl)
                .input('is_primary', sql.Bit, 1)
                .input('created_at', sql.DateTime2, now)
                .query(`
                    INSERT INTO marketplace.ProductImages (id, product_id, image_url, is_primary, created_at)
                    VALUES (@id, @product_id, @image_url, @is_primary, @created_at)
                `);
        }

        console.log('Listings added successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error adding listings:', err);
        process.exit(1);
    }
}

addListings();
