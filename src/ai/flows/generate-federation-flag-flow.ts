
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
import { getAdminStorage, getAdminRtdb } from '@/lib/firebase-admin';

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
    console.log('Generating new Federation Flag image data using Admin SDK.');

    // 1. Generate a new image from the prompt.
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: input.prompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media?.url) {
      throw new Error('Image generation failed to return a valid media object.');
    }
    const dataUri = media.url;
    
    // 2. Upload to Firebase Storage using Admin SDK
    const bucket = getAdminStorage().bucket();
    const uniqueName = `flag-${Date.now()}`;
    const filePath = `federation_flags/${uniqueName}.png`;
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

    // 3. Make the file public and get its URL
    await file.makePublic();
    const downloadURL = file.publicUrl();

    // 4. Update the Realtime Database with the new flag URL using Admin SDK
    await getAdminRtdb().ref('federation/flagUrl').set(downloadURL);
    
    // 5. Return the URL. The client will use this for an immediate UI update.
    return { dataUri: downloadURL };
  }
);
