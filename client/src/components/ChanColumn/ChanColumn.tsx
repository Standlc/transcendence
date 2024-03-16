import { Link, NavLink, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import {
  Add,
  Close,
  People,
  Settings,
  SettingsRounded,
} from "@mui/icons-material";
import { useGetUser } from "../../utils/useGetUser";
import { Avatar } from "../../UIKit/avatar/Avatar";
import ModalLayout from "../../UIKit/ModalLayout";
import { USER_STATUS } from "@api/types/usersStatusTypes";
import { CreateConversationCard } from "./CreateConversationCard";
import { CreateChannelCard } from "./CreateChannelCard";
import { ReloadButton } from "../../UIKit/ReloadButton";
import { ChannelAvatar } from "../../UIKit/avatar/ChannelAvatar";
import { useDeleteConversation } from "../../utils/conversations/useDeleteConversation";
import { UserChannel, UserConversationType } from "@api/types/channelsSchema";
import { useGetChannels } from "../../utils/channels/useGetChannels";
import { useGetConversations } from "../../utils/conversations/useGetConversations";
import { useDeleteChannel } from "../../utils/channels/useDeleteChannel";
import { useGetChannel } from "../../utils/channels/useGetChannel";
import { SwitchSelectable } from "../../UIKit/SwitchSelectable";
import { useLeaveChannel } from "../../utils/channels/useLeaveChannel";

export const ChanColumn = () => {
  const [showCreateConversation, setShowCreateConversation] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const user = useGetUser();
  const conversations = useGetConversations();
  const channels = useGetChannels();

  return (
    <div className="bg-bg-1 relative min-w-64 border-r border-r-[rgba(0,0,0,0.2)] max-h-[100vh] min-h-[100vh] flex flex-col justify-between overflow-y-auto">
      <div className="">
        <div className="p-2">
          <NavLink
            to={"friends"}
            className={({ isActive }) =>
              `w-full flex item-center gap-3 py-3 px-4 bg-white font-bold rounded-md ${
                isActive ? "bg-opacity-10" : "bg-opacity-0 hover:bg-opacity-5"
              }`
            }
          >
            <People />
            <span>Friends</span>
          </NavLink>
        </div>

        <div className="p-2 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Header
              onClick={() => setShowCreateConversation(!showCreateConversation)}
              title="DIRECT MESSAGES"
              refetch={conversations.refetch}
            />

            {showCreateConversation && (
              <ModalLayout
                onClickOutside={() => setShowCreateConversation(false)}
              >
                <CreateConversationCard
                  hide={() => setShowCreateConversation(false)}
                />
              </ModalLayout>
            )}

            <div className="text-left flex flex-col gap-[2px]">
              {conversations.data?.map((conv, i) => (
                <Conversation key={i} conversation={conv} />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Header
              onClick={() => setShowCreateChannel(!showCreateConversation)}
              title="CHANNELS"
              refetch={channels.refetch}
            />

            {showCreateChannel && (
              <ModalLayout onClickOutside={() => setShowCreateChannel(false)}>
                <CreateChannelCard hide={() => setShowCreateChannel(false)} />
              </ModalLayout>
            )}

            <div className="flex flex-col gap-[2px]">
              {channels.data?.map((channel, i) => (
                <Channel channel={channel} key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex sticky w-full bottom-0 bg-almost-black p-2 items-center justify-between">
        <div className="flex items-center">
          <Avatar
            imgUrl={user?.avatarUrl}
            size="sm"
            userId={user?.id ?? 0}
            status={user.status}
            borderRadius={0.5}
          />
          <div className="ml-3 flex flex-col gap-1">
            <div className="font-bold text-left leading-4">
              {user?.username}
            </div>
            <span className="text-left text-xs leading-4 opacity-75">
              {user.status === USER_STATUS.ONLINE
                ? "Online"
                : user.status === USER_STATUS.PLAYING
                ? "Playing"
                : "Offline"}
            </span>
          </div>
        </div>

        <Link to={"/settings"} className="flex justify-end">
          <Settings />
        </Link>
      </div>
    </div>
  );
};

const Header = ({
  onClick,
  title,
  refetch,
}: {
  onClick: () => void | any;
  refetch: () => void | any;
  title: string;
}) => {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="sticky top-0 z-10 -mx-2 px-5 py-2 bg-bg-1 border-b border-b-[rgba(0,0,0,0.2)] flex cursor-pointer items-center justify-between text-white text-opacity-50 hover:text-opacity-100"
    >
      <span className="text-sm font-[600]">{title}</span>

      <div className="flex items-center gap-1">
        <ReloadButton onClick={refetch} />
        <div className="h-[25px] aspect-square rounded-full bg-black opacity-75 hover:opacity-100 bg-opacity-30 flex items-center justify-center active:scale-90 transition-transform">
          <Add fontSize="small" />
        </div>
      </div>
    </div>
  );
};

const Conversation = ({
  conversation,
}: {
  conversation: UserConversationType;
}) => {
  const { dmId } = useParams();
  const deleteConversation = useDeleteConversation();

  const isActive = useMemo(
    () => Number(dmId) === conversation.id,
    [dmId, conversation.id]
  );

  return (
    <div
      className={`relative flex items-center w-full group/conversation bg-white rounded-md bg-opacity-0 ${
        isActive ? "bg-opacity-10" : "bg-opacity-0 hover:bg-opacity-5"
      }`}
    >
      <NavLink
        className={`flex items-center gap-3 px-2 w-full py-2 rounded-md `}
        to={`dm/${conversation.id}`}
      >
        <Avatar
          imgUrl={conversation.user.avatarUrl}
          size="sm"
          userId={conversation.user.id}
          status={conversation.user.status}
          borderRadius={0.5}
        />
        <div className="font-bold">{conversation.user.username}</div>
      </NavLink>

      <button
        onClick={() => {
          deleteConversation.mutate(conversation.id);
        }}
        className="absolute group-hover/conversation:flex opacity-50 hover:opacity-100 hidden aspect-square items-center justify-center right-2"
      >
        <Close fontSize="small" />
      </button>
    </div>
  );
};

const Channel = ({ channel }: { channel: UserChannel }) => {
  const { channelId } = useParams();
  const [showSettings, setShowSettings] = useState(false);
  const deleteChannel = useDeleteChannel();
  const leaveChannel = useLeaveChannel();
  const user = useGetUser();

  const isActive = useMemo(
    () => Number(channelId) === channel.id,
    [channelId, channel.id]
  );

  return (
    <>
      {showSettings && channel.isUserAdmin && (
        <ChannelSettingsModal
          channelId={channel.id}
          hide={() => setShowSettings(false)}
        />
      )}
      <div
        className={`relative flex items-center w-full group/channel bg-white rounded-md bg-opacity-0 ${
          isActive ? "bg-opacity-10" : "bg-opacity-0 hover:bg-opacity-5"
        }`}
      >
        <NavLink
          className={`flex items-center gap-3 px-2 w-full py-2 rounded-md `}
          to={`channels/${channel.id}`}
        >
          <ChannelAvatar
            imgUrl={channel.photoUrl}
            size="sm"
            id={channel.id}
            borderRadius={0.5}
          />
          <div className="font-bold">{channel.name}</div>
        </NavLink>

        <div className="absolute right-2 flex items-center gap-2">
          {user.id === channel.ownerId && (
            <button
              onClick={() => setShowSettings(true)}
              className="group-hover/channel:flex opacity-50 hover:opacity-100 hidden aspect-square items-center justify-center"
            >
              <SettingsRounded fontSize="small" />
            </button>
          )}

          <button
            disabled={deleteChannel.isPending || leaveChannel.isPending}
            onClick={() => {
              if (user.id === channel.ownerId) {
                deleteChannel.mutate(channel.id);
              } else {
                leaveChannel.mutate(channel.id);
              }
            }}
            className="group-hover/channel:flex opacity-50 hover:opacity-100 hidden aspect-square items-center justify-center"
          >
            <Close fontSize="small" />
          </button>
        </div>
      </div>
    </>
  );
};

const ChannelSettingsModal = ({
  channelId,
  hide,
}: {
  channelId: number;
  hide: () => void;
}) => {
  const channel = useGetChannel(channelId);
  const [newName, setNewName] = useState("");
  const [isPublic, setIsPublic] = useState(!!channel.data?.isPublic);
  const [newPassword, setNewPassword] = useState("");

  return (
    <ModalLayout onClickOutside={hide}>
      {channel.data && (
        <div className="p-4 flex flex-col gap-5 text-left">
          <header className="text-2xl font-extrabold">Channel Settings</header>

          <span className="opacity-50 text-sm font-semibold -mb-3">NAME</span>
          <input
            onChange={(e) => {
              setNewName(e.target.value);
            }}
            value={newName}
            type="text"
            className="bg-black bg-opacity-40 rounded-md px-3 py-2"
            placeholder={channel.data.name}
          />

          <span className="opacity-50 text-sm font-semibold -mb-4">
            VISIBILITY
          </span>
          <div className="flex flex-col">
            <div
              onClick={() => {
                setNewPassword("");
                setIsPublic(!isPublic);
              }}
              className="flex justify-between items-center cursor-pointer"
            >
              <span className="font-bold">Private Channel</span>
              <SwitchSelectable isSelected={!isPublic} />
            </div>
            <span className="opacity-50 text-xs">
              Only selected members will be able to view this channel.
            </span>
          </div>

          <span className="opacity-50 text-sm font-semibold -mb-3">
            PASSWORD
          </span>
          <div className="flex flex-col">
            <input
              onChange={(e) => {
                if (e.target.value !== "") {
                  setIsPublic(true);
                }
                setNewPassword(e.target.value);
              }}
              value={newPassword}
              type="password"
              className="bg-black bg-opacity-40 rounded-md px-3 py-2"
              placeholder="Channel password (optional)"
            />
            <span className="opacity-50 text-xs mt-1">
              Members will have to enter this password to join the channel.
            </span>
          </div>

          <button
            onClick={() => {}}
            disabled={
              (newName === channel.data.name || newName === "") &&
              isPublic === channel.data.isPublic &&
              newPassword === ""
            }
            className="bg-green-600 py-2 px-4 rounded-md font-semibold disabled:opacity-50"
          >
            Save changes
          </button>
        </div>
      )}
    </ModalLayout>
  );
};
