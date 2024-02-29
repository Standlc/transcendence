import { Person } from "@mui/icons-material";

const COLORS = [
    "#309d51",
    "#5765f2",
    "#FEE75C",
    "#ED4245",
    "#ebcc0e",
    "#23272A",
    "#bb397f",
];

const avatarSizes = {
    xs: 18,
    sm: 30,
    md: 40,
    lg: 65,
    xl: 85,
    "2xl": 160,
};

export const Avatar = ({
    imgUrl,
    size,
    userId,
}: {
    imgUrl: string | null | undefined;
    size: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
    userId: number;
}) => {
    const dimension = avatarSizes[size];

    const avatarColor = () => {
        return COLORS[userId % COLORS.length];
    };

    return (
        <div
            style={{
                backgroundColor: avatarColor(),
                height: `${dimension}px`,
                minHeight: `${dimension}px`,
                width: `${dimension}px`,
                minWidth: `${dimension}px`,
            }}
            className="flex select-none items-center justify-center overflow-hidden rounded-md"
        >
            {imgUrl ? (
                <img src={imgUrl} className="h-full w-full rounded-md object-cover" />
            ) : (
                <Person sx={{ fontSize: `${dimension * 0.9}px` }} />
            )}
        </div>
    );
};
