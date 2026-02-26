import axios from 'axios';
import pino from 'pino';

const logger = pino({ name: 'sarvamTranslate' });

const SARVAM_TRANSLATE_URL = process.env.SARVAM_TRANSLATE_URL || 'https://api.sarvam.ai/translate';
const SARVAM_API_KEY = process.env.SARVAM_API_KEY || '';

export function getSarvamLanguageCode(lang: string): string {
    const map: Record<string, string> = {
        hindi: 'hi-IN',
        bengali: 'bn-IN',
        kannada: 'kn-IN',
        malayalam: 'ml-IN',
        marathi: 'mr-IN',
        odia: 'od-IN',
        punjabi: 'pa-IN',
        tamil: 'ta-IN',
        telugu: 'te-IN',
        gujarati: 'gu-IN',
        english: 'en-IN',
    };
    return map[lang.toLowerCase()] || 'en-IN';
}

interface TranslateResponse {
    translated_text: string;
}

/**
 * Translates text from source language to target language using Sarvam AI
 * 
 * @param text - Text to translate
 * @param sourceLang - Source language code (e.g., 'english', 'hindi')
 * @param targetLang - Target language code (e.g., 'tamil', 'gujarati')
 * @returns Translated text
 */
export async function translateText(
    text: string,
    sourceLang: string,
    targetLang: string
): Promise<string> {
    const maxAttempts = 2; // 1 initial + 1 retry
    let lastError: unknown;

    const sourceCode = getSarvamLanguageCode(sourceLang);
    const targetCode = getSarvamLanguageCode(targetLang);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const response = await axios.post<TranslateResponse>(
                SARVAM_TRANSLATE_URL,
                {
                    input: text,
                    source_language_code: sourceCode,
                    target_language_code: targetCode,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'api-subscription-key': SARVAM_API_KEY,
                    },
                    timeout: 10_000, // 10s
                }
            );

            const translatedText = response.data?.translated_text;
            if (!translatedText || typeof translatedText !== 'string') {
                throw new Error('Sarvam Translate returned empty translation');
            }

            logger.info({ text, sourceLang, targetLang, translatedText }, 'Translation successful');
            return translatedText;
        } catch (err) {
            lastError = err;
            logger.warn(
                { attempt, err: (err as Error).message, text, sourceLang, targetLang },
                'Sarvam Translate attempt failed'
            );

            if (attempt < maxAttempts) {
                await delay(500); // 500ms between retries
            }
        }
    }

    logger.error({ err: lastError, text, sourceLang, targetLang }, 'Sarvam Translate failed after all retries');
    
    // Return original text as fallback
    return text;
}

/**
 * Translates multiple words/phrases in batch
 * 
 * @param texts - Array of texts to translate
 * @param sourceLang - Source language
 * @param targetLang - Target language
 * @returns Array of translated texts
 */
export async function translateBatch(
    texts: string[],
    sourceLang: string,
    targetLang: string
): Promise<string[]> {
    const translations = await Promise.all(
        texts.map(text => translateText(text, sourceLang, targetLang))
    );
    return translations;
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
