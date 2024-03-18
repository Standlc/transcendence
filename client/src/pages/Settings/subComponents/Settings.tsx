import { useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { ConfirmAvatarPopUp } from "./ConfirmAvatarPopUp";
import { AppUser, UserUpdated } from "@api/types/clientSchema";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { TwoFactorAuthentificationSetupModal } from "../../../components/TwoFactorAuthentificationSetupModal";
import { Avatar } from "../../../UIKit/avatar/Avatar";
import { useGetUser } from "../../../utils/useGetUser";
import { setValueNoSpace } from "../../../utils/setValueNoSpace";
import { ErrorContext } from "../../../ContextsProviders/ErrorContext";

export const Settings = () => {
  const user = useGetUser();

  const [showConfirmAvatarPopup, setShowConfirmAvatarPopup] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const navigate = useNavigate();
  const [bio, setBio] = useState(user?.bio);
  const [firstname, setFirstname] = useState(user?.firstname);
  const [lastname, setLastname] = useState(user?.lastname);
  const [show2FASetupModal, setShow2FASetupModal] = useState(false);
  const [username, setUsername] = useState("");
  const [isModified, setIsModified] = useState(false);
  const { addError } = useContext(ErrorContext);

  const handleUsernameChange = (e) => {
    const newValue = e.target.value;

    setValueNoSpace(newValue, (updatedValue) => {
      setUsername(updatedValue);
      checkModification(updatedValue, firstname, lastname, bio);
    });
  };

  const handleFirstnameChange = (e) => {
    const newValue = e.target.value;
    setValueNoSpace(newValue, (updatedValue) => {
      setFirstname(updatedValue);
      checkModification(username, updatedValue, lastname, bio);
    });
  };

  const handleLastnameChange = (e) => {
    const newValue = e.target.value;
    setValueNoSpace(newValue, (updatedValue) => {
      setLastname(updatedValue);
      checkModification(username, firstname, updatedValue, bio);
    });
  };

  const handleClickChangeAvatar = () => {
    setShowConfirmAvatarPopup(true);
  };

  const handleBioChange = (e) => {
    const newValue = e.target.value;
    setBio(newValue);
    checkModification(username, firstname, lastname, newValue);
  };

  const checkModification = (
    username: string,
    firstname: string | null,
    lastname: string | null,
    bio: string | null
  ) => {
    setIsModified(hasModified);
  };

  const hasModified =
    (username !== user?.username && username !== "") ||
    firstname !== user?.firstname ||
    lastname !== user?.lastname ||
    bio !== user?.bio;

  const handleFileChange = (file) => {
    setSelectedFile(file);
  };

  const handleConfirmChange = async () => {
    if (selectedFile) {
      const formData = new FormData();
      formData.append("file", selectedFile);

      try {
        const response = await axios.post("/api/upload/user-avatar", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        queryClient.setQueryData<AppUser | undefined>(["user"], (oldData) => {
          if (oldData) {
            return {
              ...oldData,
              avatarUrl: response.data.avatarUrl,
              bio,
              firstname,
              lastname,
              username,
            };
          } else {
            return undefined;
          }
        });

        addError({ message: "Avatar successfully", isSuccess: true });
      } catch (error) {
        console.error("Failed to upload avatar", error);
        addError({ message: "Failed to update" });
      }
    }
    setShowConfirmAvatarPopup(false);
  };

  const handleCancelChange = () => {
    setShowConfirmAvatarPopup(false);
  };

  const queryClient = useQueryClient();

  const updateUserProfile = async () => {
    try {
      const body: {
        bio: string | undefined;
        firstname: string | undefined;
        lastname: string | undefined;
        username?: string;
      } = {
        username: username === "" ? undefined : username,
        bio: bio ?? undefined,
        firstname: firstname ?? undefined,
        lastname: lastname ?? undefined,
      };

      // if (username !== user?.username && username !== undefined) {
      //   body.username = username;
      // }

      const res = await axios.patch<UserUpdated>("/api/users/update", body);

      addError({ message: "updated successfully", isSuccess: true });

      queryClient.setQueryData<AppUser>(["user"], (oldData) => {
        if (oldData && typeof oldData === "object") {
          return { ...oldData, ...res.data };
        } else {
          return undefined;
        }
      });
    } catch (error) {
      console.error("Failed to update profile", error);
      alert("Failed to update profile");
    }
  };

  const logout = async () => {
    try {
      await axios.get("/api/auth/logout");

      localStorage.removeItem("token");
      queryClient.invalidateQueries({ queryKey: ["user"] });
    } catch (error) {
      console.error("Error while disconnecting", error);
    }
    queryClient.setQueryData(["user"], null);
    navigate("/", { replace: true });
  };

  return (
    <div className="flex w-full h-full justify-center items-center p-5">
      {show2FASetupModal && (
        <TwoFactorAuthentificationSetupModal
          hide={() => setShow2FASetupModal(false)}
        />
      )}
      <div className="flex flex-col w-full max-w-4xl mx-auto p-5 bg-discord-dark-grey rounded-lg shadow-lg">
        <div className="text-4xl font-bold text-left">Settings</div>
        <div className="text-xl text-white  text-left text-opacity-60 mb-20">
          Profil
        </div>
        <div className="flex justify-between items-start gap-10">
          <div className="flex flex-col flex-1 gap-6">
            <div className="mb-3 w-2/3">
              <label
                htmlFor="username"
                className="font-bold block mb-2 text-sm text-white"
              >
                USERNAME
              </label>
              <input
                type="text"
                id="username"
                value={username ?? ""}
                onChange={handleUsernameChange}
                className="bg-discord-light-black text-white rounded-l w-full h-10 px-2.5"
                placeholder={user.username}
              />
            </div>
            <div className="mb-3 w-2/3">
              <label
                htmlFor="firstname"
                className="font-bold block mb-2 text-sm text-white"
              >
                FIRSTNAME
              </label>
              <input
                type="text"
                id="firstname"
                value={firstname ?? ""}
                onChange={handleFirstnameChange}
                className="bg-discord-light-black text-white rounded-l w-full h-10 px-2.5"
                placeholder="Firstname"
              />
            </div>
            <div className="mb-3 w-2/3">
              <label
                htmlFor="lastname"
                className="font-bold block mb-2 text-sm text-white"
              >
                LASTNAME
              </label>
              <input
                type="text"
                id="lastname"
                value={lastname ?? ""}
                onChange={handleLastnameChange}
                className="bg-discord-light-black text-white rounded-l w-full h-10 px-2.5"
                placeholder="Lastname"
              />
            </div>
            <div className="mb-3 w-2/3">
              <label
                htmlFor="bio"
                className="font-bold block mb-2 text-sm text-white"
              >
                BIO
              </label>
              <input
                type="text"
                id="bio"
                value={bio ?? ""}
                onChange={handleBioChange}
                className="bg-discord-light-black text-white rounded-l w-full h-10 px-2.5"
                placeholder="Bio"
                maxLength={100}
              />
            </div>
          </div>
          <div className="flex flex-col items-center">
            <Avatar imgUrl={user.avatarUrl} size="2xl" userId={user.id} />
            <button
              onClick={handleClickChangeAvatar}
              className="mt-4 text-white bg-indigo-500 hover:bg-indigo-600 font-bold py-2 px-4 rounded"
            >
              CHANGE AVATAR
            </button>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-start gap-4">
          <button
            onClick={updateUserProfile}
            disabled={!hasModified}
            className={`bg-green-500 hover:bg-green-600 disabled:bg-white disabled:bg-opacity-30 text-white font-bold py-2 px-4 rounded`}
          >
            Save Changes
          </button>

          {user?.isTwoFactorAuthenticationEnabled ? (
            <span className="text-green-500">2FA is set up</span>
          ) : (
            <button
              onClick={() => setShow2FASetupModal(true)}
              className="text-white bg-purple-500 hover:bg-purple-600 font-bold py-2 px-4 rounded"
            >
              Set up 2FA
            </button>
          )}

          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
          >
            LOG OUT
          </button>
        </div>
      </div>

      {showConfirmAvatarPopup && (
        <ConfirmAvatarPopUp
          onFileChange={handleFileChange}
          onConfirm={handleConfirmChange}
          onCancel={handleCancelChange}
        />
      )}
    </div>
  );
};
