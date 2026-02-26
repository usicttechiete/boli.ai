import axios from 'axios';
import pino from 'pino';
import { supabaseAdmin } from '../db/supabase';
import type {
    AnalysisInput,
    AnalysisResult,
    PythonAnalysisResult,
    Session,
    SessionType,
} from '../types/index';
import { generateFeedbackTips } from './sarvamLLM';
import { transcribeAudio } from './sarvamSTT';

const logger = pino({ name: 'analysisEngine' });

const PYTHON_SERVICE_URL =
    process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

const FILLER_WORDS = [
    'um', 'uh', 'ah', 'er', 'basically', 'actually', 'literally',
    'like', 'you know', 'i mean', 'sort of', 'kind of', 'right',
    'okay so', 'so yeah', 'only', 'simply',
];

/**
 * Core analysis pipeline — runs every time a user submits audio.
 *
 * Steps (per PRD §12):
 *   1. STORAGE   → Upload to Supabase Storage
 *   2. STT       → Sarvam speech-to-text
 *   3. ANALYSIS  → Python service (WPM, fillers, accuracy)
 *   4. LLM       → Sarvam coaching tips
 *   5. SCORE     → Compute overall score
 *   6. PERSIST   → Save session to DB
 */
export async function runAnalysisPipeline(
    input: AnalysisInput
): Promise<AnalysisResult> {
    const { audioBuffer, duration, sessionType, promptText, userId, nativeLanguage } =
        input;

    // ── STEP 1: STORAGE ──────────────────────────────────────────────────────
    const timestamp = Date.now();
    const ext = 'm4a';
    const storagePath = `${userId}/${timestamp}.${ext}`;

    let audioUrl: string;
    try {
        audioUrl = await uploadToStorage(audioBuffer, storagePath);
    } catch (err) {
        logger.error({ err, userId, storagePath }, 'Audio storage failed');
        const error = new Error('Audio storage failed') as NodeJS.ErrnoException;
        error.code = 'STORAGE_FAILED';
        throw error;
    }

    // ── STEP 2: STT ──────────────────────────────────────────────────────────
    let transcript: string;
    try {
        transcript = await transcribeAudio(audioBuffer, `${timestamp}.${ext}`);
    } catch (err) {
        logger.error({ err, userId }, 'STT failed');
        throw err; // STT failures propagate (PRD §18)
    }

    // ── STEP 3: PYTHON ANALYSIS ───────────────────────────────────────────────
    let analysis: PythonAnalysisResult;
    try {
        analysis = await callPythonService({
            transcript,
            duration_secs: duration,
            prompt_text: promptText,
            session_type: sessionType,
        });
    } catch (err) {
        logger.warn({ err }, 'Python service failed — using Node fallback');
        analysis = nodeFallbackAnalysis(transcript, duration, promptText);
    }

    const { wpm, filler_count, filler_words_found, accuracy_score } = analysis;

    // ── STEP 4: LLM FEEDBACK ─────────────────────────────────────────────────
    const tips = await generateFeedbackTips({
        transcript,
        wpm,
        fillerWordsFound: filler_words_found,
        fillerCount: filler_count,
        accuracyScore: accuracy_score,
        sessionType,
        nativeLanguage: nativeLanguage ?? 'hindi',
        promptText,
    });

    // ── STEP 5: SCORE COMPUTATION ────────────────────────────────────────────
    const overallScore = computeOverallScore(wpm, filler_count, accuracy_score);

    // ── STEP 6: PERSIST ───────────────────────────────────────────────────────
    const { data: session, error: dbError } = await supabaseAdmin
        .from('sessions')
        .insert<Partial<Session>>({
            user_id: userId,
            type: sessionType,
            prompt_text: promptText,
            transcript,
            wpm,
            accuracy_score,
            filler_count,
            filler_words_found,
            llm_tips: tips,
            audio_url: audioUrl,
            duration_secs: duration,
            overall_score: overallScore,
        })
        .select()
        .single();

    if (dbError || !session) {
        logger.error({ dbError }, 'Failed to persist session');
        throw new Error('Failed to save session to database');
    }

    logger.info({ sessionId: session.id, userId, overallScore }, 'Analysis complete');

    return {
        sessionId: session.id,
        transcript,
        wpm,
        accuracyScore: accuracy_score,
        fillerCount: filler_count,
        fillerWordsFound: filler_words_found,
        tips,
        overallScore,
        audioUrl,
    };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function uploadToStorage(
    buffer: Buffer,
    path: string
): Promise<string> {
    const maxAttempts = 3;
    let lastError: unknown;
    let delay = 500;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const { error: uploadError } = await supabaseAdmin.storage
                .from('recordings')
                .upload(path, buffer, {
                    contentType: 'audio/mp4',
                    upsert: false,
                });

            if (uploadError) throw uploadError;

            // Create a signed URL valid for 7 days
            const { data: signedData, error: signError } = await supabaseAdmin.storage
                .from('recordings')
                .createSignedUrl(path, 60 * 60 * 24 * 7);

            if (signError || !signedData?.signedUrl) {
                throw signError ?? new Error('Failed to create signed URL');
            }

            return signedData.signedUrl;
        } catch (err) {
            lastError = err;
            logger.warn({ attempt, err }, 'Storage upload attempt failed');
            if (attempt < maxAttempts) {
                await sleep(delay);
                delay *= 2; // exponential backoff
            }
        }
    }

    throw lastError;
}

