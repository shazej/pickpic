# PickPic V1 Implementation Plan
## AI-Powered "Chat-to-Buy/Sell" Marketplace

**Based on Meeting Summary - February 2026**

---

## Executive Summary

Transform the current marketplace into a **ChatGPT-style conversational commerce platform** where users interact with an AI engine to buy and sell products. The AI replaces traditional category browsing and filters with natural language conversation.

**Target Launch**: Kuwait (Phase 1) → Saudi Arabia (Phase 2)

---

## Key Architectural Changes

### Current State → Target State

| Component | Current | Target (V1) |
|-----------|---------|-------------|
| Database | MS SQL Server | **PostgreSQL + VectorDB** |
| Search UX | Categories + Filters | **Conversational AI Chat** |
| Messaging | In-app buyer-seller chat | **Direct call to seller** |
| User Roles | Buyer, Seller, Admin | **Buyer & Seller only** |
| Admin UI | Full admin panel | **Deferred to V2** |
| Input | Text only | **Text + Voice** |
| Moderation | Manual admin | **AI-powered** |
| Localization | English | **Arabic + English** |

---

## Phase 1: Infrastructure Changes

### 1.1 Database Migration (MSSQL → PostgreSQL)

**Files to modify:**
- `src/lib/db.ts` - Replace mssql driver with pg
- `database/schema.sql` - Convert to PostgreSQL syntax
- `package.json` - Replace `mssql` with `pg` package

**New PostgreSQL Schema:**
```sql
-- Core tables remain similar but with PostgreSQL syntax
-- Add pgvector extension for AI embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Products table with embedding column
ALTER TABLE products ADD COLUMN embedding vector(1536);
```

**Tasks:**
- [ ] Install `pg` and `@pgvector/pg` packages
- [ ] Remove `mssql` package
- [ ] Rewrite `db.ts` for PostgreSQL connection pooling
- [ ] Convert all SQL queries from T-SQL to PostgreSQL
- [ ] Create migration script for existing data
- [ ] Add vector search indexes

### 1.2 VectorDB Integration

**Purpose:** Enable AI-powered semantic search and image similarity

**Files to create:**
- `src/lib/vector-db.ts` - Vector operations wrapper
- `src/lib/embeddings.ts` - Text/image embedding generation

**Tasks:**
- [ ] Integrate pgvector for embeddings storage
- [ ] Create embedding generation pipeline (using Genkit)
- [ ] Implement similarity search functions
- [ ] Index product descriptions and images as vectors

---

## Phase 2: Core UI Transformation

### 2.1 New ChatGPT-Style Interface

**Replace:** Traditional homepage with categories/carousels
**With:** Full-screen conversational AI interface

**New Component Structure:**
```
src/components/ai-chat/
├── ChatInterface.tsx      # Main chat container
├── MessageBubble.tsx      # User/AI message display
├── ProductCard.tsx        # AI response product cards
├── VoiceInput.tsx         # Voice recording button
├── ChatInput.tsx          # Text input with voice toggle
└── WelcomeScreen.tsx      # Initial prompts/suggestions
```

**Files to modify:**
- `src/app/(marketplace)/page.tsx` - Replace with chat interface
- `src/app/(marketplace)/search/page.tsx` - Redirect to chat or remove

**Chat Interface Features:**
- Full-screen chat like ChatGPT
- User messages on right, AI responses on left
- AI returns "Cards" (product listings) inline
- Voice input button with real-time transcription
- Suggested prompts for new users
- Chat history persistence

### 2.2 Product Cards in Chat

**Design Requirements:**
- Thumbnail image
- Title
- Price
- Seller name
- **"Call Seller" button** (direct phone link)
- Location indicator

**Example Card Response:**
```
User: "I need a Mercedes GLE"

AI: "I found 5 Mercedes GLE listings near you:"

[Card 1] 2023 Mercedes GLE 350 - KWD 18,500
         Seller: Ahmed Motors | Kuwait City
         [📞 Call Seller]

[Card 2] 2022 Mercedes GLE 450 - KWD 22,000
         Seller: Premium Auto | Hawally
         [📞 Call Seller]
```

### 2.3 Voice Input Implementation

**Priority:** HIGH (critical for Arabic users)

**Technology:** Web Speech API / OpenAI Whisper

