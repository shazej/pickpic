
const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'V3r!fy#92uM@xTq1zR71',
    server: 'static.193.212.55.162.clients.your-server.de',
    port: 1434,
    database: 'PICKPIC',
    options: {
        encrypt: true,
        trustServerCertificate: true,
    }
};

const sellerId = '49AA5E62-5A00-432D-98CB-5D420FAE22A6'; // Q8 Motors

const listings = [
    {
        "listing_url": "https://www.q84sale.com/en/listing/e-class-20519651",
        "listing_id": "20519651",
        "title": "E-Class",
        "price_amount": 2500,
        "price_currency": "KWD",
        "location_raw": "2014, 222 Km, Silver",
        "thumbnail_url": null
    },
    {
        "listing_url": "https://www.q84sale.com/en/listing/yukon-20519638",
        "listing_id": "20519638",
        "title": "Yukon",
        "price_amount": 7500,
        "price_currency": "KWD",
        "location_raw": "2019, 15 K Km, Silver",
        "thumbnail_url": null
    },
    {
        "listing_url": "https://www.q84sale.com/en/listing/bmw-20519648",
        "listing_id": "20519648",
        "title": "BMW",
        "price_amount": 4900,
        "price_currency": "KWD",
        "location_raw": "2021, 19 Km, Black",
        "thumbnail_url": null
    },
    {
        "listing_url": "https://www.q84sale.com/en/listing/cayenne-20519642",
        "listing_id": "20519642",
        "title": "Cayenne",
        "price_amount": 6500,
        "price_currency": "KWD",
        "location_raw": "2016, 140 Km, Black",
        "thumbnail_url": null
    },
    {
        "listing_url": "https://www.q84sale.com/en/listing/taurus-20483295",
        "listing_id": "20483295",
        "title": "Taurus",
        "price_amount": 1100,
        "price_currency": "KWD",
        "location_raw": "2012, 260 Km, White",
        "thumbnail_url": null
    },
    {
        "listing_url": "https://www.q84sale.com/en/listing/mustang-20483296",
        "listing_id": "20483296",
        "title": "Mustang",
        "price_amount": 5000,
        "price_currency": "KWD",
        "location_raw": "2011, 145 Km, Red",
        "thumbnail_url": null
    },
    {
        "listing_url": "https://www.q84sale.com/en/listing/sport-20498603",
        "listing_id": "20498603",
        "title": "Sport",
        "price_amount": 4650,
        "price_currency": "KWD",
        "location_raw": "2015, 260 Km, Silver",
        "thumbnail_url": null
    },
    {
        "listing_url": "https://www.q84sale.com/en/listing/teramont-20490762",
        "listing_id": "20490762",
        "title": "Teramont",
        "price_amount": 7200,
        "price_currency": "KWD",
        "location_raw": "2022, 89 Km, Gray",
        "thumbnail_url": null
    },
    {
        "listing_url": "https://www.q84sale.com/en/listing/fiat-20490761",
        "listing_id": "20490761",
        "title": "Fiat",
        "price_amount": 2800,
        "price_currency": "KWD",
        "location_raw": "2019, 90 Km, Blue",
        "thumbnail_url": null
    }
];

async function run() {
    try {
        console.log('Connecting...');
        const pool = await sql.connect(config);
        console.log('Connected!');

        for (const item of listings) {
            console.log(`Importing: ${item.title}...`);

            // Insert into Products
            const result = await pool.request()
                .input('seller_id', sql.UniqueIdentifier, sellerId)
                .input('title', sql.NVarChar, item.title)
                .input('description', sql.NVarChar, `Source: Q84Sale. Specs: ${item.location_raw}`)
                .input('category', sql.NVarChar, 'Automotive')
                .input('condition', sql.NVarChar, 'Used')
                .input('price', sql.Decimal(18, 2), item.price_amount)
                .input('currency', sql.Char(3), item.price_currency)
                .input('status', sql.NVarChar, 'published')
                .query(`
                    INSERT INTO marketplace.Products (seller_id, title, description, category, condition, price, currency, status, created_at, updated_at)
                    OUTPUT inserted.id
                    VALUES (@seller_id, @title, @description, @category, @condition, @price, @currency, @status, SYSDATETIME(), SYSDATETIME())
                `);

            const productId = result.recordset[0].id;

            // Insert into ProductImages if thumbnail exists (though extracted as null, handle for completeness)
            if (item.thumbnail_url) {
                await pool.request()
                    .input('product_id', sql.UniqueIdentifier, productId)
                    .input('image_url', sql.NVarChar, item.thumbnail_url)
                    .input('is_primary', sql.Bit, true)
                    .query(`
                        INSERT INTO marketplace.ProductImages (product_id, image_url, is_primary, created_at)
                        VALUES (@product_id, @image_url, @is_primary, SYSDATETIME())
                    `);
            }
        }

        console.log('Import completed successfully!');
        await pool.close();
    } catch (err) {
        console.error('Import failed:', err);
    }
}

run();
