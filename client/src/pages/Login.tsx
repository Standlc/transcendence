import { useState } from "react";
import { useNavigate } from "react-router-dom";
// import qrcode from './../../public/qrcode.png';
import qrcode from "./qrcode.png";

export const Login = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    // const handleSubmit = async (event) => {
    //     event.preventDefault();
    //     // Imwhiteplement your authentication logic here
    //     console.log("Login attempt with:", username, password);
    //     // On success:
    //     navigate("/home"); // Redirect to the home route or dashboard
    // };

    // ...state declarations and other code...

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            const response = await fetch("http://localhost:5000/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });
            console.log(JSON.stringify({ username, password }));

            if (response.ok) {
                const data = await response.text();
                console.log("Login successful:", data);
                console.log("response", response);
                // Stocker le token d'authentification si nécessaire, par exemple dans localStorage
                // localStorage.setItem('token', data.token);

                navigate("/home"); // Rediriger vers la route home ou dashboard
            } else {
                // Gérer les erreurs, par exemple en montrant un message à l'utilisateur
                console.error("Login failed:", response.status);
                // Afficher un message d'erreur
            }
        } catch (error) {
            console.error("Network error:", error);
            // Afficher un message d'erreur
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
                        className="text-white bg-blurple hover:bg-blurple-hover font-bold rounded-lg text-s w-full   py-2.5 text-center"
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
                    <img src={qrcode} alt="QR Code" className="w-40 h-40 mb-4" />{" "}
                    {/* Adjust width and height as needed */}
                    <div className="text-white text-xl font-bold mb-2">
                        Log in with QR Code
                    </div>
                    <div className="text-greyple text-s ">
                        Scan this with the Discord mobile <br />
                        app to log in instantly.
                    </div>
                </div>
            </div>
        </div>
    );
};
