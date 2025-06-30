
'use server';

import { adminDb } from '@/lib/firebase-admin';
import type { GenerateDocumentationOutput } from '@/ai/flows/generate-documentation-flow';

const DOCS_CACHE_COLLECTION = 'documentationCache';

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
