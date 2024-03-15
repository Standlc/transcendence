import { Replay } from "@mui/icons-material";

export const ReloadButton = ({ onClick }: { onClick: () => void | any }) => {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="h-[25px] aspect-square rounded-full bg-black opacity-75 hover:opacity-100 bg-opacity-30 flex items-center justify-center active:scale-90 transition-transform"
    >
      <Replay style={{ fontSize: 16 }} />
    </button>
  );
};
