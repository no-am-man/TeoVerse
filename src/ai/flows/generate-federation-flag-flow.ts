'use server';
/**
 * @fileOverview A flow to generate and update the Federation Flag.
 *
 * - generateFederationFlag - The main endpoint function.
 * - GenerateFederationFlagInput - The input type for the function.
 * - GenerateFederationFlagOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { setFederationFlagUrl } from '@/services/federation-service';
import { storage } from '@/lib/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { createHash } from 'crypto';

const GenerateFederationFlagInputSchema = z.object({
  prompt: z.string().describe('The detailed text prompt to generate the flag from.'),
  // The salt is used to ensure the image is unique on regeneration, even if the prompt is the same.
  // The hash of the prompt + salt will be the image name in storage.
  salt: z.string().optional().describe('An optional random string to force regeneration.'),
});
export type GenerateFederationFlagInput = z.infer<typeof GenerateFederationFlagInputSchema>;

const GenerateFederationFlagOutputSchema = z.object({
  url: z.string().describe('The URL of the generated flag image.'),
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
    console.log('Generating new Federation Flag.');

    // 1. Generate a new image.
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

    // 2. Create a unique name for the file in storage.
    const uniqueString = JSON.stringify(input);
    const hash = createHash('sha256').update(uniqueString).digest('hex');

    // 3. Upload to Firebase Storage to get a public URL.
    const storageRef = ref(storage, `federation_flags/${hash}.png`);
    const base64Data = dataUri.substring(dataUri.indexOf(',') + 1);
    
    const uploadResult = await uploadString(storageRef, base64Data, 'base64', {
      contentType: 'image/png',
    });
    const downloadURL = await getDownloadURL(uploadResult.ref);

    // 4. Update the flag URL in the Realtime Database for all clients.
    await setFederationFlagUrl(downloadURL);

    // 5. Return the URL.
    return { url: downloadURL };
  }
);
