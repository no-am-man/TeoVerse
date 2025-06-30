'use server';
/**
 * @fileOverview An image generation and caching service called Geny.
 *
 * - geny - The main endpoint function that handles image generation.
 * - GenyInput - The input type for the geny function.
 * - GenyOutput - The return type for the geny function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { createHash } from 'crypto';
import { getCachedImage, cacheImage } from '@/services/geny-service';

const GenyInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate an image from.'),
  imageSize: z
    .object({
      width: z.number().int().positive(),
      height: z.number().int().positive(),
    })
    .describe('The desired dimensions for the image.'),
});
export type GenyInput = z.infer<typeof GenyInputSchema>;

const GenyOutputSchema = z.object({
  url: z.string().describe('The URL of the generated or cached image.'),
});
export type GenyOutput = z.infer<typeof GenyOutputSchema>;


/**
 * Main endpoint function.
 * Generates an image based on a prompt, caching the result.
 * If a request with the same payload is made again, it returns the cached image URL.
 * @param input The payload containing the prompt and image size.
 * @returns The URL of the image.
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
    // 1. Hash the payload to create a unique key for caching.
    const payloadString = JSON.stringify(input);
    const hash = createHash('sha256').update(payloadString).digest('hex');

    // 2. Check the database for a cached result.
    const cachedUrl = await getCachedImage(hash);
    if (cachedUrl) {
      console.log('Returning cached image for hash:', hash);
      return { url: cachedUrl };
    }

    console.log('No cache hit. Generating new image for hash:', hash);

    // 3. If not cached, generate a new image.
    // Note: The 'gemini-2.0-flash-preview-image-generation' model does not currently support custom image sizes.
    // The `imageSize` parameter is included in the hash for future compatibility but is not used in generation.
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
    const imageUrl = media.url;

    // 4. Upload to a bucket (simulated by caching the data URI) and save the hash/URL pair.
    await cacheImage(hash, imageUrl);

    // 5. Return the URL to the new resource.
    return { url: imageUrl };
  }
);
