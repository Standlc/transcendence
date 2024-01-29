import { useContext } from "react";
import ModalLayout from "./ModalLayout";
import { ErrorContext } from "../contextsProviders/ErrorContext";

export const ErrorModal = () => {
  const { error, setError } = useContext(ErrorContext);

  return (
    <ModalLayout isVisible={!!error}>
      <div className="p-5 flex flex-col gap-2 items-center">
        <span className="text-3xl font-[800]">Oops,</span>
        {error && <span className="text-base opacity-70">{error.message}</span>}
      </div>
      <div className="p-5 py-3 bg-bg-2 flex justify-end">
        <button
          className="text-base font-[600]"
          onClick={() => setError(undefined)}
        >
          Close
        </button>
      </div>
    </ModalLayout>
  );
};
