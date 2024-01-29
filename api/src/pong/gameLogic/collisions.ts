import { ObjectType } from 'src/types/games/pongGameTypes';

export const isHigher = (obj1: ObjectType, obj2: ObjectType) => {
  return obj1.y + obj1.h > obj2.y;
};

export const isLower = (obj1: ObjectType, obj2: ObjectType) => {
  return obj1.y < obj2.y + obj2.h;
};

export const isToTheLeft = (obj1: ObjectType, obj2: ObjectType) => {
  return obj1.x + obj1.w < obj2.x;
};

export const isToTheRight = (obj1: ObjectType, obj2: ObjectType) => {
  return obj1.x > obj2.x + obj2.w;
};

export const bottom = (obj: ObjectType) => {
  return obj.y + obj.h;
};

export const rightSide = (obj: ObjectType) => {
  return obj.x + obj.w;
};
