import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Compass,
  Crosshair,
  Radar,
  RotateCw,
  Shuffle,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { BattleGrid } from './components/BattleGrid';
import { PhysicsGuideModal } from './components/PhysicsGuideModal';
import { QuestionModal } from './components/QuestionModal';
import { SetupModal } from './components/SetupModal';
import { VictoryModal } from './components/VictoryModal';
import { PHYSICS_QUESTIONS } from './data/physicsQuestions';
import {
  BattleStats,
  CellShotState,
  Coord,
  Difficulty,
  GamePhase,
  PhysicsQuestion,
  PhysicsTopic,
  PlacedShip,
  PlayMode,
  TurnMessage,
  TurnOwner,
} from './types/game';
import {
  GRID_SIZE,
  applyShotToFleet,
  canPlaceShip,
  chooseComputerTarget,
  createEmptyGrid,
  findRandomUnhitEnemyCell,
  formatCoord,
  generateRandomFleet,
  getTotalFleetHealth,
} from './utils/shipLogic';
import { soundEngine } from './utils/sound';

const INITIAL_STATS: BattleStats = {
  questionsAsked: 0,
  correctAnswers: 0,
  currentStreak: 0,
  bestStreak: 0,
  shotsFired: 0,
  hitsLanded: 0,
  topicCorrect: {},
  topicTotal: {},
};

const DIFFICULTY_NAMES: Record<Difficulty, string> = {
  easy: 'Asan (6–7-ci sinif)',
  medium: 'Orta (7–9-cu sinif)',
  hard: 'Çətin (9–11-ci sinif)',
};

