import { UserGame } from "@api/types/games";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import { SocketsContext } from "../ContextsProviders/SocketsContext";
import { WsGameEndType } from "@api/types/gameServer/socketPayloadTypes";
import { Avatar } from "../UIKit/avatar/Avatar";
import { UserContext } from "../ContextsProviders/UserContext";
import { useGameIdParam } from "../utils/useGameIdParam";

export const RejoinGameNotification = () => {
  const queryClient = useQueryClient();
  const { gameSocketOn, gameSocketOff } = useContext(SocketsContext);
  const { gameId } = useGameIdParam();
  const { user } = useContext(UserContext);

  const currentGame = useQuery({
    queryKey: ["currentGame"],
    queryFn: async () => {
      const res = await axios.get<UserGame | null>("/api/games/current");
      return res.data;
    },
  });

  useEffect(() => {
    const handleGameEnd = (game: WsGameEndType) => {
      queryClient.setQueryData(
        ["currentGame"],
        (prev: UserGame | null | undefined) => {
          if (!prev || prev.id !== game.id) {
            return undefined;
          }
          return null;
        }
      );
    };

    gameSocketOn("gameEnd", handleGameEnd);
    return () => {
      gameSocketOff("gameEnd", handleGameEnd);
    };
  }, [gameSocketOn, gameSocketOff, queryClient]);

  if (!currentGame.data || gameId === currentGame.data.id) {
    return null;
  }

  const { playerLeft, playerRight } =
    user.id === currentGame.data.playerOne.id
      ? {
          playerLeft: currentGame.data.playerTwo,
          playerRight: currentGame.data.playerOne,
        }
      : {
          playerLeft: currentGame.data.playerOne,
          playerRight: currentGame.data.playerTwo,
        };

  return (
    <div className="fixed z-50 top-5 right-5 animate-fadein">
      <div className="animate-scalein rounded-[19px] border-[1px] border-opacity-15 border-white flex flex-col items-center gap-3 p-3 bg-zinc-900 shadow-card">
        <div className="flex gap-3 items-center">
          <div className="flex gap-2 items-center">
            <Avatar
              imgUrl={playerLeft.avatarUrl}
              size="md"
              userId={playerLeft.id}
            />
            {/* <span className="font-bold">{playerLeft.username}</span> */}
          </div>

          <span className="font-gameFont text-sm flex items-center">VS</span>

          <div className="flex opacity-30 gap-2 items-center">
            {/* <span className="font-bold">{playerLeft.username}</span> */}
            <div className="">
              <Avatar
                imgUrl={playerRight.avatarUrl}
                size="md"
                userId={playerRight.id}
              />
            </div>
          </div>

          <div className="h-[30px] w-[1px] bg-white opacity-15"></div>

          <Link
            to={`/play/${currentGame.data.id}`}
            // onClick={() => }
            className="font-extrabold text-lg bg-indigo-500 py-2 px-5 rounded-lg hover:translate-y-[-1px] active:translate-y-[1px]"
          >
            Rejoin Game
          </Link>
        </div>
      </div>
    </div>
  );
};
