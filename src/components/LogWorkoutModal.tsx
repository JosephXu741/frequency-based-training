import React, { useState } from 'react';
import { X, Check, Dumbbell, Sparkles, Calendar } from 'lucide-react';
import type { MuscleGroupWithStatus } from '../types';

interface LogWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  muscleGroups: MuscleGroupWithStatus[];
  onSaveWorkout: (selectedIds: string[], trainedAt: number, notes?: string) => Promise<void>;
}

export const LogWorkoutModal: React.FC<LogWorkoutModalProps> = ({
  isOpen,
  onClose,
  muscleGroups,
  onSaveWorkout,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Quick Presets
  const selectAllOverdue = () => {
    const overdueIds = muscleGroups
      .filter((g) => g.status === 'overdue' || g.status === 'never' || g.status === 'due_today')
      .map((g) => g.id);
    setSelectedIds(overdueIds);
  };

  const selectByKeyword = (keywords: string[]) => {
    const ids = muscleGroups
      .filter((g) =>
        keywords.some((k) => g.name.toLowerCase().includes(k.toLowerCase()))
      )
      .map((g) => g.id);
    setSelectedIds(ids);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;
    setIsSubmitting(true);
    try {
      await onSaveWorkout(selectedIds, Date.now(), notes.trim() || undefined);
      setSelectedIds([]);
      setNotes('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="log-workout-title"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <h2 id="log-workout-title" className="text-base font-bold text-white m-0">
                Log Workout
              </h2>
              <p className="text-xs text-zinc-400 m-0">
                Tap muscles you trained to reset their countdowns
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Quick Preset Buttons */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Quick Split Presets
              </span>
              <button
                type="button"
                onClick={selectAllOverdue}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                Select All Due / Overdue
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => selectByKeyword(['Chest', 'Triceps', 'Delts', 'Shoulder'])}
                className="px-2.5 py-1 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 font-medium active:scale-95 transition-all"
              >
                Push
              </button>
              <button
                type="button"
                onClick={() => selectByKeyword(['Back', 'Lats', 'Biceps'])}
                className="px-2.5 py-1 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 font-medium active:scale-95 transition-all"
              >
                Pull
              </button>
              <button
                type="button"
                onClick={() => selectByKeyword(['Quads', 'Hamstring', 'Glute', 'Calv'])}
                className="px-2.5 py-1 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 font-medium active:scale-95 transition-all"
              >
                Legs
              </button>
              <button
                type="button"
                onClick={() => selectByKeyword(['Chest', 'Back', 'Lats', 'Delts', 'Biceps', 'Triceps'])}
                className="px-2.5 py-1 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 font-medium active:scale-95 transition-all"
              >
                Upper
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="px-2.5 py-1 text-xs rounded-lg bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 border border-zinc-800 font-medium transition-all"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Muscle Selection Chips */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
              Select Muscle Groups ({selectedIds.length} selected)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {muscleGroups.map((group) => {
                const isSelected = selectedIds.includes(group.id);
                const isOverdue = group.status === 'overdue' || group.status === 'never';
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => toggleSelect(group.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all active:scale-98 ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500 text-white font-medium shadow-md shadow-amber-500/10'
                        : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-300 hover:border-zinc-600'
                    }`}
                  >
                    <div className="min-w-0 pr-1">
                      <div className="text-sm font-semibold truncate">{group.name}</div>
                      <div className="text-[11px] text-zinc-400 truncate">
                        {isOverdue ? (
                          <span className="text-red-400 font-medium">{group.statusText}</span>
                        ) : (
                          <span>{group.statusText}</span>
                        )}
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? 'bg-amber-500 border-amber-500 text-black'
                          : 'border-zinc-600 bg-zinc-800/80'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label
              htmlFor="workout-notes"
              className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5"
            >
              Session Notes (Optional)
            </label>
            <input
              id="workout-notes"
              type="text"
              placeholder="e.g. Bench 90kg x 6, intense pump..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex items-center gap-3">
          <div className="flex items-center text-xs text-zinc-400 gap-1.5">
            <Calendar className="w-4 h-4 text-zinc-500" />
            <span>Date: Today (Now)</span>
          </div>
          <button
            type="button"
            disabled={selectedIds.length === 0 || isSubmitting}
            onClick={handleSave}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all shadow-lg active:scale-98 ${
              selectedIds.length === 0 || isSubmitting
                ? 'bg-zinc-800 text-zinc-500 border border-zinc-800 cursor-not-allowed'
                : 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
            }`}
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>
              {isSubmitting
                ? 'Recording...'
                : `Log Workout (${selectedIds.length} muscles)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
