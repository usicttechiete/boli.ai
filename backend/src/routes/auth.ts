import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { supabaseAdmin } from '../db/supabase';
import { authenticate } from '../middleware/auth';

/**
 * Auth routes
 *
 * POST /api/auth/verify   — Confirms the JWT is valid and the profile exists
 * GET  /api/auth/me       — Returns the current user's profile
 * POST /api/auth/signout  — Signs out the user (server-side session cleanup)
 *
 * The actual sign-in / sign-up happens on the frontend via Supabase Auth SDK.
 * These endpoints just confirm the JWT is good and provide profile data.
 */
export async function authRoutes(fastify: FastifyInstance): Promise<void> {
    // ── POST /api/auth/verify ───────────────────────────────────────────────
    //    Verifies the token is valid and returns the user's profile.
    fastify.post(
        '/api/auth/verify',
        { preHandler: [authenticate] },
        async (request: FastifyRequest, reply: FastifyReply) => {
            try {
                const userId = request.user.sub;

                const { data: profile, error } = await supabaseAdmin
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (error || !profile) {
                    return reply.status(404).send({
                        success: false,
                        error: { code: 'NOT_FOUND', message: 'Profile not found' },
                    });
                }

                return reply.send({
                    success: true,
                    data: {
                        user: {
                            id: userId,
                            email: request.user.email,
                        },
                        profile,
                    },
                });
            } catch (err) {
                request.log.error(err);
                return reply.status(500).send({
                    success: false,
                    error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error' },
                });
            }
        }
    );

    // ── GET /api/auth/me ────────────────────────────────────────────────────
    //    Returns the current authenticated user's profile.
    fastify.get(
        '/api/auth/me',
        { preHandler: [authenticate] },
        async (request: FastifyRequest, reply: FastifyReply) => {
            try {
                const userId = request.user.sub;

                const { data: profile, error } = await supabaseAdmin
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (error || !profile) {
                    return reply.status(404).send({
                        success: false,
                        error: { code: 'NOT_FOUND', message: 'Profile not found' },
                    });
                }

                return reply.send({
                    success: true,
                    data: {
                        user: {
                            id: userId,
                            email: request.user.email,
                        },
                        profile,
                    },
                });
            } catch (err) {
                request.log.error(err);
                return reply.status(500).send({
                    success: false,
                    error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error' },
                });
            }
        }
    );

    // ── POST /api/auth/signout ──────────────────────────────────────────────
    //    Server-side sign out. The frontend handles its own session cleanup,
    //    but this can be called for extra cleanup (e.g., cache invalidation).
    fastify.post(
        '/api/auth/signout',
        { preHandler: [authenticate] },
        async (request: FastifyRequest, reply: FastifyReply) => {
            try {
                request.log.info({ userId: request.user.sub }, 'User signed out');
                return reply.send({ success: true });
            } catch (err) {
                request.log.error(err);
                return reply.status(500).send({
                    success: false,
                    error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error' },
                });
            }
        }
    );
}
