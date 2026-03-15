export interface AlgoMeta {
  name: string;
  complexity: string;
  color: string;
  description: string;
}

export const SORTING_META: Record<string, AlgoMeta> = {
  'Quick Sort': {
    name: 'Quick Sort',
    complexity: 'O(n log n)',
    color: 'text-emerald-400',
    description: 'Divide & conquer via pivot partitioning',
  },
  'Merge Sort': {
    name: 'Merge Sort',
    complexity: 'O(n log n)',
    color: 'text-emerald-400',
    description: 'Divide, sort halves, merge together',
  },
  'Heap Sort': {
    name: 'Heap Sort',
    complexity: 'O(n log n)',
    color: 'text-emerald-400',
    description: 'Build max-heap, extract maximum repeatedly',
  },
  'Shell Sort': {
    name: 'Shell Sort',
    complexity: 'O(n^1.3)',
    color: 'text-amber-400',
    description: 'Diminishing gap insertion sort variant',
  },
  'Radix Sort': {
    name: 'Radix Sort',
    complexity: 'O(nk)',
    color: 'text-emerald-400',
    description: 'Sort by individual digits, non-comparative',
  },
  'Comb Sort': {
    name: 'Comb Sort',
    complexity: 'O(n²/2^p)',
    color: 'text-amber-400',
    description: 'Shrinking gap bubble sort improvement',
  },
  'Cocktail Shaker': {
    name: 'Cocktail Shaker Sort',
    complexity: 'O(n²)',
    color: 'text-rose-400',
    description: 'Bidirectional bubble sort variant',
  },
  'Insertion Sort': {
    name: 'Insertion Sort',
    complexity: 'O(n²)',
    color: 'text-rose-400',
    description: 'Build sorted array one element at a time',
  },
  'Selection Sort': {
    name: 'Selection Sort',
    complexity: 'O(n²)',
    color: 'text-rose-400',
    description: 'Find minimum, place at front, repeat',
  },
  'Bubble Sort': {
    name: 'Bubble Sort',
    complexity: 'O(n²)',
    color: 'text-rose-400',
    description: 'Repeatedly swap adjacent elements',
  },
};

export const SEARCH_META: Record<string, AlgoMeta> = {
  'Binary Search': {
    name: 'Binary Search',
    complexity: 'O(log n)',
    color: 'text-emerald-400',
    description: 'Halve search space each step',
  },
  'Interpolation': {
    name: 'Interpolation Search',
    complexity: 'O(log log n)',
    color: 'text-emerald-400',
    description: 'Estimate position by value distribution',
  },
  'Ternary Search': {
    name: 'Ternary Search',
    complexity: 'O(log₃ n)',
    color: 'text-emerald-400',
    description: 'Split into thirds each iteration',
  },
  'Exponential': {
    name: 'Exponential Search',
    complexity: 'O(log n)',
    color: 'text-emerald-400',
    description: 'Find range exponentially, then binary search',
  },
  'Fibonacci': {
    name: 'Fibonacci Search',
    complexity: 'O(log n)',
    color: 'text-emerald-400',
    description: 'Divide using Fibonacci numbers',
  },
  'Jump Search': {
    name: 'Jump Search',
    complexity: 'O(√n)',
    color: 'text-amber-400',
    description: 'Jump ahead by √n, then linear scan',
  },
  'Linear Search': {
    name: 'Linear Search',
    complexity: 'O(n)',
    color: 'text-rose-400',
    description: 'Check every element sequentially',
  },
};

export const PATH_META: Record<string, AlgoMeta> = {
  'A* Search': {
    name: 'A* Search',
    complexity: 'O(E log V)',
    color: 'text-emerald-400',
    description: 'Optimal — combines cost + heuristic',
  },
  'Dijkstra': {
    name: "Dijkstra's Algorithm",
    complexity: 'O(E log V)',
    color: 'text-emerald-400',
    description: 'Optimal — uniform cost expansion',
  },
  'Greedy Best-First': {
    name: 'Greedy Best-First',
    complexity: 'O(E log V)',
    color: 'text-amber-400',
    description: 'Fast but not always optimal — heuristic only',
  },
  'Bidirectional BFS': {
    name: 'Bidirectional BFS',
    complexity: 'O(b^(d/2))',
    color: 'text-emerald-400',
    description: 'Search from both ends simultaneously',
  },
  'BFS': {
    name: 'Breadth-First Search',
    complexity: 'O(V + E)',
    color: 'text-amber-400',
    description: 'Guaranteed shortest path, layer by layer',
  },
  'DFS': {
    name: 'Depth-First Search',
    complexity: 'O(V + E)',
    color: 'text-rose-400',
    description: 'Deep exploration — no shortest path guarantee',
  },
};
