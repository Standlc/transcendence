import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Spinner } from "../UIKit/Kit";
import ModalLayout from "../UIKit/ModalLayout";
import { useContext, useState } from "react";
import { ErrorContext } from "../ContextsProviders/ErrorContext";
import { AppUser } from "@api/types/clientSchema";
import { TwoFactorAuthInput } from "../UIKit/TwoFactorAuthInput";

export const TwoFactorAuthentificationSetupModal = ({
  hide,
}: {
  hide: () => void;
}) => {
  const { addError } = useContext(ErrorContext);
  const [isError, setIsError] = useState(false);
  const queryClient = useQueryClient();

  const TwoFAQrCode = useQuery({
    queryKey: ["2FAQrCode"],
    queryFn: async () => {
      console.log("fetching");
      const res = await axios.get<string>("/api/auth/2fa/activate");
      return res.data;
    },
  });

  const validate2Fa = useMutation({
    mutationFn: async (code: string) => {
      const res = await axios.post(`/api/auth/2fa/turn-on?code=${code}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.setQueryData(["user"], (prev: AppUser) => {
        prev.isTwoFactorAuthenticationEnabled = true;
      });
      hide();
      addError({
        message: "2FA set up successfully",
        isSuccess: true,
      });
    },
    onError: (err) => {
      addError({ message: "Authentification failed" });
      console.log(err.message);
    },
  });

  if (TwoFAQrCode.isError) {
    return TwoFAQrCode.error.message;
  }

  return (
    <ModalLayout>
      {TwoFAQrCode.isLoading ? (
        <Spinner isLoading />
      ) : (
        <div className="p-5 flex flex-col items-center gap-7 max-w-80">
          <header className="flex flex-col items-center text-center">
            <span className="font-extrabold text-2xl">
              Two-Factor Authentification
            </span>
            <span className="opacity-50">
              Scan the QR code with the 2FA app of your choice and enter the
              generated code below
            </span>
          </header>

          <div className="w-full px-12 py-5">
            <img
              className="rounded-md h-full w-full"
              src={TwoFAQrCode.data}
              alt=""
            />
          </div>

          <TwoFactorAuthInput
            onSubmit={(code) => validate2Fa.mutate(code)}
            isError={isError}
            resetError={() => setIsError(false)}
          />

          <button
            onClick={hide}
            className="self-end opacity-50 hover:opacity-100 hover:text-red-500"
          >
            Cancel
          </button>
        </div>
      )}
    </ModalLayout>
  );
};
