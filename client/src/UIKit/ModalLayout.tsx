import { memo, useEffect } from "react";
import { Spinner } from "./Kit";

const ModalLayout = memo(
  ({
    children,
    isLoading,
    isVisible,
  }: {
    children: any;
    isLoading?: boolean;
    isVisible: boolean;
  }) => {
    // const [show, setShow] = useState(isVisible);

    useEffect(() => {
      // let timeoutId: any = undefined;

      // if (isVisible) {
      //   setShow(true);
      //   document.body.style.overflow = "hidden";
      // } else {
      //   timeoutId = setTimeout(() => {
      //     setShow(false);
      //   }, 400);
      // }

      if (isVisible) {
        document.body.style.overflow = "hidden";
      }

      return () => {
        document.body.style.overflow = "";
        // clearTimeout(timeoutId);
      };
    }, [isVisible]);

    if (!isVisible) {
      return null;
    }

    return (
      <div
        style={{
          opacity: isVisible ? "unset" : "0",
        }}
        className="animate-fadein z-50 fixed top-0 left-0 h-full w-full bg-black bg-opacity-80 flex items-center justify-center transition-opacity"
      >
        <div
          style={{
            transform: isVisible ? "unset" : "scale(0.9)",
          }}
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
