import {
  Close,
  DoNotDisturbOn,
  PersonAdd,
  PersonRemove,
  QuestionAnswer,
  SettingsRounded,
  SportsEsports,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useRemoveFriend } from "../../utils/friends/useRemoveFriend";
import { useBlockUser } from "../../utils/block/useBlockUser";
import { useUnblockUser } from "../../utils/block/useUnblockUser";
import { useMemo, useState } from "react";
import { useGetUser } from "../../utils/useGetUser";
import { useAddFriend } from "../../utils/friends/useAddFriend";
import { UserProfile } from "@api/types/clientSchema";
import { SendGameInvitationModal } from "../SendGameInvitationModal";
import { useCancelFriendRequest } from "../../utils/friends/useCancelFriendRequest";
import { useAcceptFriend } from "../../utils/friends/useAcceptFriend";
import { ActionsMenu, MenuActionType } from "../../UIKit/ActionsMenu";
import { useStartConversation } from "../../utils/conversations/useStartConversation";

export const ProfileActionsMenu = ({ profile }: { profile: UserProfile }) => {
  const [showGameInvitationModal, setShowGameInvitationModal] = useState(false);
  const currentUser = useGetUser();
  const navigate = useNavigate();
  const addFriend = useAddFriend();
  const acceptFriend = useAcceptFriend();
  const removeFriend = useRemoveFriend();
  const cancelFriendRequest = useCancelFriendRequest();
  const blockUser = useBlockUser();
  const unblockUser = useUnblockUser();
  const startConversation = useStartConversation();

  const actions = useMemo<MenuActionType[]>(() => {
    if (profile.id === currentUser.id) {
      return [
        {
          label: "Edit",
          onClick: () => navigate("/settings"),
          icon: <SettingsRounded fontSize="small" />,
        },
      ];
    }

    if (profile.isBlocking) {
      return [];
    }

    if (profile.isBlocked) {
      return [
        {
          label: "Unblock",
          onClick: () => {
            unblockUser.mutate(profile.id);
          },
          color: "red",
          icon: <Close fontSize="small" />,
        },
      ];
    }

    const availableActions: MenuActionType[] = [];
    if (!profile.isFriends) {
      if (profile.friendRequestSourceUserId === null) {
        availableActions.push({
          label: "Add Friend",
          onClick: () => {
            addFriend.mutate(profile.id);
          },
          icon: <PersonAdd fontSize="small" />,
        });
      } else if (profile.friendRequestSourceUserId === currentUser.id) {
        availableActions.push({
          label: "Cancel Friend Request",
          onClick: () => {
            cancelFriendRequest.mutate(profile.id);
          },
          icon: <PersonRemove fontSize="small" />,
          color: "red",
        });
      } else if (profile.friendRequestSourceUserId === profile.id) {
        availableActions.push({
          label: "Accept Friend",
          onClick: () => {
            acceptFriend.mutate(profile.id);
          },
          icon: <PersonAdd fontSize="small" />,
        });
      }
    } else {
      availableActions.push(
        {
          label: "Send Message",
          onClick: () => {
            if (profile.conversationId !== null) {
              navigate(`/home/dm/${profile.conversationId}`);
            } else {
              startConversation.mutate(profile.id);
            }
          },
          icon: <QuestionAnswer fontSize="small" />,
        },
        {
          label: "Play",
          onClick: () => {
            setShowGameInvitationModal(true);
          },
          icon: <SportsEsports fontSize="small" />,
        },
        {
          label: "Remove Friend",
          onClick: () => {
            removeFriend.mutate(profile.id);
          },
          color: "red",
          icon: <PersonRemove fontSize="small" />,
        }
      );
    }

    availableActions.push({
      label: "Block",
      onClick: () => {
        blockUser.mutate(profile.id);
      },
      color: "red",
      icon: <DoNotDisturbOn fontSize="small" />,
    });
    return availableActions;
  }, [profile, currentUser.id]);

  return (
    <>
      {showGameInvitationModal && (
        <SendGameInvitationModal
          invitedUser={{ username: profile.username, id: profile.id }}
          hide={() => setShowGameInvitationModal(false)}
        />
      )}
      <ActionsMenu actions={actions} />
    </>
  );
};
