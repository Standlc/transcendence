// import { Navigate } from "react-router-dom";

import { Outlet } from "react-router-dom";

export default function PrivateLayout() {
  // recuperer le user depuis un context
  //   if (false) {
  //     return <Navigate to={"/login"} />;
  //   }

  return (
    <div>
      <Outlet />
    </div>
  );
}
