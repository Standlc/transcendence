import { UserGameInvitation } from "@api/types/gameRequests";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const useGameInvitations = () => {
  const gameInvitations = useQuery({
    queryKey: ["gameInvitation"],
    queryFn: async () => {
      const res = await axios.get<UserGameInvitation[]>(
        "/api/game-requests/invitations"
      );
      return res.data;
    },
  });

  return gameInvitations;
};
