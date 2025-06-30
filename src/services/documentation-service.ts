
'use server';

import { adminDb } from '@/lib/firebase-admin';
import type { GenerateDocumentationOutput } from '@/ai/flows/generate-documentation-flow';
import { createHash } from 'crypto';

const DOCS_CACHE_COLLECTION = 'documentationCache';

function getCacheKey(topic: string, version: string): string {
    return createHash('sha256').update(`${topic}:${version}`).digest('hex');
}

/**
 * Retrieves a cached documentation article from Firestore.
 * @param topic The topic of the documentation.
 * @param version The app version for which it was generated.
 * @returns A promise that resolves to the cached data or null if not found.
 */
export async function getDocumentation(topic: string, version: string): Promise<GenerateDocumentationOutput | null> {
    const cacheKey = getCacheKey(topic, version);
    const docRef = adminDb.collection(DOCS_CACHE_COLLECTION).doc(cacheKey);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
        const data = docSnap.data();
        if (data) {
            return {
                article: data.article,
                imageUrl: data.imageUrl,
            };
        }
    }
    return null;
}

/**
 * Stores a generated documentation article in the Firestore cache.
 * @param topic The topic of the documentation.
 * @param version The app version.
 * @param data The documentation data to cache.
 */
export async function setDocumentation(topic: string, version: string, data: GenerateDocumentationOutput): Promise<void> {
    const cacheKey = getCacheKey(topic, version);
    const docRef = adminDb.collection(DOCS_CACHE_COLLECTION).doc(cacheKey);
    // Also store topic and version for querying
    await docRef.set({ ...data, topic, version });
}

/**
 * Fetches all available cached documentation for a specific version.
 * @param version The app version to fetch docs for.
 * @returns A promise resolving to a map of topic to documentation data.
 */
export async function getAvailableDocumentation(version: string): Promise<Record<string, GenerateDocumentationOutput>> {
    const cacheRef = adminDb.collection(DOCS_CACHE_COLLECTION);
    const q = cacheRef.where('version', '==', version);
    const querySnapshot = await q.get();

    const availableDocs: Record<string, GenerateDocumentationOutput> = {};
    querySnapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.topic) {
            availableDocs[data.topic] = {
                article: data.article,
                imageUrl: data.imageUrl,
            };
        }
    });

    return availableDocs;
}
