import { DirectMessage, User } from './schema';
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

export type UserFriend = {
  username: string;
  avatarUrl: string | null;
  id: number;
  conversationId: number | null;
  status: number;
  rating: number;
};

export type BlockedUser = {
  username: string;
  avatarUrl: string | null;
  id: number;
};

export type FriendRequestUser = {
  username: string;
  avatarUrl: string | null;
  id: number;
  rating: number;
  status: number;
};

export type UserSearchResult = {
  username: string;
  avatarUrl: string | null;
  id: number;
  rating: number;
  status: number;
  isFriends: boolean;
  friendRequestSourceUserId: number | null;
  conversationId: number | null;
};

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

export type UserUpdated = {
  username: string;
  firstname: string | null;
  lastname: string | null;
  bio: string | null;
};
