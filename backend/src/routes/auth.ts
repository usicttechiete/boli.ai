import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { supabaseAdmin } from '../db/supabase';
import { authenticate } from '../middleware/auth';

/**
 * Auth routes
 *
 * POST /api/auth/verify
 *   Verifies the token is valid and returns the user's profile.
 *   The actual sign-in/sign-up happens on the frontend via Supabase Auth SDK.
 *   This endpoint just confirms the JWT is good and the profile exists.
 */
export async function authRoutes(fastify: FastifyInstance): Promise<void> {
    // POST /api/auth/verify
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
}
