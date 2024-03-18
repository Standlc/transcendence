import { z } from 'zod';

export const DirectMessageContentSchema = z.object({
  content: z.string().or(z.null()),
  conversationId: z.number(),
});
