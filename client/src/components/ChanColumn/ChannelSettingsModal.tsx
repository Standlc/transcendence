import { useEffect, useState } from "react";
import { useGetChannel } from "../../utils/channels/useGetChannel";
import { useUpdateChannel } from "../../utils/channels/useUpdateChannel";
import ModalLayout from "../../UIKit/ModalLayout";
import { ChannelSetup } from "./ChannelSetup";

export const ChannelSettingsModal = ({
  channelId,
  hide,
}: {
  channelId: number;
  hide: () => void;
}) => {
  const channel = useGetChannel(channelId);
  const updateChannel = useUpdateChannel({ onSuccess: hide });
  const [newName, setNewName] = useState("");
  const [isPublic, setIsPublic] = useState(!!channel.data?.isPublic);
  const [newPassword, setNewPassword] = useState("");
  const [isProtected, setIsProtected] = useState(!!channel.data?.isProtected);

  useEffect(() => {
    setIsProtected(!!channel.data?.isProtected);
    setIsPublic(!!channel.data?.isPublic);
  }, [channel.data?.isProtected, channel.data?.isPublic]);

  const isDisabled =
    channel.data &&
    (newName === channel.data.name || newName === "") &&
    isPublic === channel.data.isPublic &&
    newPassword === "" &&
    isProtected === channel.data.isProtected;

  return (
    <ModalLayout onClickOutside={hide}>
      {channel.data && (
        <div className="p-4 flex flex-col gap-5 text-left">
          <header className="text-2xl font-extrabold">Channel Settings</header>

          <ChannelSetup
            namePlaceHolder={channel.data.name}
            name={[newName, setNewName]}
            isProtected={[isProtected, setIsProtected]}
            isPublic={[isPublic, setIsPublic]}
            password={[newPassword, setNewPassword]}
          />

          <button
            onClick={() =>
              updateChannel.mutate({
                channelId: channel.data.id,
                name: newName === "" ? undefined : newName,
                password: !isProtected
                  ? null
                  : newPassword === ""
                  ? undefined
                  : newPassword,
                isPublic,
              })
            }
            disabled={isDisabled && updateChannel.isPending}
            className="bg-green-600 py-2 px-4 rounded-md font-semibold disabled:opacity-50"
          >
            Save changes
          </button>
        </div>
      )}
    </ModalLayout>
  );
};
