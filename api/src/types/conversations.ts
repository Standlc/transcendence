import { z } from 'zod';

export type DmGatewayEmitTypes = {
  newConversation: number;
  conversationDeleted: number;
};

// export const DmGatewayEmitSchema = z.object({
//   newConversation: z.number(),
//   conversationDeleted: z.number(),
// });
