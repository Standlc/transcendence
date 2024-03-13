import { useContext, useEffect, useState } from "react";
import ModalLayout from "../../UIKit/ModalLayout";
import { Profile } from "./Profile";
import { UserProfileContext } from "../../ContextsProviders/UserProfileIdContext";

export const ProfileModal = () => {
  const { userProfileId, setUserProfileId } = useContext(UserProfileContext);
  const [currentLocation, setCurrentLocation] = useState(location.pathname);

  useEffect(() => {
    if (currentLocation !== location.pathname) {
      setUserProfileId(undefined);
      setCurrentLocation(location.pathname);
    }
  }, [location.pathname, currentLocation]);

  if (userProfileId === undefined) {
    return null;
  }

  return (
    <ModalLayout
      key={userProfileId}
      onClickOutside={() => setUserProfileId(undefined)}
    >
      <Profile userId={userProfileId} goTo={setUserProfileId} />
    </ModalLayout>
  );
};
