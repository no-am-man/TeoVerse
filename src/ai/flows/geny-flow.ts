
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
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK directly in this flow.
// This is a workaround for a suspected module loading issue in the environment
// that causes initialization to fail when it's in a shared module.
if (!admin.apps.length) {
  // In a managed environment, this call should automatically discover credentials.
  admin.initializeApp();
}

const GenyInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate an image from.'),
  imageSize: z
    .object({
      width: z.number().int().positive(),
      height: z.number().int().positive(),
    })
    .describe('The desired dimensions for the image.'),
  salt: z.string().optional().describe('An optional random string to bypass the cache and force regeneration.'),
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
    const adminStorage = admin.storage();

    // 3. If not cached, generate a new image.
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
    const dataUri = media.url;
    
    // 4. Upload to Firebase Storage using the Admin SDK
    const bucket = adminStorage.bucket();
    const filePath = `generated_images/${hash}.png`;
    const file = bucket.file(filePath);

    const commaIndex = dataUri.indexOf(',');
    if (commaIndex === -1) {
      throw new Error('Invalid data URI from image generation model.');
    }
    const base64Data = dataUri.substring(commaIndex + 1);
    const buffer = Buffer.from(base64Data, 'base64');
    
    await file.save(buffer, {
      metadata: {
        contentType: 'image/png',
      },
    });

    // Make the file public to get a predictable URL
    await file.makePublic();
    const downloadURL = file.publicUrl();

    // 5. Cache the public Storage URL in Firestore.
    await cacheImage(hash, downloadURL);

    // 6. Return the URL to the new resource.
    return { url: downloadURL };
  }
);
