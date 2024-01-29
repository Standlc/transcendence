import { Selectable } from 'kysely';
import { PublicGameRequest } from '../schema';
import { GameStateType } from './pongGameTypes';

export type EmitPayloadType<T extends string> = T extends 'updateGameState'
  ? GameStateType
  : T extends 'playerDisconnection'
    ? WsPlayerDisconnection
    : T extends 'gameEnd'
      ? WsGameEndType
      : T extends 'viewersCount'
        ? number
        : T extends 'gameStart'
          ? string
          : T extends 'privateGameInvitation'
            ? Selectable<PublicGameRequest>
            : T extends 'liveGame'
              ? WsGameIdType
              : T extends 'liveGameUpdate'
                ? WsLiveGameUpdate
                : T extends 'liveGameEnd'
                  ? number
                  : T extends 'leaderboardUpdate'
                    ? Tuple<WsLeaderboardPlayerUpdate>
                    : T extends 'pause'
                      ? { isPaused: boolean }
                      : T extends 'error'
                        ? WsError
                        : never;

export type Tuple<T> = [T, T];

export interface WsError {
  message: string;
}

export interface WsPlayerMove {
  gameId: number;
  move: 'up' | 'down' | 'stop';
}

export interface WsJoinGameRoom {
  roomId: string;
}

export interface WsLeaveGame {
  gameId: string;
}

export interface WsPlayerDisconnection {
  userId: number;
  secondsUntilEnd: number;
}

export interface WsLiveGame {
  id: string;
  players: {
    id: number;
    username: string;
    avatarUrl: string | null;
    rating: number;
    score: number;
  }[];
}

export interface WsLiveGameUpdate {
  gameId: number;
  players: Tuple<{ id: number; score: number }>;
}

export interface WsGameIdType {
  gameId: number;
}

export interface WsLeaderboardPlayerUpdate {
  userId: number;
  rating: number;
  isWinner: boolean;
}

export interface WsGameEndType {
  winnerId: number;
  playerOne: {
    score: number;
    rating: number;
  };
  playerTwo: {
    score: number;
    rating: number;
  };
}
