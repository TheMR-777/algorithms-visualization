import React, { useCallback, useMemo } from 'react';
import { GridState, PathGenerator, CellType } from '../lib/pathfinding';
import { cn } from '../lib/utils';
import { Check, CircleDashed, MapPin } from 'lucide-react';
import { useAlgorithmRunner } from '../hooks/useAlgorithmRunner';
import { PATH_META } from '../lib/complexity';
import { audioEngine } from '../lib/audioEngine';

interface PathVisualizerProps {
  name: string;
  generatorFn: (
    rows: number,
    cols: number,
    walls: Set<string>,
    start: [number, number],
    end: [number, number]
  ) => PathGenerator;
  rows: number;
  cols: number;
  walls: Set<string>;
  start: [number, number];
  end: [number, number];
  isPlaying: boolean;
  speed: number;
  onComplete?: (name: string, steps: number) => void;
  resetKey: number;
  index: number;
  position?: number | null;
}

const cellColorMap: Record<CellType, string> = {
  empty: 'bg-slate-800/20',
  wall: 'bg-slate-600/60 rounded-[1px]',
  start: 'bg-emerald-500 shadow-[0_0_6px_rgba(52,211,153,0.4)] rounded-sm',
  end: 'bg-rose-500 shadow-[0_0_6px_rgba(251,113,133,0.4)] rounded-sm',
  visited: 'bg-indigo-500/25',
  path: 'bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.3)]',
  current: 'bg-cyan-400',
};

export const PathVisualizer: React.FC<PathVisualizerProps> = ({
  name,
  generatorFn,
  rows,
  cols,
  walls,
  start,
  end,
  isPlaying,
  speed,
  onComplete,
  resetKey,
  index,
  position,
}) => {
  const wallsKey = useMemo(() => [...walls].sort().join('|'), [walls]);
  const totalCells = rows * cols;

  const createGenerator = useCallback(
    () => generatorFn(rows, cols, walls, start, end),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [generatorFn, rows, cols, wallsKey, start, end]
  );

  const handleComplete = useCallback(
    (steps: number) => onComplete?.(name, steps),
    [onComplete, name]
  );

  const isEarlyComplete = useCallback((s: GridState) => s.pathFound, []);

  // Sound: map visited count to note (more visited = higher pitch)
  const onTick = useCallback(
    (state: GridState) => {
      const progress = (state.visitedCount ?? 0) / totalCells;
      audioEngine.playNote(progress, 'path');
    },
    [totalCells]
  );

  const { state, isFinished, stepCount } = useAlgorithmRunner<GridState>({
    createGenerator,
    isPlaying,
    speed,
    speedMultiplier: 1.5,
    onComplete: handleComplete,
    onTick,
    isEarlyComplete,
    resetDeps: [generatorFn, rows, cols, wallsKey, start, end, resetKey],
  });

  const displayGrid: CellType[][] = useMemo(() => {
    if (state?.grid) return state.grid;
    const g: CellType[][] = [];
    for (let r = 0; r < rows; r++) {
      const row: CellType[] = [];
      for (let c = 0; c < cols; c++) {
        if (r === start[0] && c === start[1]) row.push('start');
        else if (r === end[0] && c === end[1]) row.push('end');
        else if (walls.has(`${r},${c}`)) row.push('wall');
        else row.push('empty');
      }
      g.push(row);
    }
    return g;
  }, [state?.grid, rows, cols, start, end, walls]);

  const pathFound = state?.pathFound ?? false;
  const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : null;
  const meta = PATH_META[name];
  const isRunning = isPlaying && !isFinished && stepCount > 0;

  return (
    <div
      className={cn(
        'algo-card flex flex-col bg-slate-900/40 rounded-2xl border backdrop-blur-sm transition-all duration-700 group relative overflow-hidden',
        isFinished && pathFound
          ? 'border-emerald-500/20 shadow-[0_0_50px_rgba(52,211,153,0.06)]'
          : isRunning
          ? 'border-slate-700/50 shadow-[0_0_30px_rgba(244,63,94,0.04)]'
          : 'border-slate-800/40 hover:border-slate-700/40'
      )}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className={cn(
        'absolute top-0 left-0 right-0 h-[1px] transition-all duration-1000',
        isFinished && pathFound
          ? 'bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent'
          : isRunning
          ? 'bg-gradient-to-r from-transparent via-rose-400/40 to-transparent'
          : 'bg-gradient-to-r from-transparent via-slate-700/20 to-transparent'
      )} />

      {isRunning && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/[0.02] to-transparent animate-shimmer" />
        </div>
      )}

      <div className="flex items-center justify-between px-5 pt-4 pb-1">
        <div className="flex flex-col">
          <h3 className="text-slate-200 font-medium tracking-wide text-sm flex items-center gap-2">
            <MapPin size={13} className="text-rose-400/60" />
            {medal && <span className="text-base drop-shadow-lg">{medal}</span>}
            {name}
          </h3>
          {meta && (
            <div className="flex items-center gap-2 mt-1 pl-5">
              <span className={cn('text-[9px] font-mono font-bold tracking-wider', meta.color)}>
                {meta.complexity}
              </span>
              <span className="text-[9px] text-slate-600 hidden xl:inline">
                {meta.description}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          {stepCount > 0 && (
            <span className={cn(
              'text-[10px] font-mono px-2 py-0.5 rounded-md tabular-nums transition-colors duration-300',
              isFinished && pathFound
                ? 'text-emerald-400/70 bg-emerald-400/10'
                : 'text-slate-500 bg-slate-800/50'
            )}>
              {state?.visitedCount ?? stepCount} visited
            </span>
          )}
          {isFinished && pathFound && state?.pathLength && (
            <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md tabular-nums">
              path: {state.pathLength}
            </span>
          )}
          <div
            className={cn(
              'transition-all duration-500',
              isFinished
                ? pathFound ? 'opacity-100 text-emerald-400 scale-110' : 'opacity-100 text-rose-400'
                : 'opacity-25 text-slate-600'
            )}
          >
            {isFinished ? (
              pathFound ? <Check size={16} strokeWidth={3} /> : <span className="text-[10px] font-mono">NO PATH</span>
            ) : (
              <CircleDashed size={16} className={isRunning ? 'animate-spin' : ''} />
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 pt-2 flex-1">
        <div
          className="grid gap-[1px] w-full h-full min-h-[140px] xl:min-h-[180px]"
          style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gridTemplateRows: `repeat(${rows}, 1fr)`,
          }}
        >
          {displayGrid.flat().map((cell, idx) => (
            <div
              key={idx}
              className={cn(
                'rounded-[1px] transition-colors duration-100',
                cellColorMap[cell]
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
