import { ChanColumn } from "../components/ChanColumn";
import { Chatbox } from "../components/Chatbox";
import { NavBar } from "../components/Navbar/Navbar";

export const Dashboard = () => {
    return (
        <div className="result-page bg-dark-but-not-black ">
            <NavBar />
            <ChanColumn />
            <Chatbox />
            {/* <RocketLaunchIcon /> */}
            {/* <div className="bg-dark-but-not-black min-h-screen w-full flex items-center justify-center">
                <RocketLaunchIcon />
                <h2 className="font-extrabold">Current time is: {now}</h2>
            </div> */}
        </div>
    );
};
