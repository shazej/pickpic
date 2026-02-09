// OpenAI Service Layer
// Handles: Chat (GPT-4o), Voice (Whisper), Vision, Embeddings

import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================
// RETRY LOGIC
// ============================================

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      const err = error as { status?: number };
      const isRateLimit = err?.status === 429;
      const isLastAttempt = attempt === maxRetries - 1;

      if (isRateLimit && !isLastAttempt) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`Rate limited, retrying in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}

// ============================================
// EMBEDDINGS
// ============================================

// Generate text embedding for search
export async function getTextEmbedding(text: string): Promise<number[]> {
  return withRetry(async () => {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    return response.data[0].embedding;
  });
}

// ============================================
// VOICE TRANSCRIPTION
// ============================================

interface TranscriptionResult {
  text: string;
  language: string;
}

// Transcribe audio using Whisper
export async function transcribeAudio(
  audioBuffer: Buffer,
  languageHint?: string
): Promise<TranscriptionResult> {
  return withRetry(async () => {
    const file = new File([audioBuffer], "audio.webm", { type: "audio/webm" });

    const response = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: languageHint,
      response_format: "verbose_json",
    });

    return {
      text: response.text,
      language:
        (response as { language?: string }).language ||
        languageHint ||
        "unknown",
    };
  });
}

// ============================================
// CHAT COMPLETION
// ============================================

interface ChatContext {
  country_code: string;
  language: string;
  available_categories: string[];
  products_found?: number;
}

interface ChatResponse {
  response: string;
  search_query?: string;
  filters?: Record<string, unknown>;
}

// ============================================
// SYSTEM PROMPT GENERATION FOR TOOL CALLING
// ============================================

/**
 * Generate mode-aware system prompts for the conversational AI.
 * Different prompts for buy vs sell mode to guide tool usage appropriately.
 */
export function generateSystemPrompt(
  countryCode: string,
  language: string,
  mode: "buy" | "sell"
): string {
  const countryName = countryCode === "KW" ? "Kuwait" : "Saudi Arabia";
  const languageName = language === "ar" ? "Arabic" : "English";
  const today = new Date().toISOString().split("T")[0];

  if (mode === "buy") {
    return `You are a helpful shopping assistant for PickPic marketplace in ${countryName}.
Today's date: ${today}

Your role:
1. Help users find products QUICKLY and efficiently
2. Ask clarifying questions SPARINGLY (max 1-2 questions total per search)
3. Search with ANY product details you have - even partial information is fine
4. Respond naturally and helpfully in ${languageName}

Available categories: vehicles, electronics, property, fashion, furniture, services, jobs, other

CRITICAL Tool usage rules:
- LIMIT clarifications: Ask MAX 1-2 clarifying questions, then ALWAYS search
- Use ask_clarification ONLY when: request is extremely vague (e.g., "I need something", "help me") AND you haven't asked before
- Use search_products when: you have ANY product details (brand, category, keyword) - partial info is enough!
- After 2 clarifications OR if user gives short answers ("no", "idk", "just show me"), SEARCH IMMEDIATELY
- If user provides a brand name (Mercedes, iPhone, etc.), search RIGHT AWAY - don't ask for more details

Examples:
- "I need a car" → Ask 1 question (budget/type?), then search
- "mercedes" → SEARCH immediately for Mercedes (don't ask model/year/etc)
- "AMG" after "mercedes" → SEARCH for Mercedes AMG (don't keep asking)
- "I need a phone under 300" → SEARCH immediately (you have enough info)

When you receive search results:
- Present findings naturally in ${languageName}
- Show what you found
- Users can refine if they want
- Be honest if results are limited

If user's intent seems to be about selling (not buying), politely suggest: "Would you like to switch to Sell mode to create a listing?"`;
  } else {
    // sell mode
    return `You are a helpful listing assistant for PickPic marketplace in ${countryName}.
Today's date: ${today}

Your role:
1. Help users create product listings for items they want to sell
2. Gather all required information: images, title, price, category, condition, description
3. Analyze uploaded images to suggest listing details
4. Create draft listings when all information is collected and confirmed

Available categories: vehicles, electronics, property, fashion, furniture, services, jobs, other

Tool usage guidelines:
- Use ask_clarification to gather: missing photos, price, category, condition, or other required details
- Use analyze_image_for_listing when: user uploads a product photo
- Use create_listing when: all required information has been collected and user confirms they're ready to publish
- Be encouraging and supportive throughout the listing creation process

Required information for a listing:
- At least one product image
- Title (clear, descriptive)
- Price in local currency (KWD/SAR)
- Category
- Condition (new, like new, good, fair, poor)
- Description (optional but recommended)

Respond naturally in ${languageName}.

If user's intent seems to be about buying (not selling), politely suggest: "Would you like to switch to Buy mode to search for products?"`;
  }
}

