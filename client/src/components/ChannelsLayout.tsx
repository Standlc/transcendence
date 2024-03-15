import { Outlet } from "react-router-dom";
import { ChanColumn } from "./ChanColumn/ChanColumn";
import { useEffect } from "react";

export const ChannelsLayout = () => {

    return (
        <div className="flex w-full ">
            <ChanColumn />
            <Outlet />
        </div>
    );
};
