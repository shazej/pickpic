// Find Similar Products API - Qdrant vector search
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getTextEmbedding } from '@/lib/ai/openai';
import { searchProducts } from '@/lib/qdrant/client';

export async function POST(request: Request) {
  try {
    const { productId, query: textQuery } = await request.json();

    let embedding: number[];

    if (productId) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { title: true, description: true },
      });
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }
      embedding = await getTextEmbedding(`${product.title} ${product.description || ''}`.trim());
    } else if (textQuery) {
      embedding = await getTextEmbedding(textQuery);
    } else {
      return NextResponse.json({ error: 'productId or query required' }, { status: 400 });
    }

    const results = await searchProducts(embedding, { country_code: 'KW' }, 4);

    const productIds = results.map((r) => r.payload.product_id);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { images: { where: { isPrimary: true }, take: 1 } },
    });

    return NextResponse.json({
      results: products.map((p) => ({
        id: p.id,
        title: p.title,
        price: Number(p.price),
        currency: p.currency,
        image_url: p.images[0]?.url || null,
        score: results.find((r) => r.payload.product_id === p.id)?.score || 0,
      })),
    });
  } catch (error) {
    console.error('Find Similar Error:', error);
    return NextResponse.json({ error: 'Search Error' }, { status: 500 });
  }
}
