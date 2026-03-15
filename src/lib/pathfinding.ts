export type CellType = 'empty' | 'wall' | 'start' | 'end' | 'visited' | 'path' | 'current';

export type GridState = {
  grid: CellType[][];
  visitedCount: number;
  pathFound: boolean;
  pathLength: number;
};

export type PathGenerator = Generator<GridState, void, unknown>;

type Pos = [number, number];

function createGrid(rows: number, cols: number, walls: Set<string>, start: Pos, end: Pos): CellType[][] {
  const grid: CellType[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: CellType[] = [];
    for (let c = 0; c < cols; c++) {
      if (r === start[0] && c === start[1]) row.push('start');
      else if (r === end[0] && c === end[1]) row.push('end');
      else if (walls.has(`${r},${c}`)) row.push('wall');
      else row.push('empty');
    }
    grid.push(row);
  }
  return grid;
}

function cloneGrid(grid: CellType[][]): CellType[][] {
  return grid.map((r) => [...r]);
}

const DIRS: Pos[] = [
  [0, 1],
  [1, 0],
  [0, -1],
  [-1, 0],
];

export function generateMaze(rows: number, cols: number, density: number = 0.25): Set<string> {
  const walls = new Set<string>();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (Math.random() < density) {
        walls.add(`${r},${c}`);
      }
    }
  }
  // Ensure start and end are clear
  walls.delete('1,1');
  walls.delete(`${rows - 2},${cols - 2}`);
  // Clear around start and end
  for (const [dr, dc] of DIRS) {
    walls.delete(`${1 + dr},${1 + dc}`);
    walls.delete(`${rows - 2 + dr},${cols - 2 + dc}`);
  }
  return walls;
}

export function* bfs(
  rows: number,
  cols: number,
  walls: Set<string>,
  start: Pos,
  end: Pos
): PathGenerator {
  const grid = createGrid(rows, cols, walls, start, end);
  const visited = new Set<string>();
  const parent = new Map<string, string>();
  const queue: Pos[] = [start];
  visited.add(`${start[0]},${start[1]}`);
  let visitedCount = 0;

  while (queue.length > 0) {
    const [cr, cc] = queue.shift()!;
    visitedCount++;

    if (cr === end[0] && cc === end[1]) {
      // Trace path
      const pathGrid = cloneGrid(grid);
      let curr = `${end[0]},${end[1]}`;
      let pathLen = 0;
      while (curr !== `${start[0]},${start[1]}`) {
        const [pr, pc] = curr.split(',').map(Number);
        if (!(pr === end[0] && pc === end[1])) pathGrid[pr][pc] = 'path';
        pathLen++;
        curr = parent.get(curr)!;
      }
      yield { grid: pathGrid, visitedCount, pathFound: true, pathLength: pathLen };
      return;
    }

    for (const [dr, dc] of DIRS) {
      const nr = cr + dr;
      const nc = cc + dc;
      const key = `${nr},${nc}`;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited.has(key) && !walls.has(key)) {
        visited.add(key);
        parent.set(key, `${cr},${cc}`);
        queue.push([nr, nc]);
        if (!(nr === end[0] && nc === end[1])) {
          grid[nr][nc] = 'visited';
        }
      }
    }

    if (!(cr === start[0] && cc === start[1])) {
      grid[cr][cc] = 'visited';
    }

    yield { grid: cloneGrid(grid), visitedCount, pathFound: false, pathLength: 0 };
  }

  yield { grid: cloneGrid(grid), visitedCount, pathFound: false, pathLength: 0 };
}

