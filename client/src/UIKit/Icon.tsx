import { SvgIconTypeMap } from "@mui/material";
import { OverridableComponent } from "@mui/material/OverridableComponent";

const iconSizes = {
  xs: {
    radius: 4,
    dim: 15,
  },
  sm: {
    radius: 6,
    dim: 25,
  },
  md: {
    radius: 8,
    dim: 30,
  },
  lg: {
    radius: 10,
    dim: 40,
  },
  xl: {
    radius: 12,
    dim: 50,
  },
};

const iconStyles = {
  pink: "rgb(255,24,93)",
  blue: "rgb(50,110,255)",
  green: "rgb(20,255,100)",
  base: "white",
};

export const Icon = ({
  IconRef,
  size,
  iconFontSize,
  style,
  variant,
}: {
  IconRef:
    | (OverridableComponent<SvgIconTypeMap<{}, "svg">> & {
        muiName: string;
      })
    | string;
  size: "xs" | "sm" | "md" | "lg" | "xl";
  iconFontSize?: number;
  style?: React.CSSProperties;
  variant?: "pink" | "blue" | "green" | "base";
}) => {
  const dimensions = iconSizes[size];
  const styles = iconStyles[variant ?? "base"];

  return (
    <div
      style={{
        height: `${dimensions.dim}px`,
        width: `${dimensions.dim}px`,
        borderRadius: `${50}px`,
        ...style,
      }}
      className={`group pointer-events-none relative flex select-none items-center justify-center [transition:all_0.1s] group-active:scale-[92%]`}
    >
      <div className="z-[1] flex items-center justify-center">
        {typeof IconRef == "string" ? (
          <span
            style={{
              fontSize: iconFontSize
                ? `${iconFontSize}px`
                : `${(dimensions.dim * 5) / 7}px`,
            }}
          >
            {IconRef}
          </span>
        ) : (
          <IconRef
            sx={{
              fontSize: iconFontSize ?? Math.round((dimensions.dim * 6) / 7),
            }}
          />
        )}
      </div>
      <div
        style={{
          backgroundColor: styles,
        }}
        className="absolute z-[0] h-[130%] w-[130%] scale-0 rounded-full opacity-10 [transition:transform_0.2s] group-hover:scale-100"
      ></div>
    </div>
  );
};
