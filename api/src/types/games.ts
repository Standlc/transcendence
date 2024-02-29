import { USER_STATUS } from './usersStatusTypes';

export type UserGame = {
  playerOne: GamePlayer;
  playerTwo: GamePlayer;
  winnerId: number | null;
  createdAt: Date;
  id: number;
  points: number;
  powerUps: boolean;
  isPublic: boolean;
};

export type GamePlayer = {
  id: number;
  score: number;
  rating: number;
  username: string;
  avatarUrl: string | null;
  ratingChange: number;
};

export type LeaderbordPlayer = {
  id: number;
  rating: number;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  losses: number;
  wins: number;
  status: USER_STATUS;
};
