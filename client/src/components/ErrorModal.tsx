import { useContext, useEffect } from "react";
import { ErrorContext } from "../ContextsProviders/ErrorContext";
import { Check } from "@mui/icons-material";

export const ErrorModal = () => {
  const { error, removeCurrentError } = useContext(ErrorContext);

  useEffect(() => {
    if (error) {
      const timeoutId = setTimeout(() => {
        removeCurrentError();
      }, 4000);

      return () => clearTimeout(timeoutId);
    }
  }, [error]);

  if (!error) {
    return null;
  }

  return (
    <div className="z-50 fixed left-0 bottom-0 w-full flex justify-center">
      <div
        style={{
          animationFillMode: "forwards",
        }}
        className="fixed bottom-10 flex animate-showUpAndLeave"
      >
        {error.isSuccess ? (
          <div className="flex items-center gap-3 outline outline-[1px] outline-green-900 py-3 px-5 rounded-md bg-zinc-900 shadow-card">
            <span>{error.message}</span>
            <div className="h-[18px] aspect-square flex items-center justify-center bg-white bg-opacity-20 rounded-full">
              <Check style={{ fontSize: 10 }} />
            </div>
          </div>
        ) : (
          <span className="outline outline-[1px] outline-red-900 py-3 px-5 rounded-md bg-zinc-900 shadow-card">
            {error.message}
          </span>
        )}
      </div>
    </div>
  );
};
