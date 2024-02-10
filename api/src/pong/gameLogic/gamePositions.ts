export const CANVAS_H = 600;
export const CANVAS_W = 800;
export const BALL_SIZE = 20;
export const PADDLE_H = 80;
export const PADDLE_W = 10;
export const PADDLE_VELOCITY_Y = 50;
export const PADDLE_WALL_OFFSET = 20;

export function createGamePositions({
    playerOneId,
    playerTwoId,
}: {
    playerOneId?: number;
    playerTwoId?: number;
}) {
    return {
        ball: {
            h: BALL_SIZE,
            w: BALL_SIZE,
            vX: 0,
            vY: 0,
            x: CANVAS_W / 2 - BALL_SIZE / 2,
            y: CANVAS_H / 2 - BALL_SIZE / 2,
        },
        playerOne: {
            w: PADDLE_W,
            h: PADDLE_H,
            vY: 0,
            vX: 0,
            x: PADDLE_WALL_OFFSET,
            y: CANVAS_H / 2 - PADDLE_H / 2,
            speed: PADDLE_VELOCITY_Y,
            id: playerOneId ?? 0,
            score: 0,
            isConnected: true,
        },
        playerTwo: {
            w: PADDLE_W,
            h: PADDLE_H,
            vY: 0,
            vX: 0,
            x: CANVAS_W - PADDLE_WALL_OFFSET - PADDLE_W,
            y: CANVAS_H / 2 - PADDLE_H / 2,
            speed: PADDLE_VELOCITY_Y,
            id: playerTwoId ?? 0,
            score: 0,
            isConnected: true,
        },
    };
}
