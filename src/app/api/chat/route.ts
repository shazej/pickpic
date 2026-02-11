// POST /api/chat - Core AI chat endpoint with OpenAI tool calling + SSE streaming
// Streams: status events during tool execution, text deltas for AI response, product/analysis data

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/jwt';
import {
  getTextEmbedding,
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
import { searchProducts, indexProduct } from '@/lib/qdrant/client';
import { getPresignedReadUrl, getKeyFromUrl, CDN_URL } from '@/lib/s3/client';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// SSE helper: format an event for the stream
function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

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
          title: userQuery ? userQuery.slice(0, 100) : null,
          countryCode,
          language,
        },
      });
      sessionId = session.id;
    } else {
      // Update last message timestamp + set title if still empty
      const existing = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        select: { title: true },
      }).catch(() => null);
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: {
          lastMessageAt: new Date(),
          ...(!existing?.title && userQuery ? { title: userQuery.slice(0, 100) } : {}),
        },
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
      take: 20,
    });

    // ============================
    // RESOLVE IMAGE URL
    // ============================
    let resolvedImageUrl = image_url || null;
    if (!resolvedImageUrl) {
      const lastImageMsg = [...conversationHistory]
        .reverse()
        .find((msg) => msg.hasImage && msg.imageUrl);
      if (lastImageMsg) {
        resolvedImageUrl = lastImageMsg.imageUrl;
      }
    }

    // ============================
    // BUILD MESSAGES FOR OPENAI
    // ============================
    let userContent = userQuery;
    if (image_url) {
      userContent = userQuery
        ? `${userQuery}\n[User uploaded an image: ${image_url}]`
        : `[User uploaded an image: ${image_url}]`;
    }

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: generateSystemPrompt(countryCode, language),
      },
      ...conversationHistory.map((msg) => {
        if (msg.hasImage && msg.imageUrl) {
          return {
            role: msg.role as 'user' | 'assistant',
            content: `${msg.content}\n[Image: ${msg.imageUrl}]`,
          };
        }
        return {
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        };
      }),
      {
        role: 'user',
        content: userContent || '[Empty message]',
      },
    ];

    // ============================
    // SSE STREAMING RESPONSE
    // ============================
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let products: Array<Record<string, unknown>> = [];
          let imageAnalysis = null;
          let searchQuery = userQuery;
          const maxIterations = 5;
          let iterations = 0;
          let clarificationCount = 0;
          let assistantResponse = '';

          // Send initial thinking status
          controller.enqueue(encoder.encode(sseEvent('status', {
            text: language === 'ar' ? 'جاري التفكير...' : 'Thinking...',
          })));

          // ============================
          // FULLY STREAMING TOOL CALLING LOOP
          // Every OpenAI call uses stream:true so text arrives token-by-token
          // ============================

          while (iterations < maxIterations) {
            iterations++;

            const streamCompletion = await openai.chat.completions.create({
              model: 'gpt-4o',
              messages,
              tools: getToolDefinitions(),
              tool_choice: 'auto',
              temperature: 0.7,
              stream: true,
            });

            // Accumulate streamed response: could be tool calls OR text
            const toolCallChunks = new Map<number, { id: string; name: string; arguments: string }>();
            let hasToolCalls = false;
            let responseContent = '';

            for await (const chunk of streamCompletion) {
              const delta = chunk.choices[0]?.delta;
              if (!delta) continue;

              // Accumulate tool call chunks
              if (delta.tool_calls) {
                hasToolCalls = true;
                for (const tc of delta.tool_calls) {
                  const existing = toolCallChunks.get(tc.index) || { id: '', name: '', arguments: '' };
                  if (tc.id) existing.id = tc.id;
                  if (tc.function?.name) existing.name = tc.function.name;
                  if (tc.function?.arguments) existing.arguments += tc.function.arguments;
                  toolCallChunks.set(tc.index, existing);
                }
              }

              // Stream text content directly to client (real-time, token by token)
              if (delta.content) {
                // Clear any status on first text token
                if (!responseContent) {
                  controller.enqueue(encoder.encode(sseEvent('status', { text: '' })));
                }
                responseContent += delta.content;
                controller.enqueue(encoder.encode(sseEvent('delta', { content: delta.content })));
              }
            }

            if (hasToolCalls) {
              // AI wants to call tools — build message and execute them
              const toolCallsArray = Array.from(toolCallChunks.values());

              messages.push({
                role: 'assistant',
                content: responseContent || null,
                tool_calls: toolCallsArray.map((tc) => ({
                  id: tc.id,
                  type: 'function' as const,
                  function: { name: tc.name, arguments: tc.arguments },
                })),
              });

              for (const tc of toolCallsArray) {
                const toolName = tc.name;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let toolArgs: any;
                try {
                  toolArgs = JSON.parse(tc.arguments);
                } catch {
                  toolArgs = {};
                }

                // Send status event to client
                const statusMessages: Record<string, string> = {
                  search_products: language === 'ar' ? 'جاري البحث عن المنتجات...' : 'Searching products...',
                  analyze_image_for_search: language === 'ar' ? 'جاري تحليل الصورة...' : 'Analyzing image...',
                  analyze_image_for_listing: language === 'ar' ? 'جاري تحليل الصورة للإعلان...' : 'Analyzing image for listing...',
                  create_listing: language === 'ar' ? 'جاري إنشاء الإعلان...' : 'Creating listing...',
                  ask_clarification: '',
                };
                const statusText = statusMessages[toolName];
                if (statusText) {
                  controller.enqueue(encoder.encode(sseEvent('status', { text: statusText })));
                }

                // Track clarifications and enforce limit
                if (toolName === 'ask_clarification') {
                  clarificationCount++;

                  if (clarificationCount >= 2) {
                    console.log('Max clarifications reached, forcing search instead');
                    const forcedSearchArgs: SearchProductsParams = {
                      search_query: userQuery || 'products',
                    };
                    controller.enqueue(encoder.encode(sseEvent('status', {
                      text: language === 'ar' ? 'جاري البحث عن المنتجات...' : 'Searching products...',
                    })));
                    const searchResult = await executeSearchProducts(
                      forcedSearchArgs,
                      countryCode,
                      regionId
                    );
                    products = searchResult.products;
                    searchQuery = forcedSearchArgs.search_query;

                    controller.enqueue(encoder.encode(sseEvent('products', {
                      products,
                      count: products.length,
                    })));

                    messages.push({
                      role: 'tool',
                      tool_call_id: tc.id,
                      content: JSON.stringify({
                        clarification: 'Understood. Let me search for what you described.',
                        forced_search: true,
                      }),
                    });
                    continue;
                  }
                }

                let toolResult: unknown;

                try {
                  switch (toolName) {
                    case 'search_products': {
                      const searchResult = await executeSearchProducts(
                        toolArgs as SearchProductsParams,
                        countryCode,
                        regionId
                      );
                      products = searchResult.products;
                      searchQuery = (toolArgs as SearchProductsParams).search_query;
                      toolResult = searchResult;

                      controller.enqueue(encoder.encode(sseEvent('products', {
                        products,
                        count: products.length,
                      })));
                      break;
                    }

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
                      if (resolvedImageUrl) {
                        let imageUrlForAI = resolvedImageUrl;
                        const s3Key = getKeyFromUrl(resolvedImageUrl);
                        if (s3Key) {
                          imageUrlForAI = await getPresignedReadUrl(s3Key);
                        }

                        const imageResult = await processImageForSearch(
                          imageUrlForAI,
                          countryCode,
                          language
                        );
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
                      if (resolvedImageUrl) {
                        let imageUrlForAI = resolvedImageUrl;
                        const s3Key = getKeyFromUrl(resolvedImageUrl);
                        if (s3Key) {
                          imageUrlForAI = await getPresignedReadUrl(s3Key);
                        }

                        const listingAnalysis = await analyzeImageForListing(
                          imageUrlForAI,
                          countryCode
                        );
                        imageAnalysis = listingAnalysis;
                        toolResult = listingAnalysis;

                        controller.enqueue(encoder.encode(sseEvent('analysis', {
                          image_analysis: imageAnalysis,
                        })));
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

                messages.push({
                  role: 'tool',
                  tool_call_id: tc.id,
                  content: JSON.stringify(toolResult),
                });
              }
            } else {
              // AI responded with pure text (no tools) — already streamed via deltas above
              assistantResponse = responseContent;
              break;
            }
          }

          // Safety check: if we hit max iterations without a response
          if (iterations >= maxIterations && !assistantResponse) {
            assistantResponse =
              language === 'ar'
                ? 'عذراً، حدث خطأ في معالجة طلبك. يرجى المحاولة مرة أخرى.'
                : 'Sorry, there was an error processing your request. Please try again.';
            controller.enqueue(encoder.encode(sseEvent('delta', { content: assistantResponse })));
          }

          const latencyMs = Date.now() - startTime;

          // ============================
          // SAVE MESSAGES TO DB
          // ============================
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

          const productIds = products.map((p) => p.id as string);
          const assistantMessage = await prisma.chatMessage.create({
            data: {
              sessionId,
              role: 'assistant',
              content: assistantResponse,
              productIds: productIds,
            },
          });

          // Log search for analytics
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
            }).catch(() => {});
          }

          // Send final done event with IDs
          controller.enqueue(encoder.encode(sseEvent('done', {
            session_id: sessionId,
            message_id: assistantMessage.id,
          })));

          controller.close();
        } catch (error) {
          console.error('Chat streaming error:', error);
          const errorMsg = language === 'ar'
            ? 'عذراً، حدث خطأ في معالجة طلبك.'
            : 'Sorry, an error occurred processing your request.';
          controller.enqueue(encoder.encode(sseEvent('delta', { content: errorMsg })));
          controller.enqueue(encoder.encode(sseEvent('done', { session_id: sessionId, error: true })));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
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
    // 1. Get or auto-create seller profile
    let seller = await prisma.seller.findUnique({
      where: { userId: user.userId },
      include: { user: { select: { countryCode: true, phone: true } } },
    });

    if (!seller) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { countryCode: true, phone: true, name: true },
      });

      seller = await prisma.seller.create({
        data: {
          userId: user.userId,
          phonePublic: dbUser?.phone || '',
          businessName: dbUser?.name || undefined,
        },
        include: { user: { select: { countryCode: true, phone: true } } },
      });

      await prisma.user.update({
        where: { id: user.userId },
        data: { role: 'seller' },
      });
    }

    const countryCode = seller.user.countryCode;

    // 2. Resolve category
    let categoryId: number | null = null;
    if (args.category) {
      const category = await prisma.category.findUnique({
        where: { slug: args.category },
      });
      if (category) categoryId = category.id;
    }

    // 3. Create product with images in transaction
    const product = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          sellerId: user.userId,
          title: args.title,
          description: args.description || null,
          price: args.price,
          currency: countryCode === 'KW' ? 'KWD' : 'SAR',
          isNegotiable: true,
          condition: args.condition || 'good',
          categoryId,
          countryCode,
        },
      });

      // Create product images
      if (args.image_urls && args.image_urls.length > 0) {
        await tx.productImage.createMany({
          data: args.image_urls.map((url, index) => ({
            productId: newProduct.id,
            url,
            s3Key: url.split('/').slice(-2).join('/'),
            isPrimary: index === 0,
            sortOrder: index,
          })),
        });
      }

      return newProduct;
    });

    // 4. Index in Qdrant (async, don't block response)
    (async () => {
      try {
        const fullProduct = await prisma.product.findUnique({
          where: { id: product.id },
          include: {
            category: { select: { slug: true } },
          },
        });
        if (!fullProduct) return;

        const searchText = `${fullProduct.title} ${fullProduct.description || ''}`.trim();
        const embedding = await getTextEmbedding(searchText);

        await indexProduct(product.id, embedding, {
          product_id: product.id,
          seller_id: fullProduct.sellerId,
          title: fullProduct.title,
          title_ar: fullProduct.titleAr || undefined,
          description: fullProduct.description || undefined,
          price: Number(fullProduct.price),
          currency: fullProduct.currency,
          category_slug: fullProduct.category?.slug || 'other',
          country_code: countryCode,
          region_id: fullProduct.regionId || undefined,
          status: fullProduct.status,
          created_at: fullProduct.createdAt.toISOString(),
        });

        await prisma.product.update({
          where: { id: product.id },
          data: { qdrantPointId: product.id },
        });
      } catch (err) {
        console.error('Failed to index product in Qdrant:', err);
      }
    })();

    return {
      success: true,
      product_id: product.id,
      message: `Listing created successfully! Product ID: ${product.id}`,
    };
  } catch (error) {
    console.error('Create listing error:', error);
    return {
      success: false,
      error: 'Failed to create listing',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
