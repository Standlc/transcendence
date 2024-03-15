import { useEffect } from "react";

export const useClickOutside = ({
  ref,
  onClickOutside,
}: {
  ref: React.RefObject<HTMLDivElement>;
  onClickOutside: () => void | any;
}) => {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as any)) {
        onClickOutside();
      }
    };

    addEventListener("mouseup", handler);
    return () => removeEventListener("mouseup", handler);
  }, []);
};