// ============================================
// CHAT FUNCTIONS (LEGACY - FOR JSON MODE)
// ============================================

// Chat with AI for product search
export async function chatWithProducts(
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
  context: ChatContext
): Promise<ChatResponse> {
  const countryName = context.country_code === "KW" ? "Kuwait" : "Saudi Arabia";
  const languageName = context.language === "ar" ? "Arabic" : "English";

  const today = new Date().toISOString().split("T")[0];

  const systemPrompt = `You are a helpful shopping assistant for PickPic marketplace in ${countryName}.
Today's date: ${today}

Your role:
1. Understand what the user wants to buy or find
2. Extract search intent and filters from their request
3. Respond naturally and helpfully in ${languageName}

Available categories: ${context.available_categories.join(", ")}

When a user describes what they're looking for, extract:
- search_query: The main search terms
- filters: Any specific criteria (category, price range, etc.)

${
  context.products_found !== undefined
    ? context.products_found > 0
      ? `Found ${context.products_found} matching products. Let the user know you found results.`
      : `No matching products found. Tell the user no listings match right now, suggest they try different keywords or check back later. Do NOT say "let me search" or "let me see" — the search already happened and returned zero results.`
    : ""
}

Respond with JSON:
{
  "response": "Your friendly response to the user in ${languageName}",
  "search_query": "extracted search terms in English",
  "filters": {
    "category": "category_slug if mentioned",
    "min_price": number if mentioned,
    "max_price": number if mentioned
  }
}`;

  return withRetry(async () => {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        })),
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = response.choices[0].message.content;
    return content
      ? JSON.parse(content)
      : { response: "", search_query: "", filters: {} };
  });
}

// ============================================
// IMAGE ANALYSIS FOR SEARCH
// ============================================

export interface ImageAnalysis {
  category: string;
  subcategory?: string;
  brand?: string;
  model?: string;
  year?: string;
  color?: string;
  condition?: string;
  material?: string;
  size?: string;
  estimated_price_range?: {
    min: number;
    max: number;
    currency: string;
  };
  search_text: string;
  search_text_ar: string;
  description: string;
  description_ar: string;
}