**Files to create:**
- `src/hooks/useVoiceInput.ts` - Voice recording hook
- `src/components/ai-chat/VoiceInput.tsx` - Microphone button

**Features:**
- Press-and-hold or toggle recording
- Real-time transcription display
- Arabic and English language support
- Visual feedback during recording

---

## Phase 3: Remove/Simplify Features

### 3.1 Remove In-App Messaging System

**Files to remove/deprecate:**
- `src/app/(account)/messages/` - Remove entire directory
- `src/app/(account)/messages/[threadId]/` - Remove
- `src/components/messaging/chat-window.tsx` - Remove
- `src/components/messaging/thread-list.tsx` - Remove
- `src/components/chat/chat-widget.tsx` - Remove or repurpose
- `src/services/message-service.ts` - Remove
- `src/app/api/chat/threads/` - Remove API routes

**Database:** Drop messaging tables (or mark deprecated)

**Replace with:** Direct "Call Seller" button on product cards

### 3.2 Simplify User Roles for V1

**Keep:** Buyer, Seller
**Defer to V2:** Admin UI

**Files to modify:**
- `src/middleware.ts` - Simplify RBAC checks
- `src/app/(admin)/` - Keep but hide from navigation (backend access only)

**Role Flow:**
1. New user = Buyer by default
2. User can upgrade to Seller (simple form)
3. No admin registration (backend seeds admin accounts)

### 3.3 Remove Traditional Category Browsing UI

**Hide from users (keep for backend management):**
- `src/app/(marketplace)/category/[slug]/page.tsx` - Remove from navigation
- Category sidebar/filters - Remove from UI
- Category carousels on homepage - Replace with chat

**Keep for Super Admin:**
- Category management APIs
- Category assignment on products (AI auto-assigns)

---

## Phase 4: AI Engine Enhancement

### 4.1 Conversational Search AI

**Files to create/modify:**
- `src/ai/flows/chat-search.ts` - Main conversational flow
- `src/ai/flows/product-matcher.ts` - Match query to products
- `src/ai/flows/intent-parser.ts` - Understand user intent

**AI Capabilities:**
1. **Natural Language Understanding**
   - "I need a car under 5000 KWD" → Parse: category=vehicles, max_price=5000
   - "Show me iPhones" → Parse: category=electronics, brand=Apple, model=iPhone

2. **Image Understanding**
   - User uploads photo → AI identifies product type
   - Find similar listings in database

3. **Conversational Context**
   - Remember previous messages in session
   - "Show me cheaper ones" → Adjust previous search

### 4.2 AI Content Moderation

**Files to create:**
- `src/ai/flows/content-moderator.ts` - Listing validation
- `src/lib/region-rules.ts` - Country-specific rules

**Moderation Rules (Kuwait/Saudi):**
```typescript
const PROHIBITED_ITEMS = {
  'KW': ['alcohol', 'pork', 'gambling', 'weapons', 'drugs'],
  'SA': ['alcohol', 'pork', 'gambling', 'weapons', 'drugs', 'tobacco'],
};
```

**Flow:**
1. Seller uploads product (text + images)
2. AI analyzes content
3. If prohibited → Reject with reason
4. If allowed → Auto-assign category and publish

### 4.3 Smart Listing Creation (Seller)

**Flow:**
1. Seller uploads photo(s)
2. AI extracts: Title, Description, Category, suggested Price
3. Seller confirms/edits
4. AI validates against regional rules
5. Publish with auto-generated embeddings

---

## Phase 5: Localization & Geo-Features

### 5.1 Multi-Language Support

**Languages:** Arabic (RTL), English (LTR)

**Files to create:**
- `src/lib/i18n/` - Internationalization setup
- `src/lib/i18n/ar.json` - Arabic translations
- `src/lib/i18n/en.json` - English translations

**Implementation:**
- Use `next-intl` or similar
- RTL layout support in Tailwind
- Language toggle in header
- AI responses in user's preferred language

### 5.2 Geo-Location System

**Files to create:**
- `src/hooks/useGeolocation.ts` - Browser geolocation hook
- `src/lib/geo.ts` - Location utilities
- `src/components/location/LocationSelector.tsx` - Manual override

**Features:**
1. Auto-detect user location on app load
2. Show products from detected country
3. Manual location/flag selector
4. Persist preference in localStorage/cookies

**Database changes:**
- Add `country_code` to products table
- Add location indexes for filtering

