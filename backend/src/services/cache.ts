import { Redis } from '@upstash/redis';
import pino from 'pino';

const logger = pino({ name: 'redis' });

let client: Redis | null = null;

/**
 * Returns a lazily-initialized Upstash Redis client.
 * Uses @upstash/redis which communicates over HTTP REST (no TCP connection needed).
 *
 * If credentials are missing, returns null and logs a warning.
 * This allows the app to run without Redis in development.
 */
export function getRedisClient(): Redis | null {
    if (client) return client;

    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
        logger.warn('Upstash Redis credentials not set — cache is disabled');
        return null;
    }

    client = new Redis({ url, token });
    return client;
}

/**
 * Cache a value with an optional TTL (seconds).
 * Silently swallows Redis errors — caching failures must never break the app.
 */
export async function cacheSet(
    key: string,
    value: unknown,
    ttlSeconds = 300
): Promise<void> {
    const redis = getRedisClient();
    if (!redis) return;
    try {
        await redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
    } catch (err) {
        logger.warn({ err, key }, 'Redis SET failed');
    }
}

/**
 * Get a cached value by key. Returns null if not found or on error.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
    const redis = getRedisClient();
    if (!redis) return null;
    try {
        const raw = await redis.get<string>(key);
        if (!raw) return null;
        return JSON.parse(raw) as T;
    } catch (err) {
        logger.warn({ err, key }, 'Redis GET failed');
        return null;
    }
}

/**
 * Delete a cached value.
 */
export async function cacheDel(key: string): Promise<void> {
    const redis = getRedisClient();
    if (!redis) return;
    try {
        await redis.del(key);
    } catch (err) {
        logger.warn({ err, key }, 'Redis DEL failed');
    }
}

/**
 * Cache key helpers — centralised so keys are consistent across the codebase.
 */
export const CacheKeys = {
    profile: (userId: string) => `profile:${userId}`,
    dialectProfile: (userId: string) => `dialect:${userId}`,
    sessionHistory: (userId: string, type?: string) =>
        `sessions:${userId}:${type ?? 'all'}`,
    drills: (userId: string) => `drills:${userId}`,
};
