
'use server';
/**
 * @fileOverview A flow to generate the Federation Flag image data.
 *
 * - generateFederationFlag - The main endpoint function.
 * - GenerateFederationFlagInput - The input type for the function.
 * - GenerateFederationFlagOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateFederationFlagInputSchema = z.object({
  prompt: z.string().describe('The detailed text prompt to generate the flag from.'),
  salt: z.string().optional().describe('An optional random string to force regeneration.'),
});
export type GenerateFederationFlagInput = z.infer<typeof GenerateFederationFlagInputSchema>;

const GenerateFederationFlagOutputSchema = z.object({
  dataUri: z.string().describe('The data URI of the generated flag image.'),
});
export type GenerateFederationFlagOutput = z.infer<typeof GenerateFederationFlagOutputSchema>;

export async function generateFederationFlag(input: GenerateFederationFlagInput): Promise<GenerateFederationFlagOutput> {
  return generateFederationFlagFlow(input);
}

const generateFederationFlagFlow = ai.defineFlow(
  {
    name: 'generateFederationFlagFlow',
    inputSchema: GenerateFederationFlagInputSchema,
    outputSchema: GenerateFederationFlagOutputSchema,
  },
  async (input) => {
    // Append the salt to the prompt to ensure deterministic or random generation.
    const finalPrompt = input.salt
      ? `${input.prompt} Salt: ${input.salt}`
      : input.prompt;

    // 1. Generate a new image from the prompt.
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: finalPrompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media?.url) {
      throw new Error('Image generation failed to return a valid media object.');
    }
    
    // 2. Return the raw data URI to the client for processing.
    return { dataUri: media.url };
  }
);
