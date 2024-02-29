export type AppGame = {
  playerOne: GamePlayer | null;
  playerTwo: GamePlayer | null;
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
