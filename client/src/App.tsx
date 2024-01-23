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
import { AppUser } from "./contextsProviders/UserContext";
import axios from "axios";
import { useMutation, useQuery } from "@tanstack/react-query";

function App() {
  // const [user, setUser] = useState<AppUser>();
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });

  const { isError, isLoading, data, refetch } = useQuery({
    queryKey: ["authenticateUser"],
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const storedUser = sessionStorage.getItem("user");
      if (!storedUser) {
        return null;
      }
      const userParsed = JSON.parse(storedUser);
      const res = await axios.post<AppUser>("/api/auth/login", {
        username: userParsed.username,
        password: userParsed.password,
      });
      return res.data;
    },
  });

  const loginMutation = useMutation({
    mutationKey: ["logUser", credentials],
    mutationFn: async () => {
      const res = await axios.post("/api/auth/login", {
        username: credentials.username,
        password: credentials.password,
      });
      sessionStorage.setItem(
        "user",
        JSON.stringify({
          username: credentials.username,
          password: credentials.password,
        })
      );
      await refetch();
      return res.data;
    },
  });

  if (isError) {
    return <>{"error"}</>;
  }

  if (isLoading) {
    return null;
  }

  return (
    <RouterProvider
      router={createBrowserRouter(
        createRoutesFromElements(
          <>
            {data ? (
              <Route
                element={<PrivateLayout user={data} />}
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
              >
                <Route
                  index
                  element={
                    <div className="text-black">
                      {loginMutation.isPending && <span>Loading...</span>}
                      {loginMutation.isError && <span>{loginMutation.error.message}</span>}
                      <input
                        placeholder="username"
                        value={credentials.username}
                        onChange={(e) =>
                          setCredentials({
                            ...credentials,
                            username: e.target.value,
                          })
                        }
                      />
                      <br />
                      <br />
                      <input
                        placeholder="password"
                        value={credentials.password}
                        onChange={(e) =>
                          setCredentials({
                            ...credentials,
                            password: e.target.value,
                          })
                        }
                      />
                      <br />
                      <br />
                      <button onClick={() => loginMutation.mutate()}>
                        LOGIN
                      </button>
                    </div>
                  }
                />
              </Route>
            )}
          </>
        )
      )}
    />
  );
}

export default App;
