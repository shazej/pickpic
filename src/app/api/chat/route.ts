// POST /api/chat - Core AI search endpoint with OpenAI tool calling
// Enables conversational multi-turn interactions with intelligent tool selection

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/jwt';
import {
  getTextEmbedding,
  chatWithProducts,
  processImageForSearch,
  analyzeImageForListing,
  generateSystemPrompt,
} from '@/lib/ai/openai';
import {
  getToolDefinitions,
  type SearchProductsParams,
  type CreateListingParams,
  type AnalyzeImageParams,
  type AskClarificationParams,
} from '@/lib/ai/tools';
import { searchProducts } from '@/lib/qdrant/client';
import { getPresignedReadUrl, getKeyFromUrl, CDN_URL } from '@/lib/s3/client';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      session_id,
      message,
      image_url,
      voice_transcript,
      location,
      mode = 'buy', // Default to buy mode if not specified
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

    // ============================
    // LOAD CONVERSATION HISTORY
    // ============================
    const conversationHistory = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: 20, // Last 20 messages for context
    });

    // ============================
    // BUILD MESSAGES FOR OPENAI TOOL CALLING
    // ============================
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: generateSystemPrompt(countryCode, language, mode as 'buy' | 'sell'),
      },
      ...conversationHistory.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      {
        role: 'user',
        content: userQuery || (image_url ? '[Image uploaded]' : ''),
      },
    ];

    // ============================
    // TOOL CALLING LOOP
    // ============================
    let assistantResponse = '';
    let products: Array<Record<string, unknown>> = [];
    let imageAnalysis = null;
    let searchQuery = userQuery;
    const maxIterations = 5; // Prevent infinite loops
    let iterations = 0;
    let clarificationCount = 0; // Track clarifications to enforce max

    while (iterations < maxIterations) {
      iterations++;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        tools: getToolDefinitions(mode as 'buy' | 'sell'),
        tool_choice: 'auto',
        temperature: 0.7,
      });

      const choice = completion.choices[0];

      // Check if AI wants to call tools
      if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
        // Add assistant's tool call message to conversation
        messages.push(choice.message);

        // Execute each tool call
        for (const toolCall of choice.message.tool_calls) {
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);

          // Track clarifications and enforce limit
          if (toolName === 'ask_clarification') {
            clarificationCount++;

            // If we've asked 2+ clarifications, override with search instead
            if (clarificationCount >= 2) {
              console.log('Max clarifications reached, forcing search instead');
              // Override: search with whatever info we have
              const forcedSearchArgs: SearchProductsParams = {
                search_query: userQuery || 'products',
              };
              const searchResult = await executeSearchProducts(
                forcedSearchArgs,
                countryCode,
                regionId
              );
              products = searchResult.products;
              searchQuery = forcedSearchArgs.search_query;

              // Add a message to explain we're searching
              messages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: JSON.stringify({
                  clarification: 'Understood. Let me search for what you described.',
                  forced_search: true,
                }),
              });
              continue; // Skip the normal tool execution
            }
          }

          let toolResult: unknown;

          try {
            switch (toolName) {
              case 'search_products':
                const searchResult = await executeSearchProducts(
                  toolArgs as SearchProductsParams,
                  countryCode,
                  regionId
                );
                products = searchResult.products;
                searchQuery = toolArgs.search_query;
                toolResult = searchResult;
                break;

              case 'create_listing':
                toolResult = await executeCreateListing(
                  toolArgs as CreateListingParams,
                  user
                );
                break;

              case 'ask_clarification':
                toolResult = {
                  clarification: (toolArgs as AskClarificationParams).question,
                };
                break;

              case 'analyze_image_for_search':
                if (image_url) {
                  // Get presigned URL for OpenAI
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
                  imageAnalysis = imageResult.analysis;
                  toolResult = {
                    analysis: imageResult.analysis,
                    search_text:
                      language === 'ar'
                        ? imageResult.analysis.search_text_ar
                        : imageResult.analysis.search_text,
                  };
                } else {
                  toolResult = { error: 'No image provided' };
                }
                break;

              case 'analyze_image_for_listing':
                if (image_url) {
                  // Get presigned URL for OpenAI
                  let imageUrlForAI = image_url;
                  const s3Key = getKeyFromUrl(image_url);
                  if (s3Key) {
                    imageUrlForAI = await getPresignedReadUrl(s3Key);
                  }

                  const listingAnalysis = await analyzeImageForListing(
                    imageUrlForAI,
                    countryCode
                  );
                  imageAnalysis = listingAnalysis;
                  toolResult = listingAnalysis;
                } else {
                  toolResult = { error: 'No image provided' };
                }
                break;

              default:
                toolResult = { error: 'Unknown tool' };
            }
          } catch (error) {
            console.error(`Tool execution error for ${toolName}:`, error);
            toolResult = {
              error: 'Tool execution failed',
              message: error instanceof Error ? error.message : 'Unknown error',
            };
          }

          // Add tool result to conversation
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult),
          });
        }
      } else {
        // AI responded with text - conversation complete
        assistantResponse = choice.message.content || '';
        break;
      }
    }

    // Safety check: if we hit max iterations, generate a fallback response
    if (iterations >= maxIterations && !assistantResponse) {
      assistantResponse =
        language === 'ar'
          ? 'عذراً، حدث خطأ في معالجة طلبك. يرجى المحاولة مرة أخرى.'
          : 'Sorry, there was an error processing your request. Please try again.';
    }

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
    const productIds = products.map((p) => p.id as string);
    const assistantMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'assistant',
        content: assistantResponse,
        productIds: productIds,
      },
    });

    // Log search for analytics (only if products were actually searched)
    if (products.length > 0) {
      await prisma.searchLog.create({
        data: {
          sessionId,
          userId: user?.userId || null,
          queryText: searchQuery || userQuery,
          queryType: image_url ? 'image' : voice_transcript ? 'voice' : 'text',
          filters: { country_code: countryCode } as object,
          resultCount: products.length,
          latencyMs,
          countryCode,
        },
      }).catch(() => {
        // Non-critical, don't fail the response
      });
    }

    return NextResponse.json({
      session_id: sessionId,
      message: {
        id: assistantMessage.id,
        role: 'assistant',
        content: assistantResponse,
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

// ============================================
// TOOL EXECUTION HELPER FUNCTIONS
// ============================================

/**
 * Execute product search using Qdrant vector DB
 */
async function executeSearchProducts(
  args: SearchProductsParams,
  countryCode: string,
  regionId?: number
): Promise<{ products: Array<Record<string, unknown>>; count: number }> {
  // Generate embedding from search query
  const embedding = await getTextEmbedding(args.search_query);

  // Build filters
  const filters: Record<string, unknown> = { country_code: countryCode };
  if (args.category) filters.category_slug = args.category;
  if (args.min_price) filters.min_price = args.min_price;
  if (args.max_price) filters.max_price = args.max_price;
  if (regionId || args.region_id) filters.region_id = args.region_id || regionId;

  // Search Qdrant vector DB
  const searchResults = await searchProducts(
    embedding,
    filters as {
      country_code: string;
      category_slug?: string;
      min_price?: number;
      max_price?: number;
      region_id?: number;
    },
    10
  );

  // Get full product details from database
  const productIds = searchResults.map((r) => r.payload.product_id);

  if (productIds.length === 0) {
    return { products: [], count: 0 };
  }

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

  // Attach similarity scores and boost title matches
  const queryLower = args.search_query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/).filter((w) => w.length > 2);

  const products = dbProducts
    .map((p) => {
      const baseScore =
        searchResults.find((r) => r.payload.product_id === p.id)?.score || 0;

      // Boost score for title matches
      const titleLower = p.title.toLowerCase();
      let boost = 0;
      if (titleLower.includes(queryLower)) {
        boost = 0.15;
      } else {
        const matchCount = queryTerms.filter((term) => titleLower.includes(term)).length;
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
        location: p.region ? { region: p.region.name, region_ar: p.region.nameAr } : null,
        similarity_score: Math.min(baseScore + boost, 1.0),
      };
    })
    .sort((a, b) => (b.similarity_score as number) - (a.similarity_score as number));

  return {
    products,
    count: products.length,
  };
}

/**
 * Execute listing creation (for sell mode)
 */
async function executeCreateListing(
  args: CreateListingParams,
  user: { userId: string } | null
): Promise<{ success: boolean; product_id?: string; error?: string; message?: string }> {
  // Check authentication
  if (!user) {
    return {
      success: false,
      error: 'Authentication required',
      message: 'Please log in to create listings',
    };
  }

  try {
    // TODO: Implement full listing creation logic
    // This should integrate with the existing POST /api/products logic
    // For now, return a placeholder response

    return {
      success: false,
      message:
        'Listing creation via tool calling is not yet fully implemented. Please use the listing creation UI for now.',
    };

    // Future implementation:
    // 1. Find or create seller profile
    // 2. Create product with all details
    // 3. Link images
    // 4. Generate Qdrant vector embedding
    // 5. Return product ID
  } catch (error) {
    console.error('Create listing error:', error);
    return {
      success: false,
      error: 'Failed to create listing',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
