import { People, PersonAdd } from "@mui/icons-material";
import { NavLink, Outlet } from "react-router-dom";

export const Friends = () => {
  return (
    <div className="flex flex-col w-full">
      <header className="flex px-5 py-2 items-center gap-5 border-b bg-bg-1 border-b-[rgba(0,0,0,0.2)]">
        <div className="flex items-center gap-3 py-3">
          <People />
          <span className="">Friends</span>
        </div>

        <div className="h-[50%] w-[1px] bg-white opacity-10"></div>

        <NavLink
          to={"all"}
          className={({ isActive }) =>
            `bg-white  rounded-md px-3 py-1 ${
              isActive
                ? "bg-opacity-10"
                : "hover:bg-opacity-5 bg-opacity-0 hover:opacity-100 opacity-50"
            }`
          }
        >
          All
        </NavLink>

        <NavLink
          to={"pending"}
          className={({ isActive }) =>
            `bg-white  rounded-md px-3 py-1 ${
              isActive
                ? "bg-opacity-10"
                : "hover:bg-opacity-5 bg-opacity-0 hover:opacity-100 opacity-50"
            }`
          }
        >
          Pending
        </NavLink>

        <NavLink
          to={"blocked"}
          className={({ isActive }) =>
            `bg-white  rounded-md px-3 py-1 ${
              isActive
                ? "bg-opacity-10"
                : "hover:bg-opacity-5 bg-opacity-0 hover:opacity-100 opacity-50"
            }`
          }
        >
          Blocked
        </NavLink>

        <NavLink
          to={"add"}
          className={({ isActive }) =>
            `bg-white text-green-500 flex items-center gap-3 rounded-md px-3 py-1 ${
              isActive
                ? "bg-opacity-10"
                : "hover:bg-opacity-5 bg-opacity-0 hover:opacity-100"
            }`
          }
        >
          <span>Add Friends</span>
          <PersonAdd fontSize="small" />
        </NavLink>
      </header>

      <div className="p-5 flex w-full h-full">
        <Outlet />
      </div>
    </div>
  );
};
