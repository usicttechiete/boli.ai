import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import pino from 'pino';
import { supabaseAdmin } from '../db/supabase';
import { authenticate } from '../middleware/auth';
import { translateText } from '../services/sarvamTranslate';

const logger = pino({ name: 'learningRoute' });

interface LearningProgressParams {
    language: string;
}

interface PracticeWordBody {
    language: string;
    sourceLanguage: string;
    wordsPracticed: number;
    sentencesPracticed: number;
}

/**
 * Learning routes
 *
 * GET  /api/learning/progress/:language — Get learning progress for a language
 * POST /api/learning/start — Start learning a new language
 * POST /api/learning/practice — Update practice progress
 * GET  /api/learning/words — Get words for practice
 * POST /api/learning/analyze-practice — Analyze practice audio
 */
export async function learningRoutes(fastify: FastifyInstance): Promise<void> {

    // ── GET /api/learning/progress/:language ───────────────────────────────
    fastify.get<{ Params: LearningProgressParams }>(
        '/api/learning/progress/:language',
        { preHandler: [authenticate] },
        async (request, reply) => {
            const userId = request.user.sub;
            const { language } = request.params;

            try {
                const { data, error } = await supabaseAdmin
                    .from('learning_progress')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('language', language.toLowerCase())
                    .single();

                if (error && error.code !== 'PGRST116') throw error;

                return reply.send({ success: true, data: data || null });
            } catch (err) {
                logger.error({ err, userId, language }, 'Fetch learning progress failed');
                return reply.status(500).send({
                    success: false,
                    error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch progress' },
                });
            }
        }
    );

    // ── POST /api/learning/start ───────────────────────────────────────────
    fastify.post<{ Body: { language: string; sourceLanguage: string } }>(
        '/api/learning/start',
        { preHandler: [authenticate] },
        async (request, reply) => {
            const userId = request.user.sub;
            const { language, sourceLanguage } = request.body;

            try {
                // Check if already exists with same source language
                const { data: existing } = await supabaseAdmin
                    .from('learning_progress')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('language', language.toLowerCase())
                    .eq('from', sourceLanguage.toLowerCase())
                    .single();

                if (existing) {
                    return reply.send({ success: true, data: existing });
                }

                // Create new progress
                const { data, error } = await supabaseAdmin
                    .from('learning_progress')
                    .insert({
                        user_id: userId,
                        language: language.toLowerCase(),
                        from: sourceLanguage.toLowerCase(),
                        words: 0,
                        sentences: 0,
                        level: 0,
                    })
                    .select()
                    .single();

                if (error) throw error;

                return reply.send({ success: true, data });
            } catch (err) {
                logger.error({ err, userId, language, sourceLanguage }, 'Start learning failed');
                return reply.status(500).send({
                    success: false,
                    error: { code: 'INTERNAL_ERROR', message: 'Failed to start learning' },
                });
            }
        }
    );

    // ── POST /api/learning/practice ────────────────────────────────────────
    fastify.post<{ Body: PracticeWordBody }>(
        '/api/learning/practice',
        { preHandler: [authenticate] },
        async (request, reply) => {
            const userId = request.user.sub;
            const { language, sourceLanguage, wordsPracticed, sentencesPracticed } = request.body;

            try {
                // Fetch current progress for this language pair
                const { data: current, error: fetchError } = await supabaseAdmin
                    .from('learning_progress')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('language', language.toLowerCase())
                    .eq('from', sourceLanguage.toLowerCase())
                    .single();

                if (fetchError) throw fetchError;

                // Update progress
                const newWords = (current?.words || 0) + wordsPracticed;
                const newSentences = (current?.sentences || 0) + sentencesPracticed;
                const newLevel = Math.min(100, Math.floor((newWords * 0.5 + newSentences * 2) / 10));

                const { data, error } = await supabaseAdmin
                    .from('learning_progress')
                    .update({
                        words: newWords,
                        sentences: newSentences,
                        level: newLevel,
                        last_active_at: new Date().toISOString(),
                    })
                    .eq('user_id', userId)
                    .eq('language', language.toLowerCase())
                    .eq('from', sourceLanguage.toLowerCase())
                    .select()
                    .single();

                if (error) throw error;

                return reply.send({ success: true, data });
            } catch (err) {
                logger.error({ err, userId, language, sourceLanguage }, 'Update practice failed');
                return reply.status(500).send({
                    success: false,
                    error: { code: 'INTERNAL_ERROR', message: 'Failed to update practice' },
                });
            }
        }
    );

    // ── GET /api/learning/words ────────────────────────────────────────────
    fastify.get<{ Querystring: { language: string; sourceLanguage: string; count?: number } }>(
        '/api/learning/words',
        { preHandler: [authenticate] },
        async (request, reply) => {
            const { language, sourceLanguage, count = 5 } = request.query;

            try {
                // Use Sarvam AI to generate words dynamically
                const words = await getWordsForLanguage(language, sourceLanguage, count);
                return reply.send({ success: true, data: words });
            } catch (err) {
                logger.error({ err, language, sourceLanguage }, 'Fetch words failed');
                return reply.status(500).send({
                    success: false,
                    error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch words' },
                });
            }
        }
    );

    // ── POST /api/learning/analyze-practice ────────────────────────────────
    fastify.post(
        '/api/learning/analyze-practice',
        { preHandler: [authenticate] },
        async (request: FastifyRequest, reply: FastifyReply) => {
            const userId = request.user.sub;

            try {
                const parts = request.parts();
                let audioBuffer: Buffer | null = null;
                let language = 'english';
                let expectedText = '';
                let type: 'word' | 'sentence' = 'word';

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
                        } else if (part.fieldname === 'expectedText') {
                            expectedText = part.value as string;
                        } else if (part.fieldname === 'type') {
                            type = part.value as 'word' | 'sentence';
                        }
                    }
                }

                if (!audioBuffer) {
                    return reply.status(400).send({
                        success: false,
                        error: { code: 'VALIDATION_ERROR', message: 'Audio file is required' },
                    });
                }

                // For MVP, return mock analysis
                const accuracy = Math.floor(Math.random() * 20) + 80; // 80-100%
                const feedback = accuracy >= 90 
                    ? 'Excellent pronunciation! Keep it up.'
                    : accuracy >= 75
                    ? 'Good effort! Try to focus on clarity.'
                    : 'Keep practicing. Listen to the pronunciation again.';

                return reply.send({
                    success: true,
                    data: {
                        accuracy,
                        feedback,
                        passed: accuracy >= 70,
                    },
                });
            } catch (err) {
                logger.error({ err, userId }, 'Analyze practice failed');
                return reply.status(500).send({
                    success: false,
                    error: { code: 'INTERNAL_ERROR', message: 'Analysis failed' },
                });
            }
        }
    );
}

