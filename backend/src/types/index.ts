/**
 * Shared TypeScript types for the Boli.AI backend.
 * These mirror the DB schema and API contract in the PRD.
 */

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface JwtPayload {
    sub: string;        // Supabase user UUID
    email?: string;
    iat?: number;
    exp?: number;
}

// Augment FastifyRequest to carry the decoded user
declare module 'fastify' {
    interface FastifyRequest {
        user: JwtPayload;
    }
}

// ─── DB Models ───────────────────────────────────────────────────────────────

export type SessionType = 'practice' | 'drill' | 'shadow' | 'onboarding';

export interface Profile {
    id: string;
    name: string;
    native_language: string;
    target_language: string;
    daily_goal_mins: number;
    streak_days: number;
    last_active_date: string | null;
    onboarding_complete: boolean;
    created_at: string;
}

export interface DialectProfile {
    id: string;
    user_id: string;
    detected_region: string | null;
    weak_phonemes: Array<{ phoneme: string; severity: 'low' | 'med' | 'high' }>;
    filler_patterns: Record<string, number>;
    avg_wpm_baseline: number | null;
    onboarding_session_ids: string[];
    updated_at: string;
}

export interface Session {
    id: string;
    user_id: string;
    type: SessionType;
    prompt_text: string | null;
    transcript: string | null;
    wpm: number | null;
    accuracy_score: number | null;
    filler_count: number;
    filler_words_found: string[];
    llm_tips: string[];
    audio_url: string | null;
    duration_secs: number | null;
    overall_score: number | null;
    created_at: string;
}

export interface InterviewSession {
    id: string;
    user_id: string;
    category: 'hr' | 'technical' | 'situational';
    questions: InterviewQuestion[];
    answers: InterviewAnswer[];
    current_question_index: number;
    overall_score: number | null;
    completed: boolean;
    created_at: string;
}

export interface InterviewQuestion {
    id: string;
    text: string;
    category: 'hr' | 'technical' | 'situational';
}

export interface InterviewAnswer {
    questionId: string;
    sessionId: string;
    score: number;
    transcript: string;
}

// ─── Analysis Pipeline ───────────────────────────────────────────────────────

export interface AnalysisInput {
    audioBuffer: Buffer;
    duration: number;
    sessionType: SessionType;
    promptText: string | null;
    userId: string;
    nativeLanguage?: string;
}

export interface AnalysisResult {
    sessionId: string;
    transcript: string;
    wpm: number;
    accuracyScore: number | null;
    fillerCount: number;
    fillerWordsFound: string[];
    tips: string[];
    overallScore: number;
    audioUrl: string;
}

export interface PythonAnalysisResult {
    wpm: number;
    filler_count: number;
    filler_words_found: string[];
    accuracy_score: number | null;
}

// ─── API Response Envelope ───────────────────────────────────────────────────

export interface ApiSuccess<T> {
    success: true;
    data: T;
}

export interface ApiError {
    success: false;
    error: {
        code: string;
        message: string;
    };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Error Codes ─────────────────────────────────────────────────────────────

export const ERROR_CODES = {
    AUTH_REQUIRED: 'AUTH_REQUIRED',
    NOT_FOUND: 'NOT_FOUND',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    STT_FAILED: 'STT_FAILED',
    STORAGE_FAILED: 'STORAGE_FAILED',
    LLM_FAILED: 'LLM_FAILED',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
