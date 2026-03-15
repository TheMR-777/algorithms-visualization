import React from 'react';
import { X, BarChart3, Search, Map, Volume2, VolumeX } from 'lucide-react';
import { cn } from '../lib/utils';
import { SORTING_META, SEARCH_META, PATH_META } from '../lib/complexity';
import { SoundProfile } from '../lib/audioEngine';

export interface AlgorithmConfig {
  sorting: Record<string, boolean>;
  searching: Record<string, boolean>;
  pathfinding: Record<string, boolean>;
}

export interface SoundConfig {
  enabled: boolean;
  volume: number;
  profile: SoundProfile;
}

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  config: AlgorithmConfig;
  onChange: (config: AlgorithmConfig) => void;
  allSortNames: string[];
  allSearchNames: string[];
  allPathNames: string[];
  soundConfig: SoundConfig;
  onSoundChange: (config: SoundConfig) => void;
}

const SOUND_PROFILES: { value: SoundProfile; label: string; description: string; emoji: string }[] = [
  { value: 'crystals', label: 'Crystals', description: 'Clean bell-like chimes', emoji: '✨' },
  { value: 'synth', label: 'Synth Waves', description: 'Warm analog-style tones', emoji: '🌊' },
  { value: 'drops', label: 'Rain Drops', description: 'Gentle water droplets', emoji: '💧' },
  { value: 'silent', label: 'Silent', description: 'No sound effects', emoji: '🔇' },
];

