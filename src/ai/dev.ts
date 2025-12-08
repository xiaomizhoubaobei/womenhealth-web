import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-symptoms.ts';
import '@/ai/flows/predict-future-cycles.ts';
import '@/ai/flows/personalized-recommendations.ts';