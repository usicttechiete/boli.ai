# Backend Implementation Details

## Directory Structure

```text
backend/src/
├── db/
│   ├── schema.sql           # Complete Supabase SQL scripts and RLS
│   └── supabase.ts          # Core service-role initialized Supabase client
├── middleware/
│   └── auth.ts              # Custom Fastify JWT preHandler middleware
├── routes/
│   ├── auth.ts              # /api/auth/* routes
│   ├── drills.ts            # /api/drills/* routes
│   ├── interview.ts         # /api/interview/* routes
│   ├── onboarding.ts        # /api/onboarding/* routes
│   ├── profile.ts           # /api/profile/* routes
│   └── sessions.ts          # /api/session/* routes
├── services/
│   ├── analysisEngine.ts    # The 6-step core orchestration pipeline
│   ├── cache.ts             # Upstash Redis wrapper
│   ├── sarvamLLM.ts         # Wrapper for Sarvam's Chat Completions
│   └── sarvamSTT.ts         # Wrapper for Sarvam's Audio Transcription
├── types/
│   └── index.ts             # All TypeScript definitions matching database schema
└── server.ts                # App initialization, plugin registration, and global handlers
```

## Core Elements

### 1. Types & Database Schema
The database runs heavily on UUIDs connected entirely through cascading deletes to Supabase's public `auth.users` instances.
The main tables are:
- `profiles`: Handled via an auto-trigger mechanism from Supabase.
- `dialect_profiles`: Tracks region, WPM baseline, and target phonemes based on regional dialect (e.g., Hindi belt vs. South Indian speech patterns).
- `sessions`: Raw analysis for single user attempts, tracking WPM, transcript, score, and applied LLM tips.
- `interview_sessions`: Composed Q&A flow handling multiple `sessions` entries mapped to an overarching aggregate score.

### 2. Middleware Strategy
Fastify's plugin and hook architecture provides clean boundaries. Our `authenticate` hook in `middleware/auth.ts`:
1. Strips the Bearer string.
2. Synchronously verifies the token signature using the `SUPABASE_JWT_SECRET`.
3. Attaches a typed `JwtPayload` object to `request.user` so down-line processes have immediate context on the logged-in user.

### 3. Audio & Multipart Route Handling
File uploads rely strictly on `@fastify/multipart`.
All analysis endpoints (e.g., `POST /api/session/analyze`) use the `request.parts()` async iterator rather than buffering strictly in memory first, ensuring lower memory overhead before moving the collected buffer chunks.

```typescript
// Pattern used inside session and interview routes
const parts = request.parts();
for await (const part of parts) {
  if (part.type === 'file' && part.fieldname === 'audio') {
     // Concatenate audio chunk streams
  } else if (part.type === 'field') {
     // Extract Zod verified metadata fields
  }
}
```

### 4. Route Organization
All routes explicitly manage their cache eviction logic (e.g., hitting `POST /api/session/analyze` will automatically force `cacheDel` on the user's `sessionHistory` keys to maintain accurate state).

The endpoints also conform strictly to the standard envelope model:
```typescript
{
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  }
}
```
This is managed by global `.setErrorHandler` interceptors in `server.ts` alongside specific error catches (like `STT_FAILED`) mapped in `types/index.ts`.
