export const OutlinedIconLayout = ({
  children,
  theme,
  ...other
}: { children: any; theme?: "red" | "base" } & React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
>) => {
  const themes = {
    red: "text-red-600",
    base: "text-white",
  };
  return (
    <div
      {...other}
      className={`cursor-pointer opacity-70 hover:bg-opacity-40 bg-opacity-25 hover:opacity-100 w-[35px] aspect-square rounded-full bg-black flex items-center justify-center ${
        themes[theme ?? "base"]
      }`}
    >
      {children}
    </div>
  );
};
