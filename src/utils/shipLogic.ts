import { CellShotState, Coord, Difficulty, Orientation, PlacedShip, ShipTemplate } from '../types/game';

export const GRID_SIZE = 10;
export const ROW_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
export const COL_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

export const FLEET_TEMPLATES: ShipTemplate[] = [
  { id: 'carrier', name: 'Avia-daşıyıcı', size: 5 },
  { id: 'battleship', name: 'Xətt gəmisi', size: 4 },
  { id: 'cruiser', name: 'Kreyser', size: 3 },
  { id: 'submarine', name: 'Sualtı qayıq', size: 3 },
  { id: 'destroyer', name: 'Eskadra minadaşıyanı', size: 2 },
];

export function formatCoord(row: number, col: number): string {
  return `${ROW_LABELS[row]}${COL_LABELS[col]}`;
}

export function createEmptyGrid(): CellShotState[][] {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => 'empty' as CellShotState)
  );
}

export function getShipCells(ship: Pick<PlacedShip, 'row' | 'col' | 'size' | 'orientation'>): Coord[] {
  const cells: Coord[] = [];
  for (let i = 0; i < ship.size; i++) {
    cells.push({
      row: ship.orientation === 'vertical' ? ship.row + i : ship.row,
      col: ship.orientation === 'horizontal' ? ship.col + i : ship.col,
    });
  }
  return cells;
}

export function canPlaceShip(
  ships: PlacedShip[],
  candidate: { row: number; col: number; size: number; orientation: Orientation },
  ignoreShipId?: string,
  requireBuffer = true
): boolean {
  const cells = getShipCells(candidate);

  for (const cell of cells) {
    if (cell.row < 0 || cell.row >= GRID_SIZE || cell.col < 0 || cell.col >= GRID_SIZE) {
      return false;
    }
  }

  const occupied = new Set<string>();
  for (const ship of ships) {
    if (ship.id === ignoreShipId) continue;
    for (const c of getShipCells(ship)) {
      if (requireBuffer) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            occupied.add(`${c.row + dr},${c.col + dc}`);
          }
        }
      } else {
        occupied.add(`${c.row},${c.col}`);
      }
    }
  }

  return cells.every((c) => !occupied.has(`${c.row},${c.col}`));
}

export function generateRandomFleet(): PlacedShip[] {
  const ships: PlacedShip[] = [];

  for (const template of FLEET_TEMPLATES) {
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 400) {
      attempts++;
      const orientation: Orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
      const maxRow = orientation === 'vertical' ? GRID_SIZE - template.size : GRID_SIZE - 1;
      const maxCol = orientation === 'horizontal' ? GRID_SIZE - template.size : GRID_SIZE - 1;
      const row = Math.floor(Math.random() * (maxRow + 1));
      const col = Math.floor(Math.random() * (maxCol + 1));

      if (canPlaceShip(ships, { row, col, size: template.size, orientation }, undefined, true)) {
        ships.push({
          ...template,
          row,
          col,
          orientation,
          hits: [],
          sunk: false,
        });
        placed = true;
      }
    }

    // Fallback without buffer if random placement got tight
    if (!placed) {
      for (let r = 0; r < GRID_SIZE && !placed; r++) {
        for (let c = 0; c < GRID_SIZE && !placed; c++) {
          for (const orientation of ['horizontal', 'vertical'] as Orientation[]) {
            if (canPlaceShip(ships, { row: r, col: c, size: template.size, orientation }, undefined, false)) {
              ships.push({
                ...template,
                row: r,
                col: c,
                orientation,
                hits: [],
                sunk: false,
              });
              placed = true;
              break;
            }
          }
        }
      }
    }
  }

  return ships;
}

export function applyShotToFleet(
  ships: PlacedShip[],
  grid: CellShotState[][],
  row: number,
  col: number
): {
  nextShips: PlacedShip[];
  nextGrid: CellShotState[][];
  outcome: 'hit' | 'miss' | 'sunk';
  sunkShip: PlacedShip | null;
} {
  const nextGrid = grid.map((r) => [...r]);
  let hitShip: PlacedShip | null = null;
  let sunkShip: PlacedShip | null = null;

  const nextShips = ships.map((ship) => {
    const cells = getShipCells(ship);
    const hitIdx = cells.findIndex((c) => c.row === row && c.col === col);
    if (hitIdx === -1) return ship;

    const updatedHits = ship.hits.includes(hitIdx) ? ship.hits : [...ship.hits, hitIdx];
    const isNowSunk = updatedHits.length >= ship.size;
    const updatedShip: PlacedShip = {
      ...ship,
      hits: updatedHits,
      sunk: isNowSunk,
    };
    hitShip = updatedShip;
    if (isNowSunk && !ship.sunk) {
      sunkShip = updatedShip;
    }
    return updatedShip;
  });

  if (hitShip) {
    nextGrid[row][col] = 'hit';
    return {
      nextShips,
      nextGrid,
      outcome: sunkShip ? 'sunk' : 'hit',
      sunkShip,
    };
  }

  nextGrid[row][col] = 'miss';
  return {
    nextShips,
    nextGrid,
    outcome: 'miss',
    sunkShip: null,
  };
}

