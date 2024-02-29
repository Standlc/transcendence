import { SportsEsportsRounded } from "@mui/icons-material";

const USER_STATUS_PADDING_RATIO = 0.06;
const USER_PLAYING_WIDTH_RATIO = 1.2;

export const UserOnlineIndicator = ({
  size,
  heightRatio,
  status,
}: {
  size: number;
  heightRatio: number;
  status: JSX.Element;
}) => {
  return (
    <div
      style={{
        height: `${size * heightRatio}px`,
        width: `${size * heightRatio}px`,
        top: `${size * (1 - heightRatio + USER_STATUS_PADDING_RATIO)}px`,
        left: `${size * (1 - heightRatio + USER_STATUS_PADDING_RATIO)}px`,
        padding: `${size * USER_STATUS_PADDING_RATIO}px`,
      }}
      className="absolute aspect-square flex items-center justify-center rounded-full group/indicator"
    >
      {status}
      <div className="h-full w-full bg-green-600 rounded-full"></div>
    </div>
  );
};

export const UserOnlineMask = ({
  size,
  heightRatio,
}: {
  size: number;
  heightRatio: number;
}) => {
  return (
    <rect
      x={size * (1 - heightRatio + USER_STATUS_PADDING_RATIO)}
      y={size * (1 - heightRatio + USER_STATUS_PADDING_RATIO)}
      height={size * heightRatio}
      width={size * heightRatio}
      rx={1000}
      fill="black"
    />
  );
};

export const UserOfflineIndicator = ({
  size,
  heightRatio,
  status,
}: {
  size: number;
  heightRatio: number;
  status: JSX.Element;
}) => {
  return (
    <div
      style={{
        height: `${size * heightRatio}px`,
        width: `${size * heightRatio}px`,
        top: `${size * (1 - heightRatio + USER_STATUS_PADDING_RATIO)}px`,
        left: `${size * (1 - heightRatio + USER_STATUS_PADDING_RATIO)}px`,
        padding: `${size * USER_STATUS_PADDING_RATIO}px`,
      }}
      className="absolute aspect-square flex items-center justify-center rounded-full group/indicator"
    >
      {status}
      <div className="h-full w-full bg-white bg-opacity-20 rounded-full"></div>
    </div>
  );
};

export const UserPlayingIndicator = ({
  size,
  heightRatio,
  status,
}: {
  size: number;
  heightRatio: number;
  status: JSX.Element;
}) => {
  return (
    <div
      style={{
        height: `${size * heightRatio}px`,
        width: `${size * (heightRatio * USER_PLAYING_WIDTH_RATIO)}px`,
        top: `${size * (1 - heightRatio + USER_STATUS_PADDING_RATIO)}px`,
        left: `${
          size *
          (1 -
            heightRatio * USER_PLAYING_WIDTH_RATIO +
            USER_STATUS_PADDING_RATIO)
        }px`,
        padding: `${size * USER_STATUS_PADDING_RATIO}px`,
      }}
      className="absolute flex items-center justify-center group/indicator"
    >
      {status}
      <div
        style={{
          borderRadius: `${size * heightRatio * 0.15}px`,
        }}
        className="flex items-center justify-center bg-indigo-500 h-full w-full bg-opacity-100"
      >
        <SportsEsportsRounded
          style={{ fontSize: size * heightRatio * (2 / 3) }}
        />
      </div>
    </div>
  );
};

export const UserPlayingMask = ({
  size,
  heightRatio,
}: {
  size: number;
  heightRatio: number;
}) => {
  return (
    <rect
      height={size}
      width={size}
      x={
        size *
        (1 - heightRatio * USER_PLAYING_WIDTH_RATIO + USER_STATUS_PADDING_RATIO)
      }
      y={size * (1 - heightRatio + USER_STATUS_PADDING_RATIO)}
      fill="black"
      rx={size * heightRatio * 0.3}
    />
  );
};