export default function App() {
  // Game Config
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [topic, setTopic] = useState<PhysicsTopic>('Hamısı');
  const [playMode, setPlayMode] = useState<PlayMode>('tactical');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Core Game State
  const [phase, setPhase] = useState<GamePhase>('SETUP');
  const [turn, setTurn] = useState<TurnOwner>('player');
  const [winner, setWinner] = useState<TurnOwner | null>(null);

  const [playerShips, setPlayerShips] = useState<PlacedShip[]>(() => generateRandomFleet());
  const [enemyShips, setEnemyShips] = useState<PlacedShip[]>(() => generateRandomFleet());
  const [playerGrid, setPlayerGrid] = useState<CellShotState[][]>(() => createEmptyGrid());
  const [enemyGrid, setEnemyGrid] = useState<CellShotState[][]>(() => createEmptyGrid());

  const [selectedSetupShipId, setSelectedSetupShipId] = useState<string | null>(null);
  const [lastPlayerShot, setLastPlayerShot] = useState<Coord | null>(null);
  const [lastComputerShot, setLastComputerShot] = useState<Coord | null>(null);
  const [shakeBoard, setShakeBoard] = useState<'player' | 'enemy' | null>(null);

  // Physics & Classroom Tools State
  const [stats, setStats] = useState<BattleStats>(INITIAL_STATS);
  const [askedIds, setAskedIds] = useState<string[]>([]);
  const [radarCharges, setRadarCharges] = useState<number>(2);
  const [radarHintCells, setRadarHintCells] = useState<Coord[]>([]);
  const [guidedStrikeReady, setGuidedStrikeReady] = useState<boolean>(false);

  // Active Modals
  const [pendingTarget, setPendingTarget] = useState<{
    coord: Coord;
    isGuided: boolean;
    question: PhysicsQuestion;
  } | null>(null);
  const [showSetupModal, setShowSetupModal] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  // Turn Log
  const [logs, setLogs] = useState<TurnMessage[]>([
    {
      id: 1,
      actor: 'system',
      text: 'Düşmən lövhəsindən bir xana seçib fizika sualını cavablayaraq atəşə başla!',
      tone: 'neutral',
    },
  ]);

  const computerTimeoutRef = useRef<number | null>(null);
  const logIdRef = useRef<number>(2);

  const pushLog = useCallback(
    (actor: TurnMessage['actor'], text: string, tone: TurnMessage['tone']) => {
      const id = logIdRef.current++;
      setLogs((prev) => [{ id, actor, text, tone }, ...prev].slice(0, 6));
    },
    []
  );

  // Sync sound engine
  useEffect(() => {
    soundEngine.enabled = soundEnabled;
  }, [soundEnabled]);

  // Clean up computer turn timeout on unmount
  useEffect(() => {
    return () => {
      if (computerTimeoutRef.current !== null) {
        window.clearTimeout(computerTimeoutRef.current);
      }
    };
  }, []);

  const triggerShake = useCallback((board: 'player' | 'enemy') => {
    setShakeBoard(board);
    window.setTimeout(() => setShakeBoard(null), 300);
  }, []);

  // Pick a fresh question matching topic & difficulty
  const pickQuestion = useCallback((): PhysicsQuestion => {
    let pool = PHYSICS_QUESTIONS.filter((q) => {
      const topicMatch = topic === 'Hamısı' || q.topic === topic;
      const diffMatch = q.difficulty === difficulty;
      return topicMatch && diffMatch;
    });

    if (pool.length === 0) {
      pool = PHYSICS_QUESTIONS.filter((q) => topic === 'Hamısı' || q.topic === topic);
    }
    if (pool.length === 0) {
      pool = PHYSICS_QUESTIONS;
    }

    let unasked = pool.filter((q) => !askedIds.includes(q.id));
    if (unasked.length === 0) {
      // Reset history for this pool so questions stay endless
      const poolIds = new Set(pool.map((q) => q.id));
      setAskedIds((prev) => prev.filter((id) => !poolIds.has(id)));
      unasked = pool;
    }

    const chosen = unasked[Math.floor(Math.random() * unasked.length)];
    setAskedIds((prev) => [...prev, chosen.id]);
    return chosen;
  }, [topic, difficulty, askedIds]);

  const startNewGame = useCallback(
    (newDiff = difficulty, newTopic = topic, newMode = playMode) => {
      if (computerTimeoutRef.current !== null) {
        window.clearTimeout(computerTimeoutRef.current);
        computerTimeoutRef.current = null;
      }
      setDifficulty(newDiff);
      setTopic(newTopic);
      setPlayMode(newMode);
      setPhase('SETUP');
      setTurn('player');
      setWinner(null);
      setPlayerShips(generateRandomFleet());
      setEnemyShips(generateRandomFleet());
      setPlayerGrid(createEmptyGrid());
      setEnemyGrid(createEmptyGrid());
      setSelectedSetupShipId(null);
      setLastPlayerShot(null);
      setLastComputerShot(null);
      setStats(INITIAL_STATS);
      setRadarCharges(2);
      setRadarHintCells([]);
      setGuidedStrikeReady(false);
      setPendingTarget(null);
      setShowSetupModal(false);
      setLogs([
        {
          id: logIdRef.current++,
          actor: 'system',
          text:
            newMode === 'direct'
              ? 'Birbaşa Zərbə rejimi hazırdır! "Sual Cavabla və Atəş Aç" düyməsinə kliklə.'
              : 'Döyüşə hazırıq! Öz gəmilərini yoxla və düşmən sularına ilk atəşi aç.',
          tone: 'neutral',
        },
      ]);
    },
    [difficulty, topic, playMode]
  );

  // Setup Phase Ship Controls
  const handleShufflePlayerShips = () => {
    if (phase !== 'SETUP') return;
    setPlayerShips(generateRandomFleet());
    setSelectedSetupShipId(null);
    soundEngine.playSonar();
  };

  const handleRotateSelectedShip = () => {
    if (phase !== 'SETUP' || !selectedSetupShipId) return;
    const targetShip = playerShips.find((s) => s.id === selectedSetupShipId);
    if (!targetShip) return;

    const nextOrientation =
      targetShip.orientation === 'horizontal' ? 'vertical' : 'horizontal';
    if (
      canPlaceShip(
        playerShips,
        {
          row: targetShip.row,
          col: targetShip.col,
          size: targetShip.size,
          orientation: nextOrientation,
        },
        targetShip.id,
        false
      )
    ) {
      setPlayerShips((prev) =>
        prev.map((s) => (s.id === targetShip.id ? { ...s, orientation: nextOrientation } : s))
      );
      soundEngine.playSonar();
    } else {
      pushLog('system', `${targetShip.name} bu mövqedə fırlana bilmir (kənara və ya digər gəmiyə dəyir).`, 'warn');
    }
  };

  const handlePlayerBoardCellClickInSetup = (row: number, col: number) => {
    if (phase !== 'SETUP' || !selectedSetupShipId) return;
    const targetShip = playerShips.find((s) => s.id === selectedSetupShipId);
    if (!targetShip) return;

    if (
      canPlaceShip(
        playerShips,
        {
          row,
          col,
          size: targetShip.size,
          orientation: targetShip.orientation,
        },
        targetShip.id,
        false
      )
    ) {
      setPlayerShips((prev) =>
        prev.map((s) => (s.id === targetShip.id ? { ...s, row, col } : s))
      );
      soundEngine.playSonar();
    }
  };

  // Computer Turn Execution
  const runComputerTurn = useCallback(
    (currentPlayerShips: PlacedShip[], currentPlayerGrid: CellShotState[][]) => {
      if (computerTimeoutRef.current !== null) {
        window.clearTimeout(computerTimeoutRef.current);
      }

      computerTimeoutRef.current = window.setTimeout(() => {
        const target = chooseComputerTarget(currentPlayerGrid, currentPlayerShips, difficulty);
        const result = applyShotToFleet(currentPlayerShips, currentPlayerGrid, target.row, target.col);

        setPlayerShips(result.nextShips);
        setPlayerGrid(result.nextGrid);
        setLastComputerShot(target);

        const coordLabel = formatCoord(target.row, target.col);

        if (result.outcome === 'sunk' && result.sunkShip) {
          soundEngine.playSunk();
          triggerShake('player');
          pushLog(
            'computer',
            `Kompüter ${coordLabel} xanasına atəş açdı və sənin "${result.sunkShip.name}" gəmini batırdı!`,
            'sunk'
          );
        } else if (result.outcome === 'hit') {
          soundEngine.playHit();
          triggerShake('player');
          pushLog('computer', `Kompüter ${coordLabel} xanasındakı gəminə zərbə vurdu!`, 'hit');
        } else {
          soundEngine.playSplash();
          pushLog('computer', `Kompüter ${coordLabel} xanasına atəş açdı — suya düşdü.`, 'miss');
        }

        const health = getTotalFleetHealth(result.nextShips);
        if (health.afloat === 0) {
          setPhase('GAME_OVER');
          setWinner('computer');
          soundEngine.playWrong();
          return;
        }

        // Classic rule: if computer hits, it gets another shot after a brief pause; on miss, back to player
        if (result.outcome === 'hit' || result.outcome === 'sunk') {
          runComputerTurn(result.nextShips, result.nextGrid);
        } else {
          setTurn('player');
        }
      }, 780);
    },
    [difficulty, pushLog, triggerShake]
  );

  // Triggered when player clicks an enemy cell (or Direct Strike / Guided Torpedo)
  const handleInitiateShot = (row: number, col: number, forceGuided = false) => {
    if (phase === 'GAME_OVER' || turn !== 'player' || pendingTarget) return;

    if (phase === 'SETUP') {
      setPhase('PLAYING');
      setSelectedSetupShipId(null);
    }

    let chosenCoord: Coord = { row, col };
    let isGuided = forceGuided;

    if (playMode === 'direct' || forceGuided) {
      const guaranteedCell = findRandomUnhitEnemyCell(enemyShips, enemyGrid);
      if (guaranteedCell) {
        chosenCoord = guaranteedCell;
        isGuided = true;
      }
    } else if (enemyGrid[row][col] !== 'empty') {
      return;
    }

    const question = pickQuestion();
    setPendingTarget({
      coord: chosenCoord,
      isGuided,
      question,
    });
  };

  const handleDirectStrikeClick = () => {
    const guaranteedCell = findRandomUnhitEnemyCell(enemyShips, enemyGrid);
    if (!guaranteedCell) return;
    handleInitiateShot(guaranteedCell.row, guaranteedCell.col, true);
  };

  // Pick a random empty water cell for when Direct Mode gets a wrong answer
  const findEmptyWaterCell = useCallback((): Coord | null => {
    const empties: Coord[] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (enemyGrid[r][c] === 'empty') {
          const hasShip = enemyShips.some(
            (s) =>
              !s.sunk &&
              Array.from({ length: s.size }).some((_, i) =>
                s.orientation === 'horizontal'
                  ? s.row === r && s.col + i === c
                  : s.row + i === r && s.col === c
              )
          );
          if (!hasShip) empties.push({ row: r, col: c });
        }
      }
    }
    if (empties.length === 0) return null;
    return empties[Math.floor(Math.random() * empties.length)];
  }, [enemyGrid, enemyShips]);

  // Resolve Physics Question Answer
  const handleResolveQuestion = (isCorrect: boolean) => {
    if (!pendingTarget) return;
    const { coord, isGuided, question } = pendingTarget;
    setPendingTarget(null);

    if (isCorrect) {
      soundEngine.playCorrect();
    } else {
      soundEngine.playWrong();
    }

    // Update physics stats
    setStats((prev) => {
      const nextStreak = isCorrect ? prev.currentStreak + 1 : 0;
      const nextTopicTotal = {
        ...prev.topicTotal,
        [question.topic]: (prev.topicTotal[question.topic] || 0) + 1,
      };
      const nextTopicCorrect = {
        ...prev.topicCorrect,
        [question.topic]: (prev.topicCorrect[question.topic] || 0) + (isCorrect ? 1 : 0),
      };
      return {
        ...prev,
        questionsAsked: prev.questionsAsked + 1,
        correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
        currentStreak: nextStreak,
        bestStreak: Math.max(prev.bestStreak, nextStreak),
        topicTotal: nextTopicTotal,
        topicCorrect: nextTopicCorrect,
      };
    });

    // Wrong Answer -> Misfire & Turn passes to Computer
    if (!isCorrect) {
      setGuidedStrikeReady(false);

      if (playMode === 'direct') {
        const missWater = findEmptyWaterCell();
        if (missWater) {
          const nextGrid = enemyGrid.map((r) => [...r]);
          nextGrid[missWater.row][missWater.col] = 'miss';
          setEnemyGrid(nextGrid);
          setLastPlayerShot(missWater);
        }
      }

      pushLog(
        'player',
        `Yanlış cavab (${question.topic})! Top atəş aça bilmədi — növbə Kompüterə keçdi.`,
        'warn'
      );
      setTurn('computer');
      runComputerTurn(playerShips, playerGrid);
      return;
    }

    // Correct Answer -> Check streak reward for Tactical Mode
    const nextStreakValue = stats.currentStreak + 1;
    if (isGuided && guidedStrikeReady) {
      setGuidedStrikeReady(false);
    } else if (playMode === 'tactical' && nextStreakValue > 0 && nextStreakValue % 3 === 0) {
      setGuidedStrikeReady(true);
    }

    // Fire at enemy grid!
    const result = applyShotToFleet(enemyShips, enemyGrid, coord.row, coord.col);
    setEnemyShips(result.nextShips);
    setEnemyGrid(result.nextGrid);
    setLastPlayerShot(coord);
    setRadarHintCells([]); // Clear old radar highlight once a shot lands

    setStats((prev) => ({
      ...prev,
      shotsFired: prev.shotsFired + 1,
      hitsLanded: prev.hitsLanded + (result.outcome !== 'miss' ? 1 : 0),
    }));

    const coordLabel = formatCoord(coord.row, coord.col);

    if (result.outcome === 'sunk' && result.sunkShip) {
      soundEngine.playSunk();
      triggerShake('enemy');
      setRadarCharges((c) => Math.min(3, c + 1));
      pushLog(
        'player',
        `Dəqiq atəş! ${coordLabel} zərbəsi ilə düşmənin "${result.sunkShip.name}" gəmisi batırıldı! (+1 Radar)`,
        'sunk'
      );
    } else if (result.outcome === 'hit') {
      soundEngine.playHit();
      triggerShake('enemy');
      pushLog(
        'player',
        `Zərbə! ${coordLabel} xanasındakı düşmən gəmisi vuruldu. Yenidən atəş aç!`,
        'hit'
      );
    } else {
      soundEngine.playSplash();
      pushLog('player', `${coordLabel} xanasına atəş açıldı — suya düşdü.`, 'miss');
    }

    // Check Victory
    const enemyHealth = getTotalFleetHealth(result.nextShips);
    if (enemyHealth.afloat === 0) {
      setPhase('GAME_OVER');
      setWinner('player');
      soundEngine.playVictory();
      return;
    }

    // In Tactical Mode, hitting a ship lets player keep turn! In Direct Mode, turn passes after each shot OR stays on correct?
    // Keeping turn on hit makes Battleship thrilling and rewards physics knowledge!
    if (result.outcome === 'hit' || result.outcome === 'sunk') {
      setTurn('player');
    } else {
      setTurn('computer');
      runComputerTurn(playerShips, playerGrid);
    }
  };

  // Radar Hint Button (highlights a 3x3 sector containing an unhit enemy ship)
  const handleUseRadarHint = () => {
    if (radarCharges <= 0 || phase === 'GAME_OVER' || turn !== 'player') return;
    const hiddenCell = findRandomUnhitEnemyCell(enemyShips, enemyGrid);
    if (!hiddenCell) return;

    const minR = Math.max(0, Math.min(GRID_SIZE - 3, hiddenCell.row - 1));
    const minC = Math.max(0, Math.min(GRID_SIZE - 3, hiddenCell.col - 1));
    const sector: Coord[] = [];
    for (let r = minR; r < minR + 3; r++) {
      for (let c = minC; c < minC + 3; c++) {
        sector.push({ row: r, col: c });
      }
    }

    setRadarCharges((c) => c - 1);
    setRadarHintCells(sector);
    soundEngine.playSonar();
    pushLog(
      'system',
      `Radar skanı: ${formatCoord(minR, minC)}–${formatCoord(minR + 2, minC + 2)} sektorunda düşmən gəmisi aşkarlandı!`,
      'good'
    );
  };

  const accuracyPct = useMemo(() => {
    if (stats.questionsAsked === 0) return 0;
    return Math.round((stats.correctAnswers / stats.questionsAsked) * 100);
  }, [stats.correctAnswers, stats.questionsAsked]);

  const playerHealth = getTotalFleetHealth(playerShips);
  const enemyHealth = getTotalFleetHealth(enemyShips);

  return (
    <div className="min-h-screen flex flex-col bg-[#061224] text-slate-100">
      {/* Top Bar Contract: 3 zones (Brand · Nav links · 1 Primary CTA) */}
      <header className="border-b border-blue-900/60 bg-[#07162C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <a
            href="#top"
            onClick={(e) => e.preventDefault()}
            className="font-display text-lg sm:text-xl font-extrabold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2.5"
          >
            <Compass className="w-5 h-5 text-sky-400" />
            <span>Fizika Dəniz Döyüşü</span>
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-blue-200/90">
            <button
              type="button"
              onClick={() => setShowGuideModal(true)}
              className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Qaydalar və Düsturlar
            </button>
            <button
              type="button"
              onClick={() => setSoundEnabled((s) => !s)}
              className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              {soundEnabled ? 'Səs: Açıq' : 'Səs: Bağlı'}
            </button>
            <button
              type="button"
              onClick={() => setShowSetupModal(true)}
              className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Mövzu: {topic}
            </button>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setShowSetupModal(true)}
              className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-display font-bold text-xs sm:text-sm transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              Yeni Oyun
            </button>
          </div>
        </div>
      </header>

      {/* Main Battle Arena */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col gap-4 sm:gap-5">
        {/* Classic Battleship Status Bar (Player · Mode/Difficulty · Computer) */}
        <section
          aria-label="Döyüş Vəziyyəti"
          className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-stretch gap-3 bg-[#0B1E3B] border border-blue-800/60 rounded-xl p-3"
        >
          {/* Player Status */}
          <div
            className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg border transition-colors ${
              turn === 'player' && phase !== 'GAME_OVER'
                ? 'bg-emerald-950/40 border-emerald-500/60'
                : 'bg-[#08172E] border-blue-900/60'
            }`}
          >
            <div>
              <div className="font-display font-bold text-sm sm:text-base text-white">
                Sənin Donanman
              </div>
              <div className="text-xs text-blue-200/80 font-mono tabular-nums">
                {turn === 'player' && phase !== 'GAME_OVER'
                  ? 'Sənin növbən · Atəşə hazır'
                  : 'Müdafiə mövqeyi'}
              </div>
            </div>
            <div className="text-right font-mono tabular-nums">
              <div className="text-sm font-bold text-emerald-300">
                {playerHealth.remaining}/{playerHealth.total}
              </div>
              <div className="text-[11px] text-blue-300/75">sağlamlıq</div>
            </div>
          </div>

          {/* Center Match Metadata + Physics Streak */}
          <div className="flex flex-col items-center justify-center px-4 py-2 bg-[#08172E] border border-blue-900/60 rounded-lg text-center min-w-[240px]">
            <div className="text-xs font-medium text-blue-200 flex items-center gap-2">
              <span>{DIFFICULTY_NAMES[difficulty]}</span>
              <span aria-hidden="true">·</span>
              <span>{playMode === 'direct' ? 'Birbaşa Zərbə' : 'Taktiki Döyüş'}</span>
            </div>
            <div className="mt-1 flex items-center gap-3 font-mono text-xs tabular-nums">
              <span className="text-emerald-300">
                Doğru: {stats.correctAnswers}/{stats.questionsAsked} ({accuracyPct}%)
              </span>
              <span aria-hidden="true" className="text-blue-600">
                ·
              </span>
              <span className="text-amber-300">Seriya: {stats.currentStreak}</span>
            </div>
          </div>

          {/* Computer Status */}
          <div
            className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg border transition-colors ${
              turn === 'computer' && phase !== 'GAME_OVER'
                ? 'bg-orange-950/40 border-orange-500/60'
                : 'bg-[#08172E] border-blue-900/60'
            }`}
          >
            <div className="text-left font-mono tabular-nums">
              <div className="text-sm font-bold text-sky-300">
                {enemyHealth.remaining}/{enemyHealth.total}
              </div>
              <div className="text-[11px] text-blue-300/75">sağlamlıq</div>
            </div>
            <div className="text-right">
              <div className="font-display font-bold text-sm sm:text-base text-white">
                Kompüter (Rəqib)
              </div>
              <div className="text-xs text-blue-200/80 font-mono tabular-nums">
                {turn === 'computer' && phase !== 'GAME_OVER'
                  ? 'Hədəf seçir...'
                  : 'Gözləmədə'}
              </div>
            </div>
          </div>
        </section>

        {/* Action Prompt / Special Strike Banner (only functional controls) */}
        <section className="flex flex-wrap items-center justify-between gap-3 bg-[#0B1E3B] border border-blue-800/60 rounded-xl px-4 py-3">
          <div className="flex-1 min-w-[240px]">
            <p className="text-sm font-medium text-slate-100">
              {logs[0]?.text}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {phase === 'SETUP' && (
              <>
                <button
                  type="button"
                  onClick={handleShufflePlayerShips}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#132C52] hover:bg-[#193A6B] border border-blue-700/60 text-xs font-semibold text-white transition-colors whitespace-nowrap"
                >
                  <Shuffle className="w-3.5 h-3.5 text-sky-400" />
                  <span>Gəmiləri Qarışdır</span>
                </button>
                {selectedSetupShipId && (
                  <button
                    type="button"
                    onClick={handleRotateSelectedShip}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors whitespace-nowrap"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Seçili Gəmini Fırlat</span>
                  </button>
                )}
              </>
            )}

            {playMode === 'direct' && turn === 'player' && phase !== 'GAME_OVER' && (
              <button
                type="button"
                onClick={handleDirectStrikeClick}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-xs sm:text-sm transition-colors whitespace-nowrap"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Sual Cavabla və Atəş Aç</span>
              </button>
            )}

            {playMode === 'tactical' && guidedStrikeReady && turn === 'player' && phase !== 'GAME_OVER' && (
              <button
                type="button"
                onClick={handleDirectStrikeClick}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-bold text-xs sm:text-sm transition-colors whitespace-nowrap"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Dəqiq Zərbə At! (3 Seriya Bonusu)</span>
              </button>
            )}
          </div>
        </section>

        {/* Dual 10x10 Ocean Boards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          <BattleGrid
            title="Sənin Donanman"
            subtitle={
              phase === 'SETUP'
                ? 'İstəsən gəmiyə klikləyib başqa xanaya köçür və ya fırlat'
                : 'Düşmən atəşlərindən qorunan donanman'
            }
            grid={playerGrid}
            ships={playerShips}
            isEnemy={false}
            interactive={false}
            setupMode={phase === 'SETUP'}
            selectedShipId={selectedSetupShipId}
            lastShot={lastComputerShot}
            shake={shakeBoard === 'player'}
            onShipSelectInSetup={(id) =>
              setSelectedSetupShipId((prev) => (prev === id ? null : id))
            }
            onCellClick={handlePlayerBoardCellClickInSetup}
          />

          <BattleGrid
            title="Düşmən Suları"
            subtitle={
              turn === 'player' && phase !== 'GAME_OVER'
                ? playMode === 'direct'
                  ? 'Sualı cavabla — doğru cavab birbaşa düşmən gəmisini vuracaq'
                  : 'Atəş açmaq üçün istənilən xanaya kliklə və fizika sualını cavabla'
                : 'Kompüter cavab həmləsi edir...'
            }
            grid={enemyGrid}
            ships={enemyShips}
            isEnemy={true}
            interactive={turn === 'player' && phase !== 'GAME_OVER' && !pendingTarget}
            radarHintCells={radarHintCells}
            lastShot={lastPlayerShot}
            shake={shakeBoard === 'enemy'}
            onCellClick={(r, c) => handleInitiateShot(r, c, false)}
          />
        </div>

        {/* Bottom Classic Action Strip (NEW, HINT, SOUND, GUIDE) */}
        <section className="flex flex-wrap items-center justify-between gap-3 bg-[#0B1E3B] border border-blue-800/60 rounded-xl px-4 py-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => startNewGame()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#132C52] hover:bg-[#193A6B] border border-blue-700/60 text-xs sm:text-sm font-semibold text-white transition-colors whitespace-nowrap"
            >
              <Crosshair className="w-4 h-4 text-sky-400" />
              <span>Yenidən Başla</span>
            </button>

            <button
              type="button"
              disabled={radarCharges <= 0 || turn !== 'player' || phase === 'GAME_OVER'}
              onClick={handleUseRadarHint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#132C52] hover:bg-[#193A6B] disabled:opacity-45 disabled:hover:bg-[#132C52] border border-blue-700/60 text-xs sm:text-sm font-semibold text-amber-300 transition-colors whitespace-nowrap"
            >
              <Radar className="w-4 h-4" />
              <span>Radar İpucu ({radarCharges})</span>
            </button>

            <button
              type="button"
              onClick={() => setSoundEnabled((s) => !s)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#132C52] hover:bg-[#193A6B] border border-blue-700/60 text-xs sm:text-sm font-semibold text-blue-100 transition-colors whitespace-nowrap"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
              <span>{soundEnabled ? 'Səs Açıq' : 'Səs Bağlı'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowGuideModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#132C52] hover:bg-[#193A6B] border border-blue-700/60 text-xs sm:text-sm font-semibold text-blue-100 transition-colors whitespace-nowrap"
            >
              <BookOpen className="w-4 h-4 text-sky-400" />
              <span>Fizika Düsturları</span>
            </button>
          </div>

          <div className="text-xs text-blue-200/80 font-mono tabular-nums">
            Atəşlər: {stats.shotsFired} · Dəqiq zərbə: {stats.hitsLanded}
          </div>
        </section>

        {/* Compact Recent Turn Log */}
        {logs.length > 1 && (
          <section className="bg-[#08172E] border border-blue-900/50 rounded-xl px-4 py-3">
            <h3 className="text-xs font-semibold text-blue-300/80 mb-2">Son Həmlələr</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1.5">
              {logs.slice(0, 3).map((entry) => (
                <div
                  key={entry.id}
                  className={`text-xs truncate ${
                    entry.tone === 'sunk'
                      ? 'text-red-300 font-semibold'
                      : entry.tone === 'hit'
                      ? 'text-orange-300'
                      : entry.tone === 'good'
                      ? 'text-emerald-300'
                      : entry.tone === 'warn'
                      ? 'text-amber-300'
                      : 'text-blue-200/80'
                  }`}
                  title={entry.text}
                >
                  {entry.actor === 'player' ? 'Sən: ' : entry.actor === 'computer' ? 'Rəqib: ' : ''}
                  {entry.text}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Modals */}
      {pendingTarget && (
        <QuestionModal
          question={pendingTarget.question}
          targetLabel={
            pendingTarget.isGuided
              ? `Dəqiq Zərbə (${formatCoord(pendingTarget.coord.row, pendingTarget.coord.col)})`
              : `Hədəf: ${formatCoord(pendingTarget.coord.row, pendingTarget.coord.col)}`
          }
          isGuidedStrike={pendingTarget.isGuided}
          playerName="Sənin Atəşin"
          onResolve={handleResolveQuestion}
        />
      )}

      {showSetupModal && (
        <SetupModal
          currentDifficulty={difficulty}
          currentTopic={topic}
          currentMode={playMode}
          onStart={(d, t, m) => startNewGame(d, t, m)}
          onClose={() => setShowSetupModal(false)}
        />
      )}

      {showGuideModal && <PhysicsGuideModal onClose={() => setShowGuideModal(false)} />}

      {phase === 'GAME_OVER' && winner && !showSetupModal && (
        <VictoryModal
          winner={winner}
          stats={stats}
          onPlayAgain={() => startNewGame()}
          onOpenSetup={() => setShowSetupModal(true)}
        />
      )}
    </div>
  );
}
