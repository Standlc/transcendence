import { z } from 'zod';

export const ZodChannelAndUserIdPayload = z.object({
  userId: z.number(),
  channelId: z.number(),
});
