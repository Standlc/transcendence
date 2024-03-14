import { useNavigate, useParams } from "react-router-dom";
import { Profile } from "../components/profile/Profile";
import ModalLayout from "../UIKit/ModalLayout";

export const ProfileTestPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  return (
    <ModalLayout key={Math.random()}>
      <Profile
        userId={Number(userId)}
        goTo={(userId) => navigate(`/profile/${userId}`)}
      />
    </ModalLayout>
  );
};
