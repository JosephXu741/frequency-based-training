import React, { useState } from 'react';
import { X, Plus, Trash2, RotateCcw, SlidersHorizontal } from 'lucide-react';
import type { MuscleGroup } from '../types';


interface ManageGroupsModalProps {
  isOpen: boolean;
  onClose: () => void;
  muscleGroups: MuscleGroup[];
  onAddGroup: (name: string, frequencyDays: number) => Promise<void>;
  onUpdateGroup: (group: MuscleGroup) => Promise<void>;
  onDeleteGroup: (id: string) => Promise<void>;
  onResetDefaults: () => Promise<void>;
}

export const ManageGroupsModal: React.FC<ManageGroupsModalProps> = ({
  isOpen,
  onClose,
  muscleGroups,
  onAddGroup,
  onUpdateGroup,
  onDeleteGroup,
  onResetDefaults,
}) => {
  const [newName, setNewName] = useState('');
  const [newDays, setNewDays] = useState(4);
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsAdding(true);
    try {
      await onAddGroup(newName.trim(), Number(newDays) || 4);
      setNewName('');
      setNewDays(4);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="manage-groups-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h2 id="manage-groups-title" className="text-base font-bold text-white m-0">
                Muscle Groups & Frequencies
              </h2>
              <p className="text-xs text-zinc-400 m-0">
                Configure your split targets in days
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

        {/* Form to Add New Muscle Group */}
        <form onSubmit={handleAdd} className="p-4 bg-zinc-950/40 border-b border-zinc-800">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
            Add New Muscle Group
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. Forearms, Traps, Abs"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              required
            />
            <div className="flex items-center gap-1 bg-zinc-800 border border-zinc-700 rounded-xl px-2.5 py-1.5 shrink-0">
              <span className="text-xs text-zinc-400">Every</span>
              <input
                type="number"
                min="1"
                max="30"
                value={newDays}
                onChange={(e) => setNewDays(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-12 bg-transparent text-center font-bold text-amber-400 focus:outline-none"
              />
              <span className="text-xs text-zinc-400">days</span>
            </div>
            <button
              type="submit"
              disabled={isAdding || !newName.trim()}
              className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold disabled:opacity-50 transition-all shrink-0 active:scale-95"
              title="Add Group"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </form>

        {/* Existing Groups List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
            Current Muscle Groups ({muscleGroups.length})
          </label>
          {muscleGroups.map((group) => (
            <div
              key={group.id}
              className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/60 gap-2"
            >
              <div className="font-semibold text-sm text-zinc-100 truncate flex-1">
                {group.name}
              </div>

              {/* Editable frequency input */}
              <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-700/80 rounded-lg px-2 py-1 shrink-0">
                <span className="text-xs text-zinc-400">Every</span>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={group.frequencyDays}
                  onChange={(e) => {
                    const days = Math.max(1, parseInt(e.target.value) || 1);
                    onUpdateGroup({ ...group, frequencyDays: days });
                  }}
                  className="w-8 text-center text-sm font-bold text-amber-400 bg-transparent focus:outline-none"
                />
                <span className="text-xs text-zinc-400">d</span>
              </div>

              <button
                onClick={() => onDeleteGroup(group.id)}
                className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
                title="Delete group"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
          <button
            onClick={() => {
              if (window.confirm('Reset all muscle groups to default split recommendations?')) {
                onResetDefaults();
              }
            }}
            className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to defaults</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
