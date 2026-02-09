// POST /api/chat - Core AI search endpoint
// Unified text, voice, and image search

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/jwt';
import {
  getTextEmbedding,
  chatWithProducts,
  processImageForSearch,
} from '@/lib/ai/openai';
import { searchProducts } from '@/lib/qdrant/client';
import { getPresignedReadUrl, getKeyFromUrl, CDN_URL } from '@/lib/s3/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      session_id,
      message,
      image_url,
      voice_transcript,
      location,
    } = body;

    const countryCode = location?.country_code || 'KW';
    const language = location?.language || 'ar';
    const regionId = location?.region_id;

    // Determine the search query from text, voice, or image
    const userQuery = message || voice_transcript || '';

    if (!userQuery && !image_url) {
      return NextResponse.json(
        { error: 'Message, voice transcript, or image is required' },
        { status: 400 }
      );
    }

    // Optionally get current user (chat works for anonymous too)
    const user = await getCurrentUser().catch(() => null);

    // Find or create chat session
    let sessionId = session_id;
    if (!sessionId) {
      const session = await prisma.chatSession.create({
        data: {
          userId: user?.userId || null,
          sessionToken: !user ? crypto.randomUUID() : null,
          countryCode,
          language,
        },
      });
      sessionId = session.id;
    } else {
      // Update last message timestamp
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { lastMessageAt: new Date() },
      }).catch(() => {
        // Session might not exist if client sent stale ID
      });
    }

    const startTime = Date.now();

    let embedding: number[];
    let filters: Record<string, unknown> = {
      country_code: countryCode,
    };
    let imageAnalysis = null;
    let searchQuery = userQuery;

    // ============================
    // HANDLE IMAGE SEARCH
    // ============================
    if (image_url) {
      // If this is an S3 URL, generate a presigned GET URL for OpenAI to download
      // (avoids public access issues and SSL problems with dotted bucket names)
      let imageUrlForAI = image_url;
      const s3Key = getKeyFromUrl(image_url);
      if (s3Key) {
        imageUrlForAI = await getPresignedReadUrl(s3Key);
      }

      const imageResult = await processImageForSearch(
        imageUrlForAI,
        countryCode,
        language
      );

      embedding = imageResult.embedding;
      filters = { ...filters, ...imageResult.filters };
      imageAnalysis = imageResult.analysis;
      searchQuery = imageResult.analysis.search_text;
    }
    // ============================
    // HANDLE TEXT/VOICE SEARCH
    // ============================
    else {
      // Use AI to parse intent and extract filters
      const categories = await prisma.category.findMany({
        where: { isActive: true },
        select: { slug: true },
      });

      const aiParsed = await chatWithProducts(
        [{ role: 'user', content: userQuery }],
        {
          country_code: countryCode,
          language,
          available_categories: categories.map((c) => c.slug),
        }
      );

      // Use AI-extracted search query for embedding, or fall back to raw query
      searchQuery = aiParsed.search_query || userQuery;

      // Merge AI-parsed filters
      if (aiParsed.filters) {
        if (aiParsed.filters.category) {
          filters.category_slug = aiParsed.filters.category;
        }
        if (aiParsed.filters.min_price) {
          filters.min_price = aiParsed.filters.min_price;
        }
        if (aiParsed.filters.max_price) {
          filters.max_price = aiParsed.filters.max_price;
        }
      }

      embedding = await getTextEmbedding(searchQuery);
    }

    // Add region filter if specified
    if (regionId) {
      filters.region_id = regionId;
    }

    // ============================
    // SEARCH QDRANT
    // ============================
    const searchResults = await searchProducts(
      embedding,
      filters as { country_code: string; category_slug?: string; min_price?: number; max_price?: number; region_id?: number },
      10
    );

    // ============================
    // GET FULL PRODUCT DETAILS
    // ============================
    const productIds = searchResults.map((r) => r.payload.product_id);
    let products: Array<Record<string, unknown>> = [];

    if (productIds.length > 0) {
      const dbProducts = await prisma.product.findMany({
        where: { id: { in: productIds } },
        include: {
          images: {
            where: { isPrimary: true },
            take: 1,
          },
          seller: {
            select: {
              businessName: true,
              phonePublic: true,
              whatsappNumber: true,
              user: {
                select: { name: true },
              },
            },
          },
          region: {
            select: { name: true, nameAr: true },
          },
          category: {
            select: { slug: true, name: true, nameAr: true },
          },
        },
      });

      // Attach similarity scores, boost exact title matches, and order by boosted score
      const queryLower = searchQuery.toLowerCase();
      const queryTerms = queryLower.split(/\s+/).filter((w: string) => w.length > 2);

      products = dbProducts
        .map((p) => {
          const baseScore =
            searchResults.find((r) => r.payload.product_id === p.id)?.score || 0;

          // Boost score for exact/partial title matches
          const titleLower = p.title.toLowerCase();
          let boost = 0;
          // Exact query match in title → big boost
          if (titleLower.includes(queryLower)) {
            boost = 0.15;
          } else {
            // Count how many search terms appear in the title
            const matchCount = queryTerms.filter((term: string) => titleLower.includes(term)).length;
            if (queryTerms.length > 0) {
              boost = (matchCount / queryTerms.length) * 0.1;
            }
          }

          return {
            id: p.id,
            title: p.title,
            title_ar: p.titleAr,
            description: p.description || null,
            description_ar: p.descriptionAr || null,
            price: Number(p.price),
            currency: p.currency,
            condition: p.condition,
            is_negotiable: p.isNegotiable,
            image_url: p.images[0]?.url || null,
            category: p.category
              ? { slug: p.category.slug, name: p.category.name, name_ar: p.category.nameAr }
              : null,
            seller: {
              name: p.seller.businessName || p.seller.user.name,
              phone: p.seller.phonePublic,
              whatsapp: p.seller.whatsappNumber,
            },
            location: p.region
              ? { region: p.region.name, region_ar: p.region.nameAr }
              : null,
            similarity_score: Math.min(baseScore + boost, 1.0),
          };
        })
        .sort((a, b) => (b.similarity_score as number) - (a.similarity_score as number));
    }

    // ============================
    // GENERATE AI RESPONSE
    // ============================
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true },
    });

    const aiResponse = await chatWithProducts(
      [{ role: 'user', content: searchQuery }],
      {
        country_code: countryCode,
        language,
        available_categories: categories.map((c) => c.slug),
        products_found: products.length,
      }
    );

    const latencyMs = Date.now() - startTime;

    // ============================
    // SAVE MESSAGES TO DB
    // ============================
    // Save user message
    await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'user',
        content: userQuery || '[Image search]',
        hasImage: !!image_url,
        imageUrl: image_url || null,
        hasVoice: !!voice_transcript,
        voiceTranscript: voice_transcript || null,
      },
    });

    // Save assistant message
    const assistantMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'assistant',
        content: aiResponse.response || '',
        productIds: productIds,
      },
    });

    // Log search for analytics
    await prisma.searchLog.create({
      data: {
        sessionId,
        userId: user?.userId || null,
        queryText: searchQuery,
        queryType: image_url ? 'image' : voice_transcript ? 'voice' : 'text',
        filters: filters as object,
        resultCount: products.length,
        latencyMs,
        countryCode,
      },
    }).catch(() => {
      // Non-critical, don't fail the response
    });

    return NextResponse.json({
      session_id: sessionId,
      message: {
        id: assistantMessage.id,
        role: 'assistant',
        content: aiResponse.response,
        image_analysis: imageAnalysis,
        products,
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
