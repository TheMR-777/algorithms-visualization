export type SortState = {
  array: number[];
  activeIndices: number[];
  pivotIndex: number;
};

export type SortingGenerator = Generator<SortState, void, unknown>;

function swap(arr: number[], i: number, j: number) {
  const temp = arr[i];
  arr[i] = arr[j];
  arr[j] = temp;
}

export function* shellSort(arr: number[]): SortingGenerator {
  const n = arr.length;
  const array = [...arr];
  for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
    for (let i = gap; i < n; i++) {
      const temp = array[i];
      let j;
      yield { array: [...array], activeIndices: [i, i - gap], pivotIndex: -1 };
      for (j = i; j >= gap && array[j - gap] > temp; j -= gap) {
        array[j] = array[j - gap];
        yield { array: [...array], activeIndices: [j, j - gap], pivotIndex: -1 };
      }
      array[j] = temp;
      yield { array: [...array], activeIndices: [j], pivotIndex: -1 };
    }
  }
  yield { array: [...array], activeIndices: [], pivotIndex: -1 };
}

export function* bubbleSort(arr: number[]): SortingGenerator {
  const n = arr.length;
  const array = [...arr];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      yield { array: [...array], activeIndices: [j, j + 1], pivotIndex: -1 };
      if (array[j] > array[j + 1]) {
        swap(array, j, j + 1);
        yield { array: [...array], activeIndices: [j, j + 1], pivotIndex: -1 };
      }
    }
  }
  yield { array: [...array], activeIndices: [], pivotIndex: -1 };
}

export function* selectionSort(arr: number[]): SortingGenerator {
  const n = arr.length;
  const array = [...arr];
  for (let i = 0; i < n; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      yield { array: [...array], activeIndices: [minIdx, j], pivotIndex: i };
      if (array[j] < array[minIdx]) {
        minIdx = j;
      }
    }
    if (minIdx !== i) {
      swap(array, minIdx, i);
      yield { array: [...array], activeIndices: [minIdx, i], pivotIndex: i };
    }
  }
  yield { array: [...array], activeIndices: [], pivotIndex: -1 };
}

export function* insertionSort(arr: number[]): SortingGenerator {
  const n = arr.length;
  const array = [...arr];
  for (let i = 1; i < n; i++) {
    const key = array[i];
    let j = i - 1;
    yield { array: [...array], activeIndices: [i, j], pivotIndex: i };
    
    while (j >= 0 && array[j] > key) {
      yield { array: [...array], activeIndices: [j, j + 1], pivotIndex: i };
      array[j + 1] = array[j];
      j = j - 1;
    }
    array[j + 1] = key;
    yield { array: [...array], activeIndices: [j + 1], pivotIndex: i };
  }
  yield { array: [...array], activeIndices: [], pivotIndex: -1 };
}

export function* mergeSort(arr: number[]): SortingGenerator {
  const array = [...arr];

  function* merge(left: number, mid: number, right: number): SortingGenerator {
    const leftArr = array.slice(left, mid + 1);
    const rightArr = array.slice(mid + 1, right + 1);
    
    let i = 0, j = 0, k = left;

    while (i < leftArr.length && j < rightArr.length) {
      yield { array: [...array], activeIndices: [k, left + i, mid + 1 + j], pivotIndex: -1 };
      if (leftArr[i] <= rightArr[j]) {
        array[k] = leftArr[i];
        i++;
      } else {
        array[k] = rightArr[j];
        j++;
      }
      yield { array: [...array], activeIndices: [k], pivotIndex: -1 };
      k++;
    }

    while (i < leftArr.length) {
      yield { array: [...array], activeIndices: [k, left + i], pivotIndex: -1 };
      array[k] = leftArr[i];
      yield { array: [...array], activeIndices: [k], pivotIndex: -1 };
      i++;
      k++;
    }

    while (j < rightArr.length) {
      yield { array: [...array], activeIndices: [k, mid + 1 + j], pivotIndex: -1 };
      array[k] = rightArr[j];
      yield { array: [...array], activeIndices: [k], pivotIndex: -1 };
      j++;
      k++;
    }
  }

  function* mergeSortHelper(left: number, right: number): SortingGenerator {
    if (left >= right) return;
    const mid = left + Math.floor((right - left) / 2);
    yield* mergeSortHelper(left, mid);
    yield* mergeSortHelper(mid + 1, right);
    yield* merge(left, mid, right);
  }

  yield* mergeSortHelper(0, array.length - 1);
  yield { array: [...array], activeIndices: [], pivotIndex: -1 };
}