// Analyze image and extract structured JSON for search
export async function analyzeImageForSearch(
  imageUrl: string,
  countryCode: string = "KW"
): Promise<ImageAnalysis> {
  const countryName = countryCode === "KW" ? "Kuwait" : "Saudi Arabia";

  return withRetry(async () => {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a product analyzer for a marketplace in ${countryName}.
Today's date: ${new Date().toISOString().split("T")[0]}

Analyze images and extract structured information for search.
The search_text field is CRITICAL - it should combine all key attributes into a natural phrase that will be used for vector similarity search.
Use current year context when estimating product details (e.g. an iPhone 15 in ${new Date().getFullYear()} is not brand new).

Categories: vehicles, electronics, property, fashion, furniture, services, jobs, other

Always respond with valid JSON.`,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: imageUrl },
            },
            {
              type: "text",
              text: `Analyze this product image and return JSON:
{
  "category": "category_slug",
  "subcategory": "optional subcategory",
  "brand": "brand if visible",
  "model": "model if visible",
  "year": "year if applicable",
  "color": "primary color",
  "condition": "new/like_new/good/fair/poor",
  "material": "if relevant",
  "size": "if relevant",
  "estimated_price_range": { "min": number, "max": number, "currency": "KWD" },
  "search_text": "English search phrase combining key attributes",
  "search_text_ar": "Arabic version of search_text",
  "description": "Brief English description",
  "description_ar": "Brief Arabic description"
}`,
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content;
    return content ? JSON.parse(content) : ({} as ImageAnalysis);
  });
}

// Combined function: Image → JSON → Embedding → Filters
export async function processImageForSearch(
  imageUrl: string,
  countryCode: string,
  language: string = "ar"
): Promise<{
  analysis: ImageAnalysis;
  embedding: number[];
  filters: Record<string, unknown>;
  chatResponse: string;
}> {
  // Step 1: Analyze image → structured JSON
  const analysis = await analyzeImageForSearch(imageUrl, countryCode);

  // Step 2: Generate embedding from search_text
  const searchText =
    language === "ar" ? analysis.search_text_ar : analysis.search_text;
  const embedding = await getTextEmbedding(searchText);

  // Step 3: Extract filters from analysis
  const filters: Record<string, unknown> = {};
  if (analysis.category) {
    filters.category_slug = analysis.category;
  }
  if (analysis.estimated_price_range?.max) {
    filters.max_price = Math.round(analysis.estimated_price_range.max * 1.2);
  }

  // Step 4: Generate chat response
  const chatResponse =
    language === "ar" ? analysis.description_ar : analysis.description;

  return { analysis, embedding, filters, chatResponse };
}

// ============================================
// IMAGE ANALYSIS FOR SELLER LISTINGS
// ============================================

interface ListingAnalysis {
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
  category: string;
  suggested_price?: { min: number; max: number; currency: string };
}

// Analyze image for seller listing creation
export async function analyzeImageForListing(
  imageUrl: string,
  countryCode: string = "KW"
): Promise<ListingAnalysis> {
  const countryName = countryCode === "KW" ? "Kuwait" : "Saudi Arabia";
  const currency = countryCode === "KW" ? "KWD" : "SAR";
  const model = "gpt-5.2";

  //if model=gpt-5.2 then donot pass max_tokens in request

  return withRetry(async () => {
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are helping a seller create a listing in ${countryName}.
Today's date: ${new Date().toISOString().split("T")[0]}

Analyze this product image and provide:
1. A compelling title (both English and Arabic)
2. A detailed description (both English and Arabic)
3. The most appropriate category
4. Suggested price range in ${currency}
5. Extract color properly from the image
6. keep title short and concise acc to product image and standard best practices for htat product

Categories: vehicles, electronics, property, fashion, furniture, services, other

Respond as JSON:
{
  "title": "English title",
  "title_ar": "Arabic title",
  "description": "English description",
  "description_ar": "Arabic description",
  "category": "category_slug",
  "suggested_price": { "min": number, "max": number, "currency": "${currency}" }
}`,
            },
            {
              type: "image_url",
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      // max_tokens: 1000,
    });

    const content = response.choices[0].message.content;
    return content ? JSON.parse(content) : ({} as ListingAnalysis);
  });
}

// ============================================
// CONTENT MODERATION
// ============================================

interface ModerationResult {
  approved: boolean;
  reason?: string;
  flags: string[];
}

// Moderate content for prohibited items
export async function moderateContent(
  title: string,
  description: string,
  imageUrls: string[],
  countryCode: string
): Promise<ModerationResult> {
  const countryName = countryCode === "KW" ? "Kuwait" : "Saudi Arabia";

  return withRetry(async () => {
    const imageContent = imageUrls.map((url) => ({
      type: "image_url" as const,
      image_url: { url },
    }));

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a content moderator for a marketplace in ${countryName}.

Prohibited items (MUST reject):
- Alcohol and alcoholic beverages
- Pork and pork products
- Weapons and ammunition
- Drugs and narcotics
- Adult/inappropriate content
- Counterfeit goods
- Stolen items
- Gambling-related items

Review the listing and respond with JSON:
{
  "approved": boolean,
  "reason": "reason if rejected",
  "flags": ["list", "of", "concerns"]
}`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Title: ${title}\nDescription: ${description}`,
            },
            ...imageContent,
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 300,
    });

    const content = response.choices[0].message.content;
    return content ? JSON.parse(content) : { approved: true, flags: [] };
  });
}

// ============================================
// HEALTH CHECK
// ============================================

export async function checkOpenAIConnection(): Promise<boolean> {
  try {
    await openai.models.list();
    return true;
  } catch {
    return false;
  }
}

export { openai };
