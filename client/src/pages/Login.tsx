import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// import qrcode from './../../public/qrcode.png';
// import qrcode from "./qrcode.png";
import qrcode from "./qrcode.png";
import { useAuth } from "../components/RequireAuth/AuthProvider";

export const Login = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const { login } = useAuth();

    useEffect(() => {
        checkCookie();
    }, []);

    const checkCookie = async () => {
        try {
            const response = await fetch("http://localhost:3000/api/auth/token");
            if (response.ok) {
                const data = await response.json();
                console.log("Data received:", data);
                login(data);
                console.log("LOGIN", login);
                navigate("/home"); // Redirect to the home route or dashboard
                // Handle the received data as needed
            } else {
                console.error("Failed to fetch data:", response.status);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            const response = await fetch("http://localhost:3000/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });
            console.log(JSON.stringify({ username, password }));

            if (response.ok) {
                const data = await response.json();
                console.log("Login successful:", data);
                login(data);
                console.log("LOGIN", login);
                navigate("/home"); // Rediriger vers la route home ou dashboard
            } else {
                console.error("Login failed:", response.status);
            }
        } catch (error) {
            console.error("Network error:", error);
        }
    };

    return (
        <div
            className="bg-discord-light-black min-h-screen 
		w-full flex items-center justify-center"
        >
            <div className="flex bg-discord-dark-grey p-8 rounded-l">
                <form onSubmit={handleSubmit}>
                    <div className="text-white text-2xl font-bold">Welcome back!</div>
                    <div className="mb-4 text-greyple">
                        We're so excited to see you again !
                    </div>
                    <div className="mb-6">
                        <label
                            htmlFor="email"
                            className="text-left block mb-2 text-sm font-bold
							    text-white"
                        >
                            USERNAME
                            <span className="text-discord-red">*</span>
                        </label>

                        <input
                            type="text"
                            id="username"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="bg-discord-light-black text-white 
                                text-sm rounded-l login-container h-10 px-2.5"
                            placeholder=""
                        />
                    </div>
                    <div className="mb-6">
                        <label
                            htmlFor="password"
                            className="text-left font-bold block mb-2 text-sm
                                text-white"
                        >
                            PASSWORD <span className="text-discord-red">*</span>
                        </label>
                        <input
                            type="password"
                            id="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-discord-light-black text-white text-sm 
                                rounded-l block login-container h-10 px-2.5"
                            placeholder=""
                        />
                        <div>
                            <a
                                href="#"
                                className="block text-left text-discord-blue-link text-sm hover:underline"
                            >
                                Forgot your password?
                            </a>
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="text-white mt-3 bg-blurple hover:bg-blurple-hover font-bold rounded-lg text-s w-full   py-2.5 text-center"
                    >
                        Log in
                    </button>
                    <div className="flex text-sm text-greyple items-center mt-2">
                        Need an account?
                        <a href="/create-account" className="text-sm hover:underline">
                            <span className="text-discord-blue-link"> Register</span>
                        </a>
                    </div>
                </form>
                <div className="flex flex-col ml-20 items-center justify-center">
                    {" "}
                    {/* Center QR code vertically and horizontally */}
                    <img src={qrcode} alt="QR Code" className="w-40 h-40 mb-5" />{" "}
                    {/* Adjust width and height as needed */}
                    <div className="text-white text-xl font-bold mb-2">
                        Log in with QR Code
                    </div>
                    <div className="text-greyple text-s ">
                        This QR Code is fake <br />
                        Please don't scan it
                    </div>
                    <a href="http://localhost:3000/api/auth/oauth">
                        <button
                            type="submit"
                            className="text-white bg-discord-light-black  p-[50px] hover:bg-blurple-hover font-bold rounded-lg text-s w-full py-2.5 text-center"
                        >
                            42 Auth
                        </button>
                    </a>
                </div>
            </div>
        </div>
    );
};
