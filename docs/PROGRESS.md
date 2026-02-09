# PickPic Development Progress

## Project Overview
**Project:** PickPic - AI-Powered Chat-to-Buy/Sell Marketplace
**Version:** 1.0 (MVP)
**Target Market:** Kuwait
**Last Updated:** February 6, 2026

---

## Overall Progress

| Sprint | Name | Status | Progress |
|--------|------|--------|----------|
| 1 | Infrastructure Setup | ✅ Complete | 95% |
| 2 | Core Backend APIs | ✅ Complete | 100% |
| 3 | Chat Interface UI | ✅ Complete | 100% |
| 4 | Seller Flow & Product Details | ✅ Complete | 100% |
| 5 | Localization & Polish | ⏳ Pending | 0% |
| 6 | Testing & Deployment | ⏳ Pending | 0% |

**Legend:** ✅ Complete | 🔄 In Progress | ⏳ Pending | ❌ Blocked

---

## Sprint 1: Infrastructure Setup — 95%

### Completed Tasks ✅

| Task | File(s) | Notes |
|------|---------|-------|
| Prisma schema definition | `prisma/schema.prisma` | 15 models, enums, indexes |
| Prisma client singleton | `src/lib/db/prisma.ts` | Connection pooling, health check |
| Database seed script | `prisma/seed.ts` | Countries, regions, categories, prohibited keywords |
| Qdrant vector DB client | `src/lib/qdrant/client.ts` | Init, index, search, delete, health check |
| S3 storage client | `src/lib/s3/client.ts` | Presigned URLs, upload, move, delete, health check |
| OpenAI service layer | `src/lib/ai/openai.ts` | Chat, voice, vision, embeddings, moderation |
| JWT auth utilities | `src/lib/auth/jwt.ts` | Token gen/verify, cookies, role guards |
| Health check API | `src/app/api/health/route.ts` | Tests all 4 services (DB, Qdrant, S3, OpenAI) |
| Package.json | `package.json` | Prisma, OpenAI, S3, Qdrant, jose deps |
| Environment template | `env.example` | All required variables documented |
| npm dependencies installed | `node_modules/` | All packages installed |
| Prisma client generated | `.prisma/client` | Types available |

### Remaining Tasks ⏳

| Task | Blocker | Notes |
|------|---------|-------|
| Run `prisma db push` | DB connectivity | PostgreSQL not reachable from dev env |
| Run `prisma db seed` | Tables must exist | Depends on db push |
| Test all connections via /api/health | All services running | After DB is up |

---

## Sprint 2: Core Backend APIs — 100%

### Completed Tasks ✅

| Task | File(s) | Notes |
|------|---------|-------|
| Register API | `src/app/api/auth/register/route.ts` | Creates user + optional seller profile |
| Login API | `src/app/api/auth/login/route.ts` | Password verification, JWT token |
| Logout API | `src/app/api/auth/logout/route.ts` | Clears auth cookie |
| Get current user API | `src/app/api/auth/me/route.ts` | Returns user with seller info |
| Products list API | `src/app/api/products/route.ts` GET | Filters, pagination, sorting |
| Product create API | `src/app/api/products/route.ts` POST | AI moderation + Qdrant indexing |
| Product detail API | `src/app/api/products/[id]/route.ts` GET | Full product with images, seller |
| Product update API | `src/app/api/products/[id]/route.ts` PUT | Owner-only |
| Product delete API | `src/app/api/products/[id]/route.ts` DELETE | Owner-only |
| **AI Chat Search API** | `src/app/api/chat/route.ts` POST | **Core feature** - unified text/voice/image search |
| Voice Transcription API | `src/app/api/chat/voice/route.ts` POST | Whisper-based transcription |
| Chat Sessions API | `src/app/api/chat/sessions/route.ts` GET | List user's chat sessions |
| Chat Session Messages | `src/app/api/chat/sessions/[id]/route.ts` GET | Get messages for a session |
| S3 Presigned URL API | `src/app/api/upload/presign/route.ts` POST | Direct client-to-S3 uploads |
| Upload API (S3) | `src/app/api/upload/route.ts` POST | Server-side S3 upload |
| Geo Countries API | `src/app/api/geo/countries/route.ts` GET | Active countries |
| Geo Regions API | `src/app/api/geo/regions/route.ts` GET | Regions by country |
| AI Listing Analysis API | `src/app/api/ai/analyze-listing-image/route.ts` POST | GPT-4o Vision → listing suggestions |
| Middleware (JWT) | `src/middleware.ts` | JWT-based route protection |
| Content moderation | `src/lib/ai/openai.ts` | moderateContent() |
| Image analysis | `src/lib/ai/openai.ts` | analyzeImageForListing(), analyzeImageForSearch() |
| Voice transcription | `src/lib/ai/openai.ts` | transcribeAudio() |
| Qdrant indexing | In product create | Auto-indexes on creation |

