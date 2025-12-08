import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Genkit AI 实例，配置了 Google AI 插件和默认模型。
 * @type {import('genkit').Genkit}
 */
export const ai = genkit({
    plugins: [googleAI()],
    model: 'googleai/gemini-2.5-flash',
});
