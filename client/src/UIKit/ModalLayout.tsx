import { memo, useEffect } from "react";
import { Spinner } from "./Kit";

const ModalLayout = memo(
  ({ children, isLoading }: { children: any; isLoading?: boolean }) => {
    useEffect(() => {
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = "";
      };
    }, []);

    return (
      <div className="animate-fadein z-40 fixed top-0 left-0 h-full w-full bg-black bg-opacity-80 flex items-center justify-center transition-opacity">
        <div
          aria-busy={isLoading}
          className="transition-transform overflow-hidden animate-scalein font-title min-w-80 aria-busy:min-h-40 flex-col bg-bg-1 bg-opacity-100 shadow-card-xl flex justify-center border-solid rounded-md"
        >
          {isLoading ? <Spinner isLoading={true} /> : children}
        </div>
      </div>
    );
  }
);

export default ModalLayout;