// ── Helper: Get words for language pair ────────────────────────────────────
async function getWordsForLanguage(targetLang: string, sourceLang: string, count: number) {
    // Base vocabulary in English that will be translated
    const baseWords = [
        { word: 'Hello', context: 'Common greeting' },
        { word: 'Thank you', context: 'Show gratitude' },
        { word: 'Yes', context: 'Affirmative' },
        { word: 'No', context: 'Negative' },
        { word: 'Water', context: 'Essential liquid' },
        { word: 'Food', context: 'Meal' },
        { word: 'Friend', context: 'Companion' },
        { word: 'Family', context: 'Relatives' },
        { word: 'Good morning', context: 'Morning greeting' },
        { word: 'Good night', context: 'Evening farewell' },
        { word: 'Please', context: 'Polite request' },
        { word: 'Sorry', context: 'Apology' },
        { word: 'Help', context: 'Request assistance' },
        { word: 'Love', context: 'Affection' },
        { word: 'Home', context: 'Place of residence' },
    ];

    // Select random words up to count
    const selectedWords = baseWords.slice(0, count);
    
    try {
        // Use Sarvam AI to translate words
        const targetWords = await Promise.all(
            selectedWords.map(async ({ word, context }) => {
                try {
                    // Translate to target language
                    const targetTranslation = await translateText(word, 'english', targetLang);
                    
                    // Translate to source language (for showing meaning)
                    const sourceTranslation = await translateText(word, 'english', sourceLang);
                    
                    // Get phonetic (romanized) version - translate to English and back
                    // For now, use a simple phonetic approximation
                    const phonetics = targetTranslation;
                    
                    return {
                        target: targetTranslation,
                        source: sourceTranslation,
                        phonetics: phonetics,
                        sub: context,
                    };
                } catch (error) {
                    logger.error({ error, word, targetLang, sourceLang }, 'Translation failed for word');
                    // Fallback to English
                    return {
                        target: word,
                        source: word,
                        phonetics: word,
                        sub: context,
                    };
                }
            })
        );
        
        logger.info({ targetLang, sourceLang, count, wordsGenerated: targetWords.length }, 'Words generated with Sarvam AI');
        return targetWords;
        
    } catch (error) {
        logger.error({ error, targetLang, sourceLang }, 'Failed to generate words with Sarvam AI');
        
        // Fallback to static database
        return getFallbackWords(targetLang, sourceLang, count);
    }
}

