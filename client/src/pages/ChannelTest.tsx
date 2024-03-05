import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useContext, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { UserContext } from "../ContextsProviders/UserContext";
import { ChannelInfos } from "@api/types/channelsSchema";
import { DateTime } from "luxon";

export const ChannelTest = () => {
  const { channelId } = useParams();
  const channelIdToNumber = useMemo(() => Number(channelId), [channelId]);
  const [targetId, setTargetId] = useState("");
  const { user } = useContext(UserContext);

  const channel = useQuery({
    queryKey: ["channel", channelIdToNumber],
    queryFn: async () => {
      const res = await axios.get<ChannelInfos>(
        `/api/channelsHttp/test/${channelIdToNumber}`
      );
      return res.data;
    },
  });

  const kickMember = useMutation({
    mutationFn: async (memberId: number) => {
      await axios.post(`/api/channelsHttp/kick`, {
        userId: memberId,
        channelId: channelIdToNumber,
      });
      return memberId;
    },
  });

  const addUser = useMutation({
    mutationFn: async (userId: number) => {
      await axios.post(`/api/channelsHttp/add`, {
        userId,
        channelId: channelIdToNumber,
      });
      return userId;
    },
  });

  const leaveChannel = useMutation({
    mutationFn: async () => {
      const res = await axios.delete(`/api/channelsHttp/leave/${channelId}`);
      return res.data;
    },
  });

  if (channel.isLoading) {
    return "Loading...";
  }

  if (channel.isError) {
    return channel.error.message;
  }

  return (
    <div className="flex flex-col gap-2">
      {channelId}
      <input
        type="text"
        className="bg-black"
        value={targetId}
        onChange={(e) => setTargetId(e.target.value)}
      />
      <button onClick={() => addUser.mutate(Number(targetId))}>Add</button>
      <button onClick={() => leaveChannel.mutate()}>Leave</button>
      <button onClick={() => kickMember.mutate(Number(targetId))}>Kick</button>

      {channel.data && (
        <div className="flex flex-col gap-2">
          <span className="font-extrabold text-xl">{channel.data.name}</span>
          <span>Members ids</span>
          <div className="flex gap-2">
            {channel.data.users.map((user, i) => {
              return <ChannelMember key={i} member={user} />;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const ChannelMember = ({
  member,
}: {
  member: {
    mutedEnd: Date | null;
    joinedAt: Date;
    id: number;
  };
}) => {


  // useEffect(() => {
  //   const isMuted = member.mutedEnd && DateTime.fromISO(member.mutedEnd as any as string).;
  //   if (  as string)
  // }, [member.mutedEnd])

  return <div className="">
    <span className="">{member.id}</span>
  </div>;
};
