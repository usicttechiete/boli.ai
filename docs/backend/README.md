# Boli.AI Backend Platform

## Overview

The Boli.AI backend is a high-performance Node.js service built with **Fastify** and **TypeScript**. It serves as the primary gateway for the Boli.AI mobile app, handling audio processing pipelines, speech-to-text (STT), large language model (LLM) coaching generation, and interview session orchestration.

The backend is designed for resilience via graceful fallbacks, fast processing via Sarvam AI's Indian-language optimized models, and robust type safety.

## Table of Contents

- [Architecture & Design Decisions](./architecture.md)
- [Backend Implementation & Routes](./backend.md)
- [Environment Variables](./environment.md)

## Quick Start

### 1. Prerequisites
- Node.js v22+
- Supabase Project (for Postgres + Auth + Storage)
- Redis database (Upstash)
- Sarvam AI API Key

### 2. Setup
```bash
# Move to the backend directory
cd backend

# Install dependencies
npm install

# Copy environment variables and fill them in
cp .env.example .env
```

### 3. Database Initialization
Run the schema script found in `src/db/schema.sql` inside your Supabase SQL Editor. This initializes the required tables, triggers, and Row Level Security (RLS) policies.

Additionally, create a **Private** storage bucket named `recordings` in Supabase Storage.

### 4. Running the Server
```bash
# Start in development mode (with pino-pretty logging and watch support)
npm run dev

# Build and start in production
npm run build
npm start
```
The server will start on `http://localhost:3001` (by default). To verify, make a `GET` request to `/health`.

## Tech Stack

| Component       | Technology    | Description                                                |
| --------------- | ------------- | ---------------------------------------------------------- |
| Framework       | Fastify v4    | High-performance Node.js REST framework.                   |
| Language        | TypeScript    | Strict type checking and advanced interfaces.              |
| Database / Auth | Supabase      | Postgres DB, Service Role SDK, Storage, Authentication.    |
| Validation      | Zod           | Runtime schema validation for requests.                    |
| AI / Analysis   | Sarvam AI     | Specialized STT API + Instruction-tuned LLMs (`sarvam-m`). |
| Caching         | Upstash Redis | HTTP REST-based Redis client (no TCP overhead).            |
| Logging         | Pino          | Extremely fast JSON logger.                                |
