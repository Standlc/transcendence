import { AppGameRequest } from './games/gameRequests';
import { AppGame } from './games/games';

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
export const POWER_UP_TIMEOUT = 4000;
export const DISCONNECTION_PAUSE_TIMEOUT = 1000;
export const DISCONNECTION_END_GAME_TIMEMOUT = 10;
export const THROW_BALL_TIMEMOUT = 1000;
export const FPP = 60;
export const LIVE_STATS_INTERVAL = 5000;

export type EmitPayloadType<T extends string> = T extends 'updateGameState'
  ? GameStateType
  : T extends 'playerDisconnection'
    ? PlayerDisconnectionDto
    : T extends 'gameEnd'
      ? AppGame
      : T extends 'viewersCount'
        ? number
        : T extends 'gameStart'
          ? string
          : T extends 'privateGameInvitation'
            ? AppGameRequest
            : T extends 'liveGames'
              ? LiveGamesDto
              : never;

export interface GameType {
  game: GameStateType;
  intervalId: any;
  points: number;
  isPublic: boolean;
  hasPowerUps: boolean;
  isPaused: boolean;
  lastPlayerToHitTheBall: number;
  userIdBeingDisconnected?: number;
  disconnectionIntervalId: any;
  liveStatsIntervalId?: any;
}

export interface GameStateType {
  id: string;
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
  id: number;
  score: number;
  isConnected: boolean;
  powerUp?: number;
};

export type GameRequestType = GameRequestDto & {
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

export const GAME_REQUEST_STATUS = {
  TARGET_USER_NOT_CONNECTED: 1,
  TARGET_USER_ALREADY_IN_GAME: 2,
  USER_ALREADY_IN_GAME: 3,
};

/**
 *
 * DTOs
 */

export interface LiveGamesDto {
  games: GameStateType[];
}

// export interface PublicGameRequestDto {
//   powerUps: boolean;
//   nbPoints: number;
// }

export interface GameRequestDto {
  targetId?: number;
  powerUps: boolean;
  nbPoints: number;
}

// export interface PrivateGameRequestDto {
//   targetId: number;
//   powerUps: boolean;
//   nbPoints: number;
// }

export interface PlayerMoveDto {
  gameId: string;
  move: 'up' | 'down' | 'stop';
}

export interface gameInviteResponseDto {
  fromId: number;
  isAccepted: boolean;
}

export interface JoinGameRoomDto {
  roomId: string;
}

export interface LeaveGameDto {
  gameId: string;
}

/**
 *
 * Return Types
 */

export interface PlayerDisconnectionDto {
  userId: number;
  secondsUntilEnd: number;
}

export interface LiveGameDto {
  id: string;
  players: {
    id: number;
    username: string;
    avatarUrl: string | null;
    rating: number;
    score: number;
  }[];
}

export interface LiveGameType {
  id: string;
  players: {
    id: number;
    score: number;
  }[];
}
