import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import pino from 'pino';
import { z } from 'zod';
import { supabaseAdmin } from '../db/supabase';
import { authenticate } from '../middleware/auth';
import { runAnalysisPipeline } from '../services/analysisEngine';
import type { InterviewAnswer, InterviewQuestion } from '../types/index';

const logger = pino({ name: 'interviewRoute' });

// Per PRD §14.3: min 30 questions per category; 5 shown per session
// We keep a bank here; in a real prod app this would be a DB table
const INTERVIEW_QUESTIONS: Record<string, InterviewQuestion[]> = {
    hr: [
        { id: 'hr-01', text: 'Tell me about yourself.', category: 'hr' },
        { id: 'hr-02', text: 'What are your greatest strengths?', category: 'hr' },
        { id: 'hr-03', text: 'What is your biggest weakness and how are you working on it?', category: 'hr' },
        { id: 'hr-04', text: 'Where do you see yourself in 5 years?', category: 'hr' },
        { id: 'hr-05', text: 'Why do you want to work for our company?', category: 'hr' },
        { id: 'hr-06', text: 'Describe a challenge you faced and how you overcame it.', category: 'hr' },
        { id: 'hr-07', text: 'Why are you leaving your current job?', category: 'hr' },
        { id: 'hr-08', text: 'What motivates you to do your best work?', category: 'hr' },
        { id: 'hr-09', text: 'How do you handle pressure and tight deadlines?', category: 'hr' },
        { id: 'hr-10', text: 'What are your salary expectations?', category: 'hr' },
        { id: 'hr-11', text: 'Tell me about a time you worked in a team.', category: 'hr' },
        { id: 'hr-12', text: 'Describe your ideal work environment.', category: 'hr' },
        { id: 'hr-13', text: 'How do you prioritize your tasks when you have multiple deadlines?', category: 'hr' },
        { id: 'hr-14', text: 'What makes you the best candidate for this role?', category: 'hr' },
        { id: 'hr-15', text: 'Tell me about a time you showed leadership.', category: 'hr' },
        { id: 'hr-16', text: 'How do you handle criticism or negative feedback?', category: 'hr' },
        { id: 'hr-17', text: 'Do you prefer working independently or in a team?', category: 'hr' },
        { id: 'hr-18', text: 'What are your hobbies and interests outside of work?', category: 'hr' },
        { id: 'hr-19', text: 'Describe a time when you had to learn something new quickly.', category: 'hr' },
        { id: 'hr-20', text: 'What does success mean to you?', category: 'hr' },
        { id: 'hr-21', text: 'How do you stay updated with industry trends?', category: 'hr' },
        { id: 'hr-22', text: 'Tell me about a time you failed and what you learned.', category: 'hr' },
        { id: 'hr-23', text: 'What is one professional achievement you are most proud of?', category: 'hr' },
        { id: 'hr-24', text: 'How would your colleagues describe you?', category: 'hr' },
        { id: 'hr-25', text: 'Are you comfortable with travel or relocation?', category: 'hr' },
        { id: 'hr-26', text: 'What do you know about our company and products?', category: 'hr' },
        { id: 'hr-27', text: 'How do you manage work-life balance?', category: 'hr' },
        { id: 'hr-28', text: 'Tell me about a time you disagreed with your manager.', category: 'hr' },
        { id: 'hr-29', text: 'What type of work culture do you thrive in?', category: 'hr' },
        { id: 'hr-30', text: 'Do you have any questions for us?', category: 'hr' },
    ],
    technical: [
        { id: 'tech-01', text: 'Explain the difference between a stack and a queue.', category: 'technical' },
        { id: 'tech-02', text: 'What is object-oriented programming? Give an example.', category: 'technical' },
        { id: 'tech-03', text: 'What is the difference between SQL and NoSQL databases?', category: 'technical' },
        { id: 'tech-04', text: 'Explain what REST APIs are and how they work.', category: 'technical' },
        { id: 'tech-05', text: 'What is version control and why is Git important?', category: 'technical' },
        { id: 'tech-06', text: 'What is the difference between frontend and backend development?', category: 'technical' },
        { id: 'tech-07', text: 'Explain the concept of recursion with an example.', category: 'technical' },
        { id: 'tech-08', text: 'What is a hash map and when would you use it?', category: 'technical' },
        { id: 'tech-09', text: 'What is agile methodology? Have you worked in an agile team?', category: 'technical' },
        { id: 'tech-10', text: 'Explain the concept of time complexity with an example.', category: 'technical' },
        { id: 'tech-11', text: 'What debugging tools or techniques do you use?', category: 'technical' },
        { id: 'tech-12', text: 'What is the difference between synchronous and asynchronous code?', category: 'technical' },
        { id: 'tech-13', text: 'Explain a design pattern you have used in a project.', category: 'technical' },
        { id: 'tech-14', text: 'What is unit testing and why is it important?', category: 'technical' },
        { id: 'tech-15', text: 'How would you optimize a slow database query?', category: 'technical' },
        { id: 'tech-16', text: 'What is the difference between authentication and authorization?', category: 'technical' },
        { id: 'tech-17', text: 'Describe a technical project you are proud of.', category: 'technical' },
        { id: 'tech-18', text: 'What programming languages are you most comfortable with and why?', category: 'technical' },
        { id: 'tech-19', text: 'What is continuous integration and continuous deployment (CI/CD)?', category: 'technical' },
        { id: 'tech-20', text: 'How do you approach learning a new technology?', category: 'technical' },
        { id: 'tech-21', text: 'What is the concept of microservices architecture?', category: 'technical' },
        { id: 'tech-22', text: 'Explain the HTTP request-response cycle.', category: 'technical' },
        { id: 'tech-23', text: 'What are the SOLID principles in software development?', category: 'technical' },
        { id: 'tech-24', text: 'How would you ensure the security of a web application?', category: 'technical' },
        { id: 'tech-25', text: 'What is a binary search tree and when would you use it?', category: 'technical' },
        { id: 'tech-26', text: 'Describe the difference between process and thread.', category: 'technical' },
        { id: 'tech-27', text: 'What tools do you use for project management and collaboration?', category: 'technical' },
        { id: 'tech-28', text: 'What is cloud computing? Have you used any cloud platforms?', category: 'technical' },
        { id: 'tech-29', text: 'Explain how garbage collection works in a programming language you know.', category: 'technical' },
        { id: 'tech-30', text: 'How do you approach code review?', category: 'technical' },
    ],
    situational: [
        { id: 'sit-01', text: 'If you had two critical tasks due at the same time, how would you handle it?', category: 'situational' },
        { id: 'sit-02', text: 'If a client was unhappy with your work, what would you do?', category: 'situational' },
        { id: 'sit-03', text: 'How would you handle a situation where you disagreed with a team decision?', category: 'situational' },
        { id: 'sit-04', text: 'What would you do if you made a significant mistake at work?', category: 'situational' },
        { id: 'sit-05', text: 'If you were given a task you had never done before, how would you approach it?', category: 'situational' },
        { id: 'sit-06', text: 'How would you handle a difficult team member who is not cooperating?', category: 'situational' },
        { id: 'sit-07', text: 'What would you do if you realized mid-project that the requirements had changed?', category: 'situational' },
        { id: 'sit-08', text: 'If your manager gave you unclear instructions, how would you proceed?', category: 'situational' },
        { id: 'sit-09', text: 'How would you handle it if you were asked to do something unethical?', category: 'situational' },
        { id: 'sit-10', text: 'What would you do if a project was going to miss its deadline?', category: 'situational' },
        { id: 'sit-11', text: 'If a senior colleague constantly took credit for your work, how would you address it?', category: 'situational' },
        { id: 'sit-12', text: 'How would you manage a sudden increase in workload?', category: 'situational' },
        { id: 'sit-13', text: 'What would you do if you noticed a colleague was struggling and falling behind?', category: 'situational' },
        { id: 'sit-14', text: 'How would you handle it if your team made a decision you thought was wrong?', category: 'situational' },
        { id: 'sit-15', text: 'If you were new to a team and noticed an inefficient process, how would you handle it?', category: 'situational' },
        { id: 'sit-16', text: 'What would you do if a customer was extremely rude to you?', category: 'situational' },
        { id: 'sit-17', text: 'How would you react if you received no feedback on your work for a long time?', category: 'situational' },
        { id: 'sit-18', text: 'What would you do if you were asked to do a task outside your job description?', category: 'situational' },
        { id: 'sit-19', text: 'How would you motivate a team that has low morale?', category: 'situational' },
        { id: 'sit-20', text: 'If resources were suddenly cut on your project, how would you adapt?', category: 'situational' },
        { id: 'sit-21', text: 'How would you handle two team members who are in constant conflict?', category: 'situational' },
        { id: 'sit-22', text: 'What would you do if you had to deliver bad news to a client?', category: 'situational' },
        { id: 'sit-23', text: 'If you had to train a junior who was slower than expected, how would you approach it?', category: 'situational' },
        { id: 'sit-24', text: 'What would you do if you discovered a critical bug right before a release?', category: 'situational' },
        { id: 'sit-25', text: "How would you handle a situation where your priorities conflict with your manager's?", category: 'situational' },
        { id: 'sit-26', text: 'If you were asked to lead a project you felt underprepared for, what would you do?', category: 'situational' },
        { id: 'sit-27', text: 'What would you do if your team was missing a key skill needed for a project?', category: 'situational' },
        { id: 'sit-28', text: 'How would you deal with a situation where you had to work with very little guidance?', category: 'situational' },
        { id: 'sit-29', text: 'What would you do if a teammate was consistently late to meetings?', category: 'situational' },
        { id: 'sit-30', text: 'What would you say to a junior colleague who was losing confidence?', category: 'situational' },
    ],
};

