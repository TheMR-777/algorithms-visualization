import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Play, Pause, Shuffle, Search, Map, Zap,
  BarChart3, Film, Keyboard, Settings, RotateCcw,
  Volume2, VolumeX,
} from 'lucide-react';
import {
  bubbleSort, selectionSort, insertionSort,
  quickSort, mergeSort, shellSort,
  heapSort, radixSort, cocktailShakerSort, combSort,
} from './lib/algorithms';
import {
  linearSearch, binarySearch, jumpSearch,
  exponentialSearch, ternarySearch, interpolationSearch,
  fibonacciSearch,
} from './lib/searchAlgorithms';
import { bfs, dfs, aStar, greedy, generateMaze, dijkstra, bidirectionalBfs } from './lib/pathfinding';
import { generateRandomArray } from './lib/utils';
import { Visualizer } from './components/Visualizer';
import { SearchVisualizer } from './components/SearchVisualizer';
import { PathVisualizer } from './components/PathVisualizer';
import { Leaderboard } from './components/Leaderboard';
import { TabButton } from './components/TabButton';
import { Confetti } from './components/Confetti';
import { WinnerToast } from './components/WinnerToast';
import { StatsPanel, WinRecord } from './components/StatsPanel';
import { SettingsDialog, AlgorithmConfig, SoundConfig } from './components/SettingsDialog';
import { audioEngine } from './lib/audioEngine';

// ─── All Available Algorithms ─────────────────────

const ALL_SORTING_ALGORITHMS = [
  { name: 'Quick Sort', fn: quickSort },
  { name: 'Merge Sort', fn: mergeSort },
  { name: 'Heap Sort', fn: heapSort },
  { name: 'Shell Sort', fn: shellSort },
  { name: 'Radix Sort', fn: radixSort },
  { name: 'Comb Sort', fn: combSort },
  { name: 'Cocktail Shaker', fn: cocktailShakerSort },
  { name: 'Insertion Sort', fn: insertionSort },
  { name: 'Selection Sort', fn: selectionSort },
  { name: 'Bubble Sort', fn: bubbleSort },
];

const ALL_SEARCH_ALGORITHMS = [
  { name: 'Binary Search', fn: binarySearch },
  { name: 'Interpolation', fn: interpolationSearch },
  { name: 'Ternary Search', fn: ternarySearch },
  { name: 'Exponential', fn: exponentialSearch },
  { name: 'Fibonacci', fn: fibonacciSearch },
  { name: 'Jump Search', fn: jumpSearch },
  { name: 'Linear Search', fn: linearSearch },
];

const ALL_PATH_ALGORITHMS = [
  { name: 'A* Search', fn: aStar },
  { name: 'Dijkstra', fn: dijkstra },
  { name: 'Greedy Best-First', fn: greedy },
  { name: 'Bidirectional BFS', fn: bidirectionalBfs },
  { name: 'BFS', fn: bfs },
  { name: 'DFS', fn: dfs },
];

const ALL_SORT_NAMES = ALL_SORTING_ALGORITHMS.map((a) => a.name);
const ALL_SEARCH_NAMES = ALL_SEARCH_ALGORITHMS.map((a) => a.name);
const ALL_PATH_NAMES = ALL_PATH_ALGORITHMS.map((a) => a.name);

// Default config: deselect Bubble Sort & Selection Sort
const DEFAULT_CONFIG: AlgorithmConfig = {
  sorting: Object.fromEntries(
    ALL_SORT_NAMES.map((n) => [n, n !== 'Bubble Sort' && n !== 'Selection Sort'])
  ),
  searching: Object.fromEntries(ALL_SEARCH_NAMES.map((n) => [n, true])),
  pathfinding: Object.fromEntries(ALL_PATH_NAMES.map((n) => [n, true])),
};

const DEFAULT_SOUND_CONFIG: SoundConfig = {
  enabled: false,
  volume: 0.25,
  profile: 'crystals',
};

