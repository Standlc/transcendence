import { Achievement, DirectMessage, User } from './schema';
import { Selectable } from 'kysely';

export type AppUserDB = Omit<
  Selectable<User>,
  'password' | 'TwoFactorAuthenticationSecret'
>;

export interface AppUser extends AppUserDB {
  status: number;
}

export type UserProfile = Omit<AppUser, 'isTwoFactorAuthenticationEnabled'> & {
  isBlocked: boolean;
  isBlocking: boolean;
  isFriends: boolean;
  friendRequestSourceUserId: number | null;
  conversationId: number | null;
};

export type UserDirectMessage = Selectable<DirectMessage>;


export type ListUsers = Omit<
  Selectable<User>,
  | 'password'
  | 'lastname'
  | 'firstname'
  | 'email'
  | 'createdAt'
  | 'bio'
  | 'rating'
  | 'isTwoFactorAuthenticationEnabled'
  | 'TwoFactorAuthenticationSecret'
>;
