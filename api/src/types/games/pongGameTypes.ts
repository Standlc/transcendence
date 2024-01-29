export interface GameType {
  game: GameStateType;
  intervalId: any;
  points: number;
  isPublic: boolean;
  hasPowerUps: boolean;
  lastPlayerToHitTheBall: number;
  userIdBeingDisconnected?: number;
  disconnectionIntervalId: any;
  roomId: string;
  gameId: number;
  isPaused: boolean;
}

export interface GameStateType {
  ball: ObjectType;
  playerOne: PlayerType;
  playerTwo: PlayerType;
  powerUp?: PowerUpType;
}

export type PowerUpType = ObjectType & {
  type: 1 | 2 | 3;
};

export type PlayerType = ObjectType & {
  id: number;
  powerUp?: number;
  speed: number;
  isConnected: boolean;
  score: number;
};

export interface ObjectType {
  x: number;
  y: number;
  w: number;
  h: number;
  vX: number;
  vY: number;
}

export const PLAYER_SIDES = {
  LEFT: 1,
  RIGHT: 2,
};

export const POWER_UPS = {
  BIGGER_PADDLE: 1,
  GRAVITY_PADDLE: 2,
  SPEED: 3,
};
