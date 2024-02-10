export type AppGame = {
  playerOne: {
    score: number;
    id: number;
    rating: number;
    username: string;
    avatarUrl: string | null;
  } | null;
  playerTwo: {
    id: number;
    score: number;
    rating: number;
    username: string;
    avatarUrl: string | null;
  } | null;
  winnerId: number | null;
  createdAt: Date;
  id: number;
  points: number;
  powerUps: boolean;
  isPublic: boolean;
};
