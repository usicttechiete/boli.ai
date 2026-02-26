import axios from 'axios';
import pino from 'pino';

const logger = pino({ name: 'sarvamLLM' });

const SARVAM_LLM_URL =
    process.env.SARVAM_LLM_URL ||
    'https://api.sarvam.ai/v1/chat/completions';
const SARVAM_API_KEY = process.env.SARVAM_API_KEY || '';

/**
 * Fallback tips returned when LLM fails — session still succeeds.
 * Per PRD §13 and §18: LLM failures should NEVER crash the session.
 */
export const FALLBACK_TIPS = [
    'Keep practicing — consistency is the key to confident speaking.',
    'Try recording yourself daily for 5 minutes to track your progress.',
    'Focus on pausing naturally between sentences instead of using filler words.',
];

interface LLMInputParams {
    transcript: string;
    wpm: number;
    fillerWordsFound: string[];
    fillerCount: number;
    accuracyScore: number | null;
    sessionType: string;
    nativeLanguage: string;
    promptText?: string | null;
}

const SYSTEM_PROMPT = `You are BOLI, a warm, encouraging speaking coach for Indian students preparing for job interviews.
Your role is to build confidence, not criticize.
Rules:
- Always acknowledge something positive first
- Give exactly 2-3 tips, each one sentence long
- Never mention "accent" negatively
- Frame everything as skill-building: "try" not "you should"
- Use simple language (8th grade reading level)
- Be specific — reference actual words or scores from the session
- Return ONLY a JSON array of strings. No preamble, no markdown, no explanation.
Example output: ["Great energy in your voice!", "Try pausing for 1 second instead of saying 'basically'.", "Your pace of 127 WPM is very good — keep it up!"]`;

/**
 * Generates 2-3 encouraging coaching tips using the Sarvam LLM.
 *
 * Retry policy: 1 retry, then return FALLBACK_TIPS (per PRD §18).
 * Never throws — always returns a string array.
 */
export async function generateFeedbackTips(
    params: LLMInputParams
): Promise<string[]> {
    const userPrompt = buildUserPrompt(params);
    const maxAttempts = 2; // 1 initial + 1 retry

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const response = await axios.post<{
                choices: Array<{ message: { content: string } }>;
            }>(
                SARVAM_LLM_URL,
                {
                    model: 'sarvam-m',  // Sarvam's instruction-tuned model
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT },
                        { role: 'user', content: userPrompt },
                    ],
                    temperature: 0.7,
                    max_tokens: 300,
                },
                {
                    headers: {
                        Authorization: `Bearer ${SARVAM_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 20_000,
                }
            );

            const content = response.data?.choices?.[0]?.message?.content?.trim();
            if (!content) throw new Error('Empty LLM response');

            const tips = parseTipsFromContent(content);
            if (tips.length > 0) return tips.slice(0, 3);

            throw new Error('Could not parse tips from LLM response');
        } catch (err) {
            logger.warn(
                { attempt, err: (err as Error).message },
                'Sarvam LLM attempt failed'
            );
        }
    }

    // Graceful fallback — per PRD: do NOT fail the session
    logger.warn('Using fallback tips after LLM failure');
    return FALLBACK_TIPS;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildUserPrompt(p: LLMInputParams): string {
    const fillerList =
        p.fillerWordsFound.length > 0
            ? p.fillerWordsFound.join(', ')
            : 'none detected';

    const accuracyLine =
        p.accuracyScore != null
            ? `- Accuracy score: ${p.accuracyScore}%${p.promptText ? ' (compared to target text)' : ''}`
            : '- Accuracy score: N/A (free practice mode)';

    return `Student speaking session data:
- Transcript: "${p.transcript.slice(0, 500)}"
- Speaking pace: ${p.wpm} words per minute (ideal: 130–150 WPM for interviews)
- Filler words detected: ${fillerList} (used ${p.fillerCount} times total)
${accuracyLine}
- Session type: ${p.sessionType}
- Student's native language: ${p.nativeLanguage}

Give them 2-3 encouraging, specific tips to improve.
Return only a JSON array of strings.`;
}

function parseTipsFromContent(content: string): string[] {
    // Try direct JSON parse first
    try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.every((t) => typeof t === 'string')) {
            return parsed;
        }
    } catch {
        // Fall through to regex extraction
    }

    // Extract JSON array from surrounding text if any
    const match = content.match(/\[[\s\S]*?\]/);
    if (match) {
        try {
            const parsed = JSON.parse(match[0]);
            if (Array.isArray(parsed) && parsed.every((t) => typeof t === 'string')) {
                return parsed;
            }
        } catch {
            // Ignore
        }
    }

    return [];
}
