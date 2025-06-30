
'use server';

import { generateDocumentation, type GenerateDocumentationInput, type GenerateDocumentationOutput } from '@/ai/flows/generate-documentation-flow';
import { adminDb } from '@/lib/firebase-admin';
import { federationConfig } from '@/config';
import crypto from 'crypto';

const DOCS_CACHE_COLLECTION = 'documentationCache';

const getCacheKey = (topic: string, version: string): string => {
    return crypto.createHash('sha256').update(`${topic}-${version}`).digest('hex');
};

/**
 * A server action that generates documentation using an AI flow and then
 * caches the result in Firestore before returning it to the client.
 * This separates the AI generation from the database write, avoiding auth issues.
 * @param input The input for the documentation generation.
 * @returns The generated documentation output.
 */
export async function generateAndCacheDocumentation(input: GenerateDocumentationInput): Promise<GenerateDocumentationOutput> {
    // 1. Generate the documentation using the stateless AI flow.
    const generatedDoc = await generateDocumentation(input);

    // 2. Cache the result in Firestore.
    try {
        const cacheKey = getCacheKey(generatedDoc.topic, federationConfig.version);
        const docRef = adminDb.collection(DOCS_CACHE_COLLECTION).doc(cacheKey);

        const docData = {
            ...generatedDoc,
            version: federationConfig.version,
        };

        await docRef.set(docData);
        console.log(`Successfully cached documentation for topic: "${generatedDoc.topic}"`);
    } catch (error) {
        // Log the error but don't block the user from seeing the generated content.
        // The content is still valuable even if caching fails.
        console.error("Failed to cache documentation:", error);
    }
    
    // 3. Return the generated document to the client.
    return generatedDoc;
}
