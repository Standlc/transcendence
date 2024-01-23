import { Selectable } from 'kysely';
import { AppGame } from './games';
import { PublicGameRequest } from '../schema';

export interface GameRequestResponseDto {
  currentGame?:
    | {
        id: string;
      }
    | undefined;
  status: number;
}

export type AppGameRequest = Selectable<PublicGameRequest>;
