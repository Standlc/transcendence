import { useEffect, useRef, useState } from "react";

export default function PongGame() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [game, setGame] = useState({
        ball: {
            x: 200,
            y: 100,
        },
        playerLeft: {
            x: 0,
            y: 0,
        },
        playerRight: {
            x: 0,
            y: 0,
        },
    });

    // const drawBall = (
    //   ctx: CanvasRenderingContext2D,
    //   x: number,
    //   y: number,
    //   w: number,
    //   h: number
    // ) => {
    //   ctx.fillRect(x, y, h, w);
    // };

    useEffect(() => {
        if (!canvasRef.current) {
            return;
        }

        const ctx = canvasRef.current.getContext("2d");
        if (!ctx) {
            return;
        }

        ctx.fillStyle = "white";

        ctx.fillRect(game.ball.x, game.ball.y, 25, 25);

        ctx.fillRect(game.ball.x, game.ball.y, 25, 25);

        // ctx?.fillRect(25, 25, 100, 100);
        // ctx?.clearRect(45, 45, 60, 60);
        // ctx?.strokeRect(50, 50, 50, 50);
    }, [canvasRef, game]);

    function roundedRect(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number
    ) {
        ctx.beginPath();
        ctx.moveTo(x, y + radius);
        ctx.arcTo(x, y + height, x + radius, y + height, radius);
        ctx.arcTo(x + width, y + height, x + width, y + height - radius, radius);
        ctx.arcTo(x + width, y, x + width - radius, y, radius);
        ctx.arcTo(x, y, x, y + radius, radius);
        ctx.stroke();
    }

    return (
        <canvas ref={canvasRef} width="600" height="400" className="border"></canvas>
    );
}
