import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, runTransaction, collection, getDocs, deleteDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { addActivityLog } from './activity-log-service';
import { federationConfig } from '@/config';

export interface PhysicalAsset {
  id: string;
  type: string;
  name: string;
  value: string;
}

export interface IpToken {
  id: string;
  name: string;
  value: string;
}

export interface Passport {
  id: string;
  federationURL: string;
  email: string;
  createdAt: any;
  physicalAssets: PhysicalAsset[];
  ipTokens: IpToken[];
  teoBalance: number;
}

const passportsCollection = 'passports';

export const getPassport = async (userId: string): Promise<Passport | null> => {
  const passportRef = doc(db, passportsCollection, userId);
  const passportSnap = await getDoc(passportRef);

  if (passportSnap.exists()) {
    const data = passportSnap.data();
    return {
      id: passportSnap.id,
      federationURL: data.federationURL,
      email: data.email,
      createdAt: data.createdAt,
      physicalAssets: data.physicalAssets || [],
      ipTokens: data.ipTokens || [],
      teoBalance: data.teoBalance || 0,
    };
  } else {
    return null;
  }
};

export const createPassport = async (user: User, federationURL: string): Promise<Passport> => {
  const passportRef = doc(db, passportsCollection, user.uid);
  const passportData = {
    federationURL,
    email: user.email,
    createdAt: serverTimestamp(),
    physicalAssets: [],
    ipTokens: [],
    teoBalance: 0,
  };
  await setDoc(passportRef, passportData);

  await addActivityLog(user.uid, 'MINT_PASSPORT', 'Passport minted.');
  
  const newPassport = await getPassport(user.uid);
  if (!newPassport) {
    throw new Error("Failed to retrieve newly created passport.");
  }
  return newPassport;
};

export const updatePassport = async (userId: string, data: Partial<Omit<Passport, 'id'>>): Promise<void> => {
  const passportRef = doc(db, passportsCollection, userId);
  await updateDoc(passportRef, data);
};

export const mintTeos = async (userId: string, amount: number): Promise<void> => {
    const passportRef = doc(db, passportsCollection, userId);
    await runTransaction(db, async (transaction) => {
        const passportDoc = await transaction.get(passportRef);
        if (!passportDoc.exists()) {
            throw "Passport does not exist!";
        }
        const currentBalance = passportDoc.data().teoBalance || 0;
        const newBalance = currentBalance + amount;
        transaction.update(passportRef, { teoBalance: newBalance });
    });

    await addActivityLog(userId, 'MINT_TEO', `Minted ${amount.toLocaleString()} ${federationConfig.tokenSymbol}`);
};

export const deletePassport = async (userId: string): Promise<void> => {
    // First, log the deletion event. This is now possible because logs are in a separate collection.
    await addActivityLog(userId, 'DELETE_PASSPORT', 'Passport deleted.');

    // Then, delete the passport document itself.
    const passportRef = doc(db, passportsCollection, userId);
    await deleteDoc(passportRef);
};

export const getFederationMemberCount = async (): Promise<number> => {
  const passportsRef = collection(db, passportsCollection);
  const passportsSnap = await getDocs(passportsRef);
  return passportsSnap.size;
};