function CategorySection({
  title,
  icon: Icon,
  iconColor,
  algoNames,
  enabled,
  metaMap,
  onToggle,
  minRequired,
}: {
  title: string;
  icon: React.FC<{ size?: number; className?: string }>;
  iconColor: string;
  algoNames: string[];
  enabled: Record<string, boolean>;
  metaMap: Record<string, { complexity: string; color: string; description: string }>;
  onToggle: (name: string) => void;
  minRequired: number;
}) {
  const enabledCount = algoNames.filter((n) => enabled[n]).length;

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-3">
        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', iconColor)}>
          <Icon size={14} className="text-white" />
        </div>
        <div>
          <h4 className="text-slate-200 text-sm font-medium">{title}</h4>
          <p className="text-[10px] text-slate-500">
            {enabledCount} of {algoNames.length} active
            {enabledCount <= minRequired && (
              <span className="text-amber-400/80 ml-1">• min {minRequired} required</span>
            )}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {algoNames.map((name) => {
          const meta = metaMap[name];
          const isOn = enabled[name];
          const wouldGoBelow = enabledCount <= minRequired && isOn;

          return (
            <button
              key={name}
              onClick={() => !wouldGoBelow && onToggle(name)}
              disabled={wouldGoBelow}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-left transition-all duration-200 group',
                isOn
                  ? 'bg-slate-800/60 border-slate-700/50 hover:border-slate-600/60'
                  : 'bg-slate-900/40 border-slate-800/30 opacity-50 hover:opacity-70',
                wouldGoBelow && 'cursor-not-allowed hover:opacity-50'
              )}
            >
              {/* Toggle indicator */}
              <div
                className={cn(
                  'w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-200',
                  isOn
                    ? 'bg-rose-500/80 border-rose-400/60'
                    : 'bg-transparent border-slate-600/50'
                )}
              >
                {isOn && (
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-xs text-slate-300 font-medium truncate">{name}</div>
                {meta && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={cn('text-[9px] font-mono font-bold', meta.color)}>
                      {meta.complexity}
                    </span>
                    <span className="text-[9px] text-slate-600 truncate hidden sm:inline">
                      {meta.description}
                    </span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  isOpen,
  onClose,
  config,
  onChange,
  allSortNames,
  allSearchNames,
  allPathNames,
  soundConfig,
  onSoundChange,
}) => {
  if (!isOpen) return null;

  const toggleAlgo = (category: keyof AlgorithmConfig, name: string) => {
    const updated = {
      ...config,
      [category]: {
        ...config[category],
        [name]: !config[category][name],
      },
    };
    onChange(updated);
  };

  const enableAll = (category: keyof AlgorithmConfig, names: string[]) => {
    const updated = { ...config };
    const catConfig = { ...config[category] };
    names.forEach((n) => (catConfig[n] = true));
    updated[category] = catConfig;
    onChange(updated);
  };

  const enableOnlyFast = (category: keyof AlgorithmConfig, names: string[], metaMap: Record<string, { color: string }>) => {
    const updated = { ...config };
    const catConfig = { ...config[category] };
    names.forEach((n) => {
      const meta = metaMap[n];
      catConfig[n] = meta ? meta.color !== 'text-rose-400' : true;
    });
    updated[category] = catConfig;
    onChange(updated);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-slate-900/98 border border-slate-700/40 rounded-2xl max-w-2xl w-full mx-4 shadow-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/40 shrink-0">
          <div>
            <h2 className="text-white font-semibold text-base">Settings</h2>
            <p className="text-slate-500 text-xs mt-0.5">Configure algorithms and sound</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800/60 transition-colors text-slate-500 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-8 flex-1">
          {/* ═══ Sound Settings Section ═══ */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-violet-500/20">
                {soundConfig.enabled && soundConfig.profile !== 'silent'
                  ? <Volume2 size={14} className="text-violet-300" />
                  : <VolumeX size={14} className="text-slate-500" />
                }
              </div>
              <div>
                <h4 className="text-slate-200 text-sm font-medium">Sound Effects</h4>
                <p className="text-[10px] text-slate-500">
                  Soothing audio mapped to algorithm data values
                </p>
              </div>
            </div>

            {/* Sound on/off toggle */}
            <div className="flex items-center justify-between mb-4 px-1">
              <span className="text-xs text-slate-400">Enable Sound</span>
              <button
                onClick={() => onSoundChange({ ...soundConfig, enabled: !soundConfig.enabled })}
                className="relative w-10 h-5 rounded-full transition-all duration-300"
                style={{ backgroundColor: soundConfig.enabled ? 'rgba(139, 92, 246, 0.5)' : 'rgba(51, 65, 85, 0.6)' }}
              >
                <div
                  className="absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 shadow-md"
                  style={{
                    left: soundConfig.enabled ? '22px' : '2px',
                    backgroundColor: soundConfig.enabled ? '#c4b5fd' : '#94a3b8',
                  }}
                />
              </button>
            </div>

            {/* Volume slider */}
            {soundConfig.enabled && (
              <div className="mb-4 px-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400">Volume</span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {Math.round(soundConfig.volume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={soundConfig.volume * 100}
                  onChange={(e) => onSoundChange({ ...soundConfig, volume: Number(e.target.value) / 100 })}
                  className="w-full cursor-pointer sound-slider"
                />
              </div>
            )}

            {/* Sound profile picker */}
            {soundConfig.enabled && (
              <div className="grid grid-cols-2 gap-1.5">
                {SOUND_PROFILES.map((profile) => (
                  <button
                    key={profile.value}
                    onClick={() => onSoundChange({ ...soundConfig, profile: profile.value })}
                    className={cn(
                      'flex items-center gap-3 px-3.5 py-3 rounded-xl border text-left transition-all duration-200',
                      soundConfig.profile === profile.value
                        ? 'bg-violet-500/15 border-violet-500/30 shadow-[0_0_20px_rgba(139,92,246,0.06)]'
                        : 'bg-slate-800/30 border-slate-800/40 hover:border-slate-700/50'
                    )}
                  >
                    <span className="text-lg">{profile.emoji}</span>
                    <div className="min-w-0">
                      <div className={cn(
                        'text-xs font-medium',
                        soundConfig.profile === profile.value ? 'text-violet-300' : 'text-slate-400'
                      )}>
                        {profile.label}
                      </div>
                      <div className="text-[9px] text-slate-600 truncate">{profile.description}</div>
                    </div>
                    {soundConfig.profile === profile.value && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-violet-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-px bg-slate-800/40" />

          {/* ═══ Sorting Algorithms ═══ */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div /> {/* spacer */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => enableAll('sorting', allSortNames)}
                  className="text-[10px] text-slate-500 hover:text-slate-300 bg-slate-800/40 hover:bg-slate-800/60 px-2.5 py-1 rounded-lg transition-colors"
                >
                  Enable All
                </button>
                <button
                  onClick={() => enableOnlyFast('sorting', allSortNames, SORTING_META)}
                  className="text-[10px] text-emerald-500/70 hover:text-emerald-400 bg-emerald-400/5 hover:bg-emerald-400/10 px-2.5 py-1 rounded-lg transition-colors"
                >
                  Fast Only
                </button>
              </div>
            </div>
            <CategorySection
              title="Sorting Algorithms"
              icon={BarChart3}
              iconColor="bg-rose-500/20"
              algoNames={allSortNames}
              enabled={config.sorting}
              metaMap={SORTING_META}
              onToggle={(n) => toggleAlgo('sorting', n)}
              minRequired={2}
            />
          </div>

          <div className="h-px bg-slate-800/40" />

          {/* ═══ Search Algorithms ═══ */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => enableAll('searching', allSearchNames)}
                  className="text-[10px] text-slate-500 hover:text-slate-300 bg-slate-800/40 hover:bg-slate-800/60 px-2.5 py-1 rounded-lg transition-colors"
                >
                  Enable All
                </button>
                <button
                  onClick={() => enableOnlyFast('searching', allSearchNames, SEARCH_META)}
                  className="text-[10px] text-emerald-500/70 hover:text-emerald-400 bg-emerald-400/5 hover:bg-emerald-400/10 px-2.5 py-1 rounded-lg transition-colors"
                >
                  Fast Only
                </button>
              </div>
            </div>
            <CategorySection
              title="Search Algorithms"
              icon={Search}
              iconColor="bg-indigo-500/20"
              algoNames={allSearchNames}
              enabled={config.searching}
              metaMap={SEARCH_META}
              onToggle={(n) => toggleAlgo('searching', n)}
              minRequired={2}
            />
          </div>

          <div className="h-px bg-slate-800/40" />

          {/* ═══ Pathfinding Algorithms ═══ */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => enableAll('pathfinding', allPathNames)}
                  className="text-[10px] text-slate-500 hover:text-slate-300 bg-slate-800/40 hover:bg-slate-800/60 px-2.5 py-1 rounded-lg transition-colors"
                >
                  Enable All
                </button>
                <button
                  onClick={() => enableOnlyFast('pathfinding', allPathNames, PATH_META)}
                  className="text-[10px] text-emerald-500/70 hover:text-emerald-400 bg-emerald-400/5 hover:bg-emerald-400/10 px-2.5 py-1 rounded-lg transition-colors"
                >
                  Fast Only
                </button>
              </div>
            </div>
            <CategorySection
              title="Pathfinding Algorithms"
              icon={Map}
              iconColor="bg-amber-500/20"
              algoNames={allPathNames}
              enabled={config.pathfinding}
              metaMap={PATH_META}
              onToggle={(n) => toggleAlgo('pathfinding', n)}
              minRequired={2}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800/40 shrink-0">
          <p className="text-[10px] text-slate-600 text-center">
            Changes take effect on next shuffle / restart • Press <kbd>Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
};
