import cors from '@fastify/cors';
import formbody from '@fastify/formbody';
import multipart from '@fastify/multipart';
import 'dotenv/config';
import Fastify from 'fastify';

import { authRoutes } from './routes/auth';
import { drillsRoutes } from './routes/drills';
import { interviewRoutes } from './routes/interview';
import { languageTestRoutes } from './routes/languageTest';
import { learningRoutes } from './routes/learning';
import { onboardingRoutes } from './routes/onboarding';
import { profileRoutes } from './routes/profile';
import { sessionsRoutes } from './routes/sessions';

const isDev = process.env.NODE_ENV !== 'production';
const PORT = parseInt(process.env.PORT ?? '3001', 10);

// ─── Bootstrap ────────────────────────────────────────────────────────────────

async function bootstrap(): Promise<void> {
    // ── Fastify instance ────────────────────────────────────────────────────────
    const fastify = Fastify({
        logger: {
            level: isDev ? 'debug' : 'info',
            ...(isDev
                ? {
                    transport: {
                        target: 'pino-pretty',
                        options: {
                            colorize: true,
                            translateTime: 'HH:MM:ss',
                            ignore: 'pid,hostname',
                        },
                    },
                }
                : {}),
        },
        ajv: {
            customOptions: { removeAdditional: 'all', coerceTypes: true },
        },
    });

    // ── Plugins ─────────────────────────────────────────────────────────────────
    await fastify.register(cors, {
        origin: isDev
            ? true // allow all in dev
            : [/\.railway\.app$/, /localhost/, /^exp:\/\//],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    });

    await fastify.register(multipart, {
        limits: {
            fileSize: 10 * 1024 * 1024, // 10MB max per file (per PRD §15)
            files: 10,
            fields: 20,
        },
    });

    await fastify.register(formbody);

    // ── Routes ──────────────────────────────────────────────────────────────────
    await fastify.register(authRoutes);
    await fastify.register(onboardingRoutes);
    await fastify.register(sessionsRoutes);
    await fastify.register(interviewRoutes);
    await fastify.register(drillsRoutes);
    await fastify.register(profileRoutes);
    await fastify.register(languageTestRoutes);
    await fastify.register(learningRoutes);

    // ── Health check ─────────────────────────────────────────────────────────────
    fastify.get('/health', async () => ({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version ?? '1.0.0',
    }));

    // ── Global error handler ─────────────────────────────────────────────────────
    fastify.setErrorHandler((error, request, reply) => {
        request.log.error(
            {
                err: error,
                url: request.url,
                method: request.method,
                userId: (request as any).user?.sub,
            },
            'Unhandled error'
        );

        if (error.statusCode === 413) {
            return reply.status(413).send({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'File too large — max 10MB' },
            });
        }

        return reply.status(error.statusCode ?? 500).send({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: isDev ? error.message : 'An unexpected error occurred',
            },
        });
    });

    // ── Not found handler ────────────────────────────────────────────────────────
    fastify.setNotFoundHandler((request, reply) => {
        reply.status(404).send({
            success: false,
            error: {
                code: 'NOT_FOUND',
                message: `Route ${request.method} ${request.url} not found`,
            },
        });
    });

    // ── Start server ─────────────────────────────────────────────────────────────
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    fastify.log.info(`🚀 Boli.AI backend running on port ${PORT}`);
}

// Run
bootstrap().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
