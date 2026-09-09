import React from 'react';
import { Dumbbell, LogIn, LogOut, Settings, History } from 'lucide-react';
import { useAuth } from '../context/useAuth';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenHistory: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings, onOpenHistory }) => {
  const { user, isConfigured, signInWithGoogle, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80 px-4 py-3">
      <div className="max-w-xl mx-auto flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white m-0 leading-tight">
              Frequency<span className="text-amber-400">Gym</span>
            </h1>
            <p className="text-[11px] text-zinc-400 font-medium leading-none mt-0.5">
              Targeted Countdown Splits
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenHistory}
            className="p-2.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 active:scale-95 transition-all"
            title="Workout History"
            aria-label="Workout History"
          >
            <History className="w-5 h-5" />
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 active:scale-95 transition-all"
            title="Manage Muscle Groups"
            aria-label="Manage Muscle Groups"
          >
            <Settings className="w-5 h-5" />
          </button>

          {user ? (
            <div className="flex items-center gap-2 pl-1">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-8 h-8 rounded-full border border-zinc-700 object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center">
                  {user.displayName?.[0] || 'U'}
                </div>
              )}
              <button
                onClick={signOut}
                className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800/60 rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-all active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5 text-amber-400" />
              <span>{isConfigured ? 'Sign in' : 'Local Mode'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
