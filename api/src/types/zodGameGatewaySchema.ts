import { z } from 'zod';

export const ZodWsGameIdType = z.object({
  gameId: z.number(),
});
