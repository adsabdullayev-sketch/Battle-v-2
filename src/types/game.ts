export type Difficulty = 'easy' | 'medium' | 'hard';

export type PhysicsTopic =
  | 'Hamısı'
  | 'Mexanika'
  | 'Elektrik'
  | 'Optika və Dalğalar'
  | 'İstilik'
  | 'Maqnetizm və Kosmos';

export type PlayMode = 'tactical' | 'direct';

export type Orientation = 'horizontal' | 'vertical';

export type ShipTypeId = 'carrier' | 'battleship' | 'cruiser' | 'submarine' | 'destroyer';

export interface ShipTemplate {
  id: ShipTypeId;
  name: string;
  size: number;
}

export interface PlacedShip {
  id: ShipTypeId;
  name: string;
  size: number;
  row: number;
  col: number;
  orientation: Orientation;
  hits: number[];
  sunk: boolean;
}

export type CellShotState = 'empty' | 'miss' | 'hit';

export interface Coord {
  row: number;
  col: number;
}

export interface PhysicsQuestion {
  id: string;
  topic: Exclude<PhysicsTopic, 'Hamısı'>;
  difficulty: Difficulty;
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  hint: string;
  explanation: string;
}

export interface BattleStats {
  questionsAsked: number;
  correctAnswers: number;
  currentStreak: number;
  bestStreak: number;
  shotsFired: number;
  hitsLanded: number;
  topicCorrect: Record<string, number>;
  topicTotal: Record<string, number>;
}

export interface TurnMessage {
  id: number;
  actor: 'player' | 'computer' | 'system';
  text: string;
  tone: 'neutral' | 'hit' | 'miss' | 'sunk' | 'good' | 'warn';
}

export type GamePhase = 'SETUP' | 'PLAYING' | 'GAME_OVER';
export type TurnOwner = 'player' | 'computer';