### Migrated Legacy Routes (Now Prisma-based)

| Route | Status | Notes |
|-------|--------|-------|
| `/api/reviews/product` | ✅ Migrated | JWT auth, placeholder (no Review model in V1) |
| `/api/metrics` | ✅ Migrated | Prisma-based analytics |
| `/api/favorites/[id]` | ✅ Migrated | JWT auth, placeholder (no Favorite model in V1) |
| `/api/seller/profile` | ✅ Migrated | Full Prisma CRUD with upsert |
| `/api/seller/listings` | ✅ Migrated | Full Prisma query with images, filters |
| `/api/ai/find-similar-products` | ✅ Migrated | Prisma + Qdrant vector search |
| `/api/chat/threads` | V1 stub | P2P messaging not in V1 scope |

---

## Sprint 3: Chat Interface UI — 100%

### Completed Tasks ✅

| Task | File(s) | Notes |
|------|---------|-------|
| Chat Widget (floating) | `src/components/chat/chat-widget.tsx` | Wired to `/api/chat`, product cards with Call/WhatsApp |
| Voice Button | `src/components/chat/voice-button.tsx` | Push-to-talk → Whisper → `/api/chat/voice` |
| Product cards in chat | In `chat-widget.tsx` | Shows image, title, price, seller, location |
| Call Seller button | In `ProductCard` component | `tel:` link with seller phone |
| WhatsApp button | In `ProductCard` component | Deep link with pre-filled message |
| Image search in chat | In `chat-widget.tsx` | File input → base64 → `/api/chat` with image_url |
| Session management | In `chat-widget.tsx` | Creates/resumes sessions via API |
| Chat in marketplace layout | `src/app/(marketplace)/layout.tsx` | ChatWidget included globally |

---

## Sprint 4: Seller Flow & Product Details — 100%

### Completed Tasks ✅

| Task | File(s) | Notes |
|------|---------|-------|
| **Seller Listing: Upload** | `src/app/(seller)/sell/new/page.tsx` | 3-step flow: Upload → Form → Preview |
| S3 presigned upload | In sell/new page | Client → presigned URL → PUT to S3 |
| AI image analysis | `/api/ai/analyze-listing-image` + sell/new | GPT-4o Vision → auto-fill title, description, category, price |
| Multi-image upload (up to 8) | In sell/new page | Additional images with S3 upload per image |
| Image preview gallery | In sell/new page | Thumbnails with upload progress, main badge |
| **Listing Preview** | `src/components/seller/listing-preview.tsx` | Shows full preview before publish |
| **Listing Form** | `src/components/seller/listing-form.tsx` | React Hook Form + Zod validation |
| Publish to API | In sell/new page | POST `/api/products` with imageUrls, AI moderation |
| Content moderation | In `/api/products` POST | AI checks for prohibited items |
| **Seller Dashboard** | `src/app/(marketplace)/seller/dashboard/products/page.tsx` | Fetches from `/api/seller/listings` |
| Edit product | In dashboard products | Dialog with title/price → PUT `/api/products/[id]` |
| Delete product | In dashboard products | DELETE `/api/products/[id]` with Qdrant cleanup |
| Mark as Sold | In dashboard products | PUT status to 'sold' |
| Product views/contacts | In dashboard products | Shows viewCount, contactCount from API |
| **Product Detail Page** | `src/app/(marketplace)/p/[productId]/page.tsx` | Fetches from `/api/products/[id]` (was hardcoded mock) |
| Call Seller (product page) | In product detail page | `tel:` link with seller's public phone |
| WhatsApp Seller (product page) | In product detail page | Deep link with pre-filled message |
| Seller verification badge | In product detail page | Blue checkmark for verified sellers |
| Negotiable badge | In product detail page | Green badge when isNegotiable is true |
| Image gallery | In product detail page | Multiple images with thumbnails |

