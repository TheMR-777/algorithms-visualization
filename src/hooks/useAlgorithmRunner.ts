import { useState, useRef, useEffect, useCallback } from 'react';

interface UseAlgorithmRunnerOptions<TState> {
  /** Function that creates a new generator for the algorithm */
  createGenerator: () => Generator<TState, void, unknown>;
  /** Whether the race is currently playing */
  isPlaying: boolean;
  /** Delay between steps in ms */
  speed: number;
  /** Optional speed multiplier (e.g. 3 for search to slow it down) */
  speedMultiplier?: number;
  /** Called when the algorithm finishes */
  onComplete?: (steps: number) => void;
  /** Called on every step with the new state — used for sound integration */
  onTick?: (state: TState, stepCount: number) => void;
  /** Check whether a yielded state represents completion (e.g. found=true for search) */
  isEarlyComplete?: (state: TState) => boolean;
  /** Reset dependencies — when any of these change, generator is recreated */
  resetDeps: unknown[];
}

interface UseAlgorithmRunnerReturn<TState> {
  state: TState | null;
  isFinished: boolean;
  stepCount: number;
}

export function useAlgorithmRunner<TState>({
  createGenerator,
  isPlaying,
  speed,
  speedMultiplier = 1,
  onComplete,
  onTick,
  isEarlyComplete,
  resetDeps,
}: UseAlgorithmRunnerOptions<TState>): UseAlgorithmRunnerReturn<TState> {
  const [state, setState] = useState<TState | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [stepCount, setStepCount] = useState(0);
  const generatorRef = useRef<Generator<TState, void, unknown> | null>(null);
  const stepCountRef = useRef(0);

  // Reset when dependencies change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const resetKey = JSON.stringify(resetDeps);

  useEffect(() => {
    generatorRef.current = createGenerator();
    setState(null);
    setIsFinished(false);
    setStepCount(0);
    stepCountRef.current = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const tick = useCallback(() => {
    if (!generatorRef.current) return false;
    const next = generatorRef.current.next();

    if (next.done) {
      setIsFinished(true);
      onComplete?.(stepCountRef.current);
      return false;
    }

    setState(next.value);
    stepCountRef.current += 1;
    setStepCount(stepCountRef.current);

    // Fire onTick for sound integration
    onTick?.(next.value, stepCountRef.current);

    if (isEarlyComplete?.(next.value)) {
      setIsFinished(true);
      onComplete?.(stepCountRef.current);
      return false;
    }

    return true;
  }, [onComplete, onTick, isEarlyComplete]);

  useEffect(() => {
    if (!isPlaying || isFinished) return;

    let timeoutId: number;
    const step = () => {
      const shouldContinue = tick();
      if (shouldContinue) {
        timeoutId = window.setTimeout(step, speed * speedMultiplier);
      }
    };

    timeoutId = window.setTimeout(step, speed * speedMultiplier);
    return () => clearTimeout(timeoutId);
  }, [isPlaying, isFinished, speed, speedMultiplier, tick]);

  return { state, isFinished, stepCount };
}
