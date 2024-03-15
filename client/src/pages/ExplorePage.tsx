import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PublicChannel } from "@api/types/channelsSchema";
import { Spinner } from "../UIKit/Kit";
import { Link } from "react-router-dom";
import axios from "axios";
import { useRef, useState } from "react";
import { ChannelAvatar } from "../UIKit/avatar/ChannelAvatar";
import { SearchInput } from "../UIKit/SearchInput";
import { Lock } from "@mui/icons-material";
import { useJoinChannel } from "../utils/channels/useJoinChannel";
import ModalLayout from "../UIKit/ModalLayout";

export const ExplorePage = () => {
  const queryClient = useQueryClient();
  const [filterInput, setFilterInput] = useState("");

  const unfilteredChannels = useRef<PublicChannel[]>();
  const channels = useQuery({
    queryKey: ["publicChannels"],
    queryFn: async () => {
      const res = await axios.get<PublicChannel[]>("/api/channels/public");
      unfilteredChannels.current = res.data;
      return res.data;
    },
  });

  return (
    <div className="flex flex-col p-5 gap-7 w-full items-center text-left">
      <div className="max-w-screen-lg flex flex-col gap-7 w-full h-full">
        <header className="flex flex-col gap-5 justify-center items-center">
          <div className="flex justify-center items-center relative">
            <img src="/explore.svg" alt="" className="h-full w-full" />
            <div className="absolute flex flex-col gap-1 items-center">
              <h1 className="font-extrabold text-4xl">Find your community</h1>
              <span className="opacity-75">
                From gaming, to music, to learning, there's a place for you.
              </span>
            </div>
          </div>

          <SearchInput
            input={filterInput}
            placeHolder="Search channels"
            autoFocus
            onSearch={(input) => {
              setFilterInput(input);
              queryClient.setQueryData(["publicChannels"], () => {
                if (!unfilteredChannels.current) return undefined;
                if (input === "") return unfilteredChannels.current;
                return unfilteredChannels.current.filter((c) =>
                  c.name?.toLowerCase().match(input.toLowerCase())
                );
              });
            }}
          />
        </header>

        {channels.isError ? (
          <div>{channels.error.message}</div>
        ) : channels.isLoading ? (
          <Spinner isLoading />
        ) : !channels.data?.length ? (
          <span className="opacity-50 text-lg">
            {filterInput === "" ? "No channels yet" : "No results"}
          </span>
        ) : (
          <div className="grid grid-cols-3 gap-5">
            {channels.data.map((channel, i) => {
              return <ChannelCard key={i} channel={channel} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const ChannelCard = ({ channel }: { channel: PublicChannel }) => {
  const membersCount = channel.membersCount ?? 0;
  const joinChannel = useJoinChannel();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  return (
    <>
      {showPasswordModal && (
        <ProtectedChannelJoinModal
          channel={channel}
          hide={() => setShowPasswordModal(false)}
        />
      )}

      <div className="relative flex flex-col justify-between gap-3 p-4 rounded-lg bg-white bg-opacity-5 shadow-lg overflow-hidden">
        <div className="absolute h-[33%] w-full bg-black bg-opacity-40 -m-4 p-3">
          {channel.isProtected && (
            <span className="opacity-50 text-sm flex items-center gap-1 relative justify-end">
              <Lock style={{ fontSize: 12 }} />
              <span>Protected</span>
            </span>
          )}
        </div>

        <div className="relative">
          <ChannelAvatar
            borderRadius={0.1}
            imgUrl={channel.photoUrl}
            size="lg"
            id={channel.id}
          />
        </div>

        <div className="flex gap-3">
          <div className="flex flex-col flex-1 overflow-hidden">
            <span className="font-extrabold whitespace-nowrap overflow-hidden text-ellipsis text-xl">
              {channel.name}
            </span>

            <span className="opacity-50 text-sm">
              <b>{membersCount}</b> member
              {membersCount !== 1 && "s"}
            </span>
          </div>

          {channel.isMember ? (
            <Link
              to={`/home/channels/${channel.id}`}
              className="bg-white hover:translate-y-[-1px] active:translate-y-[0px] bg-opacity-10 rounded-sm py-2 px-4 font-semibold text-sm self-end"
            >
              Open
            </Link>
          ) : (
            <button
              disabled={joinChannel.isPending}
              onClick={() => {
                if (channel.isProtected) {
                  setShowPasswordModal(true);
                } else {
                  joinChannel.mutate({
                    channelId: channel.id,
                  });
                }
              }}
              className="bg-indigo-500 hover:translate-y-[-1px] active:translate-y-[0px] rounded-sm py-2 px-4 font-semibold text-sm self-end"
            >
              Join
            </button>
          )}
        </div>
      </div>
    </>
  );
};

const ProtectedChannelJoinModal = ({
  channel,
  hide,
}: {
  channel: PublicChannel;
  hide: () => void;
}) => {
  const [password, setPassword] = useState("");
  const joinChannel = useJoinChannel();

  return (
    <ModalLayout onClickOutside={hide}>
      <div className="p-5 flex flex-col gap-5 min-w-96">
        <header className="flex flex-col text-center items-center">
          <span className="flex items-center gap-2 font-extrabold text-2xl">
            <Lock fontSize="small" className="opacity-50" />
            Join {channel.name}
          </span>
          <span className="opacity-50">
            Enter the channel's password to join
          </span>
        </header>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            joinChannel.mutate({
              channelId: channel.id,
              password: password,
            });
          }}
          className="flex flex-col gap-5"
        >
          <input
            autoFocus
            type="password"
            placeholder="Enter the password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-black bg-opacity-40 rounded-md px-3 py-2"
          />
          <button
            type="submit"
            disabled={password === "" || joinChannel.isPending}
            className="bg-indigo-500 font-bold text-lg py-2 px-4 rounded-md disabled:opacity-50 -mt-1"
          >
            Join
          </button>
        </form>

        <button
          onClick={hide}
          className="self-end opacity-50 hover:opacity-100 hover:text-red-600"
        >
          Cancel
        </button>
      </div>
    </ModalLayout>
  );
};
