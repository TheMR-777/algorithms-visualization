import { BarChart3, RotateCcw } from 'lucide-react';

export interface WinRecord {
  [algoName: string]: number;
}

interface StatsPanelProps {
  wins: WinRecord;
  totalRaces: number;
  onReset: () => void;
}

export function StatsPanel({ wins, totalRaces, onReset }: StatsPanelProps) {
  const entries = Object.entries(wins)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  const maxWins = entries.length > 0 ? entries[0][1] : 0;

  if (totalRaces === 0) {
    return (
      <div className="bg-slate-900/40 rounded-2xl border border-slate-800/40 backdrop-blur-sm overflow-hidden flex items-center justify-center">
        <div className="text-center py-6 px-4">
          <BarChart3 size={20} className="text-slate-700 mx-auto mb-2" />
          <p className="text-slate-600 text-xs">Session stats will appear here</p>
          <p className="text-slate-700 text-[10px] mt-1">after your first race</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/40 rounded-2xl border border-slate-800/40 backdrop-blur-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/30">
        <div className="flex items-center gap-2.5">
          <BarChart3 size={14} className="text-indigo-400" />
          <h3 className="text-slate-400 font-medium text-xs tracking-wider uppercase">
            Session Stats
          </h3>
          <span className="text-[9px] font-mono text-slate-600 bg-slate-800/50 px-1.5 py-0.5 rounded">
            {totalRaces} race{totalRaces !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          onClick={onReset}
          className="text-slate-600 hover:text-slate-400 transition-colors p-1 rounded-lg hover:bg-slate-800/40"
          title="Reset stats"
        >
          <RotateCcw size={12} />
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="px-5 py-4">
          <p className="text-slate-600 text-xs italic">No races completed yet…</p>
        </div>
      ) : (
        <div className="p-4 space-y-2.5">
          {entries.map(([name, count], idx) => {
            const pct = maxWins > 0 ? (count / maxWins) * 100 : 0;
            const barColors = idx === 0
              ? 'from-amber-400/60 to-orange-400/40'
              : idx === 1
              ? 'from-slate-300/30 to-slate-400/20'
              : idx === 2
              ? 'from-orange-500/30 to-amber-500/20'
              : 'from-slate-600/30 to-slate-700/20';

            return (
              <div key={name} className="group">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400 font-medium flex items-center gap-2">
                    {idx === 0 && <span className="text-sm">🥇</span>}
                    {idx === 1 && <span className="text-sm">🥈</span>}
                    {idx === 2 && <span className="text-sm">🥉</span>}
                    {name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 tabular-nums">
                    {count} win{count !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-800/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${barColors} transition-all duration-1000 ease-out`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
