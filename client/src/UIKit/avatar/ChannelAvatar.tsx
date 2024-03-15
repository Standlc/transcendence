import { useMemo } from "react";
import { AVATAR_SIZES, COLORS } from "./Avatar";
import { People } from "@mui/icons-material";

export const ChannelAvatar = ({
  id,
  imgUrl,
  borderRadius,
  size,
}: {
  id: number;
  imgUrl: string | null;
  borderRadius?: number;
  size: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
}) => {
  const avatarColor = useMemo(() => {
    return id === -1 ? "rgb(65,65,65)" : COLORS[id % COLORS.length];
  }, [id]);
  const dim = AVATAR_SIZES[size];

  return (
    <div
      style={{
        height: `${dim}px`,
        width: `${dim}px`,
        borderRadius: `${dim * (borderRadius ?? 0.25)}px`,
      }}
      className="h-full w-full overflow-hidden"
    >
      {imgUrl ? (
        <img src={imgUrl} className="h-full w-full objvect-coer" />
      ) : (
        <div
          style={{
            backgroundColor: avatarColor,
          }}
          className="w-full h-full flex items-center justify-center"
        >
          <People sx={{ fontSize: `${dim * 0.65}px` }} />
        </div>
      )}
    </div>
  );
};