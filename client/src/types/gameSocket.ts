import { EmitPayloadType as GameServerEventTypes } from "@api/types/gameServer/socketPayloadTypes";

export type GameSocketEventHandlerType = <T extends keyof GameServerEventTypes>(
  ev: T,
  handler: (data: GameServerEventTypes[T]) => void
) => void;