export function* dfs(
  rows: number,
  cols: number,
  walls: Set<string>,
  start: Pos,
  end: Pos
): PathGenerator {
  const grid = createGrid(rows, cols, walls, start, end);
  const visited = new Set<string>();
  const parent = new Map<string, string>();
  const stack: Pos[] = [start];
  visited.add(`${start[0]},${start[1]}`);
  let visitedCount = 0;

  while (stack.length > 0) {
    const [cr, cc] = stack.pop()!;
    visitedCount++;

    if (cr === end[0] && cc === end[1]) {
      const pathGrid = cloneGrid(grid);
      let curr = `${end[0]},${end[1]}`;
      let pathLen = 0;
      while (curr !== `${start[0]},${start[1]}`) {
        const [pr, pc] = curr.split(',').map(Number);
        if (!(pr === end[0] && pc === end[1])) pathGrid[pr][pc] = 'path';
        pathLen++;
        curr = parent.get(curr)!;
      }
      yield { grid: pathGrid, visitedCount, pathFound: true, pathLength: pathLen };
      return;
    }

    if (!(cr === start[0] && cc === start[1])) {
      grid[cr][cc] = 'visited';
    }

    // Shuffle directions for variety
    const shuffled = [...DIRS].sort(() => Math.random() - 0.5);
    for (const [dr, dc] of shuffled) {
      const nr = cr + dr;
      const nc = cc + dc;
      const key = `${nr},${nc}`;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited.has(key) && !walls.has(key)) {
        visited.add(key);
        parent.set(key, `${cr},${cc}`);
        stack.push([nr, nc]);
      }
    }

    yield { grid: cloneGrid(grid), visitedCount, pathFound: false, pathLength: 0 };
  }

  yield { grid: cloneGrid(grid), visitedCount, pathFound: false, pathLength: 0 };
}

export function* aStar(
  rows: number,
  cols: number,
  walls: Set<string>,
  start: Pos,
  end: Pos
): PathGenerator {
  const grid = createGrid(rows, cols, walls, start, end);
  const heuristic = (r: number, c: number) => Math.abs(r - end[0]) + Math.abs(c - end[1]);

  const openSet: { pos: Pos; f: number; g: number }[] = [
    { pos: start, f: heuristic(start[0], start[1]), g: 0 },
  ];
  const visited = new Set<string>();
  const parent = new Map<string, string>();
  const gScore = new Map<string, number>();
  gScore.set(`${start[0]},${start[1]}`, 0);
  let visitedCount = 0;

  while (openSet.length > 0) {
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift()!;
    const [cr, cc] = current.pos;
    const cKey = `${cr},${cc}`;

    if (visited.has(cKey)) continue;
    visited.add(cKey);
    visitedCount++;

    if (cr === end[0] && cc === end[1]) {
      const pathGrid = cloneGrid(grid);
      let curr = `${end[0]},${end[1]}`;
      let pathLen = 0;
      while (curr !== `${start[0]},${start[1]}`) {
        const [pr, pc] = curr.split(',').map(Number);
        if (!(pr === end[0] && pc === end[1])) pathGrid[pr][pc] = 'path';
        pathLen++;
        curr = parent.get(curr)!;
      }
      yield { grid: pathGrid, visitedCount, pathFound: true, pathLength: pathLen };
      return;
    }

    if (!(cr === start[0] && cc === start[1])) {
      grid[cr][cc] = 'visited';
    }

    for (const [dr, dc] of DIRS) {
      const nr = cr + dr;
      const nc = cc + dc;
      const nKey = `${nr},${nc}`;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited.has(nKey) && !walls.has(nKey)) {
        const tentG = (gScore.get(cKey) ?? Infinity) + 1;
        if (tentG < (gScore.get(nKey) ?? Infinity)) {
          gScore.set(nKey, tentG);
          parent.set(nKey, cKey);
          openSet.push({ pos: [nr, nc], f: tentG + heuristic(nr, nc), g: tentG });
          if (!(nr === end[0] && nc === end[1])) {
            grid[nr][nc] = 'visited';
          }
        }
      }
    }

    yield { grid: cloneGrid(grid), visitedCount, pathFound: false, pathLength: 0 };
  }

  yield { grid: cloneGrid(grid), visitedCount, pathFound: false, pathLength: 0 };
}

