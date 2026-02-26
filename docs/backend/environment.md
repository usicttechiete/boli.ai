# Environment Variables

## Overview

The Boli.AI backend relies on external services for database hosting, redis caching, and STT/LLM capabilities. It requires exact variables defined below in `.env`.

> [!WARNING]
> Security Reminder
> The `SUPABASE_SERVICE_KEY` bypasses all Row Level Security. **NEVER** expose this key or compile it in any client-side JavaScript bundle on the frontend. The Fastify Server executes protected queries safely as an admin layer using this token.

## Backend Variables (`backend/.env`)

These credentials must be provided inside the `/backend/.env` file. You can base this off `/backend/.env.example`.

| Variable Name              | Required | Description                                        | Example                                     |
| -------------------------- | -------- | -------------------------------------------------- | ------------------------------------------- |
| `PORT`                     | No       | Server port (defaults to 3001).                    | `3001`                                      |
| `NODE_ENV`                 | No       | Node Environment variable.                         | `development`                               |
| `SUPABASE_URL`             | **Yes**  | Project endpoint URL for Postgres DB mapping.      | `https://xxx.supabase.co`                   |
| `SUPABASE_SERVICE_KEY`     | **Yes**  | The **Service Role** admin key (not the Anon Key). | `eyJ...service_role_key`                    |
| `SUPABASE_JWT_SECRET`      | **Yes**  | The HS256 JWT key used to sign Auth tokens.        | `your-jwt-secret`                           |
| `SARVAM_API_KEY`           | **Yes**  | Developer API Key from Sarvam.                     | `sk-...`                                    |
| `SARVAM_STT_URL`           | No       | Full URL for Sarvam STT. Default mapped in code.   | `https://api.sarvam.ai/speech-to-text`      |
| `SARVAM_LLM_URL`           | No       | Full URL for Sarvam LLM. Default mapped in code.   | `https://api.sarvam.ai/v1/chat/completions` |
| `PYTHON_SERVICE_URL`       | No       | Base URI for local/remote WPM service.             | `http://localhost:8000`                     |
| `UPSTASH_REDIS_REST_URL`   | No       | Endpoint URL for the Redis instance.               | `https://xxx.upstash.io`                    |
| `UPSTASH_REDIS_REST_TOKEN` | No       | Admin token to access Upstash.                     | `your-upstash-token`                        |

## Sourcing Instructions & Key Locations

### Supabase Settings
- Navigate to your Supabase Project Dashboard.
- Open **Project Settings -> API**.
- You will find the `Project URL` mapped to `SUPABASE_URL`.
- Under **Project API Keys**, you will find `service_role`. This is the `SUPABASE_SERVICE_KEY`.
- Under **JWT Settings**, you will find the **JWT Secret**. This is the `SUPABASE_JWT_SECRET`.

### Sarvam AI Settings
- Navigate to your Sarvam API Dashboard (`dashboard.sarvam.ai`).
- Open **Developer Keys**.
- Generate an API Key to copy as your `SARVAM_API_KEY`.

### Upstash Redis Settings
- Navigate to your Upstash Console (`console.upstash.com`).
- Select the Redis database.
- Scroll down to the **REST API** section.
- You will find the endpoint and standard tokens under `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
