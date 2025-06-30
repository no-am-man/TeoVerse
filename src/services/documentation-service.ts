
'use server';

import { adminDb } from '@/lib/firebase-admin';
import type { GenerateDocumentationOutput } from '@/ai/flows/generate-documentation-flow';

const DOCS_CACHE_COLLECTION = 'documentationCache';

/**
 * Retrieves all cached documentation articles for a specific app version.
 * @param version The app version to fetch documentation for.
 * @returns A promise that resolves to an array of cached documentation articles.
 */
export const getAllCachedDocumentation = async (version: string): Promise<GenerateDocumentationOutput[]> => {
    try {
        const snapshot = await adminDb.collection(DOCS_CACHE_COLLECTION).where('version', '==', version).get();
        
        if (snapshot.empty) {
            return [];
        }

        const articles: GenerateDocumentationOutput[] = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            articles.push({
                topic: data.topic,
                article: data.article,
                imageUrl: data.imageUrl,
            });
        });
        return articles;

    } catch (error) {
        console.error('Error fetching all cached documentation:', error);
        // In case of an auth error, returning an empty array is a graceful fallback.
        if (error instanceof Error && (error.message.includes('Could not refresh access token') || error.message.includes('requires an index'))) {
            console.warn('Could not fetch cached docs due to auth or missing index. This is non-critical. The user can still generate docs manually.');
            return [];
        }
        return [];
    }
};
