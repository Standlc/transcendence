/**
 * DIMENSIONS
 */
// CANVAS
export const CANVAS_H = 700;
export const CANVAS_W = 800;
// BALL
export const BALL_SIZE = 16;
// PADDLE
export const PADDLE_H = 80;
export const PADDLE_W = 10;
export const PADDLE_WALL_OFFSET = 20;
export const PADDLE_BIG_HEIGHT = 220;
// OTHER
export const POWER_UP_SIZE = 20;

/**
 * VELOCITIES
 */
// BALL
export const BALL_VELOCITY_X_FIRST_THROW = 400;
export const BALL_VELOCITY_Y_FIRST_THROW = 400;
export const BALL_VELOCITY_X = 1100;
export const BALL_VELOCITY_X_MAX = 1200;
export const BALL_VELOCITY_Y = 600;
export const BALL_ACCELERATION = 800;
// PADDLE
export const PADDLE_VELOCITY_Y = 1100;
export const PADDLE_VELOCITY_POWER_UP = 2000;

/**
 * TIME CONSTANTS
 */
export const FPP = 15;
export const INTERVAL_S = 1 / FPP;
export const INTERVAL_MS = 1000 / FPP;
export const DISCONNECTION_END_GAME_TIMEMOUT = 10;
export const DISCONNECTION_PAUSE_TIMEOUT = 1000;
export const THROW_BALL_TIMEMOUT = 1000;
export const POWER_UP_ACTIVE_TIME = 5000;
export const PLAYER_PING_INTERVAL = 2000;

/**
 * POWER UPS
 */
export const POWER_UP_PROBABILITY_PER_SECOND = 0.3;
