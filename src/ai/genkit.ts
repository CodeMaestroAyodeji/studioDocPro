import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = () => {
  try {
    return genkit({
      plugins: [googleAI()],
      logLevel: 'debug',
      enableTracingAndMetrics: true,
    });
  } catch (error) {
    console.error('Error configuring Genkit:', error);
    throw error;
  }
};
