import { AppUser } from "@api/types/clientSchema";
import { useQueryClient } from "@tanstack/react-query";
import { Navigate, Outlet } from "react-router-dom";

export default function PublicLayout() {
  console.log("PublicLayout");
  const queryClient = useQueryClient();
  const user = queryClient.getQueryData<AppUser>(["user"]);

  if (user) {
    return <Navigate to="/"></Navigate>;
  }

  return (
    <div>
      <Outlet />
    </div>
  );
}
