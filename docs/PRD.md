# BOLI.AI — Product Requirements Document (PRD)

> **Version:** 2.0.0
> **Status:** Active Development — Hackathon MVP
> **Team:** Boli.AI Creators, USICT, GGSIPU
> **Last Updated:** 2026-02-26
> **Document Purpose:** This PRD is written for AI coding agents. Every section is structured to be unambiguous, actionable, and directly implementable. Follow it top to bottom when building features.

---

## Table of Contents

- [BOLI.AI — Product Requirements Document (PRD)](#boliai--product-requirements-document-prd)
  - [Table of Contents](#table-of-contents)
  - [1. Project Overview](#1-project-overview)
  - [2. Problem Statement](#2-problem-statement)
    - [Root Causes](#root-causes)
  - [3. Goals \& Success Metrics](#3-goals--success-metrics)
    - [Hackathon MVP Goals](#hackathon-mvp-goals)
  - [4. Target Users](#4-target-users)
  - [5. Tech Stack](#5-tech-stack)
    - [Frontend](#frontend)
    - [Backend — Node.js \& Python](#backend--nodejs--python)
    - [Infrastructure](#infrastructure)
  - [6. Repository Structure](#6-repository-structure)
  - [7. Environment Variables](#7-environment-variables)
  - [8. Database Schema](#8-database-schema)
  - [9. Frontend — Screens \& Components](#9-frontend--screens--components)
    - [`app/(tabs)/index.tsx` — Home](#apptabsindextsx--home)
    - [`app/test/[language].tsx` — Language Testing](#apptestlanguagetsx--language-testing)
    - [`app/test/analysis.tsx` — Analysis Report](#apptestanalysistsx--analysis-report)
    - [`app/learn/[language].tsx` — Source Selection](#applearnlanguagetsx--source-selection)
    - [`app/learn/practice.tsx` — Dummy Lesson](#applearnpracticetsx--dummy-lesson)
    - [`app/(tabs)/account.tsx` — Account](#apptabsaccounttsx--account)
  - [10. Backend — Routes \& Services](#10-backend--routes--services)
    - [`POST /api/test/analyze`](#post-apitestanalyze)
    - [`GET /api/test/known-languages`](#get-apitestknown-languages)
  - [11. Python Analysis Service \& 12. Core Pipeline](#11-python-analysis-service--12-core-pipeline)
  - [13. LLM Prompt Specifications](#13-llm-prompt-specifications)
  - [14-16. State, Navigation, Error Handling](#14-16-state-navigation-error-handling)
  - [19. MVP Scope \& Build Order](#19-mvp-scope--build-order)
  - [20. Out of Scope](#20-out-of-scope)

---

## 1. Project Overview

**BOLI.AI** is a mobile-first language learning application focused on bridging the gap for Indian users. It empowers users to first establish a baseline of proficiency in their known native or acquired languages, and then seamlessly transition into learning new languages by selecting a known "source language." 

**Core Value Proposition:**
- Real-time, Sarvam API-powered analysis to baseline "Known Languages".
- Accurate measurement of pace, accent, dialect, and fluency.
- Clean, focused 2-tab bottom navigation experience.
- "Learn From" mechanism, grounding new language acquisition in existing linguistic strengths.

---

## 2. Problem Statement

### Root Causes
1. Existing language apps are built around Western expectations and often fail to accurately interpret or leverage Indian dialects.
2. Users don't have a reliable, quantifiable baseline of their current language skills (pace, accent, dialect, fluency).
3. Learning a new language is often easier when bridged from a native tongue, but many apps force English as the default intermediary language.

---

## 3. Goals & Success Metrics

### Hackathon MVP Goals
- [ ] Clean layout using a 2-tab bottom navigation (`Home` and `Account`).
- [ ] Users can add a "Known Language," record themselves reading a sample paragraph, and receive immediate baseline analysis.
- [ ] Language baseline testing evaluates pace, accent, dialect, and fluency via Sarvam API.
- [ ] The "Learn Language" section lists English and Hindi as active, with several other Indian and foreign languages flagged as "Coming Soon."
- [ ] Clicking an active "Learn Language" prompts the user to select from their registered "Known Languages" as the medium of instruction.

---

## 4. Target Users

- Indian students & professionals.
- Smartphone users seeking clear, judgment-free AI evaluation of their speech characteristics.
- Multilingual individuals seeking an objective measure of their language proficiency to better guide their learning path.

---

## 5. Tech Stack

### Frontend
| Layer         | Technology          | Version |
| ------------- | ------------------- | ------- |
| Framework     | React Native (Expo) | SDK 51+ |
| Router        | Expo Router         | v3      |
| Language      | TypeScript          | 5.x     |
| State         | Zustand             | 4.x     |
| Data Fetching | TanStack Query      | 5.x     |
| Audio         | expo-av             | latest  |

### Backend — Node.js & Python
| Layer          | Technology                |
| -------------- | ------------------------- |
| Node Framework | Fastify, Zod              |
| Gen AI / STT   | Sarvam API                |
| Python API     | FastAPI, librosa, difflib |
| Async Queue    | BullMQ + Redis            |

### Infrastructure
- Supabase (PostgreSQL, Auth, Storage)

---

## 6. Repository Structure

```
d:\Boli.AI\
├── app/
│   ├── _layout.tsx
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── signup.tsx
│   └── (tabs)/
│       ├── _layout.tsx             ← Bottom nav (Home, Account)
│       ├── index.tsx               ← Home screen
│       └── account.tsx             ← Profile, Settings, Sign Out
├── app/test/
│   ├── _layout.tsx
│   ├── [language].tsx              ← Test recording screen 
│   └── analysis.tsx                ← Test analysis results
├── app/learn/
│   ├── _layout.tsx
│   ├── [language].tsx              ← Select source language
│   └── practice.tsx                ← Dummy lesson flow
├── components/
│   ├── ui/
│   ├── audio/
│   └── feedback/
├── hooks/
├── store/
├── services/
├── constants/
└── backend/
    ├── src/
    └── python-service/
```

---

## 7. Environment Variables

Same as previously defined (EXPO_PUBLIC_API_URL, SUPABASE_URL, SARVAM_API_KEY, etc.).

---

## 8. Database Schema

```sql
-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- USERS
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  created_at timestamptz not null default now()
);

-- KNOWN LANGUAGE PROFICIENCIES
-- Stores the baseline test results for languages the user knows
create table public.known_language_proficiencies (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  language text not null,
  transcript text,
  pace_wpm float,
  accent_feedback text,
  dialect_inferred text,
  fluency_score float,
  audio_url text,
  created_at timestamptz not null default now()
);

alter table public.known_language_proficiencies enable row level security;
create policy "Users can manage own proficiencies" on public.known_language_proficiencies
  for all using (auth.uid() = user_id);
```

---

## 9. Frontend — Screens & Components

### `app/(tabs)/index.tsx` — Home
- **User Greeting**: "Hello, [Name]" at the top.
- **Current Known Languages**: 
  - List of languages the user has tested (initially empty).
  - Button: "Add Language".
- **Learn Language Section**:
  - Grid or list of languages to learn.
  - Active: English, Hindi.
  - Coming Soon (disabled state with a badge): Tamil, Telugu, Punjabi, Gujarati, Marathi, Japanese, German, French.

### `app/test/[language].tsx` — Language Testing
- **Trigger**: Clicking "Add Language" on the Home screen and selecting a language.
- **UI**: 
  - Shows a sample paragraph in the selected language.
  - Microphone record button.
  - Submit button.
- **Action**: On submit, audio is sent for analysis and user is routed to `app/test/analysis.tsx`.

### `app/test/analysis.tsx` — Analysis Report
- **Result Output**:
  - Pace (WPM)
  - Accent details
  - Dialect details
  - Fluency score
- **Actions**:
  - "Retest" button (replaces or creates a new entry).
  - "Done / Go Home" button.

### `app/learn/[language].tsx` — Source Selection
- **Trigger**: Clicking English or Hindi in the Learn section.
- **UI**: "Which language would you like to use to learn [Target]?"
  - Shows list of languages the user already established in their Known Languages section.
- **Action**: Upon selection, redirect to `app/learn/practice.tsx`.

### `app/learn/practice.tsx` — Dummy Lesson
- Placeholder screen indicating the start of a lesson based on the selected source/target pair.

### `app/(tabs)/account.tsx` — Account
- Profile details (Name, avatar).
- Settings toggles (notifications, etc).
- Sign out button.

---

## 10. Backend — Routes & Services

### `POST /api/test/analyze`
- Auth: required
- Body: multipart — `audio: File`, `language: string`, `promptText: string`
- Process:
  1. Upload audio to Supabase.
  2. Sarvam STT -> Transcript.
  3. Python service -> WPM.
  4. Sarvam LLM -> Evaluates Fluency, Accent, Dialect based on transcript accuracy and audio context.
  5. Save to `known_language_proficiencies`.
- Response: 
```json
{
  "pace_wpm": 125,
  "accent_feedback": "Clear, neutral tone.",
  "dialect_inferred": "Hindi Belt Influence",
  "fluency_score": 88
}
```

### `GET /api/test/known-languages`
- Auth: required
- Response: List of user's proven known languages from the DB.

---

## 11. Python Analysis Service & 12. Core Pipeline
Remains similar to earlier versions, but pared down specifically to calculate `pace` and standard transcript matching (fluency approximation). Accent and Dialect will primarily be derived from LLM feedback on the STT output and metadata.

---

## 13. LLM Prompt Specifications

**Analysis Prompt:**
```
Student speaking a sample paragraph in {{language}}.
- Transcript: "{{transcript}}"
- Target text: "{{promptText}}"
- Speaking pace: {{wpm}} WPM.

Analyze this performance. Output a JSON payload with exact keys:
{
  "accent_feedback": "1 short sentence about their accent clarity",
  "dialect_inferred": "Likely regional dialect inferred from patterns",
  "fluency_score": "Number 0-100 indicating closeness to native fluidity"
}
```

---

## 14-16. State, Navigation, Error Handling
Follows the standard React Native Context/Zustand pattern. Navigation restricted entirely to the 2 main tabs and stacked modal/detail routes for Testing and Learning flows.

---

## 19. MVP Scope & Build Order

1. **Phase 1:** Setup 2-Tab Navigation (`Home`, `Account`). Clean out the old tab routes.
2. **Phase 2:** Implement Database updates (Drop old tables, add `known_language_proficiencies`).
3. **Phase 3:** Home layout (Greeting, Known Languages empty state, Learn Section with active vs coming soon).
4. **Phase 4:** Add Language Test flow (`/test/[language].tsx` recording -> `analysis.tsx` display).
5. **Phase 5:** Learn Language flow (`/learn/[language].tsx` selection -> `practice.tsx` dummy).

---

## 20. Out of Scope
- Dialect onboarding at account creation (removed; replaced by manual "Add Language" testing).
- Interview simulation mode.
- Drill/Shadow modes.
- Complex gamification or graphs.
- Non-Indian languages via Sarvam API (listed purely as "coming soon").

*End of PRD v2.0.0*
