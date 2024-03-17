import { useEffect, useState } from "react";
import { ErrorType } from "../ContextsProviders/ErrorContext";
import { Socket, io } from "socket.io-client";
import {
  ChannelDataWithUsersWithoutPassword,
  ChannelServerEmitTypes,
  UserChannel,
} from "@api/types/channelsSchema";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useGetUser } from "./useGetUser";

export const useChatSocket = (addError: (error: ErrorType) => void) => {
  const [chatSocket, setChatSocket] = useState<Socket>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const user = useGetUser();

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
      // redirect to login page
      chatSocket.disconnect();
      setChatSocket(undefined);
      addError({ message: err.message });
    };

    const handleDisconnect = () => {
      // redirect to login page
      setChatSocket(undefined);
      console.log("disconnected by server");
    };

    const handleMemberJoin = (
      payload: ChannelServerEmitTypes["memberJoin"]
    ) => {
      // invalidate channel info
      console.log("new member");
      queryClient.invalidateQueries({
        queryKey: ["channel", payload.channelId],
      });
    };

    const handleMemberLeave = (
      payload: ChannelServerEmitTypes["memberLeave"]
    ) => {
      if (payload.userId === user.id) {
        navigate("/home");
        queryClient.invalidateQueries({ queryKey: ["channels"] });
      }
      queryClient.invalidateQueries({ queryKey: ["channel"] });

      console.log(payload.userId, " left the channel");
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
    };

    const handleMemberMuted = (
      payload: ChannelServerEmitTypes["memberMuted"]
    ) => {
      queryClient.invalidateQueries({
        queryKey: ["channel", payload.channelId],
      });
    };

    const handleChannelDelete = (
      channelId: ChannelServerEmitTypes["channelDelete"]
    ) => {
      navigate("/home/friends/all");
      queryClient.setQueryData<UserChannel[]>(["channels"], (prev) => {
        return prev?.filter((c) => c.id !== channelId);
      });
    };

    const handleNewAdmin = (payload: ChannelServerEmitTypes["newAdmin"]) => {
      console.log("new admin");
      queryClient.invalidateQueries({ queryKey: ["channel"] });
    };

    const handleAdminRemove = (
      payload: ChannelServerEmitTypes["adminRemove"]
    ) => {
      console.log("admin remove");
      queryClient.invalidateQueries({ queryKey: ["channel"] });
    };

    const handleNewChannel = (
      channelId: ChannelServerEmitTypes["newChannel"]
    ) => {
      queryClient.invalidateQueries({ queryKey: ["channels"] });
    };

    chatSocket.on("disconnect", handleDisconnect);
    chatSocket.on("connect_error", handleErrors);
    chatSocket.on("connect_failed", handleErrors);

    chatSocket.on("memberJoin", handleMemberJoin);
    chatSocket.on("memberLeave", handleMemberLeave);
    chatSocket.on("memberMuted", handleMemberMuted);
    chatSocket.on("newChannel", handleNewChannel);
    chatSocket.on("channelDelete", handleChannelDelete);
    chatSocket.on("newAdmin", handleNewAdmin);
    chatSocket.on("adminRemove", handleAdminRemove);

    return () => {
      chatSocket.off("disconnect");
      chatSocket.off("connect_error");
      chatSocket.off("connect_failed");

      chatSocket.off("memberJoin");
      chatSocket.off("memberLeave");
      chatSocket.off("channelDelete");
      chatSocket.off("newChannel");
      chatSocket.off("newAdmin");
      chatSocket.off("adminRemove");
      chatSocket.off("memberMuted", handleMemberMuted);
    };
  }, [chatSocket, navigate]);
  return { chatSocket };
};
