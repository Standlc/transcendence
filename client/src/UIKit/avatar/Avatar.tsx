import { Person } from "@mui/icons-material";
import { USER_STATUS } from "../../../../api/src/types/usersStatusTypes";
import { useMemo } from "react";
import {
  UserOfflineIndicator,
  UserOnlineIndicator,
  UserOnlineMask,
  UserPlayingIndicator,
  UserPlayingMask,
} from "./userStatusIndicators";

export const COLORS = [
  "#309d51",
  "#5765f2",
  "#FEE75C",
  "#ED4245",
  "#ebcc0e",
  "#23272A",
  "#bb397f",
];

export const AVATAR_SIZES = {
  xs: 18,
  sm: 30,
  md: 45,
  lg: 65,
  xl: 85,
  "2xl": 140,
};

const STAUTUS_INDICATORS_HEIGHT_RATIOS = {
  xs: 0.5,
  sm: 0.5,
  md: 0.4,
  lg: 0.4,
  xl: 0.4,
  "2xl": 0.35,
};

const UserStatusIndicators = {
  [USER_STATUS.ONLINE]: {
    indicator: UserOnlineIndicator,
    mask: UserOnlineMask,
    status: "Online",
  },
  [USER_STATUS.PLAYING]: {
    indicator: UserPlayingIndicator,
    mask: UserPlayingMask,
    status: "Playing",
  },
  [USER_STATUS.OFFLINE]: {
    indicator: UserOfflineIndicator,
    mask: UserOnlineMask,
    status: "Offline",
  },
};

export const Avatar = ({
  imgUrl,
  size,
  userId,
  status,
  borderRadius,
}: {
  imgUrl: string | null | undefined;
  size: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  userId: number;
  status?: USER_STATUS;
  borderRadius?: number;
}) => {
  const randomMaskId = useMemo(() => Math.round(Math.random() * 10000), []);
  const dim = AVATAR_SIZES[size];
  const avatarColor = useMemo(() => {
    return userId === -1 ? "rgb(65,65,65)" : COLORS[userId % COLORS.length];
  }, [userId]);

  return (
    <div
      style={{
        height: `${dim}px`,
        width: `${dim}px`,
      }}
      className="relative flex select-none items-center justify-center bg-inherit"
    >
      <svg className="relative" width={`${dim}px`} height={`${dim}px`}>
        {status !== undefined && (
          <mask id={`${randomMaskId}`} x="0" y="0" width={dim} height={dim}>
            <rect x="0" y="0" width={dim} height={dim} fill="white"></rect>
            {UserStatusIndicators[status].mask({
              size: dim,
              heightRatio: STAUTUS_INDICATORS_HEIGHT_RATIOS[size],
            })}
          </mask>
        )}

        <foreignObject
          x="0"
          y="0"
          width={dim}
          height={dim}
          mask={`url(#${randomMaskId})`}
        >
          <div
            style={{
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
                <Person sx={{ fontSize: `${dim * 0.8}px` }} />
              </div>
            )}
          </div>
        </foreignObject>
      </svg>

      {status !== undefined &&
        UserStatusIndicators[status].indicator({
          size: dim,
          heightRatio: STAUTUS_INDICATORS_HEIGHT_RATIOS[size],
          status: (
            <div className="z-[2] absolute -top-1 translate-y-[-100%] bg-zinc-950 text-xs font-[500] rounded-md px-2 py-1 group-hover/indicator:[visibility:visible] group-hover/indicator:scale-100 group-hover/indicator:opacity-100 opacity-0 [visibility:hidden] origin-bottom scale-90 transition-all [transition-timing-function:cubic-bezier(0.7,0,0,1.4)]">
              {UserStatusIndicators[status].status}
            </div>
          ),
        })}
    </div>
  );
};
