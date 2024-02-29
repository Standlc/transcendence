import { useState } from "react";
import { SendGameInvitationModal } from "../components/SendGameInvitationModal";
export const GameInvitationTestPage = () => {
  const [input, setInput] = useState("");
  const [showGameInvitationModal, setShowGameInvitationModal] = useState(false);

  return (
    <div>
      <input
        type="text"
        className="text-black"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button onClick={() => setShowGameInvitationModal(true)}>
        Invite to play
      </button>

      {showGameInvitationModal && (
        <SendGameInvitationModal
          invitedUser={{ username: "Magnus", id: Number(input) }}
          hide={() => setShowGameInvitationModal(false)}
        />
      )}
    </div>
  );
};
