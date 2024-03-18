import { useEffect, useState } from "react";
import { useGetChannel } from "../../utils/channels/useGetChannel";
import { useUpdateChannel } from "../../utils/channels/useUpdateChannel";
import ModalLayout from "../../UIKit/ModalLayout";
import { ChannelSetup } from "./ChannelSetup";
import { ChannelAvatar } from "../../UIKit/avatar/ChannelAvatar";
import { CameraAltRounded, Close } from "@mui/icons-material";

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
  const [newAvatar, setNewAvatar] = useState<File>();

  useEffect(() => {
    setIsProtected(!!channel.data?.isProtected);
    setIsPublic(!!channel.data?.isPublic);
  }, [channel.data?.isProtected, channel.data?.isPublic]);

  const isDisabled =
    channel.data &&
    (newName === channel.data.name || newName === "") &&
    isPublic === channel.data.isPublic &&
    newPassword === "" &&
    isProtected === channel.data.isProtected &&
    !newAvatar;

  return (
    <ModalLayout onClickOutside={hide}>
      {channel.data && (
        <div className="p-4 flex flex-col gap-5 text-left">
          <header className="text-2xl font-extrabold">Channel Settings</header>

          <div className="group/avatar-input relative w-min rounded-full overflow-hidden">
            <ChannelAvatar
              borderRadius={1}
              imgUrl={
                newAvatar
                  ? URL.createObjectURL(newAvatar)
                  : channel.data.photoUrl
              }
              id={channel.data.id}
              size="xl"
            />
            {newAvatar ? (
              <div
                onClick={() => setNewAvatar(undefined)}
                className="h-full absolute cursor-pointer w-full top-0 left-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover/avatar-input:opacity-100"
              >
                <Close />
              </div>
            ) : (
              <label
                htmlFor="avatar-input"
                className="h-full absolute cursor-pointer w-full top-0 left-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover/avatar-input:opacity-100"
              >
                <CameraAltRounded />
                <input
                  hidden
                  type="file"
                  onChange={(e) => {
                    if (e.target.files) {
                      setNewAvatar(e.target.files[0]);
                    }
                  }}
                  id="avatar-input"
                  accept=".png,.jpeg,.jpg"
                />
              </label>
            )}
          </div>

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
                avatarFile: newAvatar,
              })
            }
            disabled={isDisabled || updateChannel.isPending}
            className="bg-green-600 py-2 px-4 rounded-md font-semibold disabled:opacity-50"
          >
            Save changes
          </button>
        </div>
      )}
    </ModalLayout>
  );
};
