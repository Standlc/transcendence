export type AppGame = {
  playerOne: AppPlayer | null;
  playerTwo: AppPlayer | null;
  winnerId: number | null;
  createdAt: Date;
  id: number;
  points: number;
  powerUps: boolean;
  isPublic: boolean;
};

export type AppPlayer = {
  id: number;
  score: number;
  rating: number;
  username: string;
  avatarUrl: string | null;
}