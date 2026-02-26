import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import pino from 'pino';
import { supabaseAdmin } from '../db/supabase';
import { authenticate } from '../middleware/auth';
import { cacheDel } from '../services/cache';
import { transcribeAudio } from '../services/sarvamSTT';

const logger = pino({ name: 'onboardingRoute' });

/**
 * Region lookup from native language (per PRD §14.1 — simple lookup, not ML)
 */
const LANGUAGE_TO_REGION: Record<string, string> = {
    hindi: 'hindi_belt',
    punjabi: 'hindi_belt',
    marathi: 'western_india',
    gujarati: 'western_india',
    bengali: 'east_india',
    odia: 'east_india',
    tamil: 'south_india',
    telugu: 'south_india',
    kannada: 'south_india',
    malayalam: 'south_india',
};

const FILLER_WORDS = [
    'um', 'uh', 'ah', 'er', 'basically', 'actually', 'literally',
    'like', 'you know', 'i mean', 'sort of', 'kind of', 'right',
    'okay so', 'so yeah', 'only', 'simply',
];

/**
 * Onboarding routes
 *
 * POST /api/onboarding/analyze
 *   Accepts 5 seed audio files + nativeLanguage, runs STT on each,
 *   builds dialect profile, saves it, and marks onboarding complete.
 */
export async function onboardingRoutes(fastify: FastifyInstance): Promise<void> {
    fastify.post(
        '/api/onboarding/analyze',
        { preHandler: [authenticate] },
        async (request: FastifyRequest, reply: FastifyReply) => {
            const userId = request.user.sub;

            try {
                // Read all multipart parts
                const parts = request.parts();
                const audioBuffers: Map<string, { buffer: Buffer; filename: string }> = new Map();
                let nativeLanguage = 'hindi';

                for await (const part of parts) {
                    if (part.type === 'file') {
                        const chunks: Buffer[] = [];
                        for await (const chunk of part.file) {
                            chunks.push(chunk);
                        }
                        const buffer = Buffer.concat(chunks);
                        audioBuffers.set(part.fieldname, {
                            buffer,
                            filename: part.filename,
                        });
                    } else if (part.type === 'field' && part.fieldname === 'nativeLanguage') {
                        nativeLanguage = part.value as string;
                    }
                }

                // Validate we received the seed audio files
                const seedKeys = ['seed_0', 'seed_1', 'seed_2', 'seed_3', 'seed_4'];
                const available = seedKeys.filter((k) => audioBuffers.has(k));
                if (available.length === 0) {
                    return reply.status(400).send({
                        success: false,
                        error: {
                            code: 'VALIDATION_ERROR',
                            message: 'At least one seed audio file (seed_0..seed_4) is required',
                        },
                    });
                }

                // ── STT each audio ────────────────────────────────────────────────
                const transcriptions: Array<{ transcript: string; wpm: number }> = [];

                // We auto-detect rough duration from buffer size as fallback
                // (Python service handles accurate WPM later; this is the onboarding estimate)
                for (const key of available) {
                    const { buffer, filename } = audioBuffers.get(key)!;
                    try {
                        const transcript = await transcribeAudio(buffer, filename);
                        const estimatedDurationSecs = estimateDuration(buffer);
                        const wpm = calculateWpm(transcript, estimatedDurationSecs);
                        transcriptions.push({ transcript, wpm });
                    } catch (err) {
                        logger.warn({ key, err }, 'STT failed for seed — skipping');
                    }
                }

                if (transcriptions.length === 0) {
                    return reply.status(502).send({
                        success: false,
                        error: {
                            code: 'STT_FAILED',
                            message: 'Speech recognition failed for all seed recordings',
                        },
                    });
                }

                // ── Compute baseline WPM ─────────────────────────────────────────
                const avgWpmBaseline =
                    Math.round(
                        (transcriptions.reduce((sum, t) => sum + t.wpm, 0) /
                            transcriptions.length) *
                        10
                    ) / 10;

                // ── Detect filler patterns ────────────────────────────────────────
                const fillerPatterns: Record<string, number> = {};
                for (const { transcript } of transcriptions) {
                    const lower = transcript.toLowerCase();
                    for (const filler of FILLER_WORDS) {
                        const matches = lower.match(new RegExp(`\\b${filler}\\b`, 'g')) ?? [];
                        if (matches.length > 0) {
                            fillerPatterns[filler] = (fillerPatterns[filler] ?? 0) + matches.length;
                        }
                    }
                }

                // ── Region inference ──────────────────────────────────────────────
                const detectedRegion =
                    LANGUAGE_TO_REGION[nativeLanguage.toLowerCase()] ?? 'unknown';

                // ── Save session records for each seed ────────────────────────────
                const sessionInserts = transcriptions.map(({ transcript, wpm }) => ({
                    user_id: userId,
                    type: 'onboarding' as const,
                    transcript,
                    wpm,
                    filler_count: 0,
                    filler_words_found: [] as string[],
                    llm_tips: [] as string[],
                    duration_secs: estimateDuration(Buffer.alloc(0)),
                    overall_score: null,
                }));

                const { data: sessions } = await supabaseAdmin
                    .from('sessions')
                    .insert(sessionInserts)
                    .select('id');

                const sessionIds = sessions?.map((s) => s.id) ?? [];

                // ── Save dialect profile ──────────────────────────────────────────
                await supabaseAdmin.from('dialect_profiles').upsert(
                    {
                        user_id: userId,
                        detected_region: detectedRegion,
                        weak_phonemes: [],
                        filler_patterns: fillerPatterns,
                        avg_wpm_baseline: avgWpmBaseline,
                        onboarding_session_ids: sessionIds,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'user_id' }
                );

                // ── Mark onboarding complete ──────────────────────────────────────
                await supabaseAdmin
                    .from('profiles')
                    .update({ onboarding_complete: true })
                    .eq('id', userId);

                // Invalidate profile cache
                await cacheDel(`profile:${userId}`);
                await cacheDel(`dialect:${userId}`);

                return reply.send({
                    success: true,
                    data: {
                        dialectProfile: {
                            detectedRegion,
                            avgWpmBaseline,
                            weakPhonemes: [],
                            fillerPatterns,
                        },
                        message: 'Voice profile created successfully',
                    },
                });
            } catch (err) {
                logger.error({ err, userId }, 'Onboarding analyze failed');
                return reply.status(500).send({
                    success: false,
                    error: { code: 'INTERNAL_ERROR', message: 'Onboarding analysis failed' },
                });
            }
        }
    );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calculateWpm(transcript: string, durationSecs: number): number {
    const words = transcript.trim().split(/\s+/).filter(Boolean).length;
    const mins = durationSecs / 60;
    return mins > 0 ? Math.round((words / mins) * 10) / 10 : 0;
}

/**
 * Very rough duration estimate from buffer size.
 * m4a/aac at ~128kbps: bytes / (128000 / 8) = bytes / 16000
 * This is only used when Python service is not available.
 */
function estimateDuration(buffer: Buffer): number {
    return Math.max(buffer.length / 16000, 1);
}
