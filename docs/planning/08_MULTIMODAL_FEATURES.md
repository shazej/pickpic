# Implementation Plan: Seller Assistant & Multimodal Search

## Goal
Implement a guided AI listing experience for sellers and text/voice/video search for buyers using Next.js, MSSQL, and Genkit.

## 1. Database Schema Extensions (MSSQL)

New tables in `marketplace` and `audit` schemas (or `dbo` if schemas not used).

```sql
-- Seller Assistant
CREATE TABLE listing_assistant_sessions (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    seller_user_id UNIQUEIDENTIFIER NOT NULL, -- FK to users
    draft_product_id UNIQUEIDENTIFIER, -- FK to products (nullable initially)
    status NVARCHAR(50) DEFAULT 'active', -- active, completed, abandoned
    current_step NVARCHAR(50),
    context_data NVARCHAR(MAX), -- JSON blob for running context
    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
    updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);

CREATE TABLE listing_assistant_conversation (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    session_id UNIQUEIDENTIFIER NOT NULL, -- FK
    role NVARCHAR(20) NOT NULL, -- 'system', 'assistant', 'user'
    content NVARCHAR(MAX),
    message_type NVARCHAR(20) DEFAULT 'text', -- 'text', 'question', 'answer'
    meta_data NVARCHAR(MAX), -- JSON for structured Q/A data
    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);

-- Search Analytics
CREATE TABLE search_events (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id UNIQUEIDENTIFIER, -- Nullable
    query_type NVARCHAR(20) NOT NULL, -- 'text', 'audio', 'video', 'image'
    raw_query NVARCHAR(MAX), -- Text or transcript or file path
    parsed_intent NVARCHAR(MAX), -- JSON
    result_count INT,
    latency_ms INT,
    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);
```

## 2. AI Integration (Google Genkit + Gemini)

Location: `src/ai/*`

### Flows to Implement
1.  **`generateListingQuestion`**:
    *   Input: `current_listing_state` (JSON), `image_url` (String)
    *   Output: `StructuredQuestion` (JSON: text, field_target, suggestions)
    *   Logic: Analyze state holes, look at image, pick next field, generate helpful Q.

2.  **`processListingAnswer`**:
    *   Input: `question_id`, `user_answer`, `current_state`
    *   Output: `UpdatedState` (JSON)
    *   Logic: Extract entities from textual answer, update JSON state.

3.  **`transcribeAndSearch`** (Audio):
    *   Input: `audio_base64` or `url`
    *   Output: `SearchIntent` (query_text, filters)
    *   Logic: Speech-to-Text (STT) -> Intent Extraction.

4.  **`analyzeVideoAndSearch`** (Video):
    *   Input: `video_url` or `frames[]`
    *   Output: `VisualDescriptor` (keywords, visual_attributes)
    *   Logic: Multi-modal Gemini call -> Describe visual -> Map to search tags.

## 3. Backend API Routes

*   `POST /api/seller/assistant/start`: Init session, saving uploaded image.
*   `POST /api/seller/assistant/chat`: Send answer, get next question (calls Genkit).
*   `POST /api/seller/assistant/publish`: Commit draft to `products` table.
*   `POST /api/search/transcribe`: Audio -> Text.
*   `POST /api/search/video-analysis`: Video/Image -> Search Terms.

## 4. Frontend Components

*   `components/seller/AssistantWizard.tsx`: Chat interface, Draft Preview side-by-side.
*   `components/search/SearchBarMultimodal.tsx`: Tabs for Text/Voice/Video.
*   `components/ui/AudioRecorder.tsx`: Web Audio API wrap.
*   `components/ui/VideoInput.tsx`: File upload + Preview.

## 5. Verification Plan

*   **Unit Tests**: Test the API logic specifically (mocking Genkit).
*   **Manual**: Walkthrough of the Wizard.
*   **Smoke**: Playwright tests for the new UI paths.
