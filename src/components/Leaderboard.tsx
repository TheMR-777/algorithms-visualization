import React from 'react';
import { Trophy, Timer } from 'lucide-react';
import { cn } from '../lib/utils';

interface LeaderboardEntry {
  name: string;
  position: number;
  steps?: number;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  title?: string;
  totalAlgorithms: number;
}

const medals = ['🥇', '🥈', '🥉'];
const positionStyles = [
  'bg-gradient-to-r from-amber-400/15 to-amber-400/5 border-amber-400/25 text-amber-200',
  'bg-gradient-to-r from-slate-300/10 to-slate-300/5 border-slate-400/20 text-slate-300',
  'bg-gradient-to-r from-orange-400/10 to-orange-400/5 border-orange-500/20 text-orange-300',
];

export const Leaderboard: React.FC<LeaderboardProps> = ({
  entries,
  title = 'Race Results',
  totalAlgorithms,
}) => {
  const progress = entries.length / totalAlgorithms;
  const allFinished = entries.length === totalAlgorithms;

  return (
    <div className={cn(
      'bg-slate-900/40 rounded-2xl border backdrop-blur-sm overflow-hidden transition-all duration-700',
      allFinished
        ? 'border-emerald-500/15 shadow-[0_0_30px_rgba(52,211,153,0.04)]'
        : 'border-slate-800/40'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-500',
            entries.length > 0
              ? 'bg-amber-400/15'
              : 'bg-slate-800/40'
          )}>
            <Trophy
              size={14}
              className={cn(
                'transition-colors duration-500',
                entries.length > 0 ? 'text-amber-400' : 'text-slate-600'
              )}
            />
          </div>
          <div>
            <h3 className="text-slate-300 font-medium text-xs tracking-wider uppercase">{title}</h3>
            <p className="text-[10px] text-slate-600">
              {entries.length === 0
                ? 'Press Start to begin the race'
                : allFinished
                ? 'All algorithms finished!'
                : `${entries.length}/${totalAlgorithms} finished`}
            </p>
          </div>
        </div>
        {entries.length > 0 && (
          <div className="flex items-center gap-1.5 text-slate-600">
            <Timer size={11} />
            <span className="text-[10px] font-mono">
              {entries.length}/{totalAlgorithms}
            </span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-[2px] bg-slate-800/40 mx-4 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700 ease-out',
            allFinished
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
              : 'bg-gradient-to-r from-rose-500 to-amber-400'
          )}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Entries */}
      {entries.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-4 pt-3">
          {entries.map((entry, idx) => (
            <div
              key={entry.name}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition-all duration-500',
                idx < 3
                  ? positionStyles[idx]
                  : 'bg-slate-800/15 border-slate-800/25 text-slate-500'
              )}
              style={{
                animationDelay: `${idx * 80}ms`,
                animation: 'fadeSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
              }}
            >
              <span className="text-sm leading-none">
                {idx < 3 ? medals[idx] : <span className="font-mono text-[10px] text-slate-600">#{entry.position}</span>}
              </span>
              <span className="font-medium whitespace-nowrap">{entry.name}</span>
              {entry.steps !== undefined && (
                <span className="font-mono text-[10px] opacity-40 tabular-nums">
                  {entry.steps.toLocaleString()}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
