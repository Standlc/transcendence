import { Lock } from "@mui/icons-material";

export const SwitchSelectable = ({ isSelected }: { isSelected: boolean }) => {
  return (
    <div
      aria-selected={isSelected}
      className="h-[25px] w-[40px] p-[3px] rounded-full flex items-center bg-white bg-opacity-20 aria-selected:bg-indigo-500 transition-colors"
    >
      <div
        aria-selected={isSelected}
        className="h-[100%] aspect-square rounded-full flex items-center justify-center text-[rgba(0,0,0,0.5)] bg-white bg-opacity-80 aria-selected:translate-x-[15px] transition-transform"
      >
        <Lock style={{ fontSize: 13 }} />
      </div>
    </div>
  );
};
