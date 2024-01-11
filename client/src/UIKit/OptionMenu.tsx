import { MoreMenuType } from "../types/UIKit";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";

const moreOptionStyles = {
  base: "white",
  red: "#ff3915",
};

export const MoreMenu = ({ data }: { data: MoreMenuType[] }) => {
  const [show, setShow] = useState(false);
  const [dataCopy, setDataCopy] = useState<MoreMenuType[] | undefined>(
    undefined
  );

  useEffect(() => {
    if (show) {
      setDataCopy([...data]);

      const handler = (e: MouseEvent) => {
        const element = e.target as HTMLElement;
        if (element.role != "open") {
          setShow(false);
        }
      };
      addEventListener("mouseup", handler);
      return () => removeEventListener("mouseup", handler);
    }
  }, [show]);

  return (
    <div className="absolute left-0 top-0 z-[8] flex -translate-x-[100%] cursor-pointer items-center justify-center">
      <div
        role="open"
        onClick={(e) => {
          e.stopPropagation();
          setShow(!show);
        }}
        className="group"
      >
        <Icon size="sm" IconRef={MoreHorizIcon} />
      </div>
      <div
        style={{
          transition: `opacity cubic-bezier(0.7, -0.0, 0, 1) 0.2s, visibility 0.2s cubic-bezier(0.7, -0.0, 0, 1), transform 0.2s cubic-bezier(0.7, -0.0, 0, 1)`,
          transform: show
            ? `scale(100%) translateX(-100%)`
            : "scale(90%) translateX(-100%)",
          opacity: show ? 1 : 0,
          visibility: show ? "visible" : "hidden",
          transformOrigin: "top",
        }}
        className={`absolute left-[8px] top-[22px] z-[8] flex flex-col gap-[1px] overflow-hidden rounded-lg font-bold shadow-2xl backdrop-blur-3xl`}
      >
        {dataCopy?.map((data, i) => (
          <MoreMenuElement key={i} data={data} />
        ))}
      </div>
    </div>
  );
};

const MoreMenuElement = ({ data }: { data: MoreMenuType }) => {
  const styles = moreOptionStyles[data.theme ? "red" : "base"];
  return (
    <div
      style={{
        color: styles,
      }}
      onClick={(e) => {
        e.stopPropagation();
        data.action();
      }}
      className={`flex cursor-pointer select-none items-center justify-start whitespace-nowrap bg-white bg-opacity-10 px-[20px] py-[5px] [transition:background_0.2s] hover:bg-opacity-20`}
    >
      {data.title}
    </div>
  );
};
