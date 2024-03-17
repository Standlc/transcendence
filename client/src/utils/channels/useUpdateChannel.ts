import { ChannelUpdate } from "@api/types/channelsSchema";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useContext } from "react";
import { ErrorContext } from "../../ContextsProviders/ErrorContext";

export const useUpdateChannel = (props?: { onSuccess: () => void }) => {
  const { addError } = useContext(ErrorContext);
  // const queryClient = useQueryClient();

  // const updateChannelList = (updates: UpdatedChannel) => {
  //   queryClient.setQueryData<UserChannel[]>(["channels"], (prev) => {
  //     return prev?.map((c) => {
  //       if (c.id !== updates.id) return c;
  //       return {
  //         ...c,
  //         name: updates.name ?? c.name,
  //         isPublic: updates.isPublic,
  //         isProtected: updates.isProtected,
  //         photoUrl: updates.photoUrl,
  //       };
  //     });
  //   });
  // };

  // const updateChannelQuery = (channel: UpdatedChannel) => {
  //   queryClient.setQueryData<ChannelDataWithUsersWithoutPassword>(
  //     ["channel", channel.id],
  //     (prev) => {
  //       if (!prev) return undefined;
  //       return {
  //         ...prev,
  //         isProtected: channel.isProtected,
  //         isPublic: channel.isPublic,
  //         photoUrl: channel.photoUrl,
  //         name: channel.name,
  //       };
  //     }
  //   );
  // };

  const updateChannel = useMutation({
    mutationFn: async (payload: ChannelUpdate & { channelId: number }) => {
      const { channelId, ...other } = payload;
      await axios.put(`/api/channels/${payload.channelId}`, other);
      return channelId;
    },
    onSuccess: () => {
      addError({ message: "Channel was updated", isSuccess: true });
      props?.onSuccess && props.onSuccess();
      // updateChannelQuery(channel);
      // updateChannelList(channel);
    },
    onError: () => {
      addError({ message: "Error while updating channel" });
    },
  });

  return updateChannel;
};
