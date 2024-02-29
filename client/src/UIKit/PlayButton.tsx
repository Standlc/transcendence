export const PlayButton = ({
  onClick,
  children,
}: {
  onClick: React.MouseEventHandler<HTMLButtonElement> | undefined;
  children: any;
}) => {
  return (
    <button
      onClick={onClick}
      className="hover:-translate-y-[1px] flex-auto flex items-center py-4 px-5 justify-center overflow-hidden active:translate-y-0 rounded-lg bg-indigo-500 font-[900] text-2xl shadow-lg"
    >
      {children}
    </button>
  );
};
