import {
    EmojiEvents,
    Person,
    SportsEsports,
    SportsEsportsRounded,
} from "@mui/icons-material";
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";
import { NavLink } from "react-router-dom";

export const NavBar = () => {
    return (
        <div
            id="nav-bar"
            className="top-0 z-50 gap-4 flex flex-col justify-center items-center bg-discord-light-black sticky h-[100vh] min-w-[75px] max-w-[75px]"
        >
            <NavItem to="/settings">
                <Person />
            </NavItem>

            <NavItem to="/home">
                <ChatBubbleRoundedIcon fontSize="small" />
            </NavItem>

            <NavItem to="/explore">
                <svg viewBox="0 0 24 24" width="20" height="20">
                    <path
                        fill="white"
                        fillRule="evenodd"
                        d="M23 12a11 11 0 1 1-22 0 11 11 0 0 1 22 0ZM7.74 9.3A2 2 0 0 1 9.3 7.75l7.22-1.45a1 1 0 0 1 1.18 1.18l-1.45 7.22a2 2 0 0 1-1.57 1.57l-7.22 1.45a1 1 0 0 1-1.18-1.18L7.74 9.3Z"
                        clipRule="evenodd"
                    />
                </svg>
            </NavItem>

            <NavItem
                to="/play"
                subRoutes={[
                    {
                        children: <SportsEsports />,
                        to: "/play/game",
                    },
                    {
                        children: <EmojiEvents />,
                        to: "/play/leaderboard",
                    },
                    {
                        children: (
                            <div className="h-[10px] w-[10px] m-[7px] flex aspect-square rounded-full bg-green-600 before:content-[''] before:rounded-full before:h-full before:w-full before:animate-ping before:bg-green-600"></div>
                        ),
                        to: "/play/live",
                    },
                ]}
            >
                <SportsEsportsRounded />
            </NavItem>
        </div>
    );
};

const NavItem = ({
    to,
    children,
    subRoutes,
}: {
    to: string;
    children: any;
    subRoutes?: {
        to: string;
        children: any;
    }[];
}) => {
    return (
        <div className="relative w-full flex justify-center items-center group">
            <NavLink
                to={to}
                className={({ isActive }) =>
                    `flex justify-center items-center transition-all p-2 ${
                        isActive
                            ? "rounded-2xl bg-indigo-500"
                            : "bg-white bg-opacity-5 hover:rounded-2xl rounded-[30px] hover:bg-indigo-500"
                    }`
                }
                style={{ height: "50px", width: "50px" }}
            >
                {(props) => (
                    <>
                        <div
                            className={`absolute left-0 w-[4px] bg-white transition-all rounded-tr-lg rounded-br-lg ${
                                props.isActive
                                    ? "h-[70%] opacity-100"
                                    : "h-[20%] opacity-50"
                            }`}
                        ></div>
                        {children}
                    </>
                )}
            </NavLink>

            {subRoutes && (
                <div className="absolute left-20 bg-bg-2 rounded-2xl flex flex-col gap-2 p-2 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 origin-left transition-all delay-300 shadow-md">
                    {subRoutes.map((route, i) => {
                        return (
                            <NavLink
                                key={i}
                                to={route.to}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-2 py-2 rounded-xl transition-all ${
                                        isActive
                                            ? "bg-indigo-500"
                                            : "hover:bg-indigo-500 bg-white bg-opacity-0"
                                    }`
                                }
                            >
                                {route.children}
                            </NavLink>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
