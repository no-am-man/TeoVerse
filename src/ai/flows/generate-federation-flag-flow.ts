
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
  // The salt is used to ensure the image is unique on regeneration, even if the prompt is the same.
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
    console.log('Generating new Federation Flag image data.');

    // 1. Generate a new image from the prompt.
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: input.prompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media?.url) {
      throw new Error(
        'Image generation failed to return a valid media object.'
      );
    }
    
    // 2. Return the data URI. The client will handle storage and database updates.
    return { dataUri: media.url };
  }
);
