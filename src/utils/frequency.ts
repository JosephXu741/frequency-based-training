import type { MuscleGroup, MuscleGroupWithStatus, UrgencyStatus } from '../types';

export const DEFAULT_MUSCLE_GROUPS: Omit<MuscleGroup, 'id'>[] = [
  { name: 'Chest (Press / Fly)', frequencyDays: 4, lastTrainedAt: Date.now() - 5 * 86400000 },
  { name: 'Lats & Upper Back', frequencyDays: 4, lastTrainedAt: Date.now() - 3 * 86400000 },
  { name: 'Quads', frequencyDays: 5, lastTrainedAt: Date.now() - 6 * 86400000 },
  { name: 'Hamstrings & Glutes', frequencyDays: 5, lastTrainedAt: Date.now() - 2 * 86400000 },
  { name: 'Side & Rear Delts', frequencyDays: 3, lastTrainedAt: Date.now() - 4 * 86400000 },
  { name: 'Triceps', frequencyDays: 4, lastTrainedAt: Date.now() - 1 * 86400000 },
  { name: 'Biceps', frequencyDays: 4, lastTrainedAt: Date.now() - 4 * 86400000 },
  { name: 'Calves & Core', frequencyDays: 3, lastTrainedAt: null },
];

export function computeMuscleStatus(
  group: MuscleGroup,
  now: number = Date.now()
): MuscleGroupWithStatus {
  if (!group.lastTrainedAt) {
    return {
      ...group,
      daysSinceLastTrained: null,
      daysRemaining: -999,
      status: 'never',
      statusText: 'Never trained',
    };
  }

  const msSince = now - group.lastTrainedAt;
  const daysSince = msSince / (1000 * 60 * 60 * 24);
  const daysRemaining = group.frequencyDays - daysSince;

  let status: UrgencyStatus;
  let statusText: string;

  if (daysRemaining < 0) {
    status = 'overdue';
    const overdueDays = Math.ceil(Math.abs(daysRemaining));
    statusText = overdueDays === 1 ? '1 day overdue' : `${overdueDays} days overdue`;
  } else if (daysRemaining <= 1) {
    status = 'due_today';
    const hoursLeft = Math.max(1, Math.round(daysRemaining * 24));
    statusText = hoursLeft <= 2 ? 'Due now' : `Due in ~${hoursLeft}h`;
  } else {
    status = 'upcoming';
    const daysLeft = Math.ceil(daysRemaining);
    statusText = `${daysLeft} days left`;
  }

  return {
    ...group,
    daysSinceLastTrained: daysSince,
    daysRemaining,
    status,
    statusText,
  };
}

export function sortMuscleGroupsByUrgency(
  groups: MuscleGroupWithStatus[]
): MuscleGroupWithStatus[] {
  return [...groups].sort((a, b) => a.daysRemaining - b.daysRemaining);
}

export function formatTimeAgo(timestamp: number | null, now: number = Date.now()): string {
  if (!timestamp) return 'Never';
  const diffHours = (now - timestamp) / (1000 * 60 * 60);
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}
