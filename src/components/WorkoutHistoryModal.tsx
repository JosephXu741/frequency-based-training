import React from 'react';
import { X, Calendar, Dumbbell, Clock } from 'lucide-react';
import type { Workout } from '../types';

interface WorkoutHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  workouts: Workout[];
}

export const WorkoutHistoryModal: React.FC<WorkoutHistoryModalProps> = ({
  isOpen,
  onClose,
  workouts,
}) => {
  if (!isOpen) return null;

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 id="history-title" className="text-base font-bold text-white m-0">
                Workout History
              </h2>
              <p className="text-xs text-zinc-400 m-0">
                {workouts.length} {workouts.length === 1 ? 'session' : 'sessions'} logged
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Workouts */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {workouts.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto text-zinc-500 mb-3">
                <Dumbbell className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-300">No workouts logged yet</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                Tap "+ Log Workout" at the bottom of the screen to record your training session!
              </p>
            </div>
          ) : (
            workouts.map((workout) => (
              <div
                key={workout.id}
                className="p-3.5 rounded-2xl bg-zinc-800/60 border border-zinc-700/60 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDate(workout.trainedAt)}
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    {workout.muscleGroupNames.length} muscles
                  </span>
                </div>

                {/* Muscle tags */}
                <div className="flex flex-wrap gap-1.5">
                  {workout.muscleGroupNames.map((name, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-700/80 text-zinc-200 text-xs font-medium"
                    >
                      {name}
                    </span>
                  ))}
                </div>

                {workout.notes && (
                  <p className="text-xs text-zinc-400 italic pt-1 border-t border-zinc-700/40">
                    "{workout.notes}"
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
