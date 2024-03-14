export interface GameType {
  game: GameStateType;
  intervalId: any;
  points: number;
  isPublic: boolean;
  hasPowerUps: boolean;
  userDisconnectedId?: number;
  disconnectionIntervalId: any;
  roomId: string;
  gameId: number;
  isPaused: boolean;
  nextUpdateTime: number;
  startTime: number;
  endTime: number;
}

export interface GameStateType {
  ball: BallType;
  playerOne: PlayerType;
  playerTwo: PlayerType;
}

export type VectorType = {
  x: number;
  y: number;
};

export type PowerUpType = ObjectType & {
  type: 1 | 2 | 3;
  isCollected: boolean;
  activeTimeLeft: number;
};

export type BallType = ObjectType & {
  nextBounceVelocity: VectorType;
  aY: number;
};

export type PlayerType = ObjectType & {
  id: number;
  speed: number;
  score: number;
  powerUp?: PowerUpType | undefined;
  pingRtt: number;
  lastPingTime: number;
};

export interface ObjectType {
  x: number;
  y: number;
  w: number;
  h: number;
  vX: number;
  vY: number;
}

export const POWER_UPS = {
  BIGGER_PADDLE: 1,
  GRAVITY_PADDLE: 2,
  SPEED: 3,
};
