import { Insertable, Selectable } from 'kysely';
import { PublicGameRequest } from '../schema';

export type PublicGameRequestDto = {
  powerUps: boolean;
  points: number;
};

export type PrivateGameRequestDto = {
  powerUps: boolean;
  points: number;
  targetId: number;
};

// export type GameRequestType = GameRequestDto & {
//   userId: number;
//   targetId?: number;
//   nbPoints: number;
//   powerUps: boolean;
// };

// export interface PrivatwGameRequestType {
//   clientSocketId: string;
//   userId: number;
//   targetId: number;
// }
