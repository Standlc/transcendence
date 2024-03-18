import { z } from 'zod';

export const ZodPublicGameRequestDto = z.object({
  powerUps: z.boolean(),
  points: z.number(),
});

export const ZodPrivateGameRequestDto = z.object({
  powerUps: z.boolean(),
  points: z.number(),
  targetId: z.number(),
});