const CategorySchema = z.object({
    category: z.enum(['hr', 'technical', 'situational']),
});

/**
 * Interview routes
 *
 * POST /api/interview/start              — Pick 5 random questions, create session
 * POST /api/interview/:interviewId/answer — Submit an audio answer
 * GET  /api/interview/:interviewId/report — Get full report after completion
 */
export async function interviewRoutes(fastify: FastifyInstance): Promise<void> {

    // ── POST /api/interview/start ─────────────────────────────────────────────
    fastify.post(
        '/api/interview/start',
        { preHandler: [authenticate] },
        async (request: FastifyRequest, reply: FastifyReply) => {
            const userId = request.user.sub;

            const bodyParsed = CategorySchema.safeParse(request.body);
            if (!bodyParsed.success) {
                return reply.status(400).send({
                    success: false,
                    error: { code: 'VALIDATION_ERROR', message: 'category must be hr, technical, or situational' },
                });
            }

            const { category } = bodyParsed.data;
            const pool = INTERVIEW_QUESTIONS[category] ?? [];
            const questions = shuffleAndPick(pool, 5);

            const { data: interviewSession, error } = await supabaseAdmin
                .from('interview_sessions')
                .insert({
                    user_id: userId,
                    category,
                    questions,
                    answers: [],
                    current_question_index: 0,
                    completed: false,
                })
                .select()
                .single();

            if (error || !interviewSession) {
                logger.error({ error }, 'Failed to create interview session');
                return reply.status(500).send({
                    success: false,
                    error: { code: 'INTERNAL_ERROR', message: 'Failed to start interview' },
                });
            }

            return reply.send({
                success: true,
                data: {
                    interviewId: interviewSession.id,
                    firstQuestion: {
                        id: questions[0].id,
                        text: questions[0].text,
                        number: 1,
                        total: 5,
                    },
                },
            });
        }
    );

    // ── POST /api/interview/:interviewId/answer ───────────────────────────────
    fastify.post<{ Params: { interviewId: string } }>(
        '/api/interview/:interviewId/answer',
        { preHandler: [authenticate] },
        async (request, reply) => {
            const userId = request.user.sub;
            const { interviewId } = request.params;

            // Fetch current interview session
            const { data: interviewSession, error: fetchError } = await supabaseAdmin
                .from('interview_sessions')
                .select('*')
                .eq('id', interviewId)
                .eq('user_id', userId)
                .single();

            if (fetchError || !interviewSession) {
                return reply.status(404).send({
                    success: false,
                    error: { code: 'NOT_FOUND', message: 'Interview session not found' },
                });
            }

            if (interviewSession.completed) {
                return reply.status(400).send({
                    success: false,
                    error: { code: 'VALIDATION_ERROR', message: 'Interview is already completed' },
                });
            }

            // Parse multipart
            const parts = request.parts();
            let audioBuffer: Buffer | null = null;
            let audioFilename = 'answer.m4a';
            let questionId = '';
            let durationSecs = 0;

            for await (const part of parts) {
                if (part.type === 'file' && part.fieldname === 'audio') {
                    const chunks: Buffer[] = [];
                    for await (const chunk of part.file) chunks.push(chunk);
                    audioBuffer = Buffer.concat(chunks);
                    audioFilename = part.filename;
                } else if (part.type === 'field') {
                    if (part.fieldname === 'questionId') questionId = part.value as string;
                    if (part.fieldname === 'duration') durationSecs = parseFloat(part.value as string) || 0;
                }
            }

            if (!audioBuffer || !questionId) {
                return reply.status(400).send({
                    success: false,
                    error: { code: 'VALIDATION_ERROR', message: 'audio and questionId are required' },
                });
            }

            // Fetch native language for LLM context
            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('native_language')
                .eq('id', userId)
                .single();

            // Run analysis pipeline
            const answerResult = await runAnalysisPipeline({
                audioBuffer,
                duration: durationSecs,
                sessionType: 'practice', // interview answers use 'practice' session type
                promptText: null,
                userId,
                nativeLanguage: profile?.native_language ?? 'hindi',
            });

            // Append to answers array
            const existingAnswers: InterviewAnswer[] = interviewSession.answers ?? [];
            const newAnswer: InterviewAnswer = {
                questionId,
                sessionId: answerResult.sessionId,
                score: answerResult.overallScore,
                transcript: answerResult.transcript,
            };
            const updatedAnswers = [...existingAnswers, newAnswer];

            const nextIndex = interviewSession.current_question_index + 1;
            const questions: InterviewQuestion[] = interviewSession.questions;
            const isLastQuestion = nextIndex >= questions.length;

            const overallScore = isLastQuestion
                ? Math.round(
                    updatedAnswers.reduce((sum, a) => sum + a.score, 0) / updatedAnswers.length
                )
                : null;

            // Update interview session in DB
            await supabaseAdmin
                .from('interview_sessions')
                .update({
                    answers: updatedAnswers,
                    current_question_index: nextIndex,
                    completed: isLastQuestion,
                    overall_score: overallScore,
                })
                .eq('id', interviewId);

            const nextQuestion =
                !isLastQuestion
                    ? {
                        id: questions[nextIndex].id,
                        text: questions[nextIndex].text,
                        number: nextIndex + 1,
                        total: questions.length,
                    }
                    : null;

            return reply.send({
                success: true,
                data: {
                    answerResult: {
                        sessionId: answerResult.sessionId,
                        wpm: answerResult.wpm,
                        accuracyScore: answerResult.accuracyScore,
                        fillerCount: answerResult.fillerCount,
                        tips: answerResult.tips,
                    },
                    nextQuestion,
                    isComplete: isLastQuestion,
                    ...(isLastQuestion ? { overallScore } : {}),
                },
            });
        }
    );

    // ── GET /api/interview/:interviewId/report ────────────────────────────────
    fastify.get<{ Params: { interviewId: string } }>(
        '/api/interview/:interviewId/report',
        { preHandler: [authenticate] },
        async (request, reply) => {
            const userId = request.user.sub;
            const { interviewId } = request.params;

            const { data: interviewSession, error } = await supabaseAdmin
                .from('interview_sessions')
                .select('*')
                .eq('id', interviewId)
                .eq('user_id', userId)
                .single();

            if (error || !interviewSession) {
                return reply.status(404).send({
                    success: false,
                    error: { code: 'NOT_FOUND', message: 'Interview session not found' },
                });
            }

            // Compute grade
            const score = interviewSession.overall_score ?? 0;
            const grade = scoreToGrade(score);

            return reply.send({
                success: true,
                data: { ...interviewSession, grade },
            });
        }
    );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function shuffleAndPick<T>(arr: T[], n: number): T[] {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(n, arr.length));
}

function scoreToGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 75) return 'B';
    if (score >= 60) return 'C';
    return 'D';
}
