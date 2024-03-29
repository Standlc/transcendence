import { useEffect, useState } from "react";
import { ErrorType } from "../ContextsProviders/ErrorContext";
import { Socket, io } from "socket.io-client";
import {
  ChannelDataWithUsersWithoutPassword,
  ChannelServerEmitTypes,
  UserChannel,
} from "@api/types/channelsSchema";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useGetUser } from "./useGetUser";

export const useChatSocket = (addError: (error: ErrorType) => void) => {
  const [chatSocket, setChatSocket] = useState<Socket>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const user = useGetUser();
  const { channelId } = useParams();

  useEffect(() => {
    const connection = io("/channel");
    setChatSocket(connection);

    return () => {
      connection.disconnect();
      setChatSocket(undefined);
    };
  }, []);

  useEffect(() => {
    if (!chatSocket) return;

    const handleErrors = (err: Error) => {
      chatSocket.disconnect();
      setChatSocket(undefined);
      addError({ message: err.message });
    };

    const handleDisconnect = () => {
      setChatSocket(undefined);
    };

    const handleMemberJoin = (
      payload: ChannelServerEmitTypes["memberJoin"]
    ) => {
      if (payload.userId === user.id) {
        queryClient.invalidateQueries({ queryKey: ["channels"] });
      }

      queryClient.invalidateQueries({
        queryKey: ["channel", payload.channelId],
      });
    };

    const handleMemberLeave = (
      payload: ChannelServerEmitTypes["memberLeave"]
    ) => {
      if (
        channelId === payload.channelId.toString() &&
        payload.userId === user.id
      ) {
        navigate("/home");
      }

      if (payload.userId === user.id) {
        queryClient.invalidateQueries({ queryKey: ["channels"] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["channel"] });

        queryClient.setQueryData<ChannelDataWithUsersWithoutPassword>(
          ["channel", payload.channelId],
          (prev) => {
            if (!prev) return undefined;
            return {
              ...prev,
              users: prev.users.filter((u) => u.userId !== payload.userId),
            };
          }
        );
      }
    };

    const handleMemberMuted = (
      payload: ChannelServerEmitTypes["memberMuted"]
    ) => {
      queryClient.invalidateQueries({
        queryKey: ["channel", payload.channelId],
      });
    };

    const handleChannelDelete = (
      deletedChannelId: ChannelServerEmitTypes["channelDelete"]
    ) => {
      if (channelId === deletedChannelId.toString()) {
        navigate("/home");
      }
      queryClient.setQueryData<UserChannel[]>(["channels"], (prev) => {
        return prev?.filter((c) => c.id !== deletedChannelId);
      });
    };

    const handleNewAdmin = (payload: ChannelServerEmitTypes["newAdmin"]) => {
      queryClient.invalidateQueries({ queryKey: ["channel"] });
    };

    const handleAdminRemove = (
      payload: ChannelServerEmitTypes["adminRemove"]
    ) => {
      queryClient.invalidateQueries({ queryKey: ["channel"] });
    };

    const handleNewChannel = (
      channelId: ChannelServerEmitTypes["newChannel"]
    ) => {
      queryClient.invalidateQueries({ queryKey: ["channels"] });
    };

    const handleChannelUpdated = (
      channelId: ChannelServerEmitTypes["channelUpdated"]
    ) => {
      queryClient.invalidateQueries({ queryKey: ["channels"] });
      queryClient.invalidateQueries({
        queryKey: ["channel", Number(channelId)],
      });
    };

    const handleUserBanned = (
      payload: ChannelServerEmitTypes["userBanned"]
    ) => {
      // queryClient.invalidateQueries({
      //   queryKey: ["channelBannedUsers", payload.channelId],
      // });
    };

    const handleUserUnbanned = (
      payload: ChannelServerEmitTypes["userBanned"]
    ) => {
      queryClient.invalidateQueries({
        queryKey: ["channelBannedUsers", payload.channelId],
      });
    };

    chatSocket.on("disconnect", handleDisconnect);
    chatSocket.on("connect_error", handleErrors);
    chatSocket.on("connect_failed", handleErrors);

    chatSocket.on("memberJoin", handleMemberJoin);
    chatSocket.on("memberLeave", handleMemberLeave);
    chatSocket.on("memberMuted", handleMemberMuted);
    chatSocket.on("newChannel", handleNewChannel);
    chatSocket.on("channelDelete", handleChannelDelete);
    chatSocket.on("userBanned", handleUserBanned);
    chatSocket.on("userUnbanned", handleUserUnbanned);
    chatSocket.on("newAdmin", handleNewAdmin);
    chatSocket.on("adminRemove", handleAdminRemove);
    chatSocket.on("channelUpdated", handleChannelUpdated);

    return () => {
      chatSocket.off("disconnect", handleDisconnect);
      chatSocket.off("connect_error", handleErrors);
      chatSocket.off("connect_failed", handleErrors);
      chatSocket.off("memberJoin", handleMemberJoin);
      chatSocket.off("memberLeave", handleMemberLeave);
      chatSocket.off("channelDelete", handleChannelDelete);
      chatSocket.off("newChannel", handleNewChannel);
      chatSocket.off("newAdmin", handleNewAdmin);
      chatSocket.off("userBanned", handleUserBanned);
      chatSocket.off("userUnbanned", handleUserUnbanned);
      chatSocket.off("adminRemove", handleAdminRemove);
      chatSocket.off("memberMuted", handleMemberMuted);
      chatSocket.off("channelUpdated", handleChannelUpdated);
    };
  }, [chatSocket, navigate, queryClient, channelId, user]);

  return { chatSocket };
};
