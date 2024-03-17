import { SwitchSelectable } from "../../UIKit/SwitchSelectable";
import { setValueNoSpace } from "../../utils/setValueNoSpace";

export const ChannelSetup = ({
  name,
  password,
  namePlaceHolder,
  isPublic,
  isProtected,
}: {
  name: [string, React.Dispatch<React.SetStateAction<string>>];
  password: [string, React.Dispatch<React.SetStateAction<string>>];
  namePlaceHolder: string;
  isPublic: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
  isProtected: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
}) => {
  return (
    <div className="flex flex-col gap-5">
      <span className="opacity-50 text-sm font-semibold -mb-3">NAME</span>
      <input
        onChange={(e) => {
          setValueNoSpace(e.target.value, name[1]);
        }}
        value={name[0]}
        type="text"
        className="bg-black bg-opacity-40 rounded-md px-3 py-2"
        placeholder={namePlaceHolder}
      />

      <span className="opacity-50 text-sm font-semibold -mb-4">VISIBILITY</span>
      <div className="flex flex-col">
        <div
          onClick={() => {
            password[1]("");
            isPublic[1](!isPublic[0]);
            isProtected[1](false);
          }}
          className="flex justify-between items-center cursor-pointer"
        >
          <span className="font-bold">Private Channel</span>
          <SwitchSelectable isSelected={!isPublic[0]} />
        </div>
        <span className="opacity-50 text-xs mt-1">
          Only selected members will be able to view this channel.
        </span>
      </div>

      <span className="opacity-50 text-sm font-semibold -mb-4">PASSWORD</span>
      <div className="flex flex-col">
        <div
          onClick={() => {
            password[1]("");
            isProtected[1](!isProtected[0]);
            isPublic[1](true);
          }}
          className="flex justify-between items-center cursor-pointer"
        >
          <span className="font-bold">Password Protected</span>
          <SwitchSelectable isSelected={isProtected[0]} />
        </div>
        {isProtected[0] && (
          <input
            onChange={(e) => {
              if (e.target.value !== "") {
                isPublic[1](true);
              }
              setValueNoSpace(e.target.value, password[1]);
            }}
            value={password[0]}
            type="password"
            className="bg-black bg-opacity-40 rounded-md px-3 py-2 mt-2"
            placeholder="Channel password"
          />
        )}
        <span className="opacity-50 text-xs mt-1">
          Members will have to enter this password to join the channel.
        </span>
      </div>
    </div>
  );
};
