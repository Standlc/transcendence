import { USER_STATUS } from '../usersStatusTypes';

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