// Fallback function using static database
function getFallbackWords(targetLang: string, sourceLang: string, count: number) {
    // Comprehensive word database with translations between all supported languages
    const wordDatabase: Record<string, Record<string, any[]>> = {
        english: {
            hindi: [
                { target: 'Hello', source: 'नमस्ते', phonetics: 'Namaste', sub: 'Common greeting' },
                { target: 'Thank you', source: 'धन्यवाद', phonetics: 'Dhanyavaad', sub: 'Show gratitude' },
                { target: 'Yes', source: 'हाँ', phonetics: 'Haan', sub: 'Affirmative' },
                { target: 'No', source: 'नहीं', phonetics: 'Nahin', sub: 'Negative' },
                { target: 'Water', source: 'पानी', phonetics: 'Paani', sub: 'Essential liquid' },
                { target: 'Food', source: 'खाना', phonetics: 'Khaana', sub: 'Meal' },
                { target: 'Friend', source: 'दोस्त', phonetics: 'Dost', sub: 'Companion' },
                { target: 'Family', source: 'परिवार', phonetics: 'Parivaar', sub: 'Relatives' },
            ],
            tamil: [
                { target: 'Hello', source: 'வணக்கம்', phonetics: 'Vaṇakkam', sub: 'Common greeting' },
                { target: 'Thank you', source: 'நன்றி', phonetics: 'Naṉṟi', sub: 'Show gratitude' },
                { target: 'Yes', source: 'ஆம்', phonetics: 'Ām', sub: 'Affirmative' },
                { target: 'No', source: 'இல்லை', phonetics: 'Illai', sub: 'Negative' },
                { target: 'Water', source: 'தண்ணீர்', phonetics: 'Taṇṇīr', sub: 'Essential liquid' },
                { target: 'Food', source: 'உணவு', phonetics: 'Uṇavu', sub: 'Meal' },
                { target: 'Friend', source: 'நண்பர்', phonetics: 'Naṇpar', sub: 'Companion' },
                { target: 'Family', source: 'குடும்பம்', phonetics: 'Kuṭumpam', sub: 'Relatives' },
            ],
            punjabi: [
                { target: 'Hello', source: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ', phonetics: 'Sat Sri Akal', sub: 'Traditional greeting' },
                { target: 'Thank you', source: 'ਧੰਨਵਾਦ', phonetics: 'Dhanvaad', sub: 'Show gratitude' },
                { target: 'Yes', source: 'ਹਾਂ', phonetics: 'Haan', sub: 'Affirmative' },
                { target: 'No', source: 'ਨਹੀਂ', phonetics: 'Nahin', sub: 'Negative' },
                { target: 'Water', source: 'ਪਾਣੀ', phonetics: 'Paani', sub: 'Essential liquid' },
                { target: 'Food', source: 'ਖਾਣਾ', phonetics: 'Khaana', sub: 'Meal' },
                { target: 'Friend', source: 'ਦੋਸਤ', phonetics: 'Dost', sub: 'Companion' },
                { target: 'Family', source: 'ਪਰਿਵਾਰ', phonetics: 'Parivaar', sub: 'Relatives' },
            ],
            gujarati: [
                { target: 'Hello', source: 'નમસ્તે', phonetics: 'Namaste', sub: 'Common greeting' },
                { target: 'Thank you', source: 'આભાર', phonetics: 'Aabhar', sub: 'Show gratitude' },
                { target: 'Yes', source: 'હા', phonetics: 'Haa', sub: 'Affirmative' },
                { target: 'No', source: 'ના', phonetics: 'Naa', sub: 'Negative' },
                { target: 'Water', source: 'પાણી', phonetics: 'Paani', sub: 'Essential liquid' },
                { target: 'Food', source: 'ખોરાક', phonetics: 'Khoraak', sub: 'Meal' },
                { target: 'Friend', source: 'મિત્ર', phonetics: 'Mitra', sub: 'Companion' },
                { target: 'Family', source: 'પરિવાર', phonetics: 'Parivaar', sub: 'Relatives' },
            ],
            marathi: [
                { target: 'Hello', source: 'नमस्कार', phonetics: 'Namaskar', sub: 'Common greeting' },
                { target: 'Thank you', source: 'धन्यवाद', phonetics: 'Dhanyavaad', sub: 'Show gratitude' },
                { target: 'Yes', source: 'होय', phonetics: 'Hoy', sub: 'Affirmative' },
                { target: 'No', source: 'नाही', phonetics: 'Naahi', sub: 'Negative' },
                { target: 'Water', source: 'पाणी', phonetics: 'Paani', sub: 'Essential liquid' },
                { target: 'Food', source: 'अन्न', phonetics: 'Anna', sub: 'Meal' },
                { target: 'Friend', source: 'मित्र', phonetics: 'Mitra', sub: 'Companion' },
                { target: 'Family', source: 'कुटुंब', phonetics: 'Kutumb', sub: 'Relatives' },
            ],
            telugu: [
                { target: 'Hello', source: 'నమస్కారం', phonetics: 'Namaskaram', sub: 'Common greeting' },
                { target: 'Thank you', source: 'ధన్యవాదాలు', phonetics: 'Dhanyavaadaalu', sub: 'Show gratitude' },
                { target: 'Yes', source: 'అవును', phonetics: 'Avunu', sub: 'Affirmative' },
                { target: 'No', source: 'కాదు', phonetics: 'Kaadu', sub: 'Negative' },
                { target: 'Water', source: 'నీరు', phonetics: 'Neeru', sub: 'Essential liquid' },
                { target: 'Food', source: 'ఆహారం', phonetics: 'Aahaaram', sub: 'Meal' },
                { target: 'Friend', source: 'స్నేహితుడు', phonetics: 'Snehitudu', sub: 'Companion' },
                { target: 'Family', source: 'కుటుంబం', phonetics: 'Kutumbam', sub: 'Relatives' },
            ],
        },
        hindi: {
            english: [
                { target: 'नमस्ते', source: 'Hello', phonetics: 'Namaste', sub: 'Common greeting' },
                { target: 'धन्यवाद', source: 'Thank you', phonetics: 'Dhanyavaad', sub: 'Show gratitude' },
                { target: 'हाँ', source: 'Yes', phonetics: 'Haan', sub: 'Affirmative' },
                { target: 'नहीं', source: 'No', phonetics: 'Nahin', sub: 'Negative' },
                { target: 'पानी', source: 'Water', phonetics: 'Paani', sub: 'Essential liquid' },
                { target: 'खाना', source: 'Food', phonetics: 'Khaana', sub: 'Meal' },
                { target: 'दोस्त', source: 'Friend', phonetics: 'Dost', sub: 'Companion' },
                { target: 'परिवार', source: 'Family', phonetics: 'Parivaar', sub: 'Relatives' },
            ],
            tamil: [
                { target: 'नमस्ते', source: 'வணக்கம்', phonetics: 'Namaste', sub: 'Common greeting' },
                { target: 'धन्यवाद', source: 'நன்றி', phonetics: 'Dhanyavaad', sub: 'Show gratitude' },
                { target: 'हाँ', source: 'ஆம்', phonetics: 'Haan', sub: 'Affirmative' },
                { target: 'नहीं', source: 'இல்லை', phonetics: 'Nahin', sub: 'Negative' },
                { target: 'पानी', source: 'தண்ணீர்', phonetics: 'Paani', sub: 'Essential liquid' },
                { target: 'खाना', source: 'உணவு', phonetics: 'Khaana', sub: 'Meal' },
                { target: 'दोस्त', source: 'நண்பர்', phonetics: 'Dost', sub: 'Companion' },
                { target: 'परिवार', source: 'குடும்பம்', phonetics: 'Parivaar', sub: 'Relatives' },
            ],
        },
        tamil: {
            english: [
                { target: 'வணக்கம்', source: 'Hello', phonetics: 'Vaṇakkam', sub: 'Common greeting' },
                { target: 'நன்றி', source: 'Thank you', phonetics: 'Naṉṟi', sub: 'Show gratitude' },
                { target: 'ஆம்', source: 'Yes', phonetics: 'Ām', sub: 'Affirmative' },
                { target: 'இல்லை', source: 'No', phonetics: 'Illai', sub: 'Negative' },
                { target: 'தண்ணீர்', source: 'Water', phonetics: 'Taṇṇīr', sub: 'Essential liquid' },
                { target: 'உணவு', source: 'Food', phonetics: 'Uṇavu', sub: 'Meal' },
                { target: 'நண்பர்', source: 'Friend', phonetics: 'Naṇpar', sub: 'Companion' },
                { target: 'குடும்பம்', source: 'Family', phonetics: 'Kuṭumpam', sub: 'Relatives' },
            ],
            hindi: [
                { target: 'வணக்கம்', source: 'नमस्ते', phonetics: 'Vaṇakkam', sub: 'Common greeting' },
                { target: 'நன்றி', source: 'धन्यवाद', phonetics: 'Naṉṟi', sub: 'Show gratitude' },
                { target: 'ஆம்', source: 'हाँ', phonetics: 'Ām', sub: 'Affirmative' },
                { target: 'இல்லை', source: 'नहीं', phonetics: 'Illai', sub: 'Negative' },
                { target: 'தண்ணீர்', source: 'पानी', phonetics: 'Taṇṇīr', sub: 'Essential liquid' },
                { target: 'உணவு', source: 'खाना', phonetics: 'Uṇavu', sub: 'Meal' },
                { target: 'நண்பர்', source: 'दोस्त', phonetics: 'Naṇpar', sub: 'Companion' },
                { target: 'குடும்பம்', source: 'परिवार', phonetics: 'Kuṭumpam', sub: 'Relatives' },
            ],
        },
        punjabi: {
            english: [
                { target: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ', source: 'Hello', phonetics: 'Sat Sri Akal', sub: 'Traditional greeting' },
                { target: 'ਧੰਨਵਾਦ', source: 'Thank you', phonetics: 'Dhanvaad', sub: 'Show gratitude' },
                { target: 'ਹਾਂ', source: 'Yes', phonetics: 'Haan', sub: 'Affirmative' },
                { target: 'ਨਹੀਂ', source: 'No', phonetics: 'Nahin', sub: 'Negative' },
                { target: 'ਪਾਣੀ', source: 'Water', phonetics: 'Paani', sub: 'Essential liquid' },
                { target: 'ਖਾਣਾ', source: 'Food', phonetics: 'Khaana', sub: 'Meal' },
                { target: 'ਦੋਸਤ', source: 'Friend', phonetics: 'Dost', sub: 'Companion' },
                { target: 'ਪਰਿਵਾਰ', source: 'Family', phonetics: 'Parivaar', sub: 'Relatives' },
            ],
            hindi: [
                { target: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ', source: 'नमस्ते', phonetics: 'Sat Sri Akal', sub: 'Traditional greeting' },
                { target: 'ਧੰਨਵਾਦ', source: 'धन्यवाद', phonetics: 'Dhanvaad', sub: 'Show gratitude' },
                { target: 'ਹਾਂ', source: 'हाँ', phonetics: 'Haan', sub: 'Affirmative' },
                { target: 'ਨਹੀਂ', source: 'नहीं', phonetics: 'Nahin', sub: 'Negative' },
                { target: 'ਪਾਣੀ', source: 'पानी', phonetics: 'Paani', sub: 'Essential liquid' },
                { target: 'ਖਾਣਾ', source: 'खाना', phonetics: 'Khaana', sub: 'Meal' },
                { target: 'ਦੋਸਤ', source: 'दोस्त', phonetics: 'Dost', sub: 'Companion' },
                { target: 'ਪਰਿਵਾਰ', source: 'परिवार', phonetics: 'Parivaar', sub: 'Relatives' },
            ],
        },
        gujarati: {
            english: [
                { target: 'નમસ્તે', source: 'Hello', phonetics: 'Namaste', sub: 'Common greeting' },
                { target: 'આભાર', source: 'Thank you', phonetics: 'Aabhar', sub: 'Show gratitude' },
                { target: 'હા', source: 'Yes', phonetics: 'Haa', sub: 'Affirmative' },
                { target: 'ના', source: 'No', phonetics: 'Naa', sub: 'Negative' },
                { target: 'પાણી', source: 'Water', phonetics: 'Paani', sub: 'Essential liquid' },
                { target: 'ખોરાક', source: 'Food', phonetics: 'Khoraak', sub: 'Meal' },
                { target: 'મિત્ર', source: 'Friend', phonetics: 'Mitra', sub: 'Companion' },
                { target: 'પરિવાર', source: 'Family', phonetics: 'Parivaar', sub: 'Relatives' },
            ],
            hindi: [
                { target: 'નમસ્તે', source: 'नमस्ते', phonetics: 'Namaste', sub: 'Common greeting' },
                { target: 'આભાર', source: 'धन्यवाद', phonetics: 'Aabhar', sub: 'Show gratitude' },
                { target: 'હા', source: 'हाँ', phonetics: 'Haa', sub: 'Affirmative' },
                { target: 'ના', source: 'नहीं', phonetics: 'Naa', sub: 'Negative' },
                { target: 'પાણી', source: 'पानी', phonetics: 'Paani', sub: 'Essential liquid' },
                { target: 'ખોરાક', source: 'खाना', phonetics: 'Khoraak', sub: 'Meal' },
                { target: 'મિત્ર', source: 'दोस्त', phonetics: 'Mitra', sub: 'Companion' },
                { target: 'પરિવાર', source: 'परिवार', phonetics: 'Parivaar', sub: 'Relatives' },
            ],
        },
        marathi: {
            english: [
                { target: 'नमस्कार', source: 'Hello', phonetics: 'Namaskar', sub: 'Common greeting' },
                { target: 'धन्यवाद', source: 'Thank you', phonetics: 'Dhanyavaad', sub: 'Show gratitude' },
                { target: 'होय', source: 'Yes', phonetics: 'Hoy', sub: 'Affirmative' },
                { target: 'नाही', source: 'No', phonetics: 'Naahi', sub: 'Negative' },
                { target: 'पाणी', source: 'Water', phonetics: 'Paani', sub: 'Essential liquid' },
                { target: 'अन्न', source: 'Food', phonetics: 'Anna', sub: 'Meal' },
                { target: 'मित्र', source: 'Friend', phonetics: 'Mitra', sub: 'Companion' },
                { target: 'कुटुंब', source: 'Family', phonetics: 'Kutumb', sub: 'Relatives' },
            ],
            hindi: [
                { target: 'नमस्कार', source: 'नमस्ते', phonetics: 'Namaskar', sub: 'Common greeting' },
                { target: 'धन्यवाद', source: 'धन्यवाद', phonetics: 'Dhanyavaad', sub: 'Show gratitude' },
                { target: 'होय', source: 'हाँ', phonetics: 'Hoy', sub: 'Affirmative' },
                { target: 'नाही', source: 'नहीं', phonetics: 'Naahi', sub: 'Negative' },
                { target: 'पाणी', source: 'पानी', phonetics: 'Paani', sub: 'Essential liquid' },
                { target: 'अन्न', source: 'खाना', phonetics: 'Anna', sub: 'Meal' },
                { target: 'मित्र', source: 'दोस्त', phonetics: 'Mitra', sub: 'Companion' },
                { target: 'कुटुंब', source: 'परिवार', phonetics: 'Kutumb', sub: 'Relatives' },
            ],
        },
        telugu: {
            english: [
                { target: 'నమస్కారం', source: 'Hello', phonetics: 'Namaskaram', sub: 'Common greeting' },
                { target: 'ధన్యవాదాలు', source: 'Thank you', phonetics: 'Dhanyavaadaalu', sub: 'Show gratitude' },
                { target: 'అవును', source: 'Yes', phonetics: 'Avunu', sub: 'Affirmative' },
                { target: 'కాదు', source: 'No', phonetics: 'Kaadu', sub: 'Negative' },
                { target: 'నీరు', source: 'Water', phonetics: 'Neeru', sub: 'Essential liquid' },
                { target: 'ఆహారం', source: 'Food', phonetics: 'Aahaaram', sub: 'Meal' },
                { target: 'స్నేహితుడు', source: 'Friend', phonetics: 'Snehitudu', sub: 'Companion' },
                { target: 'కుటుంబం', source: 'Family', phonetics: 'Kutumbam', sub: 'Relatives' },
            ],
            hindi: [
                { target: 'నమస్కారం', source: 'नमस्ते', phonetics: 'Namaskaram', sub: 'Common greeting' },
                { target: 'ధన్యవాదాలు', source: 'धन्यवाद', phonetics: 'Dhanyavaadaalu', sub: 'Show gratitude' },
                { target: 'అవును', source: 'हाँ', phonetics: 'Avunu', sub: 'Affirmative' },
                { target: 'కాదు', source: 'नहीं', phonetics: 'Kaadu', sub: 'Negative' },
                { target: 'నీరు', source: 'पानी', phonetics: 'Neeru', sub: 'Essential liquid' },
                { target: 'ఆహారం', source: 'खाना', phonetics: 'Aahaaram', sub: 'Meal' },
                { target: 'స్నేహితుడు', source: 'दोस्त', phonetics: 'Snehitudu', sub: 'Companion' },
                { target: 'కుటుంబం', source: 'परिवार', phonetics: 'Kutumbam', sub: 'Relatives' },
            ],
        },
    };

    const targetKey = targetLang.toLowerCase();
    const sourceKey = sourceLang.toLowerCase();
    
    // Get words for the specific language pair
    const words = wordDatabase[targetKey]?.[sourceKey] || 
                  wordDatabase[targetKey]?.['english'] || 
                  wordDatabase['english']?.['hindi'] || [];
    
    return words.slice(0, count);
}
