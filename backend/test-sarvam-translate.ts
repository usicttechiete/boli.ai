/**
 * Test script for Sarvam AI Translation API
 * 
 * Usage:
 * 1. Make sure SARVAM_API_KEY is set in backend/.env
 * 2. Run: npx ts-node test-sarvam-translate.ts
 */

import { translateText } from './src/services/sarvamTranslate';

async function testTranslation() {
    console.log('🧪 Testing Sarvam AI Translation...\n');

    const tests = [
        { text: 'Hello', from: 'english', to: 'tamil' },
        { text: 'Thank you', from: 'english', to: 'hindi' },
        { text: 'Water', from: 'english', to: 'gujarati' },
        { text: 'Friend', from: 'english', to: 'telugu' },
        { text: 'Family', from: 'english', to: 'marathi' },
    ];

    for (const test of tests) {
        try {
            console.log(`📝 Translating "${test.text}" from ${test.from} to ${test.to}...`);
            const result = await translateText(test.text, test.from, test.to);
            console.log(`✅ Result: ${result}\n`);
        } catch (error) {
            console.error(`❌ Error: ${(error as Error).message}\n`);
        }
    }

    console.log('✨ Test complete!');
}

testTranslation().catch(console.error);
