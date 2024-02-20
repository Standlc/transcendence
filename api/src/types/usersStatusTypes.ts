export type UsersStatusEmitsDto<T extends string> = T extends 'status'
  ? WsUserSatus
  : never;

export type WsUserSatus = { userId: number; status: USER_STATUS };

export enum USER_STATUS {
  ONLINE = 1,
  PLAYING,
  OFFLINE,
}

export type UserStatusType = {
  status: USER_STATUS;
  connectionsCount: number;
};
