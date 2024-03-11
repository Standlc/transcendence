import { Achievement, User } from './schema';
import { Selectable } from 'kysely';

export type AppUserDB = Omit<
  Selectable<User>,
  | 'password'
  | 'TwoFactorAuthenticationSecret'>;

export interface AppUser extends AppUserDB {
  status: number;
}

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
