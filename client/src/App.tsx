import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import { useEffect, useState } from "react";
import "./App.css";
import axios from "axios";
import { DateTime } from "luxon";

function App() {
  const [count, setCount] = useState(0);
  const [now, setNow] = useState("");

  useEffect(() => {
    const testApi = async () => {
      const res: { data: string } = await axios.get("/api");
      console.log(res.data);
      setNow(DateTime.fromISO(res.data).toFormat("HH':' mm: ss"));
    };
    testApi();
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <h1>Transcendence</h1>
      <button onClick={() => setCount((count) => count + 1)}>
        count is {count}
      </button>
      <div className="h-[20px]">
        <h2>{now}</h2>
      </div>
      <p className="read-the-docs text-red-500">
        <RocketLaunchIcon fontSize="large" />
      </p>
    </div>
  );
}

export default App;
