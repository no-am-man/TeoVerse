'use client';

/**
 * Generates a SHA-256 hash of a given string.
 * This function must run on the client as it uses the Web Crypto API.
 * @param message The string to hash.
 * @returns A promise that resolves to the hex string of the hash.
 */
export async function sha256(message: string): Promise<string> {
  // Web Crypto API is only available in secure contexts (HTTPS/localhost)
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    throw new Error('Web Crypto API not available in this environment.');
  }
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
