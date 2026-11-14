import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import type { MuscleGroup, Workout } from '../types';
import { DEFAULT_MUSCLE_GROUPS } from '../utils/frequency';

// Firestore write promises settle only on server ack, so offline they never
// resolve. The local cache applies writes immediately and syncs later, so
// callers must not await them.
function logWriteError(what: string) {
  return (err: unknown) => console.error(`Error ${what} Firestore:`, err);
}

const LOCAL_STORAGE_KEY_GROUPS = 'fbt_muscle_groups';
const LOCAL_STORAGE_KEY_WORKOUTS = 'fbt_workouts';

function getInitialLocalGroups(): MuscleGroup[] {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY_GROUPS);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // ignore
    }
  }
  // Initialize with defaults
  const defaults: MuscleGroup[] = DEFAULT_MUSCLE_GROUPS.map((g, idx) => ({
    ...g,
    id: `default-${idx + 1}`,
  }));
  localStorage.setItem(LOCAL_STORAGE_KEY_GROUPS, JSON.stringify(defaults));
  return defaults;
}

export async function fetchMuscleGroups(userId?: string | null): Promise<MuscleGroup[]> {
  if (userId && isFirebaseConfigured && db) {
    try {
      const colRef = collection(db, 'users', userId, 'muscle_groups');
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        return snap.docs.map((d) => ({ ...d.data(), id: d.id } as MuscleGroup));
      } else {
        // Seed new user with default muscle groups
        const initial = getInitialLocalGroups();
        const batch = writeBatch(db);
        for (const item of initial) {
          batch.set(doc(colRef, item.id), { ...item, userId });
        }
        batch.commit().catch(logWriteError('seeding muscle groups in'));
        return initial.map((g) => ({ ...g, userId }));
      }
    } catch (err) {
      console.warn('Failed to load from Firestore, falling back to local storage:', err);
    }
  }
  return getInitialLocalGroups();
}

export async function saveMuscleGroup(
  group: MuscleGroup,
  userId?: string | null
): Promise<void> {
  // Save locally first
  const current = getInitialLocalGroups();
  const existingIdx = current.findIndex((g) => g.id === group.id);
  let updated: MuscleGroup[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = group;
  } else {
    updated = [group, ...current];
  }
  localStorage.setItem(LOCAL_STORAGE_KEY_GROUPS, JSON.stringify(updated));

  // Sync to Firestore if authenticated
  if (userId && isFirebaseConfigured && db) {
    setDoc(doc(db, 'users', userId, 'muscle_groups', group.id), {
      ...group,
      userId,
    }).catch(logWriteError('saving muscle group to'));
  }
}

export async function removeMuscleGroup(
  groupId: string,
  userId?: string | null
): Promise<void> {
  const current = getInitialLocalGroups();
  const updated = current.filter((g) => g.id !== groupId);
  localStorage.setItem(LOCAL_STORAGE_KEY_GROUPS, JSON.stringify(updated));

  if (userId && isFirebaseConfigured && db) {
    deleteDoc(doc(db, 'users', userId, 'muscle_groups', groupId)).catch(
      logWriteError('deleting muscle group from')
    );
  }
}

export async function fetchWorkouts(userId?: string | null): Promise<Workout[]> {
  if (userId && isFirebaseConfigured && db) {
    try {
      const colRef = collection(db, 'users', userId, 'workouts');
      const q = query(colRef, orderBy('trainedAt', 'desc'), limit(50));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Workout));
      }
    } catch (err) {
      console.warn('Failed to load workouts from Firestore, using local:', err);
    }
  }

  const saved = localStorage.getItem(LOCAL_STORAGE_KEY_WORKOUTS);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // ignore
    }
  }
  return [];
}

export async function recordWorkout(
  workout: Workout,
  userId?: string | null
): Promise<void> {
  // Update local workouts
  const current = await fetchWorkouts(null);
  const updated = [workout, ...current];
  localStorage.setItem(LOCAL_STORAGE_KEY_WORKOUTS, JSON.stringify(updated));

  // Also update lastTrainedAt on the affected muscle groups
  const groups = getInitialLocalGroups();
  const updatedGroups = groups.map((g) => {
    if (workout.muscleGroupIds.includes(g.id)) {
      return { ...g, lastTrainedAt: workout.trainedAt };
    }
    return g;
  });
  localStorage.setItem(LOCAL_STORAGE_KEY_GROUPS, JSON.stringify(updatedGroups));

  // Sync to Firestore if authenticated
  if (userId && isFirebaseConfigured && db) {
    const batch = writeBatch(db);
    batch.set(doc(db, 'users', userId, 'workouts', workout.id), {
      ...workout,
      userId,
    });
    for (const gid of workout.muscleGroupIds) {
      const g = updatedGroups.find((x) => x.id === gid);
      if (g) {
        batch.set(doc(db, 'users', userId, 'muscle_groups', gid), {
          ...g,
          userId,
        });
      }
    }
    batch.commit().catch(logWriteError('syncing workout to'));
  }
}
