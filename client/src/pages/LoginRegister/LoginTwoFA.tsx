import { useEffect } from "react";
import { useCheck2FA } from "../../utils/auth/useCheck2FA";
import { Navigate } from "react-router-dom";
import { TwoFactorAuthLoginModal } from "../../components/login/TwoFactorAuthLoginModal";

export const LoginTwoFA = () => {
  const check2FA = useCheck2FA();

  useEffect(() => {
    if (check2FA.isError) {
    }
  }, [check2FA.isError]);

  if (check2FA.isError) {
    return <Navigate to={"/login"} />;
  }

  return (
    <div className="">
      <TwoFactorAuthLoginModal hide={() => {}} />
    </div>
  );
};