export function* greedy(
  rows: number,
  cols: number,
  walls: Set<string>,
  start: Pos,
  end: Pos
): PathGenerator {
  const grid = createGrid(rows, cols, walls, start, end);
  const heuristic = (r: number, c: number) => Math.abs(r - end[0]) + Math.abs(c - end[1]);

  const openSet: { pos: Pos; h: number }[] = [
    { pos: start, h: heuristic(start[0], start[1]) },
  ];
  const visited = new Set<string>();
  const parent = new Map<string, string>();
  let visitedCount = 0;

  while (openSet.length > 0) {
    openSet.sort((a, b) => a.h - b.h);
    const current = openSet.shift()!;
    const [cr, cc] = current.pos;
    const cKey = `${cr},${cc}`;

    if (visited.has(cKey)) continue;
    visited.add(cKey);
    visitedCount++;

    if (cr === end[0] && cc === end[1]) {
      const pathGrid = cloneGrid(grid);
      let curr = `${end[0]},${end[1]}`;
      let pathLen = 0;
      while (curr !== `${start[0]},${start[1]}`) {
        const [pr, pc] = curr.split(',').map(Number);
        if (!(pr === end[0] && pc === end[1])) pathGrid[pr][pc] = 'path';
        pathLen++;
        curr = parent.get(curr)!;
      }
      yield { grid: pathGrid, visitedCount, pathFound: true, pathLength: pathLen };
      return;
    }

    if (!(cr === start[0] && cc === start[1])) {
      grid[cr][cc] = 'visited';
    }

    for (const [dr, dc] of DIRS) {
      const nr = cr + dr;
      const nc = cc + dc;
      const nKey = `${nr},${nc}`;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited.has(nKey) && !walls.has(nKey)) {
        parent.set(nKey, cKey);
        openSet.push({ pos: [nr, nc], h: heuristic(nr, nc) });
      }
    }

    yield { grid: cloneGrid(grid), visitedCount, pathFound: false, pathLength: 0 };
  }

  yield { grid: cloneGrid(grid), visitedCount, pathFound: false, pathLength: 0 };
}

export function* dijkstra(
  rows: number,
  cols: number,
  walls: Set<string>,
  start: Pos,
  end: Pos
): PathGenerator {
  const grid = createGrid(rows, cols, walls, start, end);
  const dist = new Map<string, number>();
  const parent = new Map<string, string>();
  const visited = new Set<string>();

  const pq: { pos: Pos; d: number }[] = [{ pos: start, d: 0 }];
  dist.set(`${start[0]},${start[1]}`, 0);
  let visitedCount = 0;

  while (pq.length > 0) {
    pq.sort((a, b) => a.d - b.d);
    const current = pq.shift()!;
    const [cr, cc] = current.pos;
    const cKey = `${cr},${cc}`;

    if (visited.has(cKey)) continue;
    visited.add(cKey);
    visitedCount++;

    if (cr === end[0] && cc === end[1]) {
      const pathGrid = cloneGrid(grid);
      let curr = `${end[0]},${end[1]}`;
      let pathLen = 0;
      while (curr !== `${start[0]},${start[1]}`) {
        const [pr, pc] = curr.split(',').map(Number);
        if (!(pr === end[0] && pc === end[1])) pathGrid[pr][pc] = 'path';
        pathLen++;
        curr = parent.get(curr)!;
      }
      yield { grid: pathGrid, visitedCount, pathFound: true, pathLength: pathLen };
      return;
    }

    if (!(cr === start[0] && cc === start[1])) {
      grid[cr][cc] = 'visited';
    }

    for (const [dr, dc] of DIRS) {
      const nr = cr + dr;
      const nc = cc + dc;
      const nKey = `${nr},${nc}`;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited.has(nKey) && !walls.has(nKey)) {
        const newDist = (dist.get(cKey) ?? Infinity) + 1;
        if (newDist < (dist.get(nKey) ?? Infinity)) {
          dist.set(nKey, newDist);
          parent.set(nKey, cKey);
          pq.push({ pos: [nr, nc], d: newDist });
          if (!(nr === end[0] && nc === end[1])) {
            grid[nr][nc] = 'visited';
          }
        }
      }
    }

    yield { grid: cloneGrid(grid), visitedCount, pathFound: false, pathLength: 0 };
  }

  yield { grid: cloneGrid(grid), visitedCount, pathFound: false, pathLength: 0 };
}

