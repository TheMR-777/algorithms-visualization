import React from 'react';
import { cn } from '../lib/utils';
import { LucideIcon } from 'lucide-react';

interface TabButtonProps {
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  onClick: () => void;
}

export const TabButton: React.FC<TabButtonProps> = ({ label, icon: Icon, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-300 relative',
        isActive
          ? 'text-white bg-slate-800/90 shadow-md shadow-black/20'
          : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/20'
      )}
    >
      <Icon
        size={14}
        className={cn(
          'transition-colors duration-300',
          isActive ? 'text-rose-400' : 'text-slate-600'
        )}
      />
      <span className="hidden sm:inline">{label}</span>
      {isActive && (
        <div className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-full bg-gradient-to-r from-rose-500 to-orange-400" />
      )}
    </button>
  );
};
