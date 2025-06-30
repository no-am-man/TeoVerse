'use server';
import { rtdb } from '@/lib/firebase';
import { ref, set } from 'firebase/database';

const FEDERATION_FLAG_PATH = 'federation/flagUrl';

/**
 * Sets the federation flag URL in the Realtime Database.
 * @param url The URL of the federation flag.
 */
export async function setFederationFlagUrl(url: string): Promise<void> {
  const flagRef = ref(rtdb, FEDERATION_FLAG_PATH);
  await set(flagRef, url);
}
