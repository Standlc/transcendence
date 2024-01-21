export const CANVAS_H = 800;
export const CANVAS_W = 1000;
export const BALL_SIZE = 20;
export const PADDLE_H = 80;
export const PADDLE_W = 5;
export const BALL_VELOCITY_X = 15;
export const BALL_VELOCITY_Y = 15;
export const BALL_VELOCITY_X_FIRST_THROW = 7;
export const BALL_VELOCITY_Y_FIRST_THROW = 7;
export const PADDLE_VELOCITY_Y = 18;
export const GAME_POINTS = 100;
export const POWER_UP_TIMEOUT = 4000;
export const DISCONNECTION_PAUSE_TIMEOUT = 1000;
export const DISCONNECTION_END_GAME_TIMEMOUT = 30;
export const THROW_BALL_TIMEMOUT = 1000;
export const FPP = 60;

export interface GameType {
  game: GameStateType;
  roomId: string;
  intervalId: any;
  userIdBeingDisconnected?: number;
  disconnectionIntervalId: any;
  isPublic: boolean;
  hasPowerUps: boolean;
  isPaused: boolean;
  lastPlayerToHitTheBall: number;
}

export interface GameStateType {
  id: number;
  ball: ObjectType;
  playerLeft: PlayerType;
  playerRight: PlayerType;
  powerUps?: PowerUpType;
  w: number;
  h: number;
}

export type PowerUpType = ObjectType & {
  type: 1 | 2 | 3;
};

export type PlayerType = ObjectType & {
  userId: number;
  score: number;
  isConnected: boolean;
  powerUp?: number;
};

export type GameRequestType = PublicGameRequestDto & {
  userId: number;
  targetId?: number;
  nbPoints: number;
  powerUps: boolean;
};

export interface PrivatwGameRequestType {
  clientSocketId: string;
  userId: number;
  targetId: number;
}

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
  OTHER: 3,
};

export interface GameErrorType {
  errorCode: number;
  currentGameId?: number;
}

export const GAME_ERRORS = {
  TARGET_USER_NOT_CONNECTED: 1,
  TARGET_USER_ALREADY_IN_GAME: 2,
  USER_ALREADY_IN_GAME: 3,
  NO_SUCH_GAME: 4,
  USER_NOT_ALLOWED: 5,
};

/**
 *
 * DTOs
 */

export interface GameLiveStatsType {
  usersOnline: number;
  games: number;
}

export interface PublicGameRequestDto {
  powerUps: boolean;
  nbPoints: number;
}

export interface PrivateGameRequestDto {
  targetId: number;
  powerUps: boolean;
  nbPoints: number;
}

export interface PlayerMoveDto {
  gameId: number;
  move: 'up' | 'down' | 'stop';
}

export interface PrivateGameRequestResponseDto {
  userInvitingId: number;
  isAccepted: boolean;
}

export interface JoinGameRoomDto {
  roomId: number;
}
