import { EmojiEvents, SportsEsports } from "@mui/icons-material";
import { NavLink, Outlet } from "react-router-dom";

export const PlayPageLayout = () => {
  return (
    <div className="relative flex w-full justify-center">
      {/* <PlayPageNavBar /> */}
      <div className="flex p-5 gap-5 w-full justify-center">
        <div className="flex max-w-screen-lg w-full h-full">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const PlayPageNavBar = () => {
  return (
    <div className="sticky p-3 left-0 top-0 h-[100vh] bg-[rgb(43_45_49] bg-black bg-opacity-10 min-w-56 text-left">
      <h1 className="text-2xl font-extrabold mb-5 mx-3">Play</h1>

      <div className="flex flex-col gap-[2px]">
        <NavLink
          className={({ isActive }) =>
            `px-3 py-2 flex items-center gap-3 rounded-sm ${
              isActive
                ? "bg-indigo-500 hover:bg-indigo-500 opacity-100"
                : "hover:bg-[rgba(255,255,255,0.05)] opacity-75"
            }`
          }
          to={"game"}
        >
          <SportsEsports />
          <span>Home</span>
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            `px-3 py-2 flex items-center gap-3 rounded-sm ${
              isActive
                ? "bg-indigo-500 hover:bg-indigo-500 opacity-100"
                : "hover:bg-[rgba(255,255,255,0.05)] opacity-75"
            }`
          }
          to={"leaderboard"}
        >
          <EmojiEvents />
          <span>Leaderboard</span>
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            `px-3 py-2 flex items-center gap-3 rounded-sm ${
              isActive
                ? "bg-indigo-500 hover:bg-indigo-500 opacity-100"
                : "hover:bg-[rgba(255,255,255,0.05)] opacity-75"
            }`
          }
          to={"live"}
        >
          <div className="h-[10px] w-[10px] m-[7px] flex aspect-square rounded-full bg-green-600 before:content-[''] before:rounded-full before:h-full before:w-full before:animate-ping before:bg-green-600"></div>{" "}
          <span>Live Games</span>
        </NavLink>
      </div>
    </div>
  );
};
