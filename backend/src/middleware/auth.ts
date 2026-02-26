import { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import { ERROR_CODES, JwtPayload } from '../types/index';

/**
 * Fastify preHandler — verifies Supabase-issued JWT on every protected route.
 *
 * Supabase signs access tokens with HS256 using the project's JWT secret.
 * We verify the signature here and attach the decoded payload to `request.user`.
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
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;

    if (!jwtSecret) {
        request.log.error('SUPABASE_JWT_SECRET is not set');
        return reply.status(500).send({
            success: false,
            error: {
                code: ERROR_CODES.INTERNAL_ERROR,
                message: 'Server configuration error',
            },
        });
    }

    try {
        const decoded = jwt.verify(token, jwtSecret, {
            algorithms: ['HS256'],
        }) as JwtPayload;

        request.user = decoded;
    } catch (err) {
        request.log.warn({ err }, 'JWT verification failed');
        return reply.status(401).send({
            success: false,
            error: {
                code: ERROR_CODES.AUTH_REQUIRED,
                message: 'Invalid or expired token',
            },
        });
    }
}
