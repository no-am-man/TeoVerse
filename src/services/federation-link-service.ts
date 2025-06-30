
'use server';

import { db } from '@/lib/firebase';
import { collection, doc, addDoc, getDocs, deleteDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { federationConfig } from '@/config';

export interface LinkedFederation {
  id: string;
  name: string;
  url: string;
  tokenSymbol: string;
  version: string;
  linkedAt: number;
}

const getLinkedFederationsCollection = (userId: string) => {
  return collection(db, 'passports', userId, 'linkedFederations');
};

const getMajorVersion = (version: string): string => {
  return version.split('.')[0];
};

/**
 * Fetches the list of linked federations for a user.
 * @param userId The user's ID.
 * @returns A promise that resolves to an array of linked federations.
 */
export const getLinkedFederations = async (userId: string): Promise<LinkedFederation[]> => {
  const federationsRef = getLinkedFederationsCollection(userId);
  const snapshot = await getDocs(federationsRef);
  
  if (snapshot.empty) {
    return [];
  }

  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      url: data.url,
      tokenSymbol: data.tokenSymbol,
      version: data.version,
      linkedAt: data.linkedAt?.toDate().getTime() || Date.now(),
    };
  });
};

/**
 * Links to a new federation after performing checks.
 * @param userId The user's ID.
 * @param foreignFederationUrl The URL of the federation to link to.
 * @returns A promise that resolves to the newly linked federation data.
 */
export const linkFederation = async (userId: string, foreignFederationUrl: string): Promise<LinkedFederation> => {
  // 1. Normalize URL to remove trailing slash
  const normalizedUrl = foreignFederationUrl.endsWith('/') ? foreignFederationUrl.slice(0, -1) : foreignFederationUrl;

  if (normalizedUrl === federationConfig.federationURL) {
    throw new Error("You cannot link to your own federation.");
  }
  
  // 2. Check if already linked
  const federationsRef = getLinkedFederationsCollection(userId);
  const q = query(federationsRef, where("url", "==", normalizedUrl));
  const existingLink = await getDocs(q);

  if (!existingLink.empty) {
    throw new Error("This federation is already linked.");
  }

  // 3. Fetch foreign federation's config
  let foreignConfig;
  try {
    const response = await fetch(`${normalizedUrl}/app.config.json`);
    if (!response.ok) {
      throw new Error(`Could not fetch configuration. Status: ${response.status}`);
    }
    foreignConfig = await response.json();
  } catch (error) {
    console.error("Failed to fetch foreign federation config:", error);
    throw new Error("Could not retrieve federation info from the provided URL.");
  }

  // 4. Validate the foreign config
  if (!foreignConfig.version || !foreignConfig.federationName || !foreignConfig.tokenSymbol) {
    throw new Error("The provided URL does not point to a valid federation config.");
  }

  // 5. Compare major versions
  const localMajorVersion = getMajorVersion(federationConfig.version);
  const foreignMajorVersion = getMajorVersion(foreignConfig.version);

  if (localMajorVersion !== foreignMajorVersion) {
    throw new Error(`Version mismatch. Your federation is v${localMajorVersion}, but the target is v${foreignMajorVersion}. Major versions must match.`);
  }

  // 6. Add to Firestore
  const newFederationData = {
    name: foreignConfig.federationName,
    url: normalizedUrl,
    tokenSymbol: foreignConfig.tokenSymbol,
    version: foreignConfig.version,
    linkedAt: serverTimestamp(),
  };

  const docRef = await addDoc(federationsRef, newFederationData);

  return {
    id: docRef.id,
    ...newFederationData,
    linkedAt: Date.now(), // Return current time immediately
  };
};

/**
 * Unlinks a federation.
 * @param userId The user's ID.
 * @param federationId The Firestore document ID of the federation to unlink.
 */
export const unlinkFederation = async (userId: string, federationId: string): Promise<void> => {
  const docRef = doc(db, 'passports', userId, 'linkedFederations', federationId);
  await deleteDoc(docRef);
};
