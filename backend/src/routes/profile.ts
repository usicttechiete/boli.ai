import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import pino from 'pino';
import { z } from 'zod';
import { supabaseAdmin } from '../db/supabase';
import { authenticate } from '../middleware/auth';
import { cacheDel, cacheGet, CacheKeys, cacheSet } from '../services/cache';

const logger = pino({ name: 'profileRoute' });

const UpdateProfileSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    native_language: z.string().optional(),
    target_language: z.string().optional(),
    daily_goal_mins: z.number().int().min(1).max(120).optional(),
});

/**
 * Profile routes
 *
 * GET /api/profile/me   — Returns profile + dialect profile merged
 * PUT /api/profile/me   — Updates editable profile fields
 */
export async function profileRoutes(fastify: FastifyInstance): Promise<void> {

    // ── GET /api/profile/me ───────────────────────────────────────────────────
    fastify.get(
        '/api/profile/me',
        { preHandler: [authenticate] },
        async (request: FastifyRequest, reply: FastifyReply) => {
            const userId = request.user.sub;

            // Try cache
            const cached = await cacheGet<object>(CacheKeys.profile(userId));
            if (cached) {
                return reply.send({ success: true, data: cached });
            }

            try {
                const [profileRes, dialectRes] = await Promise.all([
                    supabaseAdmin.from('profiles').select('*').eq('id', userId).single(),
                    supabaseAdmin
                        .from('dialect_profiles')
                        .select('*')
                        .eq('user_id', userId)
                        .maybeSingle(),
                ]);

                if (profileRes.error || !profileRes.data) {
                    return reply.status(404).send({
                        success: false,
                        error: { code: 'NOT_FOUND', message: 'Profile not found' },
                    });
                }

                const result = {
                    ...profileRes.data,
                    dialectProfile: dialectRes.data ?? null,
                };

                // Cache for 2 minutes
                await cacheSet(CacheKeys.profile(userId), result, 120);

                return reply.send({ success: true, data: result });
            } catch (err) {
                logger.error({ err, userId }, 'Failed to fetch profile');
                return reply.status(500).send({
                    success: false,
                    error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch profile' },
                });
            }
        }
    );

    // ── PUT /api/profile/me ───────────────────────────────────────────────────
    fastify.put(
        '/api/profile/me',
        { preHandler: [authenticate] },
        async (request: FastifyRequest, reply: FastifyReply) => {
            const userId = request.user.sub;

            const bodyParsed = UpdateProfileSchema.safeParse(request.body);
            if (!bodyParsed.success) {
                return reply.status(400).send({
                    success: false,
                    error: { code: 'VALIDATION_ERROR', message: bodyParsed.error.message },
                });
            }

            if (Object.keys(bodyParsed.data).length === 0) {
                return reply.status(400).send({
                    success: false,
                    error: { code: 'VALIDATION_ERROR', message: 'No fields to update' },
                });
            }

            try {
                const { data: updatedProfile, error } = await supabaseAdmin
                    .from('profiles')
                    .update(bodyParsed.data)
                    .eq('id', userId)
                    .select()
                    .single();

                if (error || !updatedProfile) {
                    throw error ?? new Error('Update returned no data');
                }

                // Invalidate profile cache
                await cacheDel(CacheKeys.profile(userId));

                return reply.send({ success: true, data: updatedProfile });
            } catch (err) {
                logger.error({ err, userId }, 'Failed to update profile');
                return reply.status(500).send({
                    success: false,
                    error: { code: 'INTERNAL_ERROR', message: 'Failed to update profile' },
                });
            }
        }
    );
}
