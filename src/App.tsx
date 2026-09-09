import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, RefreshCw, Dumbbell } from 'lucide-react';
import { useAuth } from './context/useAuth';
import { Header } from './components/Header';
import { UrgencyBanner } from './components/UrgencyBanner';
import { MuscleCard } from './components/MuscleCard';
import { LogWorkoutModal } from './components/LogWorkoutModal';
import { ManageGroupsModal } from './components/ManageGroupsModal';
import { WorkoutHistoryModal } from './components/WorkoutHistoryModal';
import type { MuscleGroup, Workout, MuscleGroupWithStatus } from './types';
import {
  computeMuscleStatus,
  sortMuscleGroupsByUrgency,
  DEFAULT_MUSCLE_GROUPS,
} from './utils/frequency';
import {
  fetchMuscleGroups,
  saveMuscleGroup,
  removeMuscleGroup,
  fetchWorkouts,
  recordWorkout,
} from './lib/storage';

type FilterTab = 'all' | 'overdue' | 'due_today' | 'upcoming';

export const App: React.FC = () => {
  const { user } = useAuth();
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(() => Date.now());

  // Modals state
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);

  // Update timer every minute for live countdown precision
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Helper to refresh data after user actions
  const refreshData = useCallback(async () => {
    const [loadedGroups, loadedWorkouts] = await Promise.all([
      fetchMuscleGroups(user?.uid),
      fetchWorkouts(user?.uid),
    ]);
    setMuscleGroups(loadedGroups);
    setWorkouts(loadedWorkouts);
  }, [user?.uid]);

  // Load data on mount or when user changes
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [loadedGroups, loadedWorkouts] = await Promise.all([
          fetchMuscleGroups(user?.uid),
          fetchWorkouts(user?.uid),
        ]);
        if (isMounted) {
          setMuscleGroups(loadedGroups);
          setWorkouts(loadedWorkouts);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [user?.uid]);


  // Compute live urgency status for each muscle group
  const groupsWithStatus: MuscleGroupWithStatus[] = useMemo(() => {
    const computed = muscleGroups.map((group) => computeMuscleStatus(group, currentTime));
    return sortMuscleGroupsByUrgency(computed);
  }, [muscleGroups, currentTime]);


  // Counts for filter badges
  const overdueCount = useMemo(
    () => groupsWithStatus.filter((g) => g.status === 'overdue' || g.status === 'never').length,
    [groupsWithStatus]
  );
  const dueTodayCount = useMemo(
    () => groupsWithStatus.filter((g) => g.status === 'due_today').length,
    [groupsWithStatus]
  );

  // Filtered list
  const displayedGroups = useMemo(() => {
    if (activeFilter === 'overdue') {
      return groupsWithStatus.filter((g) => g.status === 'overdue' || g.status === 'never');
    }
    if (activeFilter === 'due_today') {
      return groupsWithStatus.filter((g) => g.status === 'due_today');
    }
    if (activeFilter === 'upcoming') {
      return groupsWithStatus.filter((g) => g.status === 'upcoming');
    }
    return groupsWithStatus;
  }, [groupsWithStatus, activeFilter]);

  // Quick reset for single muscle group
  const handleQuickHit = async (groupId: string) => {
    const group = muscleGroups.find((g) => g.id === groupId);
    if (!group) return;

    const newWorkout: Workout = {
      id: `w-${Date.now()}`,
      userId: user?.uid,
      trainedAt: Date.now(),
      muscleGroupIds: [groupId],
      muscleGroupNames: [group.name],
      notes: 'Quick single-group reset',
    };

    await recordWorkout(newWorkout, user?.uid);
    await refreshData();
  };

  // Log full workout
  const handleSaveWorkout = async (
    selectedIds: string[],
    trainedAt: number,
    notes?: string
  ) => {
    const names = selectedIds
      .map((id) => muscleGroups.find((g) => g.id === id)?.name)
      .filter(Boolean) as string[];

    const newWorkout: Workout = {
      id: `w-${Date.now()}`,
      userId: user?.uid,
      trainedAt,
      muscleGroupIds: selectedIds,
      muscleGroupNames: names,
      notes,
    };

    await recordWorkout(newWorkout, user?.uid);
    await refreshData();
  };

  // Group Management
  const handleAddGroup = async (name: string, frequencyDays: number) => {
    const newGroup: MuscleGroup = {
      id: `custom-${Date.now()}`,
      userId: user?.uid,
      name,
      frequencyDays,
      lastTrainedAt: null,
    };
    await saveMuscleGroup(newGroup, user?.uid);
    await refreshData();
  };

  const handleUpdateGroup = async (group: MuscleGroup) => {
    await saveMuscleGroup(group, user?.uid);
    await refreshData();
  };

  const handleDeleteGroup = async (id: string) => {
    await removeMuscleGroup(id, user?.uid);
    await refreshData();
  };

  const handleResetDefaults = async () => {
    localStorage.removeItem('fbt_muscle_groups');
    const defaults: MuscleGroup[] = DEFAULT_MUSCLE_GROUPS.map((g, idx) => ({
      ...g,
      id: `default-${idx + 1}`,
      userId: user?.uid,
    }));
    for (const d of defaults) {
      await saveMuscleGroup(d, user?.uid);
    }
    await refreshData();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-amber-500 selection:text-black pb-28">
      {/* Top App Header */}
      <Header
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
      />

      {/* Main App Container */}
      <main className="w-full max-w-xl mx-auto flex-1 flex flex-col">
        {/* Urgency Motivation Banner */}
        <UrgencyBanner groups={groupsWithStatus} />

        {/* Filter Navigation Bar */}
        <div className="px-4 py-2 sticky top-[57px] z-20 bg-zinc-950/90 backdrop-blur-md">
          <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
            <button
              onClick={() => setActiveFilter('all')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                activeFilter === 'all'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All ({groupsWithStatus.length})
            </button>

            <button
              onClick={() => setActiveFilter('overdue')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                activeFilter === 'overdue'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                  : 'text-zinc-400 hover:text-red-400'
              }`}
            >
              <span>🚨 Overdue</span>
              {overdueCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-red-500 text-black text-[10px] font-bold flex items-center justify-center">
                  {overdueCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveFilter('due_today')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                activeFilter === 'due_today'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-zinc-400 hover:text-amber-400'
              }`}
            >
              <span>Due Today</span>
              {dueTodayCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-black text-[10px] font-bold flex items-center justify-center">
                  {dueTodayCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveFilter('upcoming')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                activeFilter === 'upcoming'
                  ? 'bg-zinc-800 text-emerald-300 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Upcoming
            </button>
          </div>
        </div>

        {/* Muscle Cards List */}
        <div className="px-4 py-2 space-y-2.5 flex-1">
          {isLoading ? (
            <div className="text-center py-20">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400 mb-2" />
              <p className="text-xs text-zinc-400">Loading muscle groups...</p>
            </div>
          ) : displayedGroups.length === 0 ? (
            <div className="text-center py-16 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6">
              <Dumbbell className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-zinc-300">
                No muscle groups in this filter
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                {activeFilter === 'overdue'
                  ? 'Awesome! You have zero overdue muscle groups.'
                  : 'Try switching filters or add muscle groups in Settings.'}
              </p>
            </div>
          ) : (
            displayedGroups.map((group) => (
              <MuscleCard
                key={group.id}
                group={group}
                onQuickHit={handleQuickHit}
              />
            ))
          )}
        </div>
      </main>

      {/* Floating Bottom Workout Bar for Single-Thumb Mobile Logging */}
      <div className="fixed bottom-0 inset-x-0 z-30 p-4 bg-gradient-to-t from-black via-zinc-950/95 to-transparent pointer-events-none">
        <div className="max-w-xl mx-auto pointer-events-auto">
          <button
            onClick={() => setIsLogModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-black font-extrabold text-base shadow-[0_4px_20px_rgba(245,158,11,0.35)] transition-all"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            <span>+ Log Workout</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      <LogWorkoutModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        muscleGroups={groupsWithStatus}
        onSaveWorkout={handleSaveWorkout}
      />

      <ManageGroupsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        muscleGroups={muscleGroups}
        onAddGroup={handleAddGroup}
        onUpdateGroup={handleUpdateGroup}
        onDeleteGroup={handleDeleteGroup}
        onResetDefaults={handleResetDefaults}
      />

      <WorkoutHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        workouts={workouts}
      />
    </div>
  );
};

export default App;
