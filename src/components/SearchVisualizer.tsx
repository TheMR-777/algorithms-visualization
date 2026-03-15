import React, { useCallback, useMemo } from 'react';
import { SearchState, SearchGenerator } from '../lib/searchAlgorithms';
import { cn } from '../lib/utils';
import { Check, CircleDashed, Target } from 'lucide-react';
import { useAlgorithmRunner } from '../hooks/useAlgorithmRunner';
import { SEARCH_META } from '../lib/complexity';
import { audioEngine } from '../lib/audioEngine';

interface SearchVisualizerProps {
  name: string;
  generatorFn: (arr: number[], target: number) => SearchGenerator;
  initialArray: number[];
  target: number;
  isPlaying: boolean;
  speed: number;
  onComplete?: (name: string, steps: number) => void;
  index: number;
  position?: number | null;
}

export const SearchVisualizer: React.FC<SearchVisualizerProps> = ({
  name,
  generatorFn,
  initialArray,
  target,
  isPlaying,
  speed,
  onComplete,
  index,
  position,
}) => {
  const maxVal = useMemo(() => Math.max(...initialArray), [initialArray]);

  const createGenerator = useCallback(
    () => generatorFn([...initialArray], target),
    [generatorFn, initialArray, target]
  );

  const handleComplete = useCallback(
    (steps: number) => onComplete?.(name, steps),
    [onComplete, name]
  );

  const isEarlyComplete = useCallback((s: SearchState) => s.found, []);

  // Sound: map current probe value to notes
  const onTick = useCallback(
    (state: SearchState) => {
      if (state.currentIndex >= 0 && state.currentIndex < state.array.length) {
        const val = state.array[state.currentIndex];
        audioEngine.playNote(val / maxVal, 'search');
      }
    },
    [maxVal]
  );

  const { state, isFinished, stepCount } = useAlgorithmRunner<SearchState>({
    createGenerator,
    isPlaying,
    speed,
    speedMultiplier: 3,
    onComplete: handleComplete,
    onTick,
    isEarlyComplete,
    resetDeps: [initialArray, generatorFn, target],
  });

  const wasFound = state?.found ?? false;
  const displayState = state ?? {
    array: initialArray,
    target,
    currentIndex: -1,
    searchRange: [0, initialArray.length - 1] as [number, number],
    found: false,
    checkedIndices: [] as number[],
  };

  const checkedSet = useMemo(() => new Set(displayState.checkedIndices), [displayState.checkedIndices]);
  const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : null;
  const meta = SEARCH_META[name];
  const isRunning = isPlaying && !isFinished && stepCount > 0;

  return (
    <div
      className={cn(
        'algo-card flex flex-col bg-slate-900/40 rounded-2xl border backdrop-blur-sm transition-all duration-700 group relative overflow-hidden',
        isFinished && wasFound
          ? 'border-emerald-500/20 shadow-[0_0_50px_rgba(52,211,153,0.06)]'
          : isRunning
          ? 'border-slate-700/50 shadow-[0_0_30px_rgba(244,63,94,0.04)]'
          : 'border-slate-800/40 hover:border-slate-700/40'
      )}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className={cn(
        'absolute top-0 left-0 right-0 h-[1px] transition-all duration-1000',
        isFinished && wasFound
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
            {medal && <span className="text-base drop-shadow-lg">{medal}</span>}
            {name}
          </h3>
          {meta && (
            <div className="flex items-center gap-2 mt-1">
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
              isFinished && wasFound
                ? 'text-emerald-400/70 bg-emerald-400/10'
                : 'text-slate-500 bg-slate-800/50'
            )}>
              {stepCount} steps
            </span>
          )}
          <div
            className={cn(
              'transition-all duration-500',
              isFinished
                ? wasFound ? 'opacity-100 text-emerald-400 scale-110' : 'opacity-100 text-rose-400'
                : 'opacity-25 text-slate-600'
            )}
          >
            {isFinished ? (
              wasFound ? <Check size={16} strokeWidth={3} /> : <span className="text-[10px] font-mono">MISS</span>
            ) : (
              <CircleDashed size={16} className={isRunning ? 'animate-spin' : ''} />
            )}
          </div>
        </div>
      </div>

      {/* Target badge */}
      <div className="px-5 pb-2 flex items-center gap-2">
        <Target size={11} className="text-amber-400/60" />
        <span className="text-[10px] text-slate-500">Target:</span>
        <span className="text-[10px] text-amber-400 font-mono font-semibold bg-amber-400/10 px-1.5 py-0.5 rounded">
          {target}
        </span>
      </div>

      <div className="flex-1 flex items-end gap-[1.5px] px-4 pb-4 min-h-[120px] xl:min-h-[160px]">
        {displayState.array.map((value, idx) => {
          const isCurrent = displayState.currentIndex === idx;
          const isChecked = checkedSet.has(idx);
          const inRange = idx >= displayState.searchRange[0] && idx <= displayState.searchRange[1];
          const isTarget = value === target && isFinished && wasFound;
          const heightPercent = (value / maxVal) * 100;

          return (
            <div key={idx} className="relative flex-1" style={{ height: `${heightPercent}%` }}>
              <div
                className={cn(
                  'absolute inset-x-0 bottom-0 w-full h-full rounded-t-[2px] transition-all duration-100',
                  isTarget
                    ? 'bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.6)]'
                    : isCurrent
                    ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                    : isChecked
                    ? 'bg-indigo-400/50'
                    : inRange
                    ? 'bg-slate-600/60'
                    : 'bg-slate-800/30'
                )}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