---

## API Route Map (Current State)

```
src/app/api/
├── auth/
│   ├── register/route.ts    ✅ POST - Register
│   ├── login/route.ts       ✅ POST - Login
│   ├── logout/route.ts      ✅ POST - Logout
│   └── me/route.ts          ✅ GET  - Current user
│
├── chat/
│   ├── route.ts             ✅ POST - AI search (text/voice/image)
│   ├── voice/route.ts       ✅ POST - Voice transcription
│   ├── sessions/route.ts    ✅ GET  - Chat sessions list
│   ├── sessions/[id]/route.ts ✅ GET - Session messages
│   └── threads/             ⚠️ V1 stub (P2P not in scope)
│
├── products/
│   ├── route.ts             ✅ GET/POST - List/Create
│   └── [id]/route.ts        ✅ GET/PUT/DELETE - Detail/Update/Delete
│
├── upload/
│   ├── route.ts             ✅ POST - Upload file to S3
│   └── presign/route.ts     ✅ POST - Get presigned URL
│
├── geo/
│   ├── countries/route.ts   ✅ GET  - Active countries
│   └── regions/route.ts     ✅ GET  - Regions by country
│
├── ai/
│   ├── analyze-listing-image/route.ts ✅ POST - AI image analysis for listings
│   └── find-similar-products/route.ts ✅ POST - Qdrant vector search
│
├── health/route.ts          ✅ GET  - Health check
├── reviews/product/route.ts ✅ JWT auth (placeholder)
├── metrics/route.ts         ✅ Prisma analytics
├── favorites/[id]/route.ts  ✅ JWT auth (placeholder)
└── seller/
    ├── profile/route.ts     ✅ Prisma CRUD
    └── listings/route.ts    ✅ Prisma query with images
```

---

## Core Feature Flows (V1)

### Buyer: Chat → Products → Contact Seller
```
1. User opens ChatWidget (floating button, bottom-right)
2. Types text / records voice / uploads image
3. Voice → Whisper transcription → text
4. Image → GPT-4o Vision → JSON → text-embedding-3-small → Qdrant
5. Text → chatWithProducts() → search query → embedding → Qdrant
6. Results displayed as ProductCards (image, title, price, seller, location)
7. Each card has: Call button (tel:), WhatsApp button (wa.me deep link)
8. Clicking card navigates to /p/[id] product detail page
9. Product page shows full details + Call/WhatsApp/Message buttons
```

### Seller: Upload → AI Analysis → Preview → Publish
```
1. Seller navigates to /sell/new
2. Uploads product photo via drag-and-drop
3. Image uploaded to S3 via presigned URL
4. AI analyzes image (GPT-4o Vision) → auto-fills title, description, category, price
5. Seller reviews/edits pre-filled form, adds more images (up to 8)
6. Clicks "Create Listing" → preview step shows full listing
7. Clicks "Publish" → POST /api/products (AI moderation check)
8. Product created in DB + indexed in Qdrant for search
9. Seller manages listings in /seller/dashboard/products (edit/delete/mark sold)
```

---

## Infrastructure Files

```
src/lib/
├── ai/openai.ts             ✅ OpenAI service (chat, voice, vision, embeddings, moderation)
├── auth/jwt.ts              ✅ JWT utilities (generate, verify, cookies, guards)
├── db/prisma.ts             ✅ Prisma client singleton
├── qdrant/client.ts         ✅ Qdrant vector DB client
├── s3/client.ts             ✅ AWS S3 client (presign, upload, delete, move)
├── auth.ts                  ⚠️ Legacy compatibility shim → redirects to auth/jwt.ts
└── db.ts                    ⚠️ Legacy compatibility shim → logs warning

src/middleware.ts             ✅ JWT-based route protection (was using old session system)

prisma/
├── schema.prisma            ✅ 15 models, enums, indexes
└── seed.ts                  ✅ Countries, regions, categories, keywords
```

