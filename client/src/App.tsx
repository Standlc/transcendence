import { useEffect, useState } from "react";
import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import PrivateLayout from "./components/PrivateLayout";
import PublicLayout from "./components/PublicLayout";
import PlayPage from "./pages/PlayPage";
import GamePage from "./pages/GamePage";
import { AppUser } from "./ContextsProviders/UserContext";

function App() {
  const [user, setUser] = useState<AppUser>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsLoading(false);
    }
  }, []);

  if (isLoading) {
    return "Loading...";
  }

  return (
    <RouterProvider
      router={createBrowserRouter(
        createRoutesFromElements(
          <>
            {user ? (
              <Route
                element={<PrivateLayout user={user} setUser={setUser} />}
                errorElement={<div>\(o_o)/</div>}
              >
                <Route index element={<div>home</div>}></Route>
                <Route path="/play" element={<PlayPage />} />
                <Route path="/play/:gameId" element={<GamePage />} />
              </Route>
            ) : (
              <Route
                element={<PublicLayout />}
                errorElement={<div>\(o_o)/</div>}
              ></Route>
            )}
          </>
        )
      )}
    />
  );
}

export default App;
