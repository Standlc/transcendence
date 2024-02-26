export const PlayerRating = ({
  rating,
  children,
}: {
  rating: number;
  children?: any;
}) => {
  return (
    <span className="text-indigo-400 flex w-min items-center font-bold bg-indigo-500 bg-opacity-20 px-2 py-[2px] rounded-md text-sm">
      {rating}
      {children}
    </span>
  );
};
