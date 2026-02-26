import axios from 'axios';
import FormData from 'form-data';
import pino from 'pino';

const logger = pino({ name: 'sarvamSTT' });

const SARVAM_STT_URL =
    process.env.SARVAM_STT_URL || 'https://api.sarvam.ai/speech-to-text';
const SARVAM_API_KEY = process.env.SARVAM_API_KEY || '';

/**
 * Sends an audio buffer to the Sarvam Speech-to-Text API and returns the transcript.
 *
 * Retry policy: 2 retries with 1 second delay (per PRD §18).
 *
 * @param audioBuffer - Raw audio bytes
 * @param filename    - Original filename (e.g. "recording.m4a")
 * @returns transcript string
 * @throws {Error} with code 'STT_FAILED' on unrecoverable failure
 */
export async function transcribeAudio(
    audioBuffer: Buffer,
    filename: string
): Promise<string> {
    const maxAttempts = 3; // 1 initial + 2 retries
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const formData = new FormData();
            formData.append('file', audioBuffer, {
                filename,
                contentType: filename.endsWith('.wav') ? 'audio/wav' : 'audio/mp4',
            });
            formData.append('language_code', 'en-IN');
            formData.append('model', 'saarika:v2');  // Sarvam's latest model
            formData.append('with_timestamps', 'false');

            const response = await axios.post<{ transcript: string }>(
                SARVAM_STT_URL,
                formData,
                {
                    headers: {
                        ...formData.getHeaders(),
                        'api-subscription-key': SARVAM_API_KEY,
                    },
                    timeout: 30_000, // 30s
                }
            );

            const transcript = response.data?.transcript;
            if (!transcript || typeof transcript !== 'string') {
                throw new Error('Sarvam STT returned empty transcript');
            }

            return transcript;
        } catch (err) {
            lastError = err;
            logger.warn(
                { attempt, err: (err as Error).message },
                'Sarvam STT attempt failed'
            );

            if (attempt < maxAttempts) {
                await delay(1000); // 1s between retries
            }
        }
    }

    logger.error({ err: lastError }, 'Sarvam STT failed after all retries');
    const error = new Error('Speech recognition failed') as NodeJS.ErrnoException;
    error.code = 'STT_FAILED';
    throw error;
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
