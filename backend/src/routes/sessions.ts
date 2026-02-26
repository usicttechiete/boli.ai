import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import pino from 'pino';
import { z } from 'zod';
import { supabaseAdmin } from '../db/supabase';
import { authenticate } from '../middleware/auth';
import { runAnalysisPipeline } from '../services/analysisEngine';
import { cacheDel, cacheGet, CacheKeys, cacheSet } from '../services/cache';
import type { Session, SessionType } from '../types/index';

const logger = pino({ name: 'sessionsRoute' });

const SessionTypeEnum = z.enum(['practice', 'drill', 'shadow', 'onboarding']);

const HistoryQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
    type: SessionTypeEnum.optional(),
});

/**
 * Sessions routes
 *
 * POST /api/session/analyze  — Upload audio, run full pipeline, return result
 * GET  /api/sessions/history — Paginated session history with optional type filter
 */
export async function sessionsRoutes(fastify: FastifyInstance): Promise<void> {

    // ── POST /api/session/analyze ─────────────────────────────────────────────
    fastify.post(
        '/api/session/analyze',
        { preHandler: [authenticate] },
        async (request: FastifyRequest, reply: FastifyReply) => {
            const userId = request.user.sub;

            try {
                // Parse multipart
                const parts = request.parts();
                let audioBuffer: Buffer | null = null;
                let audioFilename = 'recording.m4a';
                let sessionType: SessionType = 'practice';
                let promptText: string | null = null;
                let durationSecs = 0;

                for await (const part of parts) {
                    if (part.type === 'file' && part.fieldname === 'audio') {
                        const chunks: Buffer[] = [];
                        for await (const chunk of part.file) {
                            chunks.push(chunk);
                        }
                        audioBuffer = Buffer.concat(chunks);
                        audioFilename = part.filename;
                    } else if (part.type === 'field') {
                        if (part.fieldname === 'type') {
                            const parsed = SessionTypeEnum.safeParse(part.value);
                            if (parsed.success) sessionType = parsed.data;
                        } else if (part.fieldname === 'promptText') {
                            promptText = part.value as string;
                        } else if (part.fieldname === 'duration') {
                            durationSecs = parseFloat(part.value as string) || 0;
                        }
                    }
                }

                if (!audioBuffer) {
                    return reply.status(400).send({
                        success: false,
                        error: { code: 'VALIDATION_ERROR', message: 'Audio file is required' },
                    });
                }

                // Validate audio size (max 10MB)
                if (audioBuffer.length > 10 * 1024 * 1024) {
                    return reply.status(400).send({
                        success: false,
                        error: { code: 'VALIDATION_ERROR', message: 'Audio file exceeds 10MB limit' },
                    });
                }

                // Fetch native language from profile for LLM prompt context
                const { data: profile } = await supabaseAdmin
                    .from('profiles')
                    .select('native_language')
                    .eq('id', userId)
                    .single();

                const result = await runAnalysisPipeline({
                    audioBuffer,
                    duration: durationSecs,
                    sessionType,
                    promptText,
                    userId,
                    nativeLanguage: profile?.native_language ?? 'hindi',
                });

                // Invalidate session history cache
                await cacheDel(CacheKeys.sessionHistory(userId));
                await cacheDel(CacheKeys.sessionHistory(userId, sessionType));

                return reply.send({ success: true, data: result });
            } catch (err) {
                const code = (err as NodeJS.ErrnoException).code;

                if (code === 'STORAGE_FAILED') {
                    return reply.status(502).send({
                        success: false,
                        error: { code, message: 'Audio storage failed. Please try again.' },
                    });
                }

                if (code === 'STT_FAILED') {
                    return reply.status(502).send({
                        success: false,
                        error: { code, message: 'Speech recognition failed. Please try again.' },
                    });
                }

                logger.error({ err, userId }, 'Session analyze failed');
                return reply.status(500).send({
                    success: false,
                    error: { code: 'INTERNAL_ERROR', message: 'Analysis failed unexpectedly' },
                });
            }
        }
    );

    // ── GET /api/sessions/history ─────────────────────────────────────────────
    fastify.get(
        '/api/sessions/history',
        { preHandler: [authenticate] },
        async (request: FastifyRequest, reply: FastifyReply) => {
            const userId = request.user.sub;

            const queryParsed = HistoryQuerySchema.safeParse(request.query);
            if (!queryParsed.success) {
                return reply.status(400).send({
                    success: false,
                    error: { code: 'VALIDATION_ERROR', message: queryParsed.error.message },
                });
            }

            const { limit, offset, type } = queryParsed.data;
            const cacheKey = CacheKeys.sessionHistory(userId, type);

            // Try cache (only for first page, no type filter)
            if (offset === 0) {
                const cached = await cacheGet<{ sessions: Session[]; total: number }>(cacheKey);
                if (cached) {
                    return reply.send({ success: true, data: cached });
                }
            }

            try {
                let query = supabaseAdmin
                    .from('sessions')
                    .select('*', { count: 'exact' })
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false })
                    .range(offset, offset + limit - 1);

                if (type) {
                    query = query.eq('type', type);
                }

                const { data: sessions, error, count } = await query;

                if (error) throw error;

                const result = { sessions: sessions ?? [], total: count ?? 0 };

                // Cache the first page for 60 seconds
                if (offset === 0) {
                    await cacheSet(cacheKey, result, 60);
                }

                return reply.send({ success: true, data: result });
            } catch (err) {
                logger.error({ err, userId }, 'Fetch session history failed');
                return reply.status(500).send({
                    success: false,
                    error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch session history' },
                });
            }
        }
    );
}
