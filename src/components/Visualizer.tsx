import React, { useCallback, useMemo } from 'react';
import { SortState, SortingGenerator } from '../lib/algorithms';
import { cn } from '../lib/utils';
import { Check, CircleDashed } from 'lucide-react';
import { useAlgorithmRunner } from '../hooks/useAlgorithmRunner';
import { SORTING_META } from '../lib/complexity';
import { audioEngine } from '../lib/audioEngine';

interface VisualizerProps {
  name: string;
  generatorFn: (arr: number[]) => SortingGenerator;
  initialArray: number[];
  isPlaying: boolean;
  speed: number;
  onComplete?: (name: string, steps: number) => void;
  maxValue: number;
  index: number;
  position?: number | null;
}

export const Visualizer: React.FC<VisualizerProps> = ({
  name,
  generatorFn,
  initialArray,
  isPlaying,
  speed,
  onComplete,
  maxValue,
  index,
  position,
}) => {
  const createGenerator = useCallback(
    () => generatorFn([...initialArray]),
    [generatorFn, initialArray]
  );

  const handleComplete = useCallback(
    (steps: number) => onComplete?.(name, steps),
    [onComplete, name]
  );

  // Sound: map active indices' values to notes
  const onTick = useCallback(
    (state: SortState) => {
      if (state.activeIndices.length > 0) {
        const idx = state.activeIndices[0];
        const val = state.array[idx] ?? 0;
        audioEngine.playNote(val / maxValue, 'sort');
      }
    },
    [maxValue]
  );

  const { state, isFinished, stepCount } = useAlgorithmRunner<SortState>({
    createGenerator,
    isPlaying,
    speed,
    onComplete: handleComplete,
    onTick,
    resetDeps: [initialArray, generatorFn],
  });

  const displayArray = state?.array ?? initialArray;
  const activeIndices = useMemo(() => new Set(state?.activeIndices ?? []), [state?.activeIndices]);
  const pivotIndex = state?.pivotIndex ?? -1;
  const meta = SORTING_META[name];

  const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : null;
  const isRunning = isPlaying && !isFinished && stepCount > 0;

  return (
    <div
      className={cn(
        'algo-card flex flex-col bg-slate-900/40 rounded-2xl border backdrop-blur-sm transition-all duration-700 group relative overflow-hidden',
        isFinished
          ? 'border-emerald-500/20 shadow-[0_0_50px_rgba(52,211,153,0.06)]'
          : isRunning
          ? 'border-slate-700/50 shadow-[0_0_30px_rgba(244,63,94,0.04)]'
          : 'border-slate-800/40 hover:border-slate-700/40'
      )}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Top accent line with animation */}
      <div className={cn(
        'absolute top-0 left-0 right-0 h-[1px] transition-all duration-1000',
        isFinished
          ? 'bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent'
          : isRunning
          ? 'bg-gradient-to-r from-transparent via-rose-400/40 to-transparent'
          : 'bg-gradient-to-r from-transparent via-slate-700/20 to-transparent'
      )} />

      {/* Running shimmer effect */}
      {isRunning && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/[0.02] to-transparent animate-shimmer" />
        </div>
      )}

      {/* Header */}
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
              isFinished
                ? 'text-emerald-400/70 bg-emerald-400/10'
                : 'text-slate-500 bg-slate-800/50'
            )}>
              {stepCount.toLocaleString()} ops
            </span>
          )}
          <div
            className={cn(
              'transition-all duration-500',
              isFinished ? 'opacity-100 text-emerald-400 scale-110' : 'opacity-25 text-slate-600'
            )}
          >
            {isFinished ? (
              <Check size={16} strokeWidth={3} />
            ) : (
              <CircleDashed size={16} className={isRunning ? 'animate-spin' : ''} />
            )}
          </div>
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex-1 flex items-end gap-[1px] px-4 pb-4 min-h-[140px] xl:min-h-[180px]">
        {displayArray.map((value, idx) => {
          const isActive = activeIndices.has(idx);
          const isPivot = pivotIndex === idx;
          const heightPercent = (value / maxValue) * 100;

          return (
            <div key={idx} className="relative flex-1" style={{ height: `${heightPercent}%` }}>
              <div
                className={cn(
                  'absolute inset-x-0 bottom-0 w-full h-full rounded-t-[2px] transition-all duration-75',
                  isFinished
                    ? 'bg-emerald-400/70'
                    : isActive
                    ? 'bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.5)]'
                    : isPivot
                    ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                    : 'bg-slate-700/50'
                )}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
