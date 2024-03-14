import { memo, useEffect } from "react";
import { Spinner } from "./Kit";

const MultiModalLayout = memo(
  ({
    children,
    isLoading,
  }: {
    children: JSX.Element[];
    isLoading?: boolean;
  }) => {
    useEffect(() => {
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = "";
      };
    }, []);

    return (
      <div className="animate-fadein z-40 fixed top-0 left-[75px] h-full w-[calc(100%-75px)] bg-black bg-opacity-80 flex items-center justify-center transition-opacity">
        <div className="animate-scalein flex items-center justify-center">
          {isLoading ? (
            <div
              aria-busy={isLoading}
              className="transition-transform animate-scalein font-title min-w-80 aria-busy:min-h-40 flex-col bg-bg-1 bg-opacity-100 shadow-card-xl flex justify-center border-solid rounded-md"
            >
              <Spinner isLoading={true} />
            </div>
          ) : (
            children.slice(0, 3).map((child, i) => {
              return (
                <div
                  key={i}
                  style={{
                    transform: `translateY(${i * -20}px) scale(${
                      1 - i * 0.05
                    })`,
                    filter: `brightness(${1 - i * 0.15})`,
                    zIndex: children.length - i,
                  }}
                  className="absolute origin-center font-title min-w-80 flex-col bg-bg-1 bg-opacity-100 shadow-card-xl flex justify-center border-solid rounded-md"
                >
                  {child}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }
);

export default MultiModalLayout;
