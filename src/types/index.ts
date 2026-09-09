export interface MuscleGroup {
  id: string;
  userId?: string;
  name: string;
  frequencyDays: number;
  lastTrainedAt: number | null; // Unix timestamp in ms
  notes?: string;
  color?: string;
}

export interface Workout {
  id: string;
  userId?: string;
  trainedAt: number; // Unix timestamp in ms
  muscleGroupIds: string[];
  muscleGroupNames: string[];
  notes?: string;
}

export type UrgencyStatus = 'overdue' | 'due_today' | 'upcoming' | 'never';

export interface MuscleGroupWithStatus extends MuscleGroup {
  daysSinceLastTrained: number | null;
  daysRemaining: number;
  status: UrgencyStatus;
  statusText: string;
}
