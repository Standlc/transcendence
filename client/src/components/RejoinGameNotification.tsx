import { UserGame } from "@api/types/games";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useContext, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SocketsContext } from "../ContextsProviders/SocketsContext";
import { WsGameEndType } from "@api/types/gameServer/socketPayloadTypes";

export const RejoinGameNotification = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { gameSocketOn, gameSocketOff } = useContext(SocketsContext);
  const { gameId } = useParams();

  const currentGame = useQuery({
    queryKey: ["currentGame"],
    queryFn: async () => {
      const res = await axios.get<UserGame | null>("/api/games/current");
      return res.data;
    },
  });

  useEffect(() => {
    const handleGameEnd = (game: WsGameEndType) => {
      console.log("removign game");
      //   queryClient.setQueryData(
      //     ["currentGame"],
      //     (prev: UserGame | null | undefined) => {
      //       if (!prev) return undefined;
      //       if (prev.id === game.id) {
      //         console.log("removign game");
      //         return null;
      //       }
      //       return undefined;
      //     }
      //   );
    };

    gameSocketOn("gameEnd", handleGameEnd);
    return () => {
      gameSocketOff("gameEnd", handleGameEnd);
    };
  }, [gameSocketOn, gameSocketOff, queryClient]);

  if (!currentGame.data || gameId != null) {
    return null;
  }

  return (
    <div className="fixed top-5 right-5 flex z-50 p-4 bg-zinc-950">
      <button onClick={() => navigate(`/play/${currentGame.data?.id}`)}>
        Join
      </button>
    </div>
  );
};
