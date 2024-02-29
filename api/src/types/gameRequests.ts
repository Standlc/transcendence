export type GamePointsTypes = 10 | 21 | 42;

export type PublicGameRequestDto = {
  powerUps: boolean;
  points: number;
};

export type PrivateGameRequestDto = {
  powerUps: boolean;
  points: GamePointsTypes;
  targetId: number;
};

export type GameInvitation = {
  createdAt: Date;
  points: number;
  powerUps: boolean;
  targetId: number;
  userId: number;
};

export type UserGameRequest = {
  createdAt: Date;
  points: number;
  powerUps: boolean;
};

export type UserGameInvitation = {
  createdAt: Date;
  points: number;
  powerUps: boolean;
  inviterUser: GameInvitationUser;
  targetUser: GameInvitationUser;
};

export type GameInvitationUser = {
  id: number;
  username: string;
  avatarUrl: string | null;
  rating: number;
};
