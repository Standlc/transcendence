import { useContext, useEffect } from "react";
import { ErrorContext } from "../ContextsProviders/ErrorContext";

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
        className="animate-showUpAndLeave [outline:1px_solid_rgba(255,0,0,0.2)] fixed bottom-10 py-3 px-5 rounded-md bg-zinc-900 gap-2 items-center shadow-card"
      >
        {/* <span className="">Oops, </span> */}
        <span className="">{error.message}</span>
      </div>
    </div>
  );
};
