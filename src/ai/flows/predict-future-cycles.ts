'use server';

/**
 * @fileOverview 根据记录的数据预测未来的月经周期和排卵日期。
 *
 * - predictFutureCycles - 预测未来的月经周期和排卵日期。
 * - PredictFutureCyclesInput - predictFutureCycles 函数的输入类型。
 * - PredictFutureCyclesOutput - predictFutureCycles 函数的返回类型。
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictFutureCyclesInputSchema = z.object({
  cycleLength: z
    .number()
    .describe('月经周期的典型长度（天）。'),
  periodLength: z.number().describe('经期的典型长度（天）。'),
  numberOfCycles: z
    .number()
    .describe('要预测的未来周期数。'),
  lastPeriodStartDate: z
    .string()
    .describe('上次月经开始的日期 (YYYY-MM-DD)。'),
});
export type PredictFutureCyclesInput = z.infer<typeof PredictFutureCyclesInputSchema>;

const PredictFutureCyclesOutputSchema = z.object({
  predictedCycles: z.array(
    z.object({
      startDate: z.string().describe('预测的周期开始日期 (YYYY-MM-DD)。'),
      endDate: z.string().describe('预测的周期结束日期 (YYYY-MM-DD)。'),
      ovulationDate: z
        .string()
        .describe('预测的周期排卵日期 (YYYY-MM-DD)。'),
    })
  ),
});
export type PredictFutureCyclesOutput = z.infer<typeof PredictFutureCyclesOutputSchema>;

export async function predictFutureCycles(input: PredictFutureCyclesInput): Promise<PredictFutureCyclesOutput> {
  return predictFutureCyclesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictFutureCyclesPrompt',
  input: {schema: PredictFutureCyclesInputSchema},
  output: {schema: PredictFutureCyclesOutputSchema},
  prompt: `你是一个专注于女性生殖健康的乐于助人的助手。

  根据用户的月经周期数据，预测接下来 {{numberOfCycles}} 个周期的开始日期、结束日期和排卵日期。

  这是用户的数据:
  - 典型周期长度: {{cycleLength}} 天
  - 典型经期长度: {{periodLength}} 天
  - 上次经期开始日期: {{lastPeriodStartDate}}

  以JSON格式输出预测的周期。
  `,
});

const predictFutureCyclesFlow = ai.defineFlow(
  {
    name: 'predictFutureCyclesFlow',
    inputSchema: PredictFutureCyclesInputSchema,
    outputSchema: PredictFutureCyclesOutputSchema,
  },
  async input => {
    const {cycleLength, periodLength, numberOfCycles, lastPeriodStartDate} = input;
    const {output} = await prompt({
      cycleLength,
      periodLength,
      numberOfCycles,
      lastPeriodStartDate,
    });
    return output!;
  }
);
