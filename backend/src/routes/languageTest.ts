import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import pino from 'pino';
import { supabaseAdmin } from '../db/supabase';
import { authenticate } from '../middleware/auth';
import { runLanguageTestPipeline } from '../services/analysisEngine';

const logger = pino({ name: 'languageTestRoute' });

/**
 * Language Test routes
 *
 * POST /api/test/analyze  — Upload audio, run full pipeline for known language, return result
 * GET  /api/test/known-languages — List of user's proven known languages
 */
export async function languageTestRoutes(fastify: FastifyInstance): Promise<void> {

    // ── POST /api/test/analyze ─────────────────────────────────────────────
    fastify.post(
        '/api/test/analyze',
        { preHandler: [authenticate] },
        async (request: FastifyRequest, reply: FastifyReply) => {
            const userId = request.user.sub;

            try {
                // Parse multipart
                const parts = request.parts();
                let audioBuffer: Buffer | null = null;
                let language = 'hindi';
                let promptText = '';

                for await (const part of parts) {
                    if (part.type === 'file' && part.fieldname === 'audio') {
                        const chunks: Buffer[] = [];
                        for await (const chunk of part.file) {
                            chunks.push(chunk);
                        }
                        audioBuffer = Buffer.concat(chunks);
                    } else if (part.type === 'field') {
                        if (part.fieldname === 'language') {
                            language = part.value as string;
                        } else if (part.fieldname === 'promptText') {
                            promptText = part.value as string;
                        }
                    }
                }

                if (!audioBuffer) {
                    return reply.status(400).send({
                        success: false,
                        error: { code: 'VALIDATION_ERROR', message: 'Audio file is required' },
                    });
                }

                if (audioBuffer.length > 10 * 1024 * 1024) {
                    return reply.status(400).send({
                        success: false,
                        error: { code: 'VALIDATION_ERROR', message: 'Audio file exceeds 10MB limit' },
                    });
                }

                const result = await runLanguageTestPipeline({
                    audioBuffer,
                    language,
                    promptText,
                    userId,
                });

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

                logger.error({ err, userId }, 'Language test analyze failed');
                return reply.status(500).send({
                    success: false,
                    error: { code: 'INTERNAL_ERROR', message: 'Analysis failed unexpectedly' },
                });
            }
        }
    );

    // ── GET /api/test/known-languages ──────────────────────────────────────
    fastify.get(
        '/api/test/known-languages',
        { preHandler: [authenticate] },
        async (request: FastifyRequest, reply: FastifyReply) => {
            const userId = request.user.sub;

            try {
                // Fetch known languages from DB
                const { data: knownLanguages, error } = await supabaseAdmin
                    .from('known_language_proficiencies')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                return reply.send({ success: true, data: knownLanguages ?? [] });
            } catch (err) {
                logger.error({ err, userId }, 'Fetch known languages failed');
                return reply.status(500).send({
                    success: false,
                    error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch known languages' },
                });
            }
        }
    );
}
