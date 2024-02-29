import {
  PrivateGameRequestDto,
  UserGameInvitation,
} from "@api/types/gameRequests";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";

export const useSendGameInvitation = (props?: {
  onSuccess?: (invitation: UserGameInvitation) => void;
  onError?: () => void;
}) => {
  const gameInvitation = useMutation({
    mutationFn: async (req: PrivateGameRequestDto) => {
      const res = await axios.post<UserGameInvitation>(
        "/api/game-requests/invitation",
        req
      );
      return res.data;
    },
    onSuccess: props?.onSuccess,
    onError: props?.onError,
  });

  return gameInvitation;
};
