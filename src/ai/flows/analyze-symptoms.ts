'use server';

/**
 * @fileOverview 一个AI代理，分析用户记录的症状以识别模式和潜在的健康问题，提供个性化的见解和建议。
 *
 * - analyzeSymptoms - 分析症状的函数。
 * - AnalyzeSymptomsInput - analyzeSymptoms 函数的输入类型。
 * - AnalyzeSymptomsOutput - analyzeSymptoms 函数的返回类型。
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeSymptomsInputSchema = z.object({
  symptoms: z
    .string()
    .describe('所经历症状的详细描述。'),
  cycleData: z
    .string()
    .optional()
    .describe(
      '可选：关于用户周期的数据，如平均长度或任何不规则性。'
    ),
});
export type AnalyzeSymptomsInput = z.infer<typeof AnalyzeSymptomsInputSchema>;

const AnalyzeSymptomsOutputSchema = z.object({
  analysis: z.string().describe('对症状和潜在健康问题的分析。'),
  recommendations: z
    .string()
    .describe('基于症状分析的个性化见解和建议。'),
});
export type AnalyzeSymptomsOutput = z.infer<typeof AnalyzeSymptomsOutputSchema>;

export async function analyzeSymptoms(input: AnalyzeSymptomsInput): Promise<AnalyzeSymptomsOutput> {
  return analyzeSymptomsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeSymptomsPrompt',
  input: {schema: AnalyzeSymptomsInputSchema},
  output: {schema: AnalyzeSymptomsOutputSchema},
  prompt: `你是一个专注于女性生殖健康的AI助手。

  分析提供的症状和周期数据（如果可用），以识别潜在的模式和健康问题。
  根据分析提供个性化的见解和建议。

  症状: {{{symptoms}}}
  周期数据: {{{cycleData}}}

  用分析和建议来回应。
  `,
});

const analyzeSymptomsFlow = ai.defineFlow(
  {
    name: 'analyzeSymptomsFlow',
    inputSchema: AnalyzeSymptomsInputSchema,
    outputSchema: AnalyzeSymptomsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
