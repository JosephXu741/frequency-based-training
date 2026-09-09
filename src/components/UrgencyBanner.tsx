import React from 'react';
import { AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import type { MuscleGroupWithStatus } from '../types';

interface UrgencyBannerProps {
  groups: MuscleGroupWithStatus[];
}

export const UrgencyBanner: React.FC<UrgencyBannerProps> = ({ groups }) => {
  const overdueCount = groups.filter((g) => g.status === 'overdue' || g.status === 'never').length;
  const dueTodayCount = groups.filter((g) => g.status === 'due_today').length;

  if (groups.length === 0) {
    return null;
  }

  return (
    <section className="px-4 pt-4 pb-2 max-w-xl mx-auto">
      {overdueCount > 0 ? (
        <div className="bg-gradient-to-r from-red-950/50 via-zinc-900 to-zinc-900 border border-red-500/30 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-red-200 m-0">
                {overdueCount} {overdueCount === 1 ? 'group is' : 'groups are'} overdue!
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {dueTodayCount > 0
                  ? `Plus ${dueTodayCount} due today. Time to hit the gym!`
                  : 'Prioritize these in your workout today.'}
              </p>
            </div>
          </div>
        </div>
      ) : dueTodayCount > 0 ? (
        <div className="bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-900 border border-amber-500/30 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-amber-200 m-0">
                {dueTodayCount} {dueTodayCount === 1 ? 'group' : 'groups'} due today
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                No groups overdue. Stay on schedule!
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900 border border-emerald-500/30 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-emerald-200 m-0">
                All muscle groups on track!
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Great job maintaining your recovery cycles.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