### 5.3 Regional Rules Engine

**Files to create:**
- `src/lib/regions/kuwait.ts` - Kuwait-specific rules
- `src/lib/regions/saudi.ts` - Saudi-specific rules
- `src/lib/regions/index.ts` - Region switcher

**Per-Region Configuration:**
- Currency (KWD, SAR)
- Prohibited items list
- Legal requirements
- Phone number format
- Default language

---

## Phase 6: Seller Experience

### 6.1 Simplified Listing Flow

**V1 Required Fields:**
- Title (AI can suggest)
- Price
- Description (AI can generate from photos)
- Photos/Videos
- Location (auto-detected)
- Phone number (for direct contact)

**Files to modify:**
- `src/app/(seller)/sell/new/page.tsx` - Simplify form
- `src/app/api/products/route.ts` - Update validation

### 6.2 Seller Profile

**Display on product cards:**
- Seller name
- Phone number (click-to-call)
- Location
- Rating (optional for V1)

---

## Implementation Priority & Timeline

### Sprint 1: Foundation (Days 1-3)
1. ✅ PostgreSQL migration
2. ✅ VectorDB setup
3. ✅ Remove messaging system
4. ✅ Simplify role system

### Sprint 2: Core Chat UI (Days 4-7)
1. ✅ ChatGPT-style interface
2. ✅ Product cards in chat
3. ✅ Voice input button
4. ✅ Direct call functionality

### Sprint 3: AI Enhancement (Days 8-10)
1. ✅ Conversational search AI
2. ✅ Content moderation AI
3. ✅ Smart listing creation

### Sprint 4: Localization (Days 11-14)
1. ✅ Arabic/English support
2. ✅ Geo-location system
3. ✅ Regional rules (Kuwait)
4. ✅ RTL layout support

### Sprint 5: Testing & Polish (Days 15-17)
1. ✅ E2E testing
2. ✅ Bug fixes
3. ✅ Performance optimization
4. ✅ Production deployment

---

## Technical Decisions

### Database: PostgreSQL + pgvector
**Why:** Better transactional support, native vector search, JSON support, open-source

### Voice: Web Speech API + Whisper fallback
**Why:** Browser-native, low latency, supports Arabic

### AI: Google Genkit (existing)
**Why:** Already integrated, supports multi-modal (text + image)

### Deployment: Keep existing (Docker/PM2)
**Why:** Production-ready infrastructure already in place

---

## Files Summary

### Files to CREATE:
```
src/components/ai-chat/
├── ChatInterface.tsx
├── MessageBubble.tsx
├── ProductCard.tsx
├── VoiceInput.tsx
├── ChatInput.tsx
└── WelcomeScreen.tsx

src/hooks/
├── useVoiceInput.ts
├── useGeolocation.ts
└── useChatSession.ts

src/lib/
├── db-postgres.ts
├── vector-db.ts
├── embeddings.ts
├── geo.ts
├── i18n/
│   ├── ar.json
│   └── en.json
└── regions/
    ├── kuwait.ts
    ├── saudi.ts
    └── index.ts

src/ai/flows/
├── chat-search.ts
├── content-moderator.ts
└── intent-parser.ts

database/
└── postgres-schema.sql
```

### Files to MODIFY:
```
src/lib/db.ts → db-postgres.ts
src/app/(marketplace)/page.tsx
src/app/(seller)/sell/new/page.tsx
src/middleware.ts
package.json
```

### Files to REMOVE/DEPRECATE:
```
src/app/(account)/messages/
src/components/messaging/
src/components/chat/chat-widget.tsx
src/services/message-service.ts
src/app/api/chat/threads/
```

---

## Success Criteria for V1 Launch

- [ ] User can chat with AI to search products
- [ ] User can use voice input in Arabic/English
- [ ] AI returns relevant product cards
- [ ] User can call seller directly from card
- [ ] Seller can list products with AI assistance
- [ ] AI moderates content based on Kuwait laws
- [ ] App detects and respects user location
- [ ] Full Arabic language support with RTL
- [ ] Production deployment complete

---

## Post-V1 Roadmap (V2)

1. Admin dashboard UI
2. Analytics and reporting
3. Saudi Arabia expansion
4. Payment integration
5. Advanced seller tools
6. Review/rating system enhancement

---

*Document created: February 2026*
*Last updated: February 2026*
