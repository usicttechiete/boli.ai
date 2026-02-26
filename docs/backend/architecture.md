# Backend Architecture & Design

## Key Design Decisions

The Fastify backend serves as an orchestration layer between the Boli.AI mobile application, Sarvam AI, and Supabase. Several deliberate design decisions were made to prioritize resilience, caching, and maintainability.

### 1. The 6-Step Analysis Pipeline
Handling audio uploads and analysis requires multiple heavy operations. To ensure reliability, we run a pipeline encapsulated in `analysisEngine.ts`:
1. **Storage**: Audio Buffer → Supabase Storage → Signed URL.
2. **STT**: Buffer → Sarvam AI Speech-to-Text API → Transcript. (Fails loudly on error).
3. **Python Service Analysis**: Extracts WPM and filler words. If the Python microservice is down, it silently falls back to a Node.js text-parsing fallback algorithm.
4. **LLM Coaching Tips**: Uses Sarvam's `sarvam-m` model. If the LLM call fails, the pipeline *gracefully falls back* to local confidence-building tips instead of crashing the user's session.
5. **Scoring**: Computes an aggregate score based on WPM, fillers, and accuracy.
6. **Persist**: Saves the merged session data back to the Supabase Postgres database.

### 2. Server-side Supabase Pattern
- **Client-Side Auth**: Users authenticate on the device via the Supabase Auth SDK.
- **Server-Side Validation**: Fastify intercepts requests using a `preHandler` hook. It explicitly verifies the `Authorization: Bearer <token>` using `jsonwebtoken` against the project's HS256 secret.
- **Service Role Operations**: All interactions with the database from the Fastify server use the Supabase **Service Role** key, bypassing Row Level Security (RLS). This ensures backend operations act with admin privileges securely, eliminating complex RLS rules for server actions.

### 3. Graceful Redis Degradation
We utilize Upstash Redis over HTTP (`@upstash/redis`). If the Redis environment configuration is missing, or the service goes down, the cache layer intercepts the failure and returns `null`. The application continues to fetch directly from Postgres, avoiding any service disruption for the user.

## System Flow Map (Interview Session)

```text
[ Mobile Client ] --(Multipart Audio)--> [ Fastify Route (/api/interview/:id/answer) ]
                                                       |
                                            (Validates JWT & Extracts Buffer)
                                                       |
                                          [ Analysis Engine Pipeline ]
                                          /            |             \
                          (1. Supabase Storage)  (2. Sarvam STT)   (3. Sarvam LLM)
                                         \             |             /
                                          \            |            /
                                           \           V           /
                                            [ Postgres Database ]
                                                       |
                                           (Updates Interview Session)
                                                       |
                            <---(Returns Score, Tips, and Next Question)---
```

## Security Boundaries

1. **Service Role Isolation**: The service role key is strictly contained within `src/db/supabase.ts`. It must never be exposed or compiled into the client.
2. **Audio Integrity**: We restrict audio payloads heavily via `@fastify/multipart` limits: max 10MB per file, preventing memory denial-of-service.
3. **CORS Policy**: The server strictly locks down `origin` configurations. While it accepts all inputs in development, production limits requests solely to Railway endpoints, Localhost, or Expo schemas (`exp://`).
