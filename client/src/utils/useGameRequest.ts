import { GameInvitationUser, UserGameRequest } from "@api/types/gameRequests";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const useGameRequest = () => {
  const currentGameRequest = useQuery({
    queryKey: ["currentGameRequest"],
    queryFn: async () => {
      const res = await axios.get<
        (UserGameRequest & { targetUser: GameInvitationUser | null }) | null
      >("/api/game-requests");
      return res.data;
    },
  });

  return currentGameRequest;
};
