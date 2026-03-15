export type SearchState = {
  array: number[];
  target: number;
  currentIndex: number;
  searchRange: [number, number]; // highlighted search range
  found: boolean;
  checkedIndices: number[];
};

export type SearchGenerator = Generator<SearchState, void, unknown>;

export function* linearSearch(arr: number[], target: number): SearchGenerator {
  const array = [...arr];
  const checked: number[] = [];
  for (let i = 0; i < array.length; i++) {
    checked.push(i);
    const found = array[i] === target;
    yield {
      array,
      target,
      currentIndex: i,
      searchRange: [0, array.length - 1],
      found,
      checkedIndices: [...checked],
    };
    if (found) return;
  }
}

export function* binarySearch(arr: number[], target: number): SearchGenerator {
  const array = [...arr];
  const checked: number[] = [];
  let low = 0;
  let high = array.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    checked.push(mid);
    const found = array[mid] === target;
    yield {
      array,
      target,
      currentIndex: mid,
      searchRange: [low, high],
      found,
      checkedIndices: [...checked],
    };
    if (found) return;
    if (array[mid] < target) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
}

export function* jumpSearch(arr: number[], target: number): SearchGenerator {
  const array = [...arr];
  const n = array.length;
  const checked: number[] = [];
  const step = Math.floor(Math.sqrt(n));
  let prev = 0;
  let curr = step;

  // Jump phase
  while (curr < n && array[Math.min(curr, n) - 1] < target) {
    checked.push(curr - 1);
    yield {
      array,
      target,
      currentIndex: curr - 1,
      searchRange: [prev, Math.min(curr, n) - 1],
      found: false,
      checkedIndices: [...checked],
    };
    prev = curr;
    curr += step;
  }

  // Linear phase in the block
  for (let i = prev; i < Math.min(curr, n); i++) {
    checked.push(i);
    const found = array[i] === target;
    yield {
      array,
      target,
      currentIndex: i,
      searchRange: [prev, Math.min(curr, n) - 1],
      found,
      checkedIndices: [...checked],
    };
    if (found) return;
  }
}

export function* exponentialSearch(arr: number[], target: number): SearchGenerator {
  const array = [...arr];
  const n = array.length;
  const checked: number[] = [];

  if (array[0] === target) {
    checked.push(0);
    yield {
      array,
      target,
      currentIndex: 0,
      searchRange: [0, 0],
      found: true,
      checkedIndices: [...checked],
    };
    return;
  }

  // Find range
  let bound = 1;
  while (bound < n && array[bound] <= target) {
    checked.push(bound);
    yield {
      array,
      target,
      currentIndex: bound,
      searchRange: [Math.floor(bound / 2), Math.min(bound, n - 1)],
      found: false,
      checkedIndices: [...checked],
    };
    bound *= 2;
  }

  // Binary search in found range
  let low = Math.floor(bound / 2);
  let high = Math.min(bound, n - 1);

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    checked.push(mid);
    const found = array[mid] === target;
    yield {
      array,
      target,
      currentIndex: mid,
      searchRange: [low, high],
      found,
      checkedIndices: [...checked],
    };
    if (found) return;
    if (array[mid] < target) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
}

export function* ternarySearch(arr: number[], target: number): SearchGenerator {
  const array = [...arr];
  const checked: number[] = [];
  let low = 0;
  let high = array.length - 1;

  while (low <= high) {
    const mid1 = low + Math.floor((high - low) / 3);
    const mid2 = high - Math.floor((high - low) / 3);

    checked.push(mid1);
    yield {
      array,
      target,
      currentIndex: mid1,
      searchRange: [low, high],
      found: array[mid1] === target,
      checkedIndices: [...checked],
    };
    if (array[mid1] === target) return;

    checked.push(mid2);
    yield {
      array,
      target,
      currentIndex: mid2,
      searchRange: [low, high],
      found: array[mid2] === target,
      checkedIndices: [...checked],
    };
    if (array[mid2] === target) return;

    if (target < array[mid1]) {
      high = mid1 - 1;
    } else if (target > array[mid2]) {
      low = mid2 + 1;
    } else {
      low = mid1 + 1;
      high = mid2 - 1;
    }
  }
}

export function* interpolationSearch(arr: number[], target: number): SearchGenerator {
  const array = [...arr];
  const checked: number[] = [];
  let low = 0;
  let high = array.length - 1;

  while (low <= high && target >= array[low] && target <= array[high]) {
    if (low === high) {
      checked.push(low);
      yield {
        array,
        target,
        currentIndex: low,
        searchRange: [low, high],
        found: array[low] === target,
        checkedIndices: [...checked],
      };
      return;
    }

    const pos = low + Math.floor(((target - array[low]) * (high - low)) / (array[high] - array[low]));
    const clampedPos = Math.max(low, Math.min(pos, high));

    checked.push(clampedPos);
    const found = array[clampedPos] === target;
    yield {
      array,
      target,
      currentIndex: clampedPos,
      searchRange: [low, high],
      found,
      checkedIndices: [...checked],
    };
    if (found) return;

    if (array[clampedPos] < target) {
      low = clampedPos + 1;
    } else {
      high = clampedPos - 1;
    }
  }
}

export function* fibonacciSearch(arr: number[], target: number): SearchGenerator {
  const array = [...arr];
  const n = array.length;
  const checked: number[] = [];

  // Find smallest Fibonacci number >= n
  let fibM2 = 0; // (m-2)'th Fibonacci
  let fibM1 = 1; // (m-1)'th Fibonacci
  let fibM = fibM2 + fibM1; // m'th Fibonacci

  while (fibM < n) {
    fibM2 = fibM1;
    fibM1 = fibM;
    fibM = fibM2 + fibM1;
  }

  let offset = -1;

  while (fibM > 1) {
    const i = Math.min(offset + fibM2, n - 1);
    checked.push(i);

    const found = array[i] === target;
    yield {
      array,
      target,
      currentIndex: i,
      searchRange: [Math.max(0, offset + 1), Math.min(offset + fibM, n - 1)],
      found,
      checkedIndices: [...checked],
    };
    if (found) return;

    if (array[i] < target) {
      fibM = fibM1;
      fibM1 = fibM2;
      fibM2 = fibM - fibM1;
      offset = i;
    } else {
      fibM = fibM2;
      fibM1 = fibM1 - fibM2;
      fibM2 = fibM - fibM1;
    }
  }

  // Check last element
  if (fibM1 && offset + 1 < n) {
    const idx = offset + 1;
    checked.push(idx);
    yield {
      array,
      target,
      currentIndex: idx,
      searchRange: [idx, idx],
      found: array[idx] === target,
      checkedIndices: [...checked],
    };
  }
}