type TabType = 'sorting' | 'searching' | 'pathfinding';
const TABS: TabType[] = ['sorting', 'searching', 'pathfinding'];

const SORT_ARRAY_SIZE = 60;
const SEARCH_ARRAY_SIZE = 80;
const MIN_VALUE = 10;
const MAX_VALUE = 200;
const GRID_ROWS = 20;
const GRID_COLS = 40;

type LeaderboardEntry = { name: string; position: number; steps: number };

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('sorting');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(50);
  const [cinemaMode, setCinemaMode] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Algorithm config
  const [algoConfig, setAlgoConfig] = useState<AlgorithmConfig>(DEFAULT_CONFIG);

  // Sound config
  const [soundConfig, setSoundConfig] = useState<SoundConfig>(DEFAULT_SOUND_CONFIG);

  // Confetti
  const [confettiActive, setConfettiActive] = useState(false);

  // Winner toast
  const [toastWinner, setToastWinner] = useState<string | null>(null);
  const [toastCategory, setToastCategory] = useState('');
  const [toastSteps, setToastSteps] = useState(0);

  // Session stats
  const [sessionWins, setSessionWins] = useState<WinRecord>({});
  const [totalRaces, setTotalRaces] = useState(0);

  // Sorting state
  const [sortArray, setSortArray] = useState<number[]>([]);
  const [sortLeaderboard, setSortLeaderboard] = useState<LeaderboardEntry[]>([]);

  // Search state
  const [searchArray, setSearchArray] = useState<number[]>([]);
  const [searchTarget, setSearchTarget] = useState(0);
  const [searchLeaderboard, setSearchLeaderboard] = useState<LeaderboardEntry[]>([]);

  // Pathfinding state
  const [pathWalls, setPathWalls] = useState<Set<string>>(new Set());
  const [pathResetKey, setPathResetKey] = useState(0);
  const [pathLeaderboard, setPathLeaderboard] = useState<LeaderboardEntry[]>([]);

  // Cinema mode timer
  const cinemaTimerRef = useRef<number>(0);

  const pathStart: [number, number] = [1, 1];
  const pathEnd: [number, number] = [GRID_ROWS - 2, GRID_COLS - 2];

  // ─── Sync sound config to audio engine ─────────
  useEffect(() => {
    audioEngine.enabled = soundConfig.enabled;
    audioEngine.volume = soundConfig.volume;
    audioEngine.profile = soundConfig.profile;
  }, [soundConfig]);

  const handleSoundChange = useCallback((newConfig: SoundConfig) => {
    setSoundConfig(newConfig);
    // If user is enabling sound, try a click to confirm audio context starts
    if (newConfig.enabled && !soundConfig.enabled) {
      audioEngine.enabled = true;
      audioEngine.volume = newConfig.volume;
      audioEngine.profile = newConfig.profile;
      audioEngine.playClick();
    }
  }, [soundConfig.enabled]);

  const toggleSound = useCallback(() => {
    const newEnabled = !soundConfig.enabled;
    setSoundConfig((prev) => ({ ...prev, enabled: newEnabled }));
    audioEngine.enabled = newEnabled;
    if (newEnabled) {
      audioEngine.playClick();
    }
  }, [soundConfig.enabled]);

  // ─── Filtered algorithm lists ──────────────────
  const activeSortAlgos = useMemo(
    () => ALL_SORTING_ALGORITHMS.filter((a) => algoConfig.sorting[a.name]),
    [algoConfig.sorting]
  );
  const activeSearchAlgos = useMemo(
    () => ALL_SEARCH_ALGORITHMS.filter((a) => algoConfig.searching[a.name]),
    [algoConfig.searching]
  );
  const activePathAlgos = useMemo(
    () => ALL_PATH_ALGORITHMS.filter((a) => algoConfig.pathfinding[a.name]),
    [algoConfig.pathfinding]
  );

  // ─── Generators ─────────────────────────────────
  const generateSortArray = useCallback(() => {
    setIsPlaying(false);
    setSortLeaderboard([]);
    setToastWinner(null);
    setSortArray(generateRandomArray(SORT_ARRAY_SIZE, MIN_VALUE, MAX_VALUE));
  }, []);

  const generateSearchArray = useCallback(() => {
    setIsPlaying(false);
    setSearchLeaderboard([]);
    setToastWinner(null);
    const arr = generateRandomArray(SEARCH_ARRAY_SIZE, MIN_VALUE, MAX_VALUE).sort((a, b) => a - b);
    setSearchArray(arr);
    setSearchTarget(arr[Math.floor(Math.random() * arr.length)]);
  }, []);

  const generateNewMaze = useCallback(() => {
    setIsPlaying(false);
    setPathLeaderboard([]);
    setToastWinner(null);
    setPathWalls(generateMaze(GRID_ROWS, GRID_COLS, 0.28));
    setPathResetKey((k) => k + 1);
  }, []);

  useEffect(() => {
    generateSortArray();
    generateSearchArray();
    generateNewMaze();
  }, [generateSortArray, generateSearchArray, generateNewMaze]);

  const handleShuffle = useCallback(() => {
    audioEngine.playClick();
    if (activeTab === 'sorting') generateSortArray();
    else if (activeTab === 'searching') generateSearchArray();
    else generateNewMaze();
  }, [activeTab, generateSortArray, generateSearchArray, generateNewMaze]);

  // ─── Completion handlers ────────────────────────
  const handleSortComplete = useCallback((name: string, steps: number) => {
    setSortLeaderboard((prev) => {
      if (prev.find((e) => e.name === name)) return prev;
      const updated = [...prev, { name, position: prev.length + 1, steps }];
      if (updated.length === 1) {
        setToastWinner(name);
        setToastCategory('Sorting Race');
        setToastSteps(steps);
        setSessionWins((w) => ({ ...w, [name]: (w[name] || 0) + 1 }));
        setTotalRaces((t) => t + 1);
        audioEngine.playCelebration();
      }
      return updated;
    });
  }, []);

  const handleSearchComplete = useCallback((name: string, steps: number) => {
    setSearchLeaderboard((prev) => {
      if (prev.find((e) => e.name === name)) return prev;
      const updated = [...prev, { name, position: prev.length + 1, steps }];
      if (updated.length === 1) {
        setToastWinner(name);
        setToastCategory('Search Race');
        setToastSteps(steps);
        setSessionWins((w) => ({ ...w, [name]: (w[name] || 0) + 1 }));
        setTotalRaces((t) => t + 1);
        audioEngine.playCelebration();
      }
      return updated;
    });
  }, []);

  const handlePathComplete = useCallback((name: string, steps: number) => {
    setPathLeaderboard((prev) => {
      if (prev.find((e) => e.name === name)) return prev;
      const updated = [...prev, { name, position: prev.length + 1, steps }];
      if (updated.length === 1) {
        setToastWinner(name);
        setToastCategory('Pathfinding Race');
        setToastSteps(steps);
        setSessionWins((w) => ({ ...w, [name]: (w[name] || 0) + 1 }));
        setTotalRaces((t) => t + 1);
        audioEngine.playCelebration();
      }
      return updated;
    });
  }, []);

  const handleTabChange = useCallback((tab: TabType) => {
    setIsPlaying(false);
    setActiveTab(tab);
    setToastWinner(null);
    audioEngine.playClick();
  }, []);

  // ─── Derived state ──────────────────────────────
  const currentLeaderboard = useMemo(() => {
    if (activeTab === 'sorting') return sortLeaderboard;
    if (activeTab === 'searching') return searchLeaderboard;
    return pathLeaderboard;
  }, [activeTab, sortLeaderboard, searchLeaderboard, pathLeaderboard]);

  const currentAlgoCount = useMemo(() => {
    if (activeTab === 'sorting') return activeSortAlgos.length;
    if (activeTab === 'searching') return activeSearchAlgos.length;
    return activePathAlgos.length;
  }, [activeTab, activeSortAlgos.length, activeSearchAlgos.length, activePathAlgos.length]);

  const allFinished = currentLeaderboard.length >= currentAlgoCount;

  // Confetti trigger
  useEffect(() => {
    if (allFinished && currentLeaderboard.length > 0) {
      setConfettiActive(true);
    }
  }, [allFinished, currentLeaderboard.length]);

  // ─── Cinema Mode Logic ──────────────────────────
  useEffect(() => {
    if (!cinemaMode) {
      clearTimeout(cinemaTimerRef.current);
      return;
    }

    if (allFinished && currentLeaderboard.length > 0) {
      cinemaTimerRef.current = window.setTimeout(() => {
        const currentIdx = TABS.indexOf(activeTab);
        const nextTab = TABS[(currentIdx + 1) % TABS.length];

        if (nextTab === 'sorting') generateSortArray();
        else if (nextTab === 'searching') generateSearchArray();
        else generateNewMaze();

        setActiveTab(nextTab);

        window.setTimeout(() => {
          setIsPlaying(true);
        }, 800);
      }, 3000);

      return () => clearTimeout(cinemaTimerRef.current);
    }

    if (!isPlaying && currentLeaderboard.length === 0) {
      cinemaTimerRef.current = window.setTimeout(() => {
        setIsPlaying(true);
      }, 600);
      return () => clearTimeout(cinemaTimerRef.current);
    }
  }, [cinemaMode, allFinished, isPlaying, activeTab, currentLeaderboard.length, generateSortArray, generateSearchArray, generateNewMaze]);

  // ─── Keyboard Shortcuts ─────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (allFinished) {
            handleShuffle();
          } else {
            setIsPlaying((p) => !p);
          }
          break;
        case 'r':
        case 'R':
          handleShuffle();
          break;
        case '1':
          handleTabChange('sorting');
          break;
        case '2':
          handleTabChange('searching');
          break;
        case '3':
          handleTabChange('pathfinding');
          break;
        case 'c':
        case 'C':
          setCinemaMode((m) => !m);
          break;
        case 'm':
        case 'M':
          toggleSound();
          break;
        case '?':
          setShowShortcuts((s) => !s);
          break;
        case 'Escape':
          setShowShortcuts(false);
          setShowSettings(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleShuffle, handleTabChange, allFinished, toggleSound]);

  // ─── Derived display ───────────────────────────
  const leaderboardTitle = useMemo(() => {
    if (activeTab === 'sorting') return 'Sorting Race';
    if (activeTab === 'searching') return 'Search Race';
    return 'Pathfinding Race';
  }, [activeTab]);

  const positionMap = useMemo(() => {
    const map: Record<string, number> = {};
    currentLeaderboard.forEach((e) => { map[e.name] = e.position; });
    return map;
  }, [currentLeaderboard]);

  const handleResetStats = useCallback(() => {
    setSessionWins({});
    setTotalRaces(0);
  }, []);

  // ─── Play button state ─────────────────────────
  const handlePlayButton = useCallback(() => {
    if (allFinished) {
      handleShuffle();
    } else {
      setIsPlaying((p) => !p);
    }
  }, [allFinished, handleShuffle]);

  const playButtonLabel = allFinished ? 'Restart' : isPlaying ? 'Pause' : 'Start';
  const PlayButtonIcon = allFinished ? RotateCcw : isPlaying ? Pause : Play;

  // Grid cols based on active count
  const sortGridCols = activeSortAlgos.length <= 4
    ? 'grid-cols-1 md:grid-cols-2'
    : activeSortAlgos.length <= 6
    ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
    : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4';

  const searchGridCols = activeSearchAlgos.length <= 4
    ? 'grid-cols-1 md:grid-cols-2'
    : activeSearchAlgos.length <= 6
    ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
    : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4';

  const pathGridCols = activePathAlgos.length <= 4
    ? 'grid-cols-1 md:grid-cols-2'
    : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-rose-500/30 relative overflow-hidden">
      {/* ═══ Confetti ═══ */}
      <Confetti active={confettiActive} onComplete={() => setConfettiActive(false)} />

      {/* ═══ Winner Toast ═══ */}
      <WinnerToast winner={toastWinner} category={toastCategory} steps={toastSteps} />

      {/* ═══ Settings Dialog ═══ */}
      <SettingsDialog
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        config={algoConfig}
        onChange={setAlgoConfig}
        allSortNames={ALL_SORT_NAMES}
        allSearchNames={ALL_SEARCH_NAMES}
        allPathNames={ALL_PATH_NAMES}
        soundConfig={soundConfig}
        onSoundChange={handleSoundChange}
      />

      {/* ═══ Keyboard shortcuts modal ═══ */}
      {showShortcuts && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowShortcuts(false)}
        >
          <div
            className="bg-slate-900/95 border border-slate-700/40 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            <h2 className="text-white font-semibold text-lg mb-1">Keyboard Shortcuts</h2>
            <p className="text-slate-500 text-xs mb-6">Quick controls for the racing experience</p>
            <div className="space-y-3">
              {[
                ['Space', 'Play / Pause / Restart'],
                ['R', 'Shuffle / Reset'],
                ['1', 'Sorting tab'],
                ['2', 'Searching tab'],
                ['3', 'Pathfinding tab'],
                ['C', 'Toggle Cinema mode'],
                ['M', 'Toggle Sound'],
                ['?', 'Toggle this panel'],
                ['Esc', 'Close panels'],
              ].map(([key, desc]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">{desc}</span>
                  <kbd>{key}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Animated Background Orbs ═══ */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-rose-500/[0.06] blur-[140px] animate-float-1" />
        <div className="absolute top-[10%] right-[-10%] w-[50%] h-[60%] rounded-full bg-indigo-500/[0.06] blur-[140px] animate-float-2" />
        <div className="absolute bottom-[-15%] left-[20%] w-[55%] h-[55%] rounded-full bg-emerald-500/[0.04] blur-[140px] animate-float-3" />
        <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full bg-amber-500/[0.03] blur-[120px] animate-float-2" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* ═══ Header ═══ */}
        <header className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/20">
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10">
            <div className="flex items-center justify-between h-16 gap-4">
              {/* Brand */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-orange-400 flex items-center justify-center shadow-lg shadow-rose-500/15">
                  <Zap className="text-white" size={18} strokeWidth={2.5} />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-light tracking-tight text-white leading-tight">
                    Algorithm{' '}
                    <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-300">
                      Racing
                    </span>
                  </h1>
                  <p className="text-slate-500 text-[10px] tracking-wider leading-none">
                    Watch algorithms compete in real-time
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-0.5 bg-slate-900/60 p-1 rounded-xl border border-slate-800/20">
                <TabButton
                  label="Sorting"
                  icon={BarChart3}
                  isActive={activeTab === 'sorting'}
                  onClick={() => handleTabChange('sorting')}
                />
                <TabButton
                  label="Searching"
                  icon={Search}
                  isActive={activeTab === 'searching'}
                  onClick={() => handleTabChange('searching')}
                />
                <TabButton
                  label="Pathfinding"
                  icon={Map}
                  isActive={activeTab === 'pathfinding'}
                  onClick={() => handleTabChange('pathfinding')}
                />
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Settings */}
                <button
                  onClick={() => setShowSettings(true)}
                  className="flex items-center gap-1.5 p-2 rounded-xl hover:bg-slate-800/60 transition-colors text-slate-500 hover:text-white"
                  title="Settings (Algorithms & Sound)"
                >
                  <Settings size={15} />
                </button>

                {/* Sound toggle */}
                <button
                  onClick={toggleSound}
                  className={`flex items-center gap-1.5 p-2 rounded-xl transition-all ${
                    soundConfig.enabled
                      ? 'bg-violet-400/15 text-violet-400 border border-violet-400/20'
                      : 'hover:bg-slate-800/60 text-slate-500 hover:text-white'
                  }`}
                  title={`Sound ${soundConfig.enabled ? 'On' : 'Off'} (M)`}
                >
                  {soundConfig.enabled ? (
                    <Volume2 size={15} className={isPlaying ? 'sound-active' : ''} />
                  ) : (
                    <VolumeX size={15} />
                  )}
                  {soundConfig.enabled && (
                    <span className="hidden lg:inline text-xs font-medium">
                      {soundConfig.profile === 'silent' ? '' : soundConfig.profile.charAt(0).toUpperCase() + soundConfig.profile.slice(1)}
                    </span>
                  )}
                </button>

                {/* Cinema mode toggle */}
                <button
                  onClick={() => setCinemaMode(!cinemaMode)}
                  className={`flex items-center gap-1.5 p-2 rounded-xl transition-all ${
                    cinemaMode
                      ? 'bg-amber-400/15 text-amber-400 border border-amber-400/20'
                      : 'hover:bg-slate-800/60 text-slate-500 hover:text-white'
                  }`}
                  title="Cinema Mode (C) — auto-cycles through tabs"
                >
                  <Film size={15} />
                  <span className="hidden lg:inline text-xs font-medium">
                    {cinemaMode ? 'Cinema' : ''}
                  </span>
                </button>

                {/* Play/Pause/Restart */}
                <button
                  onClick={handlePlayButton}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm shadow-lg active:scale-[0.97] transition-all ${
                    allFinished
                      ? 'bg-gradient-to-r from-rose-500 to-orange-400 text-white shadow-rose-500/15 hover:brightness-110'
                      : 'bg-white text-slate-950 hover:bg-slate-100 shadow-white/5'
                  }`}
                >
                  <PlayButtonIcon size={14} className={allFinished ? '' : isPlaying ? '' : 'ml-0.5'} />
                  <span className="hidden sm:inline">{playButtonLabel}</span>
                </button>

                {/* Shuffle */}
                <button
                  onClick={handleShuffle}
                  disabled={isPlaying}
                  className="flex items-center gap-1.5 p-2 rounded-xl hover:bg-slate-800/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-slate-400 hover:text-white"
                  title="Shuffle / Reset (R)"
                >
                  <Shuffle size={15} />
                </button>

                {/* Speed */}
                <div className="hidden md:flex items-center gap-2 ml-1 pl-3 border-l border-slate-800/30">
                  <span className="text-[9px] text-slate-600 uppercase tracking-widest font-medium">Spd</span>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={105 - speed}
                    onChange={(e) => setSpeed(105 - Number(e.target.value))}
                    className="w-16 cursor-pointer"
                  />
                </div>

                {/* Keyboard shortcuts */}
                <button
                  onClick={() => setShowShortcuts(!showShortcuts)}
                  className="hidden lg:flex p-2 rounded-xl hover:bg-slate-800/60 transition-colors text-slate-500 hover:text-white"
                  title="Keyboard Shortcuts (?)"
                >
                  <Keyboard size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Cinema mode indicator bar */}
          {cinemaMode && (
            <div className="h-0.5 bg-gradient-to-r from-amber-400/40 via-orange-400/60 to-amber-400/40 animate-pulse" />
          )}
        </header>

        {/* ═══ Leaderboard + Stats Strip ═══ */}
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-3">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-3">
            <Leaderboard
              entries={currentLeaderboard}
              title={leaderboardTitle}
              totalAlgorithms={currentAlgoCount}
            />
            <StatsPanel
              wins={sessionWins}
              totalRaces={totalRaces}
              onReset={handleResetStats}
            />
          </div>
        </div>

        {/* ═══ Main Visualization Grid ═══ */}
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 xl:px-10 pb-8">
          {/* Sorting Tab */}
          {activeTab === 'sorting' && (
            <div className={`grid ${sortGridCols} gap-4 animate-fadeIn`}>
              {activeSortAlgos.map((algo, i) => (
                <Visualizer
                  key={algo.name}
                  name={algo.name}
                  generatorFn={algo.fn}
                  initialArray={sortArray}
                  isPlaying={isPlaying}
                  speed={speed}
                  maxValue={MAX_VALUE}
                  onComplete={handleSortComplete}
                  index={i}
                  position={positionMap[algo.name] ?? null}
                />
              ))}
            </div>
          )}

          {/* Searching Tab */}
          {activeTab === 'searching' && (
            <div className={`grid ${searchGridCols} gap-4 animate-fadeIn`}>
              {activeSearchAlgos.map((algo, i) => (
                <SearchVisualizer
                  key={algo.name}
                  name={algo.name}
                  generatorFn={algo.fn}
                  initialArray={searchArray}
                  target={searchTarget}
                  isPlaying={isPlaying}
                  speed={speed}
                  onComplete={handleSearchComplete}
                  index={i}
                  position={positionMap[algo.name] ?? null}
                />
              ))}
            </div>
          )}

          {/* Pathfinding Tab */}
          {activeTab === 'pathfinding' && (
            <div className={`grid ${pathGridCols} gap-4 animate-fadeIn`}>
              {activePathAlgos.map((algo, i) => (
                <PathVisualizer
                  key={algo.name}
                  name={algo.name}
                  generatorFn={algo.fn}
                  rows={GRID_ROWS}
                  cols={GRID_COLS}
                  walls={pathWalls}
                  start={pathStart}
                  end={pathEnd}
                  isPlaying={isPlaying}
                  speed={speed}
                  onComplete={handlePathComplete}
                  resetKey={pathResetKey}
                  index={i}
                  position={positionMap[algo.name] ?? null}
                />
              ))}
            </div>
          )}

          {/* Legend */}
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 justify-center">
            {activeTab === 'sorting' && (
              <>
                <LegendDot color="bg-slate-700/50" label="Unsorted" />
                <LegendDot color="bg-rose-400" label="Active" />
                <LegendDot color="bg-amber-400" label="Pivot" />
                <LegendDot color="bg-emerald-400/70" label="Sorted" />
              </>
            )}
            {activeTab === 'searching' && (
              <>
                <LegendDot color="bg-slate-600/60" label="In range" />
                <LegendDot color="bg-indigo-400/50" label="Checked" />
                <LegendDot color="bg-amber-400" label="Current" />
                <LegendDot color="bg-emerald-400" label="Found" />
              </>
            )}
            {activeTab === 'pathfinding' && (
              <>
                <LegendDot color="bg-emerald-500" label="Start" />
                <LegendDot color="bg-rose-500" label="End" />
                <LegendDot color="bg-slate-600/60" label="Wall" />
                <LegendDot color="bg-indigo-500/25" label="Explored" />
                <LegendDot color="bg-amber-400" label="Path" />
              </>
            )}
          </div>

          {/* Footer hint */}
          <div className="mt-8 text-center">
            <p className="text-slate-700 text-[10px] tracking-wider">
              Press <kbd>?</kbd> for shortcuts • <kbd>Space</kbd> play/pause • <kbd>C</kbd> cinema • <kbd>M</kbd> sound
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2.5 h-2.5 rounded-sm ${color} shrink-0`} />
      <span className="text-[11px] text-slate-500">{label}</span>
    </div>
  );
}

export { App };
