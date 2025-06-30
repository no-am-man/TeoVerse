'use server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

export type ActivityType = 
  | 'MINT_PASSPORT'
  | 'MINT_TEO'
  | 'ADD_PHYSICAL_ASSET'
  | 'REMOVE_PHYSICAL_ASSET'
  | 'MINT_IP_TOKEN'
  | 'BURN_IP_TOKEN'
  | 'DELETE_PASSPORT';

export interface ActivityLog {
  id: string;
  userId: string;
  type: ActivityType;
  description: string;
  createdAt: number; // Firestore Timestamp converted to milliseconds
}

const ACTIVITY_LOGS_COLLECTION = 'activity_logs';

/**
 * Adds a new activity log entry for a user.
 * @param userId The ID of the user performing the action.
 * @param type The type of activity.
 * @param description A description of the activity.
 */
export const addActivityLog = async (userId: string, type: ActivityType, description: string): Promise<void> => {
  try {
    const logsRef = collection(db, ACTIVITY_LOGS_COLLECTION);
    await addDoc(logsRef, {
      userId,
      type,
      description,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error adding activity log:", error);
    // Depending on requirements, you might want to re-throw or handle this differently
  }
};

/**
 * Fetches the most recent activity logs for a user.
 * This function fetches all logs for a user and sorts/limits them in-code to avoid needing a composite index.
 * @param userId The ID of the user.
 * @param count The number of recent activities to fetch.
 * @returns A promise that resolves to an array of activity logs.
 */
export const getRecentActivity = async (userId: string, count: number = 5): Promise<ActivityLog[]> => {
  const logsRef = collection(db, ACTIVITY_LOGS_COLLECTION);
  // Query only by userId to avoid needing a composite index for sorting.
  const q = query(
    logsRef,
    where("userId", "==", userId)
  );

  const querySnapshot = await getDocs(q);
  const activities: ActivityLog[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    // Ensure createdAt field exists before processing
    if (data.createdAt) {
      activities.push({
        id: doc.id,
        userId: data.userId,
        type: data.type,
        description: data.description,
        createdAt: data.createdAt.toDate().getTime(),
      });
    }
  });

  // Sort activities by date descending in the code.
  activities.sort((a, b) => b.createdAt - a.createdAt);

  // Return the specified number of recent activities.
  return activities.slice(0, count);
};
