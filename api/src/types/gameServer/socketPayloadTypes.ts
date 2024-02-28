import { Selectable } from 'kysely';
import { Game } from '../schema';
import { GameStateType, PlayerType } from './pongGameTypes';
import { UserAchievement } from '../achievements';
import { UserGameInvitation } from '../gameRequests';

export type EmitPayloadType = {
  updateGameState: GameStateType;
  playerMoveUpdate: PlayerType;
  playerDisconnection: WsPlayerDisconnection;
  startCountdown: number;
  gameEnd: WsGameEndType;
  viewersCount: number;
  gameStart: string;
  liveGame: WsGameIdType;
  liveGameUpdate: WsLiveGameUpdate;
  liveGameEnd: number;
  leaderboardUpdate: Tuple<WsLeaderboardPlayerUpdate>;
  pause: { isPaused: boolean };
  error: WsError;
  achievements: UserAchievement[];
  gameInvitation: UserGameInvitation;
  gameInvitationRefused: undefined;
  gameInvitationCanceled: { inviterId: number };
};

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
  ratingChange: number;
  prevRating: number;
  isWinner: boolean;
}

export type WsGameEndType = Selectable<Game>;
