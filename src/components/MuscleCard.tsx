import React from 'react';
import { Check, Flame, AlertCircle, Clock } from 'lucide-react';
import type { MuscleGroupWithStatus } from '../types';
import { formatTimeAgo } from '../utils/frequency';

interface MuscleCardProps {
  group: MuscleGroupWithStatus;
  onQuickHit: (groupId: string) => void;
}

export const MuscleCard: React.FC<MuscleCardProps> = ({ group, onQuickHit }) => {
  const isOverdue = group.status === 'overdue' || group.status === 'never';
  const isDueToday = group.status === 'due_today';

  // Calculate percentage of frequency cycle elapsed (0% to 100%)
  const percentElapsed = group.daysSinceLastTrained !== null
    ? Math.min(100, Math.round((group.daysSinceLastTrained / group.frequencyDays) * 100))
    : 100;

  return (
    <article
      className={`relative overflow-hidden rounded-2xl p-4 transition-all border ${
        isOverdue
          ? 'bg-zinc-900/90 border-red-500/40 shadow-[0_0_15px_-3px_rgba(239,68,68,0.15)]'
          : isDueToday
          ? 'bg-zinc-900/90 border-amber-500/40 shadow-[0_0_15px_-3px_rgba(245,158,11,0.1)]'
          : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700'
      }`}
    >
      {/* Top row: Name and Status Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-base font-bold text-white truncate tracking-tight">
              {group.name}
            </h3>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1.5">
            <span>Every {group.frequencyDays} days</span>
            <span className="text-zinc-600">•</span>
            <span>Last: {formatTimeAgo(group.lastTrainedAt)}</span>
          </p>
        </div>

        {/* Urgency Pill Badge */}
        <div
          className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
            isOverdue
              ? 'bg-red-500/20 text-red-300 border-red-500/40'
              : isDueToday
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
          }`}
        >
          {isOverdue ? (
            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
          ) : isDueToday ? (
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Flame className="w-3.5 h-3.5 text-emerald-400" />
          )}
          <span>{group.statusText}</span>
        </div>
      </div>

      {/* Progress / Timeline Bar */}
      <div className="mt-3.5 mb-3">
        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isOverdue
                ? 'bg-gradient-to-r from-red-600 to-red-500'
                : isDueToday
                ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
            }`}
            style={{ width: `${percentElapsed}%` }}
          />
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] font-medium text-zinc-400">
          {group.lastTrainedAt
            ? `${group.daysSinceLastTrained?.toFixed(1)}d since workout`
            : 'Not yet recorded'}
        </span>

        <button
          onClick={() => onQuickHit(group.id)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95 ${
            isOverdue
              ? 'bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30'
              : isDueToday
              ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30'
              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
          }`}
          title={`Log ${group.name} as trained today`}
        >
          <Check className="w-3.5 h-3.5" />
          <span>Reset Timer</span>
        </button>
      </div>
    </article>
  );
};
