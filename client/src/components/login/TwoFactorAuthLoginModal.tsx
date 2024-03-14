import { useMutation, useQueryClient } from "@tanstack/react-query";
import ModalLayout from "../../UIKit/ModalLayout";
import { TwoFactorAuthInput } from "../../UIKit/TwoFactorAuthInput";
import axios from "axios";
import { AppUser } from "@api/types/clientSchema";
import { useState } from "react";

export const TwoFactorAuthLoginModal = ({ hide }: { hide: () => void }) => {
  const [isError, setIsError] = useState(false);
  const queryClient = useQueryClient();

  const submitCode = useMutation({
    mutationFn: async (code: string) => {
      const res = await axios.post<AppUser>(
        `/api/auth/2fa/authenticate?code=${code}`
      );
      return res.data;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["user"], user);
    },
    onError: (err) => {
      console.log(err.message);
      setIsError(true);
    },
  });

  return (
    <ModalLayout>
      <div className="flex flex-col gap-7 p-5 items-center">
        <header className="flex flex-col items-center">
          <span className="text-2xl font-extrabold">
            Two-Factor Authentification
          </span>
          <span className="opacity-50">Enter the generated 2FA code</span>
        </header>
        <TwoFactorAuthInput
          onSubmit={(code) => submitCode.mutate(code)}
          isError={isError}
          resetError={() => setIsError(false)}
        />
        <button onClick={hide} className="opacity-50 self-end">
          Go Back
        </button>
      </div>
    </ModalLayout>
  );
};
