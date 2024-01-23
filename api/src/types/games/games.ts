import { Selectable } from 'kysely';
import { Game } from '../schema';

export type AppGame = Selectable<Game>;