---

## UI Components

```
src/components/
├── chat/
│   ├── chat-widget.tsx      ✅ Floating AI search with voice, image, product cards
│   └── voice-button.tsx     ✅ Push-to-talk recording → Whisper transcription
├── seller/
│   ├── listing-form.tsx     ✅ React Hook Form + Zod validation
│   └── listing-preview.tsx  ✅ Full listing preview before publish
├── product/
│   ├── product-gallery.tsx  ✅ Image gallery with thumbnails
│   └── message-seller-button.tsx ✅ Creates message thread
├── search/
│   └── visual-search-uploader.tsx ✅ Drag-and-drop image upload
└── ui/                      ✅ shadcn/ui components (40+ components)
```

---

## Legacy Code Cleanup

| Old File/Dir | Action | Notes |
|-------------|--------|-------|
| `src/ai/genkit.ts` | Removed | Replaced by `src/lib/ai/openai.ts` |
| `src/ai/dev.ts` | Removed | Dev script for old Genkit flows |
| `src/ai/flows/*.ts` (6 flows) | Replaced with stubs | 3 flows still imported by components |
| `src/lib/firebase.ts` | Removed | Firebase auth no longer used |
| `src/lib/auth.ts` | Shimmed | Redirects getSession() to JWT getCurrentUser() |
| `src/lib/db.ts` | Shimmed | Returns empty results, logs migration warning |
| Old middleware (session-based) | Rewritten | Now uses JWT verification directly |
| Upload API (local disk) | Rewritten | Now uses S3 via `@/lib/s3/client` |
| Chat threads (MSSQL) | Stubbed | P2P messaging not in V1 |

---

## Key Technical Decisions

| Decision | Choice | Status |
|----------|--------|--------|
| ORM | Prisma | ✅ Implemented |
| Database | PostgreSQL | ✅ Schema ready, needs `db push` |
| Vector DB | Qdrant | ✅ Client ready |
| Storage | AWS S3 (me-south-1) | ✅ Client ready |
| AI Provider | OpenAI (GPT-4o, Whisper) | ✅ Service ready |
| Auth | JWT (jose library) | ✅ Implemented + middleware |
| Image Search | Vision → JSON → Text Embedding | ✅ Implemented |
| Messaging | Direct call to seller (no P2P chat) | Per V1 spec |

---

## Environment Variables Required

```
DATABASE_URL          - PostgreSQL connection string
OPENAI_API_KEY        - OpenAI API key
QDRANT_URL            - Qdrant vector DB URL
QDRANT_API_KEY        - Qdrant API key (optional)
AWS_REGION            - AWS region (me-south-1)
AWS_ACCESS_KEY_ID     - AWS access key
AWS_SECRET_ACCESS_KEY - AWS secret key
S3_BUCKET_NAME        - S3 bucket name
S3_CDN_URL            - S3/CDN public URL
JWT_SECRET            - JWT signing secret (min 32 chars)
JWT_EXPIRES_IN        - Token expiry (default: 24h)
NODE_ENV              - Environment (development/production)
```

---

## Next Steps

1. **DB Setup:** Run `prisma db push` + `prisma db seed` (needs PostgreSQL connectivity)
2. **Sprint 5:** Arabic localization + RTL support
3. **Sprint 6:** E2E testing + production deployment
4. **Post-V1:** Add Favorite/Review Prisma models, P2P messaging

---

## Commands Reference

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push schema to database (dev)
npx prisma db push

# Seed database
npx prisma db seed

# Open Prisma Studio
npx prisma studio

# Run development server
npm run dev

# Build for production
npm run build

# Type check
npm run typecheck
```

---

*Last Updated: February 6, 2026*
