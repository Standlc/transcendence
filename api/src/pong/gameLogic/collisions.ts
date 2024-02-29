import { ObjectType } from 'src/types/gameServer/pongGameTypes';

export const boundingBoxIntersection = (obj1: ObjectType, obj2: ObjectType) => {
  if (obj1.y + obj1.h < obj2.y || obj1.y > obj2.y + obj2.h) {
    return false;
  }
  if (obj1.x > obj2.x + obj2.w || obj1.x + obj1.w < obj2.x) {
    return false;
  }
  return true;
};
