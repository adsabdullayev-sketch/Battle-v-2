import React from 'react';
import { CellShotState, Coord, PlacedShip } from '../types/game';
import { COL_LABELS, GRID_SIZE, ROW_LABELS, getShipCells } from '../utils/shipLogic';
import { ExplosionMarker, ShipGraphic, WaterSplashMarker } from './ShipGraphic';

interface BattleGridProps {
  title: string;
  subtitle: string;
  grid: CellShotState[][];
  ships: PlacedShip[];
  isEnemy: boolean;
  interactive: boolean;
  setupMode?: boolean;
  selectedShipId?: string | null;
  radarHintCells?: Coord[];
  lastShot?: Coord | null;
  shake?: boolean;
  onCellClick?: (row: number, col: number) => void;
  onShipSelectInSetup?: (shipId: string) => void;
}

export const BattleGrid: React.FC<BattleGridProps> = ({
  title,
  subtitle,
  grid,
  ships,
  isEnemy,
  interactive,
  setupMode = false,
  selectedShipId = null,
  radarHintCells = [],
  lastShot = null,
  shake = false,
  onCellClick,
  onShipSelectInSetup,
}) => {
  const hintSet = new Set(radarHintCells.map((c) => `${c.row},${c.col}`));

  // Map ship occupancy for fast lookup in setup mode or hit coloring
  const shipAtCell = new Map<string, PlacedShip>();
  for (const ship of ships) {
    for (const c of getShipCells(ship)) {
      shipAtCell.set(`${c.row},${c.col}`, ship);
    }
  }

  // Visible ships:
  // - On player grid: show all ships
  // - On enemy grid: show only sunk ships (just like classic Battleship!)
  const visibleShips = isEnemy ? ships.filter((s) => s.sunk) : ships;

  const remainingSegments = ships.reduce((acc, s) => acc + (s.size - s.hits.length), 0);
  const totalSegments = ships.reduce((acc, s) => acc + s.size, 0);
  const afloatCount = ships.filter((s) => !s.sunk).length;

  return (
    <section
      className={`flex flex-col bg-[#0B1E3B] border border-blue-800/60 rounded-xl p-3 sm:p-4 shadow-lg transition-transform ${
        shake ? 'animate-board-shake' : ''
      }`}
    >
      {/* Grid Header */}
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <div>
          <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-white">
            {title}
          </h2>
          <p className="text-xs text-blue-200/75 mt-0.5">{subtitle}</p>
        </div>
        <div className="text-right font-mono text-xs tabular-nums text-blue-200 shrink-0">
          <span>{afloatCount}/{ships.length} gəmi</span>
          <span className="mx-1.5 text-blue-500">·</span>
          <span>{remainingSegments}/{totalSegments} bölmə</span>
        </div>
      </div>

      {/* 10x10 Coordinate Grid */}
      <div className="w-full max-w-[440px] mx-auto select-none">
        {/* Column Numbers 1..10 */}
        <div className="grid grid-cols-[24px_repeat(10,minmax(0,1fr))] mb-1">
          <div />
          {COL_LABELS.map((col) => (
            <div
              key={col}
              className="text-center font-mono text-[11px] sm:text-xs font-bold text-blue-200/90 tabular-nums"
            >
              {col}
            </div>
          ))}
        </div>

        {/* Rows A..J + Ocean Board */}
        <div className="flex">
          {/* Row Letters */}
          <div className="w-6 grid grid-rows-10 shrink-0">
            {ROW_LABELS.map((rowLabel) => (
              <div
                key={rowLabel}
                className="flex items-center justify-center font-mono text-[11px] sm:text-xs font-bold text-blue-200/90"
              >
                {rowLabel}
              </div>
            ))}
          </div>

          {/* 10x10 Relative Container (ships layer + cells layer) */}
          <div className="relative flex-1 aspect-square bg-[#082458] border-2 border-blue-400/60 rounded-md overflow-hidden shadow-inner">
            {/* Base Grid Cells */}
            <div className="grid grid-cols-10 grid-rows-10 w-full h-full">
              {Array.from({ length: GRID_SIZE }).map((_, r) =>
                Array.from({ length: GRID_SIZE }).map((__, c) => {
                  const cellState = grid[r][c];
                  const isLast = lastShot?.row === r && lastShot?.col === c;
                  const isRadarHint = hintSet.has(`${r},${c}`) && cellState === 'empty';
                  const occupyingShip = !isEnemy ? shipAtCell.get(`${r},${c}`) : undefined;
                  const isSelectedSetup = setupMode && occupyingShip && occupyingShip.id === selectedShipId;
                  const canClick =
                    (interactive && isEnemy && cellState === 'empty') ||
                    (setupMode && !isEnemy);

                  return (
                    <button
                      key={`${r}-${c}`}
                      type="button"
                      disabled={!canClick}
                      onClick={() => {
                        if (setupMode && !isEnemy && occupyingShip && onShipSelectInSetup) {
                          onShipSelectInSetup(occupyingShip.id);
                          return;
                        }
                        if (onCellClick && canClick) {
                          onCellClick(r, c);
                        }
                      }}
                      aria-label={`${title} ${ROW_LABELS[r]}${COL_LABELS[c]}`}
                      className={`relative border border-blue-400/25 flex items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:z-30 ${
                        canClick
                          ? isEnemy
                            ? 'hover:bg-sky-400/25 cursor-crosshair'
                            : 'hover:bg-sky-400/20 cursor-pointer'
                          : 'cursor-default'
                      } ${isRadarHint ? 'bg-amber-400/20 ring-1 ring-inset ring-amber-300/80' : ''} ${
                        isSelectedSetup ? 'bg-sky-400/25 ring-1 ring-inset ring-sky-300' : ''
                      } ${isLast ? 'ring-2 ring-inset ring-white/80' : ''}`}
                    />
                  );
                })
              )}
            </div>

            {/* Ship Graphics Layer (rendered cleanly over cells) */}
            <div className="absolute inset-0 pointer-events-none">
              {visibleShips.map((ship) => {
                const leftPct = ship.col * 10;
                const topPct = ship.row * 10;
                const widthPct = ship.orientation === 'horizontal' ? ship.size * 10 : 10;
                const heightPct = ship.orientation === 'vertical' ? ship.size * 10 : 10;
                const isSelected = setupMode && ship.id === selectedShipId;

                return (
                  <div
                    key={ship.id}
                    style={{
                      left: `${leftPct}%`,
                      top: `${topPct}%`,
                      width: `${widthPct}%`,
                      height: `${heightPct}%`,
                    }}
                    className={`absolute p-[2px] transition-all duration-150 ${
                      isSelected ? 'ring-2 ring-amber-400 rounded bg-amber-400/15' : ''
                    }`}
                  >
                    <ShipGraphic
                      type={ship.id}
                      size={ship.size}
                      orientation={ship.orientation}
                      sunk={ship.sunk}
                    />
                  </div>
                );
              })}
            </div>

            {/* Hit / Miss Markers Layer (always above ships) */}
            <div className="absolute inset-0 grid grid-cols-10 grid-rows-10 pointer-events-none">
              {Array.from({ length: GRID_SIZE }).map((_, r) =>
                Array.from({ length: GRID_SIZE }).map((__, c) => {
                  const cellState = grid[r][c];
                  const ship = shipAtCell.get(`${r},${c}`);
                  if (cellState === 'empty') return <div key={`m-${r}-${c}`} />;
                  return (
                    <div key={`m-${r}-${c}`} className="flex items-center justify-center">
                      {cellState === 'hit' ? (
                        <ExplosionMarker sunk={Boolean(ship?.sunk)} />
                      ) : (
                        <WaterSplashMarker />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Compact Fleet Roster Strip */}
      <div className="mt-3 pt-2.5 border-t border-blue-800/60 grid grid-cols-5 gap-1.5 text-center">
        {ships.map((ship) => (
          <div
            key={ship.id}
            className={`px-1 py-1 rounded text-[11px] leading-tight transition-opacity ${
              ship.sunk ? 'opacity-45 bg-red-950/40' : 'bg-[#081730]'
            }`}
          >
            <div className={`truncate font-medium ${ship.sunk ? 'line-through text-red-300' : 'text-slate-200'}`}>
              {ship.name.split(' ')[0]}
            </div>
            <div className="flex items-center justify-center gap-0.5 mt-1">
              {Array.from({ length: ship.size }).map((_, idx) => {
                const damaged = idx < ship.hits.length;
                return (
                  <span
                    key={idx}
                    className={`h-1.5 w-2 rounded-[2px] ${
                      ship.sunk
                        ? 'bg-red-500'
                        : damaged && !isEnemy
                        ? 'bg-orange-400'
                        : !isEnemy
                        ? 'bg-slate-400'
                        : 'bg-blue-400/50'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