export function chooseComputerTarget(
  playerGrid: CellShotState[][],
  playerShips: PlacedShip[],
  difficulty: Difficulty
): Coord {
  const available: Coord[] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (playerGrid[r][c] === 'empty') {
        available.push({ row: r, col: c });
      }
    }
  }

  if (available.length === 0) return { row: 0, col: 0 };

  // Find unsunk hit cells to hunt around (used for medium & hard)
  if (difficulty !== 'easy') {
    const activeHits: Coord[] = [];
    for (const ship of playerShips) {
      if (!ship.sunk && ship.hits.length > 0) {
        const cells = getShipCells(ship);
        for (const idx of ship.hits) {
          activeHits.push(cells[idx]);
        }
      }
    }

    if (activeHits.length > 0) {
      // Check aligned pairs first in hard mode
      if (difficulty === 'hard' && activeHits.length >= 2) {
        const alignedCandidates: Coord[] = [];
        for (let i = 0; i < activeHits.length; i++) {
          for (let j = i + 1; j < activeHits.length; j++) {
            const a = activeHits[i];
            const b = activeHits[j];
            if (a.row === b.row && Math.abs(a.col - b.col) === 1) {
              const left = { row: a.row, col: Math.min(a.col, b.col) - 1 };
              const right = { row: a.row, col: Math.max(a.col, b.col) + 1 };
              if (left.col >= 0 && playerGrid[left.row][left.col] === 'empty') alignedCandidates.push(left);
              if (right.col < GRID_SIZE && playerGrid[right.row][right.col] === 'empty') alignedCandidates.push(right);
            } else if (a.col === b.col && Math.abs(a.row - b.row) === 1) {
              const up = { row: Math.min(a.row, b.row) - 1, col: a.col };
              const down = { row: Math.max(a.row, b.row) + 1, col: a.col };
              if (up.row >= 0 && playerGrid[up.row][up.col] === 'empty') alignedCandidates.push(up);
              if (down.row < GRID_SIZE && playerGrid[down.row][down.col] === 'empty') alignedCandidates.push(down);
            }
          }
        }
        if (alignedCandidates.length > 0) {
          return alignedCandidates[Math.floor(Math.random() * alignedCandidates.length)];
        }
      }

      const neighbors: Coord[] = [];
      const dirs = [
        { dr: -1, dc: 0 },
        { dr: 1, dc: 0 },
        { dr: 0, dc: -1 },
        { dr: 0, dc: 1 },
      ];
      for (const hit of activeHits) {
        for (const d of dirs) {
          const nr = hit.row + d.dr;
          const nc = hit.col + d.dc;
          if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && playerGrid[nr][nc] === 'empty') {
            neighbors.push({ row: nr, col: nc });
          }
        }
      }

      if (neighbors.length > 0) {
        return neighbors[Math.floor(Math.random() * neighbors.length)];
      }
    }
  }

  // Hard mode uses checkerboard parity for hunt phase
  if (difficulty === 'hard') {
    const parity = available.filter((c) => (c.row + c.col) % 2 === 0);
    if (parity.length > 0) {
      return parity[Math.floor(Math.random() * parity.length)];
    }
  }

  return available[Math.floor(Math.random() * available.length)];
}

export function findRandomUnhitEnemyCell(enemyShips: PlacedShip[], enemyGrid: CellShotState[][]): Coord | null {
  const candidates: Coord[] = [];
  for (const ship of enemyShips) {
    if (ship.sunk) continue;
    const cells = getShipCells(ship);
    for (const c of cells) {
      if (enemyGrid[c.row][c.col] === 'empty') {
        candidates.push(c);
      }
    }
  }
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function getTotalFleetHealth(ships: PlacedShip[]): { remaining: number; total: number; afloat: number } {
  let total = 0;
  let hits = 0;
  let afloat = 0;
  for (const s of ships) {
    total += s.size;
    hits += s.hits.length;
    if (!s.sunk) afloat++;
  }
  return { remaining: total - hits, total, afloat };
}
