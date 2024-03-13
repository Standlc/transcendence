// import qrcode from "./../../../public/qrcode.png";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { FormEvent, useState } from "react";
import { AppUser } from "@api/types/clientSchema";

export const Login = () => {
    const [username, setUsername] = useState("");
    const queryClient = useQueryClient();
    const [password, setPassword] = useState("");

    const logUser = useMutation<AppUser, any, { username: string; password: string }>({
        mutationFn: async ({ username, password }) => {
            const response = await axios.post("/api/auth/login", {
                username,
                password,
            });
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.setQueryData(["user"], data);
        },
        onError: () => {
            console.log("Error");
        },
    });

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        logUser.mutate({ username, password });
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
                            <span className="text-discord-blue-link ml-2"> Register</span>
                        </a>
                    </div>
                </form>
                <div className="flex flex-col ml-20 items-center justify-center">
                    {" "}
                    {/* Center QR code vertically and horizontally */}
                    <img
                        src={"/qrcode.png"}
                        alt="QR Code"
                        className="w-40 h-40 mb-5"
                    />{" "}
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
