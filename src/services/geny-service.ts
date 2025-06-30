import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const GENERATED_IMAGES_COLLECTION = 'generated_images';

/**
 * Retrieves a cached image URL from Firestore based on a payload hash.
 * @param hash The SHA256 hash of the generation payload.
 * @returns The cached image URL if found, otherwise null.
 */
export async function getCachedImage(hash: string): Promise<string | null> {
  const docRef = doc(db, GENERATED_IMAGES_COLLECTION, hash);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data().url;
  }
  return null;
}

/**
 * Caches a newly generated image URL in Firestore.
 * @param hash The SHA256 hash of the generation payload.
 * @param url The URL of the generated image (e.g., a data URI).
 */
export async function cacheImage(hash: string, url: string): Promise<void> {
  const docRef = doc(db, GENERATED_IMAGES_COLLECTION, hash);
  await setDoc(docRef, {
    url,
    createdAt: serverTimestamp(),
  });
}
