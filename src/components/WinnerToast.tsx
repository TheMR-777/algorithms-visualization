import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';

interface WinnerToastProps {
  winner: string | null;
  category: string;
  steps: number;
}

export function WinnerToast({ winner, category, steps }: WinnerToastProps) {
  const [visible, setVisible] = useState(false);
  const [currentWinner, setCurrentWinner] = useState<string | null>(null);

  useEffect(() => {
    if (winner && winner !== currentWinner) {
      setCurrentWinner(winner);
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 3500);
      return () => clearTimeout(timer);
    }
    if (!winner) {
      setCurrentWinner(null);
      setVisible(false);
    }
  }, [winner, currentWinner]);

  return (
    <div
      className={`fixed top-24 left-1/2 -translate-x-1/2 z-40 transition-all duration-500 ${
        visible
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'
      }`}
    >
      <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-amber-400/20 shadow-2xl shadow-amber-500/10">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Trophy size={14} className="text-white" />
        </div>
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">{category}</p>
          <p className="text-white font-semibold text-sm">
            🏆 {currentWinner} <span className="text-slate-500 font-normal">wins!</span>
          </p>
        </div>
        <span className="text-[10px] font-mono text-amber-400/70 bg-amber-400/10 px-2 py-1 rounded-lg ml-1">
          {steps.toLocaleString()} ops
        </span>
      </div>
    </div>
  );
}