export function* bidirectionalBfs(
  rows: number,
  cols: number,
  walls: Set<string>,
  start: Pos,
  end: Pos
): PathGenerator {
  const grid = createGrid(rows, cols, walls, start, end);
  const visitedFwd = new Set<string>();
  const visitedBwd = new Set<string>();
  const parentFwd = new Map<string, string>();
  const parentBwd = new Map<string, string>();

  const qFwd: Pos[] = [start];
  const qBwd: Pos[] = [end];
  visitedFwd.add(`${start[0]},${start[1]}`);
  visitedBwd.add(`${end[0]},${end[1]}`);
  let visitedCount = 0;

  while (qFwd.length > 0 || qBwd.length > 0) {
    // Forward expansion
    if (qFwd.length > 0) {
      const [cr, cc] = qFwd.shift()!;
      visitedCount++;
      if (!(cr === start[0] && cc === start[1]) && !(cr === end[0] && cc === end[1])) {
        grid[cr][cc] = 'visited';
      }

      for (const [dr, dc] of DIRS) {
        const nr = cr + dr;
        const nc = cc + dc;
        const key = `${nr},${nc}`;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visitedFwd.has(key) && !walls.has(key)) {
          visitedFwd.add(key);
          parentFwd.set(key, `${cr},${cc}`);
          qFwd.push([nr, nc]);
          if (!(nr === end[0] && nc === end[1]) && !(nr === start[0] && nc === start[1])) {
            grid[nr][nc] = 'visited';
          }
          if (visitedBwd.has(key)) {
            // Reconstruct path through meeting point
            const pathGrid = cloneGrid(grid);
            let pathLen = 0;
            let c = key;
            while (c !== `${start[0]},${start[1]}`) {
              const [pr, pc] = c.split(',').map(Number);
              if (!(pr === start[0] && pc === start[1]) && !(pr === end[0] && pc === end[1]))
                pathGrid[pr][pc] = 'path';
              pathLen++;
              const p = parentFwd.get(c);
              if (!p) break;
              c = p;
            }
            c = key;
            while (c !== `${end[0]},${end[1]}`) {
              const [pr, pc] = c.split(',').map(Number);
              if (!(pr === start[0] && pc === start[1]) && !(pr === end[0] && pc === end[1]))
                pathGrid[pr][pc] = 'path';
              pathLen++;
              const p = parentBwd.get(c);
              if (!p) break;
              c = p;
            }
            yield { grid: pathGrid, visitedCount, pathFound: true, pathLength: pathLen };
            return;
          }
        }
      }
      yield { grid: cloneGrid(grid), visitedCount, pathFound: false, pathLength: 0 };
    }

    // Backward expansion
    if (qBwd.length > 0) {
      const [cr, cc] = qBwd.shift()!;
      visitedCount++;
      if (!(cr === start[0] && cc === start[1]) && !(cr === end[0] && cc === end[1])) {
        grid[cr][cc] = 'visited';
      }

      for (const [dr, dc] of DIRS) {
        const nr = cr + dr;
        const nc = cc + dc;
        const key = `${nr},${nc}`;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visitedBwd.has(key) && !walls.has(key)) {
          visitedBwd.add(key);
          parentBwd.set(key, `${cr},${cc}`);
          qBwd.push([nr, nc]);
          if (!(nr === end[0] && nc === end[1]) && !(nr === start[0] && nc === start[1])) {
            grid[nr][nc] = 'visited';
          }
          if (visitedFwd.has(key)) {
            const pathGrid = cloneGrid(grid);
            let pathLen = 0;
            let c = key;
            while (c !== `${start[0]},${start[1]}`) {
              const [pr, pc] = c.split(',').map(Number);
              if (!(pr === start[0] && pc === start[1]) && !(pr === end[0] && pc === end[1]))
                pathGrid[pr][pc] = 'path';
              pathLen++;
              const p = parentFwd.get(c);
              if (!p) break;
              c = p;
            }
            c = key;
            while (c !== `${end[0]},${end[1]}`) {
              const [pr, pc] = c.split(',').map(Number);
              if (!(pr === start[0] && pc === start[1]) && !(pr === end[0] && pc === end[1]))
                pathGrid[pr][pc] = 'path';
              pathLen++;
              const p = parentBwd.get(c);
              if (!p) break;
              c = p;
            }
            yield { grid: pathGrid, visitedCount, pathFound: true, pathLength: pathLen };
            return;
          }
        }
      }
      yield { grid: cloneGrid(grid), visitedCount, pathFound: false, pathLength: 0 };
    }
  }

  yield { grid: cloneGrid(grid), visitedCount, pathFound: false, pathLength: 0 };
}
