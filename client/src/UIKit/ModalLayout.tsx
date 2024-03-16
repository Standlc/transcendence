import { memo, useEffect, useRef, useState } from "react";
import { Spinner } from "./Kit";

const ModalLayout = memo(
  ({
    children,
    isLoading,
    onClickOutside,
  }: {
    children: JSX.Element | undefined;
    isLoading?: boolean;
    onClickOutside?: () => void;
  }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const [shiftLayout, setShiftLayout] = useState(false);

    useEffect(() => {
      document.body.style.overflow = "hidden";

      const navBar = document.getElementById("nav-bar");
      setShiftLayout(!!navBar);

      return () => {
        document.body.style.overflow = "";
      };
    }, []);

    useEffect(() => {
      if (onClickOutside) {
        const handleClick = (e: MouseEvent) => {
          if (
            modalRef.current &&
            !modalRef.current.contains(e.target as Node)
          ) {
            onClickOutside();
          }
        };

        addEventListener("mouseup", handleClick);
        return () => removeEventListener("mouseup", handleClick);
      }
    }, [onClickOutside]);

    return (
      <div
        className={`animate-fadein z-40 fixed top-0 h-full bg-black bg-opacity-80 flex items-center justify-center transition-opacity ${
          shiftLayout ? "left-[75px] w-[calc(100%-75px)]" : "left-0 w-full"
        }`}
      >
        <div
          ref={modalRef}
          aria-busy={isLoading}
          className="transition-transform animate-scalein font-title min-w-80 aria-busy:min-h-40 flex-col bg-bg-1 bg-opacity-100 shadow-card-xl flex justify-center border-solid rounded-md"
        >
          {isLoading ? <Spinner isLoading={true} /> : children}
        </div>
      </div>
    );
  }
);

export default ModalLayout;
