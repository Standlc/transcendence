import { User } from './schema';
import { Selectable } from 'kysely';

export type AppUser = Omit<Selectable<User>, 'password'>;

export type ListUsers = Omit<Selectable<User>, 'password' | 'lastname' | 'firstname' | 'email' | 'createdAt' | 'bio' | 'rating'>;
