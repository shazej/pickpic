const sql = require('mssql');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: '.env.local' });

const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    port: parseInt(process.env.DB_PORT || '1434'),
    database: process.env.DB_NAME || 'PICKPIC',
    options: {
        encrypt: true,
        trustServerCertificate: true,
    }
};

function getDeterministicMockEmbedding(text) {
    const vector = new Array(768).fill(0).map((_, i) => (i / 768.0) * 0.1); // Small base noise
    const keywords = ['cake', 'camera', 'watch', 'car', 'graduation', 'luxury', 'professional', 'vintage', 'rugged', 'classic'];
    keywords.forEach((word, i) => {
        if (text.toLowerCase().includes(word)) {
            for (let j = 0; j < 50; j++) {
                vector[(i * 50 + j) % 768] += 0.5; // Distribute keyword influence
            }
        }
    });
    // Add unique hash for "specific" identity
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) - hash) + text.charCodeAt(i);
        hash |= 0;
    }
    vector[0] += (hash % 100) / 100;
    return vector;
}

async function seed() {
    console.log('Starting clean product seeding with mock fallback...');

    let pool;
    try {
        pool = await sql.connect(config);
        console.log('Database connected successfully');
    } catch (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }

    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    let genAI, model, embedModel;
    let useMock = false;

    if (!apiKey || apiKey.startsWith('AIzaSyCyqz5UadIE')) {
        console.warn('Leaked or missing API key detected. Using Mock Embeddings for the demo.');
        useMock = true;
    } else {
        try {
            genAI = new GoogleGenerativeAI(apiKey);
            model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
            embedModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
        } catch (e) {
            console.warn('AI Setup failed, using Mock Embeddings:', e.message);
            useMock = true;
        }
    }

    let sellerId = '49AA5E62-5A00-432D-98CB-5D420FAE22A6';

    const products = [
        { category: 'Cakes', title: 'Graduation Cake - Excellence', price: 45.0, image: 'grad_cake_1.png', description: 'Elegant 2-tier graduation cake with black cap and gold tassels.' },
        { category: 'Cakes', title: 'Graduation Cake - Celebration', price: 50.0, image: 'grad_cake_2.png', description: 'Blue and white graduation cake with silver stars and diploma.' },
        { category: 'Cakes', title: 'Graduation Cake - Minimalist', price: 40.0, image: 'grad_cake_3.png', description: 'Modern white graduation cake with gold mortarboard topper.' },
        { category: 'Cakes', title: 'Graduation Cake - Fun Stack', price: 55.0, image: 'grad_cake_4.png', description: 'Fun multi-colored cake with book stack base and cap.' },

        { category: 'Cameras', title: 'Professional DSLR Camera', price: 1200.0, image: 'camera_1.png', description: 'High-end black DSLR camera with professional lens.' },
        { category: 'Cameras', title: 'Vintage Mirrorless Camera', price: 850.0, image: 'camera_2.png', description: 'Retro silver mirrorless camera with leather strap.' },
        { category: 'Cameras', title: 'Rugged Action Camera', price: 350.0, image: 'camera_3.png', description: 'Durable yellow action camera for sports and travel.' },
        { category: 'Cameras', title: 'Classic Film Camera', price: 1500.0, image: 'camera_4.png', description: 'Timeless film camera with manual dials and metal body.' },

        { category: 'Luxury', title: 'Luxury Chronograph Watch', price: 5000.0, image: 'watch_1.png', description: 'Premium silver chronograph watch with blue dial.' },
        { category: 'Luxury', title: 'Elegant Dress Watch', price: 3500.0, image: 'watch_2.jpg', description: 'Gold dress watch with black leather strap.' },
        { category: 'Luxury', title: 'Mercedes-Benz Luxury Car', price: 45000.0, image: 'car_1.jpg', description: 'Silver Mercedes-Benz luxury sedan in pristine condition.' },
        { category: 'Luxury', title: 'Professional Mirrorless Kit', price: 2100.0, image: 'camera_5.png', description: 'Advanced black mirrorless camera kit for professionals.' }
    ];

    for (const p of products) {
        console.log(`Processing product: ${p.title}`);
        const productId = uuidv4();
        const imageId = uuidv4();
        const imageUrl = `/uploads/${p.image}`;
        const filePath = path.join(process.cwd(), 'public', imageUrl);

        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            continue;
        }

        try {
            // Cleanup existing
            const findRecords = await pool.request()
                .input('url', sql.NVarChar, imageUrl)
                .query('SELECT product_id, id FROM marketplace.ProductImages WHERE image_url = @url');

            for (const record of findRecords.recordset) {
                await pool.request().input('imgid', sql.UniqueIdentifier, record.id).query('DELETE FROM ai.ImageEmbeddings WHERE product_image_id = @imgid');
                await pool.request().input('imgid', sql.UniqueIdentifier, record.id).query('DELETE FROM marketplace.ProductImages WHERE id = @imgid');
                await pool.request().input('pid', sql.UniqueIdentifier, record.product_id).query('DELETE FROM marketplace.Products WHERE id = @pid');
            }

            // 1. Insert Product
            await pool.request()
                .input('id', sql.UniqueIdentifier, productId)
                .input('seller_id', sql.UniqueIdentifier, sellerId)
                .input('title', sql.NVarChar, p.title)
                .input('description', sql.NVarChar, p.description)
                .input('category', sql.NVarChar, p.category)
                .input('price', sql.Decimal(18, 2), p.price)
                .input('status', sql.NVarChar, 'published')
                .query('INSERT INTO marketplace.Products (id, seller_id, title, description, category, price, status) VALUES (@id, @seller_id, @title, @description, @category, @price, @status)');

            // 2. Insert Image
            await pool.request()
                .input('id', sql.UniqueIdentifier, imageId)
                .input('product_id', sql.UniqueIdentifier, productId)
                .input('image_url', sql.NVarChar, imageUrl)
                .query('INSERT INTO marketplace.ProductImages (id, product_id, image_url, is_primary) VALUES (@id, @product_id, @image_url, 1)');

            // 3. Generate Embedding
            let embedding;
            if (useMock) {
                console.log(`Using mock embedding for ${p.title}`);
                embedding = getDeterministicMockEmbedding(`${p.category} ${p.title} ${p.description}`);
            } else {
                try {
                    const imageBuffer = fs.readFileSync(filePath);
                    const base64Image = imageBuffer.toString('base64');
                    const mimeType = p.image.endsWith('.png') ? 'image/png' : 'image/jpeg';
                    const prompt = `Describe this product: ${p.description}`;
                    const imagePart = { inlineData: { data: base64Image, mimeType: mimeType } };
                    const result = await model.generateContent([prompt, imagePart]);
                    const aiDescription = result.response.text();
                    const embedResult = await embedModel.embedContent(aiDescription);
                    embedding = embedResult.embedding.values;
                } catch (e) {
                    console.error('AI step failed mid-loop, falling back to mock:', e.message);
                    embedding = getDeterministicMockEmbedding(`${p.category} ${p.title} ${p.description}`);
                }
            }

            const embeddingJson = JSON.stringify(embedding);

            // 4. Save Embedding
            await pool.request()
                .input('image_id', sql.UniqueIdentifier, imageId)
                .input('model', sql.NVarChar, useMock ? 'mock-deterministic' : 'text-embedding-004')
                .input('vector', sql.NVarChar, embeddingJson)
                .query('INSERT INTO ai.ImageEmbeddings (product_image_id, model_name, embedding_json) VALUES (@image_id, @model, @vector)');

            console.log(`Successfully seeded: ${p.title}`);
        } catch (err) {
            console.error(`Failed to seed ${p.title}:`, err);
        }
    }

    console.log('Seeding completed.');
    await pool.close();
    process.exit(0);
}

seed();
