export const PlayButton = ({
  onClick,
  isDisabled,
  children,
}: {
  onClick: React.MouseEventHandler<HTMLButtonElement> | undefined;
  isDisabled: boolean;
  children: any;
}) => {
  return (
    <button
      disabled={isDisabled}
      onClick={onClick}
      className="hover:-translate-y-[1px] flex-auto flex items-center py-4 px-5 justify-center overflow-hidden active:translate-y-[1px] rounded-lg bg-indigo-500 font-[900] text-2xl shadow-lg"
    >
      {children}
    </button>
  );
};
