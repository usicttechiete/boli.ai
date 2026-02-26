import { FastifyReply, FastifyRequest } from 'fastify';
import { supabaseAdmin } from '../db/supabase';
import { ERROR_CODES, JwtPayload } from '../types/index';

/**
 * Fastify preHandler — verifies Supabase-issued JWT on every protected route.
 *
 * Uses `supabase.auth.getUser(token)` which makes a server-side call to
 * Supabase Auth to validate the token. This is the recommended approach as it:
 *   - Works with both symmetric (HS256) and asymmetric keys
 *   - Handles token revocation correctly
 *   - Doesn't require storing the JWT secret locally
 *
 * The client must send: Authorization: Bearer <supabase_access_token>
 */
export async function authenticate(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.status(401).send({
            success: false,
            error: {
                code: ERROR_CODES.AUTH_REQUIRED,
                message: 'Authorization header missing or malformed',
            },
        });
    }

    const token = authHeader.slice(7); // strip "Bearer "

    try {
        // Validate the JWT via Supabase Auth server (handles revocation, expiry, etc.)
        const {
            data: { user },
            error,
        } = await supabaseAdmin.auth.getUser(token);

        if (error || !user) {
            request.log.warn({ err: error }, 'JWT verification failed');
            return reply.status(401).send({
                success: false,
                error: {
                    code: ERROR_CODES.AUTH_REQUIRED,
                    message: 'Invalid or expired token',
                },
            });
        }

        // Attach decoded user info to the request
        request.user = {
            sub: user.id,
            email: user.email,
        } satisfies JwtPayload;
    } catch (err) {
        request.log.error(err, 'Unexpected auth error');
        return reply.status(401).send({
            success: false,
            error: {
                code: ERROR_CODES.AUTH_REQUIRED,
                message: 'Invalid or expired token',
            },
        });
    }
}
