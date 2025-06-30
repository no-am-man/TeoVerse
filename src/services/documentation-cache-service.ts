'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { GenerateDocumentationOutput } from '@/ai/flows/generate-documentation-flow';

const DOCUMENTATION_CACHE_COLLECTION = 'documentation_cache';

/**
 * Retrieves a cached documentation article from Firestore.
 * @param hash The SHA256 hash of the generation payload (the topic).
 * @returns The cached article and image URL if found, otherwise null.
 */
export async function getCachedDocumentation(hash: string): Promise<GenerateDocumentationOutput | null> {
  const docRef = doc(db, DOCUMENTATION_CACHE_COLLECTION, hash);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      article: data.article,
      imageUrl: data.imageUrl,
    };
  }
  return null;
}

/**
 * Caches a newly generated documentation article in Firestore.
 * @param hash The SHA256 hash of the generation payload.
 * @param data The documentation data to cache.
 */
export async function cacheDocumentation(hash: string, data: GenerateDocumentationOutput): Promise<void> {
  const docRef = doc(db, DOCUMENTATION_CACHE_COLLECTION, hash);
  await setDoc(docRef, {
    ...data,
    createdAt: serverTimestamp(),
  });
}
