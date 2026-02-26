# BOLI.AI — Product Requirements Document (PRD)

> **Version:** 1.0.0
> **Status:** Active Development — Hackathon MVP
> **Team:** Boli.AI Creators, USICT, GGSIPU
> **Last Updated:** 2026-02-26
> **Document Purpose:** This PRD is written for AI coding agents. Every section is structured to be unambiguous, actionable, and directly implementable. Follow it top to bottom when building features.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Success Metrics](#3-goals--success-metrics)
4. [Target Users](#4-target-users)
5. [Tech Stack](#5-tech-stack)
6. [Repository Structure](#6-repository-structure)
7. [Environment Variables](#7-environment-variables)
8. [Database Schema](#8-database-schema)
9. [Frontend — Screens & Components](#9-frontend--screens--components)
10. [Backend — Routes & Services](#10-backend--routes--services)
11. [Python Analysis Service](#11-python-analysis-service)
12. [Core Analysis Pipeline](#12-core-analysis-pipeline)
13. [LLM Prompt Specifications](#13-llm-prompt-specifications)
14. [Feature Specifications](#14-feature-specifications)
15. [API Contract](#15-api-contract)
16. [State Management](#16-state-management)
17. [Navigation Structure](#17-navigation-structure)
18. [Error Handling Rules](#18-error-handling-rules)
19. [MVP Scope & Build Order](#19-mvp-scope--build-order)
20. [Out of Scope](#20-out-of-scope)

---

## 1. Project Overview

**BOLI.AI** is a mobile-first, AI-powered speaking coach designed for rural and semi-urban Indian students preparing for job interviews and college placements. It provides personalized spoken English coaching that respects and adapts to the user's regional dialect, accent, and native language — rather than erasing it.

**Tagline:** *Confidence in Every Conversation. Your Accent. Your Identity. Your Boli.*

**Core Value Proposition:**
- Not accent correction — confidence and clarity building
- Built for Indian regional speech patterns (not Western-biased)
- Real-time, personalized AI feedback after every session
- Safe practice environment before high-stakes interviews

---

## 2. Problem Statement

### Root Causes
1. Existing language apps (Duolingo, ELSA) are trained on Western English phonemes — they fail on Indian regional accents
2. Indian students face interview rejections due to communication anxiety, not lack of skill
3. No affordable, accessible tool exists that understands Hindi-English code-mixing
4. Rural students have no human speaking coach access

### Linguistic Context (Important for AI agents building analysis features)
Indian regional language interference patterns that the analysis engine must be aware of:

| Region | Common Patterns |
|--------|----------------|
| Hindi belt | w/v confusion ("vine" vs "wine"), retroflex /t/ and /d/, missing articles |
| South India | Gemination (double consonants), vowel length differences, no /æ/ sound |
| Bengali | "v" pronounced as "b", different /r/ quality |
| Gujarati/Marathi | Schwa deletion, vowel length differences |

The app must never frame these as "errors" in UI copy — always frame as "areas to build clarity."

---

## 3. Goals & Success Metrics

### Hackathon MVP Goals
- [ ] User can record speech and receive AI feedback within 10 seconds
- [ ] Feedback includes: WPM score, accuracy score, filler word count, 2-3 LLM tips
- [ ] Interview simulation mode works end-to-end (question → record → feedback → next question)
- [ ] Dialect onboarding (5 seed sentences) creates a stored dialect profile
- [ ] Progress screen shows history of past sessions

### Key Metrics to Track (post-MVP)
- Average WPM improvement per user over 7 days
- Filler word reduction rate
- Session completion rate (started vs finished)
- Daily active users / streak retention

---

## 4. Target Users

### Primary Persona — "Priya"
- 21-year-old from Meerut, Uttar Pradesh
- Final-year B.Com student
- Preparing for campus placement interviews
- Speaks Hindi as first language, uses Hinglish daily
- Has a smartphone (Android), limited data budget
- Feels anxious speaking English in formal settings
- Has never had access to a speaking coach

### Secondary Persona — "Ravi"
- 24-year-old from Coimbatore, Tamil Nadu
- Working at a BPO, wants to move to a corporate job
- Tamil is first language, reads English well but struggles with spoken fluency
- Practices English YouTube videos but has no feedback mechanism

### Design Implications
- UI must be warm, encouraging, never clinical or judgmental
- All feedback copy must be empathetic (see LLM prompt specs)
- App must work on mid-range Android devices (no heavy animations)
- Offline-first considerations for low connectivity areas (future scope)

---

## 5. Tech Stack

### Frontend
| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Framework | React Native (Expo) | SDK 51+ | Already initialized in root |
| Router | Expo Router | v3 | File-based routing in `/app` |
| Language | TypeScript | 5.x | Strict mode enabled |
| State (global) | Zustand | 4.x | Auth state, dialect profile, session state |
| State (server) | TanStack Query | 5.x | API calls, caching, loading states |
| Audio | expo-av | latest | Recording and playback |
| Charts | victory-native | latest | WPM trends, score rings |
| Icons | @expo/vector-icons | latest | Ionicons set |
| HTTP client | axios | 1.x | All backend API calls |

### Backend — Node.js
| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Fastify | v4, TypeScript |
| Validation | Zod | All request/response schemas |
| Auth middleware | JWT verify | Tokens issued by Supabase |
| File uploads | @fastify/multipart | Audio file ingestion |
| CORS | @fastify/cors | Allow Expo dev + prod origins |
| Queue | BullMQ + Redis | Async audio analysis jobs |
| HTTP client | axios | Calls to Sarvam API + Python service |

### Backend — Python Microservice
| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | FastAPI | Async |
| Audio analysis | librosa | WPM, pace, prosody |
| STT fallback | — | Sarvam handles STT; Python does post-processing |
| Server | uvicorn | Dev and prod |

### Infrastructure
| Service | Purpose |
|---------|---------|
| Supabase | PostgreSQL DB + Auth + Storage + Realtime WebSocket |
| Railway | Deploy Node.js backend (`/backend` subdirectory) |
| Railway | Deploy Python service (`/backend/python-service` subdirectory) |
| Sarvam AI | Speech-to-Text API (Indian language optimized) |
| Sarvam LLM | Feedback generation (empathetic coaching tips) |
| EAS Build | Expo Android APK builds |

---

## 6. Repository Structure

```
d:\Boli.AI\                         ← repo root
│
├── app/                            ← Expo Router (DO NOT restructure)
│   ├── _layout.tsx                 ← Root layout, auth gate here
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── onboarding.tsx          ← Dialect fingerprinting (5 seeds)
│   └── (tabs)/
│       ├── _layout.tsx             ← Tab bar config
│       ├── index.tsx               ← Home dashboard
│       ├── record.tsx              ← Recording screen
│       ├── interview.tsx           ← Interview simulation
│       ├── progress.tsx            ← History + charts
│       └── profile.tsx             ← Settings
│
├── components/
│   ├── ui/                         ← Base UI (Button, Card, Input, Badge)
│   ├── audio/
│   │   ├── WaveformVisualizer.tsx  ← Live recording animation
│   │   └── AudioPlayer.tsx         ← Playback for shadow mode
│   ├── feedback/
│   │   ├── ScoreCard.tsx           ← WPM / Accuracy / Filler card
│   │   ├── TranscriptHighlight.tsx ← Highlights filler words in transcript
│   │   └── TipsList.tsx            ← LLM-generated tips display
│   └── charts/
│       ├── WpmChart.tsx            ← Line chart — WPM over sessions
│       └── AccuracyRing.tsx        ← Circular progress ring
│
├── hooks/
│   ├── useAudioRecorder.ts         ← expo-av wrapper, returns {startRecording, stopRecording, audioUri, duration}
│   ├── useAnalysis.ts              ← POST to /api/session/analyze, poll result
│   └── useAuth.ts                  ← Supabase auth methods
│
├── store/
│   ├── authStore.ts                ← Zustand: user, session token, isAuthenticated
│   └── sessionStore.ts            ← Zustand: currentSession, dialectProfile, lastResult
│
├── services/
│   ├── api.ts                      ← axios instance with base URL + auth header
│   └── supabase.ts                 ← Supabase client init
│
├── constants/
│   ├── seedSentences.ts            ← 5 fixed onboarding sentences
│   ├── fillerWords.ts              ← Array of filler words to detect
│   ├── interviewQuestions.ts       ← Question bank by category
│   └── theme.ts                    ← Already exists — colors, spacing
│
└── backend/                        ← Node.js + Python (separate deploy)
    ├── src/
    │   ├── server.ts               ← Fastify init, register plugins, routes
    │   ├── routes/
    │   │   ├── auth.ts             ← POST /api/auth/verify
    │   │   ├── onboarding.ts       ← POST /api/onboarding/analyze
    │   │   ├── sessions.ts         ← POST /api/session/analyze, GET /api/sessions/history
    │   │   ├── interview.ts        ← POST /api/interview/start, POST /api/interview/:id/answer
    │   │   ├── drills.ts           ← GET /api/drills/generate
    │   │   └── profile.ts          ← GET/PUT /api/profile/me
    │   ├── services/
    │   │   ├── sarvamSTT.ts        ← Sarvam Speech API wrapper
    │   │   ├── sarvamLLM.ts        ← Sarvam LLM feedback generation
    │   │   ├── analysisEngine.ts   ← Orchestrates STT + Python + LLM
    │   │   └── queue.ts            ← BullMQ job definitions
    │   ├── middleware/
    │   │   └── auth.ts             ← Verify Supabase JWT on protected routes
    │   └── db/
    │       ├── supabase.ts         ← Supabase admin client
    │       └── schema.sql          ← Full DB schema (run once to init)
    ├── python-service/
    │   ├── main.py                 ← FastAPI app, POST /analyze
    │   ├── pace.py                 ← WPM calculation
    │   ├── filler.py               ← Filler word detection from transcript
    │   ├── accuracy.py             ← Text diff for drill/shadow accuracy
    │   └── requirements.txt
    ├── package.json
    ├── tsconfig.json
    └── .env                        ← Never commit
```

---

## 7. Environment Variables

### Frontend (`/.env` or via `app.config.ts`)
```
EXPO_PUBLIC_API_URL=http://localhost:3001
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### Backend (`/backend/.env`)
```
PORT=3001
NODE_ENV=development

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...           # Service role key (NOT anon key)

# Sarvam AI
SARVAM_API_KEY=sk-...
SARVAM_STT_URL=https://api.sarvam.ai/speech-to-text
SARVAM_LLM_URL=https://api.sarvam.ai/v1/chat/completions

# Python service
PYTHON_SERVICE_URL=http://localhost:8000

# Redis (for BullMQ)
REDIS_URL=redis://localhost:6379
```

---

## 8. Database Schema

Run this SQL in Supabase SQL Editor to initialize all tables.

```sql
-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  native_language text not null default 'hindi',
  target_language text not null default 'english',
  daily_goal_mins integer not null default 10,
  streak_days integer not null default 0,
  last_active_date date,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now()
);

-- RLS: users can only read/write their own profile
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- ============================================================
-- DIALECT PROFILES
-- ============================================================
create table public.dialect_profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  detected_region text,                        -- 'hindi_belt' | 'south_india' | 'bengal' | etc
  weak_phonemes jsonb default '[]',            -- array of {phoneme: string, severity: 'low'|'med'|'high'}
  filler_patterns jsonb default '{}',          -- {word: count} e.g. {"basically": 12, "um": 8}
  avg_wpm_baseline float,                      -- from onboarding sessions
  onboarding_session_ids uuid[],               -- links to sessions table
  updated_at timestamptz not null default now()
);

alter table public.dialect_profiles enable row level security;
create policy "Users can manage own dialect profile" on public.dialect_profiles
  for all using (auth.uid() = user_id);

-- ============================================================
-- SESSIONS (single recording + analysis result)
-- ============================================================
create type session_type as enum ('practice', 'drill', 'shadow', 'onboarding');

create table public.sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type session_type not null default 'practice',
  prompt_text text,                            -- what user was asked to say (for drill/shadow)
  transcript text,                             -- Sarvam STT output
  wpm float,                                   -- words per minute
  accuracy_score float,                        -- 0-100, null for free practice
  filler_count integer not null default 0,
  filler_words_found text[],                   -- which fillers were detected
  llm_tips text[],                             -- array of 2-3 tip strings from LLM
  audio_url text,                              -- Supabase Storage signed URL
  duration_secs float,
  overall_score float,                         -- computed: weighted avg of wpm_score + accuracy + filler penalty
  created_at timestamptz not null default now()
);

alter table public.sessions enable row level security;
create policy "Users can manage own sessions" on public.sessions
  for all using (auth.uid() = user_id);

-- ============================================================
-- INTERVIEW SESSIONS
-- ============================================================
create table public.interview_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  category text not null default 'hr',        -- 'hr' | 'technical' | 'situational'
  questions jsonb not null default '[]',       -- array of {id, text, category}
  answers jsonb not null default '[]',         -- array of {questionId, sessionId, score, transcript}
  current_question_index integer not null default 0,
  overall_score float,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.interview_sessions enable row level security;
create policy "Users can manage own interview sessions" on public.interview_sessions
  for all using (auth.uid() = user_id);

-- ============================================================
-- DRILL SESSIONS
-- ============================================================
create table public.drill_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  target_phonemes text[],                      -- which phonemes this drill targets
  sentences text[] not null,                   -- the 5 sentences presented
  session_ids uuid[],                          -- one session per sentence attempt
  scores float[],                              -- accuracy score per sentence
  avg_score float,
  created_at timestamptz not null default now()
);

alter table public.drill_sessions enable row level security;
create policy "Users can manage own drill sessions" on public.drill_sessions
  for all using (auth.uid() = user_id);
```

---

## 9. Frontend — Screens & Components

### 9.1 Screen Specifications

#### `app/(auth)/login.tsx`
- Fields: email, password
- Actions: Sign In (Supabase), Sign Up (Supabase)
- On success: check `profiles.onboarding_complete` → if false, push to `/onboarding`, else push to `/(tabs)/`
- Error states: invalid credentials, network error

#### `app/(auth)/onboarding.tsx`
- Step 1: Name input + native language picker (Hindi, Tamil, Bengali, Telugu, Marathi, Other)
- Step 2: Instructions screen — "We'll listen to you speak 5 sentences to understand your unique voice"
- Steps 3–7: One sentence per screen from `constants/seedSentences.ts`, record each one
- Step 8: "Analyzing your voice..." loading screen, calls `POST /api/onboarding/analyze`
- Step 9: Profile ready screen with dialect feedback ("We noticed you speak at X WPM naturally")
- On complete: set `profiles.onboarding_complete = true`, push to `/(tabs)/`

**Seed Sentences** (defined in `constants/seedSentences.ts`):
```typescript
export const SEED_SENTENCES = [
  "I am looking for a good opportunity in this company.",       // tests articles, /v/ vs /w/
  "My greatest strength is my ability to work in a team.",     // tests /w/, /th/, stress
  "I completed my project within the given deadline.",          // tests /w/, /ð/, schwa
  "Please tell me about yourself and your background.",         // tests /ð/, vowels
  "I believe I can contribute effectively to your organization.", // tests /v/, /θ/, rhythm
];
```

#### `app/(tabs)/index.tsx` — Home Dashboard
- Top: Greeting ("Good morning, Priya 👋")
- Streak card: current streak + days active this week
- Quick action buttons: "Practice Speaking", "Start Interview", "Shadow Mode", "Drill Mode"
- Recent session card: last session score + date
- Weekly progress mini chart (WPM last 7 days)
- Motivational quote (rotate from a fixed list of 20 — no API call needed)

#### `app/(tabs)/record.tsx` — Recording Screen
- Header: session type label ("Free Practice" / mode name)
- If prompt exists (drill/shadow): show prompt text in a card
- Center: large mic button (pulsing animation when recording)
- Below mic: WaveformVisualizer component (animated bars)
- Timer: MM:SS counting up while recording
- Stop button: appears after 3 seconds of recording
- On stop: show "Analyzing..." overlay, call `useAnalysis` hook
- On result: navigate to Feedback screen passing result as param

#### `app/feedback.tsx` — Feedback Screen (modal or stack)
- Score cards row: WPM | Accuracy | Fillers (each as a ScoreCard component)
- Transcript section: full transcript with filler words highlighted in amber
- Tips section: 2-3 TipsList items from LLM
- Action buttons: "Try Again" | "Go to Drills" | "Back to Home"
- Share button: screenshot of scores (future scope, stub it out)

#### `app/(tabs)/interview.tsx` — Interview Simulation
- Category picker: HR / Technical / Situational
- Question card: displays current question with question number
- Record button: same UX as record screen
- After each answer: mini feedback (just scores, no full screen) + "Next Question" button
- After all questions (5 per session): full report screen
  - Per-question scores table
  - Overall score with grade (A/B/C/D)
  - Top 3 tips from session aggregate
- "Retry Interview" and "Back to Home" buttons

#### `app/(tabs)/progress.tsx` — Progress & History
- WPM chart: line chart of last 10 sessions (victory-native)
- Accuracy trend: line chart of last 10 sessions
- Filler word reduction: bar chart
- Session log: FlatList of past sessions
  - Each item: date, type icon, WPM, accuracy, duration
  - Tap to expand and see transcript + tips

#### `app/(tabs)/profile.tsx` — Profile & Settings
- Display: name, native language, streak
- Editable: daily goal (minutes), target language, notification time
- Section: "Redo Voice Onboarding" button (re-runs onboarding flow)
- Section: "About BOLI.AI"
- Sign out button

---

### 9.2 Reusable Components

#### `components/audio/WaveformVisualizer.tsx`
```typescript
// Props
interface WaveformVisualizerProps {
  isRecording: boolean;
  barCount?: number; // default 20
  color?: string;
}
// Renders animated bars using Animated API
// Bars randomly pulse in amplitude while isRecording is true
// Static / flat when not recording
```

#### `components/feedback/ScoreCard.tsx`
```typescript
interface ScoreCardProps {
  label: string;           // "WPM" | "Accuracy" | "Fillers"
  value: number | string;
  unit?: string;           // "wpm" | "%" | "words"
  status: 'good' | 'ok' | 'improve';  // drives color coding
  target?: string;         // e.g. "Target: 130–150"
}
// Green for 'good', amber for 'ok', soft red for 'improve'
// Never use harsh red — always use a soft coral
```

#### `components/feedback/TranscriptHighlight.tsx`
```typescript
interface TranscriptHighlightProps {
  transcript: string;
  fillerWords: string[];   // words to highlight
}
// Splits transcript into word tokens
// Wraps filler words in amber-colored Text spans
```

#### `components/feedback/TipsList.tsx`
```typescript
interface TipsListProps {
  tips: string[];  // array of 2-3 strings from LLM
}
// Each tip has a numbered icon and the tip text
// Warm purple accent color for numbers
// Never show more than 3 tips — truncate if needed
```

---

## 10. Backend — Routes & Services

### 10.1 `backend/src/server.ts`
```typescript
// Fastify server setup
// Register: @fastify/cors, @fastify/multipart, @fastify/formbody
// Register routes: auth, onboarding, sessions, interview, drills, profile
// Health check: GET /health → { status: 'ok', timestamp }
// Start on PORT from .env
```

### 10.2 Route Specifications

#### `POST /api/onboarding/analyze`
- Auth: required
- Body: multipart — 5 audio files (`seed_0` through `seed_4`) + `nativeLanguage: string`
- Process:
  1. Send each audio to Sarvam STT
  2. Calculate average WPM across 5 recordings
  3. Detect common filler patterns
  4. Infer dialect region based on `nativeLanguage` (simple lookup, not ML)
  5. Save dialect profile to `dialect_profiles` table
  6. Mark `profiles.onboarding_complete = true`
- Response:
```json
{
  "dialectProfile": {
    "detectedRegion": "hindi_belt",
    "avgWpmBaseline": 112,
    "weakPhonemes": [],
    "fillerPatterns": {}
  },
  "message": "Voice profile created successfully"
}
```

#### `POST /api/session/analyze`
- Auth: required
- Body: multipart — `audio: File`, `type: string`, `promptText?: string`
- Process:
  1. Save audio to Supabase Storage → get signed URL
  2. Send audio to Sarvam STT → get transcript
  3. POST transcript + audio metadata to Python service → get `{wpm, fillerCount, fillerWordsFound, accuracyScore}`
  4. POST transcript + scores to Sarvam LLM → get `tips: string[]`
  5. Compute `overallScore`
  6. Save session to DB
  7. Return full result
- Response:
```json
{
  "sessionId": "uuid",
  "transcript": "I am looking for a good opportunity...",
  "wpm": 127,
  "accuracyScore": 88,
  "fillerCount": 2,
  "fillerWordsFound": ["basically", "um"],
  "tips": [
    "Great pace! Try to slow down slightly on complex words.",
    "You said 'basically' twice — try pausing instead.",
    "Your pronunciation of 'opportunity' was very clear!"
  ],
  "overallScore": 82,
  "audioUrl": "https://..."
}
```

#### `GET /api/sessions/history`
- Auth: required
- Query params: `limit=20`, `offset=0`, `type?=practice|drill|interview`
- Response: `{ sessions: Session[], total: number }`

#### `POST /api/interview/start`
- Auth: required
- Body: `{ category: 'hr' | 'technical' | 'situational' }`
- Process: Pick 5 random questions from `constants/interviewQuestions.ts` matching category
- Save interview session to DB
- Response: `{ interviewId: string, firstQuestion: { id, text, number: 1, total: 5 } }`

#### `POST /api/interview/:interviewId/answer`
- Auth: required
- Body: multipart — `audio: File`, `questionId: string`
- Process: Same as `/api/session/analyze` but scoped to interview
- Update `interview_sessions.answers` array
- If `current_question_index < 4`: return next question
- If last question: compute `overallScore`, mark `completed: true`, return report
- Response:
```json
{
  "answerResult": { "sessionId": "...", "wpm": 130, "accuracyScore": 91, "fillerCount": 1, "tips": [...] },
  "nextQuestion": { "id": "q3", "text": "Where do you see yourself in 5 years?", "number": 3, "total": 5 },
  "isComplete": false
}
```

#### `GET /api/interview/:interviewId/report`
- Auth: required
- Response: Full interview session with all answers, per-question scores, overall score, aggregate tips

#### `GET /api/drills/generate`
- Auth: required
- Process: Read user's `dialect_profiles.weakPhonemes` → select 5 sentences from drill bank targeting those phonemes
- If no dialect profile exists, return general confidence-building sentences
- Response: `{ sentences: string[], targetPhonemes: string[] }`

#### `GET /api/profile/me`
- Auth: required
- Response: User profile + dialect profile merged

#### `PUT /api/profile/me`
- Auth: required
- Body: `{ name?, dailyGoalMins?, nativeLanguage?, targetLanguage? }`
- Response: Updated profile

---

## 11. Python Analysis Service

### `backend/python-service/main.py`
```python
# FastAPI app
# Single endpoint: POST /analyze
# Input: { transcript: str, duration_secs: float, prompt_text: str | None, session_type: str }
# Output: { wpm: float, filler_count: int, filler_words_found: list[str], accuracy_score: float | None }
```

### `backend/python-service/pace.py`
```python
def calculate_wpm(transcript: str, duration_secs: float) -> float:
    """
    Count words in transcript, divide by duration in minutes.
    Clean transcript first: remove punctuation, strip whitespace.
    Returns float rounded to 1 decimal place.
    Target range: 130–150 WPM for interview context.
    """
    word_count = len(transcript.strip().split())
    duration_mins = duration_secs / 60
    return round(word_count / duration_mins, 1) if duration_mins > 0 else 0.0
```

### `backend/python-service/filler.py`
```python
# Import FILLER_WORDS list (must match frontend constants/fillerWords.ts)
FILLER_WORDS = [
    "um", "uh", "ah", "er", "basically", "actually", "literally",
    "like", "you know", "i mean", "sort of", "kind of", "right",
    "okay so", "so yeah", "only", "simply"
]

def detect_fillers(transcript: str) -> dict:
    """
    Case-insensitive search for filler words in transcript.
    Returns { filler_words_found: list[str], filler_count: int }
    Count each occurrence, not just unique words.
    """
```

### `backend/python-service/accuracy.py`
```python
def calculate_accuracy(transcript: str, prompt_text: str) -> float:
    """
    Used only for drill and shadow modes where expected text is known.
    Use difflib.SequenceMatcher for word-level comparison.
    Returns score 0–100.
    Ignore punctuation and case in comparison.
    """
```

### `requirements.txt`
```
fastapi==0.111.0
uvicorn==0.30.0
librosa==0.10.2
numpy==1.26.4
difflib  # stdlib, no install needed
python-multipart==0.0.9
```

---

## 12. Core Analysis Pipeline

This is the exact sequence that runs every time a user submits audio. Build this in `backend/src/services/analysisEngine.ts`.

```
INPUT: audioBuffer (Buffer), duration (float), sessionType (string), promptText (string|null), userId (string)

STEP 1 — STORAGE
  → Upload audio to Supabase Storage bucket 'recordings'
  → Path: `{userId}/{timestamp}.m4a`
  → Get signed URL (7 day expiry)
  → On failure: throw StorageError, do not proceed

STEP 2 — SPEECH TO TEXT
  → POST audio to Sarvam STT API
  → Headers: { 'api-subscription-key': SARVAM_API_KEY }
  → Body: FormData with audio file + language_code ('en-IN')
  → Extract transcript string from response
  → On failure: throw STTError with message "Speech recognition failed"

STEP 3 — PYTHON ANALYSIS
  → POST to PYTHON_SERVICE_URL/analyze
  → Body: { transcript, duration_secs: duration, prompt_text: promptText, session_type: sessionType }
  → Extract: { wpm, filler_count, filler_words_found, accuracy_score }
  → On failure: use fallback calculation (calculate WPM in Node from transcript + duration)

STEP 4 — LLM FEEDBACK
  → Build prompt using template (see Section 13)
  → POST to Sarvam LLM API
  → Parse response as JSON array of 3 strings
  → On failure: return generic tips array (do not crash the session)

STEP 5 — SCORE COMPUTATION
  wpmScore = clamp((wpm / 150) * 100, 0, 100)          // 150 WPM = 100%
  fillerPenalty = min(filler_count * 5, 30)              // max 30 point penalty
  accuracyComponent = accuracy_score ?? 75               // default 75 if free practice
  overallScore = round((wpmScore * 0.3) + (accuracyComponent * 0.5) + ((100 - fillerPenalty) * 0.2))

STEP 6 — PERSIST
  → Insert into sessions table
  → Return full session object

OUTPUT: Session object with all fields populated
```

---

## 13. LLM Prompt Specifications

### Main Feedback Prompt

**System Prompt (never change this):**
```
You are BOLI, a warm, encouraging speaking coach for Indian students preparing for job interviews.
Your role is to build confidence, not criticize.
Rules:
- Always acknowledge something positive first
- Give exactly 2-3 tips, each one sentence long
- Never mention "accent" negatively
- Frame everything as skill-building: "try" not "you should"
- Use simple language (8th grade reading level)
- Be specific — reference actual words or scores from the session
- Return ONLY a JSON array of strings. No preamble, no markdown, no explanation.
Example output: ["Great energy in your voice!", "Try pausing for 1 second instead of saying 'basically'.", "Your pace of 127 WPM is very good — keep it up!"]
```

**User Prompt Template:**
```
Student speaking session data:
- Transcript: "{{transcript}}"
- Speaking pace: {{wpm}} words per minute (ideal: 130–150 WPM for interviews)
- Filler words detected: {{fillerWordsFound}} (used {{fillerCount}} times total)
- Accuracy score: {{accuracyScore}}% {{#if promptText}}(compared to target text){{/if}}
- Session type: {{sessionType}}
- Student's native language: {{nativeLanguage}}

Give them 2-3 encouraging, specific tips to improve.
Return only a JSON array of strings.
```

### Fallback Tips (if LLM fails)
```typescript
export const FALLBACK_TIPS = [
  "Keep practicing — consistency is the key to confident speaking.",
  "Try recording yourself daily for 5 minutes to track your progress.",
  "Focus on pausing naturally between sentences instead of using filler words."
];
```

---

## 14. Feature Specifications

### 14.1 Dialect Onboarding
- **Trigger:** First login, or manual re-run from Profile
- **Duration:** Target under 3 minutes for user
- **Sentences:** Fixed set of 5 (see `constants/seedSentences.ts`)
- **Processing:** Run all 5 through STT, calculate average WPM, detect filler patterns
- **Region inference:** Based on `nativeLanguage` selection, not ML (for MVP)
  ```typescript
  const LANGUAGE_TO_REGION = {
    hindi: 'hindi_belt',
    punjabi: 'hindi_belt',
    marathi: 'western_india',
    gujarati: 'western_india',
    bengali: 'east_india',
    tamil: 'south_india',
    telugu: 'south_india',
    kannada: 'south_india',
    malayalam: 'south_india',
  };
  ```
- **UI copy:** Always positive — "Your voice has been captured!" not "Analysis complete"

### 14.2 Free Practice Mode
- User records anything they want to say
- No prompt, no expected text
- Feedback: WPM, filler count, LLM tips
- `accuracyScore` is null for this mode — do not show accuracy card

### 14.3 Interview Simulation Mode
- 5 questions per session
- Question bank: minimum 30 questions per category (HR/Technical/Situational)
- Questions displayed one at a time
- User cannot skip questions
- Each answer: 30 second minimum, 3 minute maximum recording
- After last answer: generate report
- Report shows: overall grade (A/B/C/D based on score), per-question breakdown, top 3 aggregate tips

**Score to Grade mapping:**
```
90–100 → A (Excellent)
75–89  → B (Good)
60–74  → C (Needs Practice)
0–59   → D (Keep Going!)
```

### 14.4 Shadow Mode
- App plays reference audio clip (pre-recorded by team)
- User listens, then records themselves repeating it
- Accuracy compared against reference transcript
- Feedback: accuracy score + WPM comparison + tips

### 14.5 Drill Mode
- 5 targeted sentences based on dialect profile
- User records each sentence one at a time
- Accuracy compared against exact sentence text
- At end: show which phonemes improved
- Save as drill_session in DB

### 14.6 Progress Tracking
- Pull last 10 sessions for charts
- Charts: WPM trend, accuracy trend, filler word reduction
- Sessions list: scrollable, filterable by type
- No gamification beyond streak counter for MVP

---

## 15. API Contract

### Authentication
All protected routes require header:
```
Authorization: Bearer {supabase_jwt_token}
```
The Fastify auth middleware (`backend/src/middleware/auth.ts`) must verify this JWT using Supabase's JWT secret.

### Standard Response Envelope
All API responses follow this shape:
```typescript
// Success
{ success: true, data: T }

// Error
{ success: false, error: { code: string, message: string } }
```

### Error Codes
| Code | Meaning | HTTP Status |
|------|---------|-------------|
| `AUTH_REQUIRED` | No/invalid JWT | 401 |
| `NOT_FOUND` | Resource not found | 404 |
| `VALIDATION_ERROR` | Bad request body | 400 |
| `STT_FAILED` | Sarvam STT unavailable | 502 |
| `STORAGE_FAILED` | Supabase Storage error | 502 |
| `LLM_FAILED` | LLM generation failed | 502 — use fallback tips, do NOT return 502 to client |
| `INTERNAL_ERROR` | Unexpected server error | 500 |

### Audio Upload Requirements
- Format: `.m4a` or `.wav`
- Max size: 10MB per file
- Max duration: 5 minutes
- Min duration: 2 seconds (reject shorter recordings with `VALIDATION_ERROR`)

---

## 16. State Management

### Zustand Store — `store/authStore.ts`
```typescript
interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isOnboardingComplete: boolean;

  setUser: (user: User, token: string) => void;
  setOnboardingComplete: () => void;
  signOut: () => void;
}
```

### Zustand Store — `store/sessionStore.ts`
```typescript
interface SessionStore {
  dialectProfile: DialectProfile | null;
  lastSessionResult: SessionResult | null;
  currentInterviewId: string | null;
  currentInterviewQuestion: Question | null;

  setDialectProfile: (profile: DialectProfile) => void;
  setLastSessionResult: (result: SessionResult) => void;
  setCurrentInterview: (id: string, question: Question) => void;
  clearCurrentInterview: () => void;
}
```

### TanStack Query Keys
```typescript
export const QUERY_KEYS = {
  sessions: ['sessions'],
  sessionHistory: (type?: string) => ['sessions', 'history', type],
  profile: ['profile', 'me'],
  dialectProfile: ['profile', 'dialect'],
  interviewReport: (id: string) => ['interview', id, 'report'],
  drills: (userId: string) => ['drills', userId],
};
```

---

## 17. Navigation Structure

```
Stack Navigator (root)
├── (auth) group — shown if !isAuthenticated
│   ├── /login
│   └── /onboarding
│
└── (tabs) group — shown if isAuthenticated && onboardingComplete
    ├── /index (Home)           ← default tab
    ├── /record                 ← tab
    ├── /interview              ← tab
    ├── /progress               ← tab
    └── /profile                ← tab

Modal screens (presented over tabs):
    └── /feedback               ← pushed after recording analysis completes
```

**Auth Guard Logic** (in `app/_layout.tsx`):
```typescript
// On app start:
// 1. Check Supabase session
// 2. If no session → redirect to /login
// 3. If session → fetch profile
// 4. If profile.onboardingComplete === false → redirect to /onboarding
// 5. Else → allow tabs to render
```

---

## 18. Error Handling Rules

### Frontend Rules
1. Every API call must have a loading state, success state, and error state
2. Network errors: show a toast "Connection issue — please try again"
3. Analysis failures: show "Something went wrong with analysis" + "Try Again" button — never lose the recording
4. Audio recording errors: show "Microphone access needed" with link to settings
5. Never show raw error messages from the server to the user

### Backend Rules
1. All routes wrapped in try/catch
2. LLM failures: catch silently, return fallback tips, log the error — do not fail the session
3. Python service failures: catch silently, calculate WPM in Node as fallback, log the error
4. Storage failures: fail loudly, return 502 to client (cannot proceed without storing audio)
5. STT failures: fail loudly, return 502 to client (cannot proceed without transcript)
6. All errors logged with: timestamp, userId, route, error message, stack trace

### Retry Policy
- STT API: 2 retries with 1s delay
- LLM API: 1 retry, then fallback tips
- Python service: 1 retry, then Node fallback
- Supabase Storage: 2 retries with exponential backoff

---

## 19. MVP Scope & Build Order

Build in this exact order. Each phase is independently demoable.

### Phase 1 — Foundation (Day 1 AM)
- [ ] Supabase project setup — create tables from schema.sql
- [ ] Fastify server running on port 3001 with health check
- [ ] Supabase Auth connected to frontend (login works)
- [ ] Auth guard in `app/_layout.tsx`

### Phase 2 — Core Loop (Day 1 PM)
- [ ] Audio recording works in `app/(tabs)/record.tsx` using expo-av
- [ ] `POST /api/session/analyze` endpoint working
- [ ] Sarvam STT integration working (returns transcript)
- [ ] Python service running — WPM + filler detection working
- [ ] Feedback screen renders with real data

### Phase 3 — Onboarding (Day 2 AM)
- [ ] Onboarding flow — 5 seed sentences with recording
- [ ] `POST /api/onboarding/analyze` working
- [ ] Dialect profile saved to DB
- [ ] Home screen shows user name + streak

### Phase 4 — Interview Mode (Day 2 PM)
- [ ] Question bank populated in `constants/interviewQuestions.ts` (min 15 questions)
- [ ] `POST /api/interview/start` working
- [ ] `POST /api/interview/:id/answer` working
- [ ] Interview report screen renders

### Phase 5 — Progress & Polish (Day 3)
- [ ] Progress screen with session history
- [ ] WPM chart renders with real data
- [ ] LLM feedback tips working (Sarvam LLM integrated)
- [ ] Error states and loading states on all screens
- [ ] App icon + splash screen set to BOLI.AI branding

---

## 20. Out of Scope (Do Not Build for MVP)

These are explicitly excluded from the hackathon MVP:

- Waveform comparison / phoneme-level audio overlay
- On-device STT (Picovoice) — use Sarvam API only
- Push notifications
- Shadow Mode (stub the button, mark as "Coming Soon")
- Social features / leaderboards
- Paid tiers / subscription logic
- iOS-specific builds (Android only for demo)
- Multi-language UI (English UI only, supports Hindi speech input)
- Offline mode
- PostHog / Sentry analytics (add stubs but don't configure)
- College placement cell integration
- Admin dashboard

---

*End of PRD v1.0.0*

*This document is the single source of truth. If any implementation decision conflicts with this PRD, the PRD takes precedence. Update version number when making breaking changes.*