interface PythonServiceInput {
    transcript: string;
    duration_secs: number;
    prompt_text: string | null;
    session_type: SessionType;
}

async function callPythonService(
    input: PythonServiceInput
): Promise<PythonAnalysisResult> {
    const response = await axios.post<PythonAnalysisResult>(
        `${PYTHON_SERVICE_URL}/analyze`,
        input,
        { timeout: 15_000 }
    );
    return response.data;
}

/**
 * Node.js fallback when Python service is unavailable.
 * Handles WPM + filler detection directly (less accurate than Python/librosa).
 */
function nodeFallbackAnalysis(
    transcript: string,
    durationSecs: number,
    promptText: string | null
): PythonAnalysisResult {
    const words = transcript.trim().split(/\s+/).filter(Boolean);
    const wpm =
        durationSecs > 0
            ? Math.round((words.length / durationSecs) * 60 * 10) / 10
            : 0;

    const lower = transcript.toLowerCase();
    const fillerWordsFound: string[] = [];
    let fillerCount = 0;

    for (const filler of FILLER_WORDS) {
        const regex = new RegExp(`\\b${filler}\\b`, 'gi');
        const matches = lower.match(regex);
        if (matches && matches.length > 0) {
            fillerWordsFound.push(filler);
            fillerCount += matches.length;
        }
    }

    let accuracyScore: number | null = null;
    if (promptText) {
        accuracyScore = simpleAccuracy(transcript, promptText);
    }

    return { wpm, filler_count: fillerCount, filler_words_found: fillerWordsFound, accuracy_score: accuracyScore };
}

function simpleAccuracy(transcript: string, prompt: string): number {
    const normalize = (s: string) =>
        s.toLowerCase().replace(/[^\w\s]/g, '').trim().split(/\s+/);

    const transcriptWords = normalize(transcript);
    const promptWords = normalize(prompt);

    let matches = 0;
    for (const word of transcriptWords) {
        if (promptWords.includes(word)) matches++;
    }

    return Math.round((matches / Math.max(promptWords.length, 1)) * 100);
}

/**
 * Weighted score formula from PRD §12 Step 5:
 *   overallScore = (wpmScore * 0.3) + (accuracyComponent * 0.5) + ((100 - fillerPenalty) * 0.2)
 */
function computeOverallScore(
    wpm: number,
    fillerCount: number,
    accuracyScore: number | null
): number {
    const wpmScore = Math.min(Math.max((wpm / 150) * 100, 0), 100);
    const fillerPenalty = Math.min(fillerCount * 5, 30);
    const accuracyComponent = accuracyScore ?? 75;

    return Math.round(
        wpmScore * 0.3 + accuracyComponent * 0.5 + (100 - fillerPenalty) * 0.2
    );
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
