import { Outlet } from "react-router-dom";
import { ChanColumn } from "./ChanColumn/ChanColumn";

export const ChannelsLayout = () => {
    return (
        <div className="flex w-full ">
            <ChanColumn />
            <Outlet />
        </div>
    );
};
