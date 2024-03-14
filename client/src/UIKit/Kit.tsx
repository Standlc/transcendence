export const Input = (
  args: React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  >
) => {
  return (
    <input
      {...args}
      className={`rounded-xl border border-border_s bg-white bg-opacity-5 px-5 py-[10px] text-base ease-in-out [transition:box-shadow_0.2s,border_0.2s] hover:border-border_p hover:shadow-shadow_hover focus:shadow-shadow_focus focus:outline-0`}
    />
  );
};

const bgVariants = {
  primary: {
    bg: "bg-primary",
    color: "text-black",
    hover:
      "hover:-translate-y-[1px] hover:scale-[100%] hover:shadow-shadow_hover active:scale-[97%]",
    outline: "",
  },
  secondary: {
    bg: "bg-secondary",
    color: "text-white",
    hover:
      "hover:-translate-y-[1px] hover:scale-[100%] hover:shadow-shadow_hover active:scale-[97%]",
    outline: "",
  },
  monochrome: {
    bg: "bg-white bg-opacity-10",
    color: "text-white",
    hover:
      "hover:-translate-y-[1px] hover:scale-[100%] hover:bg-opacity-20 hover:shadow-shadow_hover active:scale-[97%]",
    outline: "",
  },
  outlined: {
    bg: "bg-transparent",
    color: "text-white",
    hover:
      "hover:-translate-y-[1px] hover:scale-[100%] hover:shadow-shadow_hover active:scale-[97%]",
    outline: "outline outline-1 outline-[rgba(255,255,255,0.5)]",
  },
};

export const Button = (
  args: React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > & {
    size?: "sm" | "lg";
    isLoading?: boolean;
    active?: boolean;
    variant?: "primary" | "secondary" | "monochrome" | "outlined";
  }
) => {
  const {
    isLoading,
    style,
    active,
    variant,
    children,
    size,
    ...ogButtonProps
  } = args;
  const styles = bgVariants[variant ?? "primary"];
  const isActive = active || active == undefined;

  return (
    <button
      {...ogButtonProps}
      style={{
        ...style,
      }}
      className={`relative flex w-auto select-none flex-col items-center justify-center overflow-hidden rounded-xl text-lg font-extrabold text-black shadow-shadow duration-300 ease-in-out [transition:color_0.2s,transform_0.2s,box-shadow_0.2s,background-color_0.2s] ${
        isActive ? styles.hover : "opacity-50"
      } ${styles.bg} ${styles.color} ${styles.outline} px-5 py-2`}
      disabled={isLoading}
    >
      {children}
      <Spinner isLoading={isLoading ?? false} />
    </button>
  );
};

export const Spinner = ({ isLoading }: { isLoading: boolean }) => {
  if (!isLoading) {
    return null;
  }

  return (
    <div className="relative pointer-events-none z-10 w-full h-full flex animate-fadein items-center justify-center bg-transparent transition-all">
      <div className="absolute z-10 flex h-full w-full animate-pulse bg-secondary opacity-100" />
      <div className="z-10 h-[30px] w-[30px] animate-spin rounded-full border-4 border-transparent [border-left:4px_solid_white]" />
    </div>
  );
};
