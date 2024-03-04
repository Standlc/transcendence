import { Outlet } from "react-router-dom";

export default function PublicLayout() {
    console.log("PublicLayout");
    return (
        <div>
            <Outlet />
        </div>
    );
}
