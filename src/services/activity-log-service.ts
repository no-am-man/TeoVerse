'use server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

export type ActivityType = 
  | 'MINT_TEO'
  | 'ADD_PHYSICAL_ASSET'
  | 'REMOVE_PHYSICAL_ASSET'
  | 'MINT_IP_TOKEN'
  | 'BURN_IP_TOKEN';

export interface ActivityLog {
  id: string;
  userId: string;
  type: ActivityType;
  description: string;
  createdAt: any; // Firestore Timestamp
}

const activityLogsCollection = 'activity_logs';

/**
 * Adds a new activity log entry for a user.
 * @param userId The ID of the user performing the action.
 * @param type The type of activity.
 * @param description A description of the activity.
 */
export const addActivityLog = async (userId: string, type: ActivityType, description: string): Promise<void> => {
  try {
    await addDoc(collection(db, activityLogsCollection), {
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
 * @param userId The ID of the user.
 * @param count The number of recent activities to fetch.
 * @returns A promise that resolves to an array of activity logs.
 */
export const getRecentActivity = async (userId: string, count: number = 5): Promise<ActivityLog[]> => {
  const logsRef = collection(db, activityLogsCollection);
  const q = query(
    logsRef,
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(count)
  );

  const querySnapshot = await getDocs(q);
  const activities: ActivityLog[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    activities.push({
      id: doc.id,
      userId: data.userId,
      type: data.type,
      description: data.description,
      createdAt: data.createdAt,
    });
  });

  return activities;
};
