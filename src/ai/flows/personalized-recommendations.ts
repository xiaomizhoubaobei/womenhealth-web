'use server';

/**
 * @fileOverview 一个根据用户数据生成个性化健康建议的流程。
 *
 * - generatePersonalizedRecommendations - 生成个性化建议的函数。
 * - PersonalizedRecommendationsInput - generatePersonalizedRecommendations 函数的输入类型。
 * - PersonalizedRecommendationsOutput - generatePersonalizedRecommendations 函数的输出类型。
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedRecommendationsInputSchema = z.object({
  cycleData: z.string().describe('月经周期数据，包括经期日期、流量强度和症状。'),
  fertilityData: z.string().describe('生育迹象数据，如基础体温和宫颈粘液观察。'),
  pregnancyData: z.string().optional().describe('怀孕相关数据，如果适用。'),
  symptomAnalysis: z.string().describe('症状分析数据，提供对潜在健康问题的见解。'),
});

export type PersonalizedRecommendationsInput = z.infer<typeof PersonalizedRecommendationsInputSchema>;

const PersonalizedRecommendationsOutputSchema = z.object({
  recommendations: z.array(
    z.object({
      type: z.string().describe('建议类型（生活方式、咨询等）'),
      description: z.string().describe('建议的详细描述。'),
    })
  ).describe('个性化健康建议列表。'),
});

export type PersonalizedRecommendationsOutput = z.infer<typeof PersonalizedRecommendationsOutputSchema>;

export async function generatePersonalizedRecommendations(input: PersonalizedRecommendationsInput): Promise<PersonalizedRecommendationsOutput> {
  return personalizedRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedRecommendationsPrompt',
  input: {schema: PersonalizedRecommendationsInputSchema},
  output: {schema: PersonalizedRecommendationsOutputSchema},
  prompt: `根据以下健康数据，为用户生成个性化建议。

周期数据: {{{cycleData}}}
生育数据: {{{fertilityData}}}
怀孕数据: {{{pregnancyData}}}
症状分析: {{{symptomAnalysis}}}

根据追踪到的数据提供量身定制的建议，例如生活方式调整或建议咨询医生。
考虑所有可用数据以提供最相关和最有帮助的建议。
`,
});

const personalizedRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedRecommendationsFlow',
    inputSchema: PersonalizedRecommendationsInputSchema,
    outputSchema: PersonalizedRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
