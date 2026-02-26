import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import pino from 'pino';
import { supabaseAdmin } from '../db/supabase';
import { authenticate } from '../middleware/auth';
import { cacheGet, CacheKeys, cacheSet } from '../services/cache';

const logger = pino({ name: 'drillsRoute' });

/**
 * Drill sentence bank — indexed by phoneme target.
 * Sentences are designed to target specific Indian English pronunciation patterns.
 */
const DRILL_BANK: Record<string, string[]> = {
    'v-w': [
        'The village has very warm weather in winter.',
        'We went to visit the vineyard on Wednesday.',
        'Victor wore a vest to the wedding event.',
        'The wolves wander through the valley every evening.',
        'William values hard work and a positive view.',
    ],
    'th-d': [
        'They thought the third theme was thoroughly interesting.',
        'This is the method that the author had in mind.',
        'The mother thanked the teacher with all her heart.',
        'Although it is thin, this thread is very strong.',
        'Health is important — think about it every day.',
    ],
    articles: [
        'I have a dog and the dog loves to play in a park.',
        'She found a job at the company she had always wanted.',
        'He bought a book from the library near the station.',
        'It is a great opportunity to work with a talented team.',
        'The answer to the question is in the first chapter.',
    ],
    schwa: [
        'The problem with the system is the balance of the budget.',
        'A level of confidence comes from regular practice.',
        'The cabinet of ministers discussed the agenda.',
        'About a dozen people arrived at the station.',
        'The collection of data helps us find the pattern.',
    ],
    pace: [
        'Good morning. My name is Priya and I am from Meerut.',
        'I completed my internship at a reputed software company.',
        'My greatest strength is my ability to adapt quickly.',
        'I believe teamwork and communication are key to success.',
        'I am eager to contribute my skills to your organization.',
    ],
};

const GENERAL_DRILLS = [
    'I am looking for a good opportunity in this company.',
    'My greatest strength is my ability to work in a team.',
    'I completed my project within the given deadline.',
    'Please tell me about yourself and your background.',
    'I believe I can contribute effectively to your organization.',
];

/**
 * Drills routes
 *
 * GET /api/drills/generate
 *   Returns 5 targeted sentences based on the user's dialect profile.
 *   Falls back to general confidence sentences if no dialect profile exists.
 */
export async function drillsRoutes(fastify: FastifyInstance): Promise<void> {
    fastify.get(
        '/api/drills/generate',
        { preHandler: [authenticate] },
        async (request: FastifyRequest, reply: FastifyReply) => {
            const userId = request.user.sub;

            // Try cache
            const cached = await cacheGet<{ sentences: string[]; targetPhonemes: string[] }>(
                CacheKeys.drills(userId)
            );
            if (cached) {
                return reply.send({ success: true, data: cached });
            }

            try {
                // Fetch dialect profile
                const { data: dialectProfile } = await supabaseAdmin
                    .from('dialect_profiles')
                    .select('weak_phonemes, detected_region')
                    .eq('user_id', userId)
                    .single();

                let sentences: string[] = [];
                let targetPhonemes: string[] = [];

                if (dialectProfile?.weak_phonemes && (dialectProfile.weak_phonemes as unknown[]).length > 0) {
                    // Pick sentences that target the user's weakest phonemes
                    for (const pw of dialectProfile.weak_phonemes as Array<{
                        phoneme: string;
                        severity: string;
                    }>) {
                        const bank = DRILL_BANK[pw.phoneme];
                        if (bank) {
                            targetPhonemes.push(pw.phoneme);
                            sentences.push(...bank);
                            if (sentences.length >= 5) break;
                        }
                    }
                }

                // If we couldn't build enough sentences from phonemes, use region defaults
                if (sentences.length < 5 && dialectProfile?.detected_region) {
                    const regionPhonemes = REGION_DEFAULT_PHONEMES[dialectProfile.detected_region] ?? [];
                    for (const phoneme of regionPhonemes) {
                        const bank = DRILL_BANK[phoneme];
                        if (bank) {
                            targetPhonemes.push(phoneme);
                            sentences.push(...bank);
                            if (sentences.length >= 5) break;
                        }
                    }
                }

                // Final fallback — general sentences
                if (sentences.length === 0) {
                    sentences = GENERAL_DRILLS;
                    targetPhonemes = ['pace', 'articles'];
                }

                // Cap at 5 and deduplicate
                sentences = [...new Set(sentences)].slice(0, 5);

                const result = { sentences, targetPhonemes: [...new Set(targetPhonemes)] };

                // Cache for 5 minutes
                await cacheSet(CacheKeys.drills(userId), result, 300);

                return reply.send({ success: true, data: result });
            } catch (err) {
                logger.error({ err, userId }, 'Failed to generate drills');
                return reply.status(500).send({
                    success: false,
                    error: { code: 'INTERNAL_ERROR', message: 'Failed to generate drill sentences' },
                });
            }
        }
    );
}

// ─── Region → default phoneme targets ────────────────────────────────────────

const REGION_DEFAULT_PHONEMES: Record<string, string[]> = {
    hindi_belt: ['v-w', 'articles'],
    south_india: ['th-d', 'pace'],
    east_india: ['v-w', 'pace'],
    western_india: ['schwa', 'articles'],
    unknown: ['pace', 'articles'],
};
