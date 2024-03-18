import { z } from 'zod';

export const ZodChannelAndUserIdPayload = z.object({
  userId: z.number(),
  channelId: z.number(),
});

export const ZodChannelCreationData = z.object({
  isPublic: z.boolean(),
  name: z.string(),
  password: z.string().or(z.null()),
  memberIds: z.array(z.number()),
});

export const ZodChannelUpdate = z.object({
  password: z.string().or(z.null()).optional(),
  name: z.string().optional(),
  isPublic: z.boolean().optional(),
});

export const ZodChannelJoinDto = z.object({
  channelId: z.number(),
  password: z.string().optional(),
});

export const ZodConnectToChannel = z.object({
  channelId: z.number(),
  password: z.string(),
});

export const ZodChannelMessageContent = z.object({
  channelId: z.number(),
  content: z.string().or(z.null()),
});