export function* quickSort(arr: number[]): SortingGenerator {
  const array = [...arr];

  function* partition(low: number, high: number): Generator<SortState, number, unknown> {
    const pivot = array[high];
    let i = low - 1;

    for (let j = low; j < high; j++) {
      yield { array: [...array], activeIndices: [j, high], pivotIndex: high };
      if (array[j] < pivot) {
        i++;
        swap(array, i, j);
        yield { array: [...array], activeIndices: [i, j], pivotIndex: high };
      }
    }
    swap(array, i + 1, high);
    yield { array: [...array], activeIndices: [i + 1, high], pivotIndex: high };
    return i + 1;
  }

  function* quickSortHelper(low: number, high: number): SortingGenerator {
    if (low < high) {
      const piGenerator = partition(low, high);
      let next = piGenerator.next();
      let pi = -1;
      while (!next.done) {
        yield next.value;
        next = piGenerator.next();
      }
      pi = next.value as number;

      yield* quickSortHelper(low, pi - 1);
      yield* quickSortHelper(pi + 1, high);
    }
  }

  yield* quickSortHelper(0, array.length - 1);
  yield { array: [...array], activeIndices: [], pivotIndex: -1 };
}

// ─── New Algorithms ──────────────────────────────

export function* heapSort(arr: number[]): SortingGenerator {
  const array = [...arr];
  const n = array.length;

  function* heapify(size: number, root: number): SortingGenerator {
    let largest = root;
    const left = 2 * root + 1;
    const right = 2 * root + 2;

    if (left < size && array[left] > array[largest]) largest = left;
    if (right < size && array[right] > array[largest]) largest = right;

    if (largest !== root) {
      yield { array: [...array], activeIndices: [root, largest], pivotIndex: root };
      swap(array, root, largest);
      yield { array: [...array], activeIndices: [root, largest], pivotIndex: root };
      yield* heapify(size, largest);
    }
  }

  // Build max heap
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    yield* heapify(n, i);
  }

  // Extract elements one by one
  for (let i = n - 1; i > 0; i--) {
    yield { array: [...array], activeIndices: [0, i], pivotIndex: i };
    swap(array, 0, i);
    yield { array: [...array], activeIndices: [0, i], pivotIndex: i };
    yield* heapify(i, 0);
  }

  yield { array: [...array], activeIndices: [], pivotIndex: -1 };
}

export function* radixSort(arr: number[]): SortingGenerator {
  const array = [...arr];
  const maxVal = Math.max(...array);

  for (let exp = 1; Math.floor(maxVal / exp) > 0; exp *= 10) {
    const output = new Array(array.length);
    const count = new Array(10).fill(0);

    for (let i = 0; i < array.length; i++) {
      const digit = Math.floor(array[i] / exp) % 10;
      count[digit]++;
      yield { array: [...array], activeIndices: [i], pivotIndex: -1 };
    }

    for (let i = 1; i < 10; i++) {
      count[i] += count[i - 1];
    }

    for (let i = array.length - 1; i >= 0; i--) {
      const digit = Math.floor(array[i] / exp) % 10;
      output[count[digit] - 1] = array[i];
      count[digit]--;
      yield { array: [...array], activeIndices: [i, count[digit]], pivotIndex: -1 };
    }

    for (let i = 0; i < array.length; i++) {
      array[i] = output[i];
      yield { array: [...array], activeIndices: [i], pivotIndex: -1 };
    }
  }

  yield { array: [...array], activeIndices: [], pivotIndex: -1 };
}

export function* cocktailShakerSort(arr: number[]): SortingGenerator {
  const array = [...arr];
  let start = 0;
  let end = array.length - 1;
  let swapped = true;

  while (swapped) {
    swapped = false;

    // Forward pass
    for (let i = start; i < end; i++) {
      yield { array: [...array], activeIndices: [i, i + 1], pivotIndex: -1 };
      if (array[i] > array[i + 1]) {
        swap(array, i, i + 1);
        yield { array: [...array], activeIndices: [i, i + 1], pivotIndex: -1 };
        swapped = true;
      }
    }

    if (!swapped) break;
    end--;

    swapped = false;
    // Backward pass
    for (let i = end - 1; i >= start; i--) {
      yield { array: [...array], activeIndices: [i, i + 1], pivotIndex: -1 };
      if (array[i] > array[i + 1]) {
        swap(array, i, i + 1);
        yield { array: [...array], activeIndices: [i, i + 1], pivotIndex: -1 };
        swapped = true;
      }
    }
    start++;
  }

  yield { array: [...array], activeIndices: [], pivotIndex: -1 };
}

export function* combSort(arr: number[]): SortingGenerator {
  const array = [...arr];
  const n = array.length;
  let gap = n;
  const shrink = 1.3;
  let sorted = false;

  while (!sorted) {
    gap = Math.floor(gap / shrink);
    if (gap <= 1) {
      gap = 1;
      sorted = true;
    }

    for (let i = 0; i + gap < n; i++) {
      yield { array: [...array], activeIndices: [i, i + gap], pivotIndex: -1 };
      if (array[i] > array[i + gap]) {
        swap(array, i, i + gap);
        yield { array: [...array], activeIndices: [i, i + gap], pivotIndex: -1 };
        sorted = false;
      }
    }
  }

  yield { array: [...array], activeIndices: [], pivotIndex: -1 };
}
