import { describe, it, expect } from 'vitest';
import {
  computeMuscleStatus,
  sortMuscleGroupsByUrgency,
  formatTimeAgo,
} from './frequency';
import type { MuscleGroup } from '../types';

describe('computeMuscleStatus', () => {
  const now = 1700000000000;
  const ONE_DAY_MS = 86400000;

  it('marks muscle group as never trained when lastTrainedAt is null', () => {
    const group: MuscleGroup = {
      id: '1',
      name: 'Calves',
      frequencyDays: 3,
      lastTrainedAt: null,
    };
    const status = computeMuscleStatus(group, now);
    expect(status.status).toBe('never');
    expect(status.statusText).toBe('Never trained');
    expect(status.daysRemaining).toBe(-999);
  });

  it('marks muscle group as overdue when elapsed days exceed frequency', () => {
    const group: MuscleGroup = {
      id: '2',
      name: 'Chest',
      frequencyDays: 4,
      lastTrainedAt: now - 6 * ONE_DAY_MS, // 6 days ago, target is 4
    };
    const status = computeMuscleStatus(group, now);
    expect(status.status).toBe('overdue');
    expect(status.statusText).toBe('2 days overdue');
    expect(status.daysRemaining).toBeCloseTo(-2, 0);
  });

  it('marks muscle group as due today when remaining time is <= 1 day', () => {
    const group: MuscleGroup = {
      id: '3',
      name: 'Back',
      frequencyDays: 4,
      lastTrainedAt: now - 3.5 * ONE_DAY_MS, // 3.5 days ago, 0.5 days left
    };
    const status = computeMuscleStatus(group, now);
    expect(status.status).toBe('due_today');
    expect(status.statusText).toContain('Due');
  });

  it('marks muscle group as upcoming when plenty of time remains', () => {
    const group: MuscleGroup = {
      id: '4',
      name: 'Legs',
      frequencyDays: 5,
      lastTrainedAt: now - 1 * ONE_DAY_MS, // 1 day ago, 4 days left
    };
    const status = computeMuscleStatus(group, now);
    expect(status.status).toBe('upcoming');
    expect(status.statusText).toBe('4 days left');
  });
});

describe('sortMuscleGroupsByUrgency', () => {
  const now = 1700000000000;
  const ONE_DAY_MS = 86400000;

  it('sorts groups with most overdue first', () => {
    const groups: MuscleGroup[] = [
      { id: '1', name: 'Triceps', frequencyDays: 4, lastTrainedAt: now - 2 * ONE_DAY_MS }, // upcoming (+2d)
      { id: '2', name: 'Chest', frequencyDays: 4, lastTrainedAt: now - 7 * ONE_DAY_MS }, // 3d overdue (-3d)
      { id: '3', name: 'Quads', frequencyDays: 4, lastTrainedAt: now - 5 * ONE_DAY_MS }, // 1d overdue (-1d)
      { id: '4', name: 'Delts', frequencyDays: 3, lastTrainedAt: null }, // never (-999)
    ];

    const computed = groups.map((g) => computeMuscleStatus(g, now));
    const sorted = sortMuscleGroupsByUrgency(computed);

    expect(sorted.map((s) => s.name)).toEqual(['Delts', 'Chest', 'Quads', 'Triceps']);
  });
});

describe('formatTimeAgo', () => {
  const now = 1700000000000;
  const ONE_DAY_MS = 86400000;

  it('formats correctly', () => {
    expect(formatTimeAgo(null, now)).toBe('Never');
    expect(formatTimeAgo(now - 1000 * 60 * 10, now)).toBe('Just now');
    expect(formatTimeAgo(now - 1000 * 60 * 60 * 5, now)).toBe('5h ago');
    expect(formatTimeAgo(now - ONE_DAY_MS * 1.2, now)).toBe('Yesterday');
    expect(formatTimeAgo(now - ONE_DAY_MS * 4, now)).toBe('4 days ago');
  });
});
