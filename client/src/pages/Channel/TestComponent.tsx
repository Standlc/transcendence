import { ChannelDataWithUsersWithoutPassword } from "@api/types/channelsSchema";
import { DateTime } from "luxon";
import { useKickMemberFromChannel } from "../../utils/channels/useKickMemberFromChannel";
import { useBanUserFromChannel } from "../../utils/channels/useBanUserFromChannel";
import { useMuteMember } from "../../utils/channels/useMuteMember";

export const TestComponent = ({
  channel,
}: {
  channel: ChannelDataWithUsersWithoutPassword;
}) => {
  const kickMember = useKickMemberFromChannel();
  const banMember = useBanUserFromChannel();
  const muteMember = useMuteMember();

  return (
    <>
      {channel.users.map((u, i) => {
        return (
          <div key={i} className="flex gap-3">
            {u.username}
            {u.isBlocked}
            {u.mutedEnd && DateTime.fromISO(u.mutedEnd as any).toRelative()}
            <button
              onClick={() =>
                kickMember.mutate({
                  channelId: channel.id,
                  userId: u.userId,
                })
              }
              className="text-red-600"
            >
              KICK
            </button>
            <button
              onClick={() =>
                banMember.mutate({
                  channelId: channel.id,
                  userId: u.userId,
                })
              }
              className="text-red-600"
            >
              BAN
            </button>
            <button
              onClick={() =>
                muteMember.mutate({
                  channelId: channel.id,
                  userId: u.userId,
                })
              }
              className="text-gray-400"
            >
              MUTE
            </button>
          </div>
        );
      })}
    </>
  );
};
