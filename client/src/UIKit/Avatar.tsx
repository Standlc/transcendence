import AccountCircleIcon from "@mui/icons-material/AccountCircle";

const avatarSizes = {
  xs: 18,
  sm: 30,
  md: 40,
  lg: 55,
  xl: 100,
  "2xl": 160,
};

export const Avatar = ({
  imgUrl,
  size,
}: {
  imgUrl: string | null | undefined;
  size: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
}) => {
  const dimension = avatarSizes[size];

  return (
    <div
      style={{
        height: `${dimension}px`,
        minHeight: `${dimension}px`,
        width: `${dimension}px`,
        minWidth: `${dimension}px`,
      }}
      className="group-[avatar]-hover:border-border_p group-[avatar]-hover:shadow-[0_0_0_5px_rgba(255,255,255,0.1)] group-[avatar]-active:scale-[92%] flex select-none items-center justify-center overflow-hidden rounded-lg border border-border_s bg-white bg-opacity-[5%] [transition:border_0.2s,box-shadow_0.2s,transform_0.2s]"
    >
      {imgUrl ? (
        <img src={imgUrl} className="h-full w-full rounded-lg object-cover" />
      ) : (
        <AccountCircleIcon sx={{ fontSize: `${dimension + 7}px` }} />
      )}
    </div>
  );
};
