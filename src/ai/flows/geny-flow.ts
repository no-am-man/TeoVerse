
'use server';
/**
 * @fileOverview An image generation service called Geny.
 *
 * - geny - The main endpoint function that handles image generation.
 * - GenyInput - The input type for the geny function.
 * - GenyOutput - The return type for the geny function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenyInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate an image from.'),
  salt: z.string().optional().describe('An optional random string to ensure a unique image is generated.'),
});
export type GenyInput = z.infer<typeof GenyInputSchema>;

const GenyOutputSchema = z.object({
  dataUri: z.string().describe('The data URI of the generated image.'),
});
export type GenyOutput = z.infer<typeof GenyOutputSchema>;


/**
 * Main endpoint function.
 * Generates an image based on a prompt.
 * @param input The payload containing the prompt.
 * @returns The data URI of the generated image.
 */
export async function geny(input: GenyInput): Promise<GenyOutput> {
  return genyFlow(input);
}

const genyFlow = ai.defineFlow(
  {
    name: 'genyFlow',
    inputSchema: GenyInputSchema,
    outputSchema: GenyOutputSchema,
  },
  async (input) => {
    // Append salt to the prompt if provided to ensure uniqueness
    const finalPrompt = input.salt
      ? `${input.prompt} Salt: ${input.salt}`
      : input.prompt;

    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: finalPrompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media?.url) {
      throw new Error(
        'Image generation failed to return a valid media object.'
      );
    }
    
    return { dataUri: media.url };
  }
);
