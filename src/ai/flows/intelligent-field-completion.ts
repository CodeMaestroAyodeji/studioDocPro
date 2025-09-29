'use server';

/**
 * @fileOverview Implements the Intelligent Field Completion flow.
 *
 * This flow analyzes document content and suggests values for subsequent form fields to accelerate data entry.
 *   - intelligentFieldCompletion - A function that uses AI to suggest values for form fields.
 *   - IntelligentFieldCompletionInput - The input type for the intelligentFieldCompletion function.
 *   - IntelligentFieldCompletionOutput - The return type for the intelligentFieldCompletion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IntelligentFieldCompletionInputSchema = z.object({
  documentContent: z
    .string()
    .describe('The content of the document to analyze.'),
  currentField: z
    .string()
    .describe('The name of the current field to suggest a value for.'),
  precedingFields: z
    .record(z.string())
    .describe('A map of the names and values of the fields that precede the current field.'),
});
export type IntelligentFieldCompletionInput = z.infer<
  typeof IntelligentFieldCompletionInputSchema
>;

const IntelligentFieldCompletionOutputSchema = z.object({
  suggestedValue: z
    .string()
    .describe('The AI-suggested value for the current field.'),
});
export type IntelligentFieldCompletionOutput = z.infer<
  typeof IntelligentFieldCompletionOutputSchema
>;

export async function intelligentFieldCompletion(
  input: IntelligentFieldCompletionInput
): Promise<IntelligentFieldCompletionOutput> {
  return intelligentFieldCompletionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'intelligentFieldCompletionPrompt',
  input: {schema: IntelligentFieldCompletionInputSchema},
  output: {schema: IntelligentFieldCompletionOutputSchema},
  prompt: `You are an AI assistant that suggests values for form fields in a document.

  Given the content of the document and the values of the preceding fields, suggest a value for the current field.

  Document Content:
  {{documentContent}}

  Preceding Fields:
  {{#each precedingFields}}
  {{@key}}: {{this}}
  {{/each}}

  Current Field: {{currentField}}

  Suggest a value for the current field based on the document content and preceding fields.
  Format your output as a plain string.`,
});

const intelligentFieldCompletionFlow = ai.defineFlow(
  {
    name: 'intelligentFieldCompletionFlow',
    inputSchema: IntelligentFieldCompletionInputSchema,
    outputSchema: IntelligentFieldCompletionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return {suggestedValue: output!.suggestedValue};
  }
);
