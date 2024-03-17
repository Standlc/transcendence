import { useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { TwoFactorAuthLoginModal } from "../../components/login/TwoFactorAuthLoginModal";
import { Link } from "react-router-dom";
import { useLogin } from "../../utils/auth/useLogin";

export const Login = () => {
    const [username, setUsername] = useState("");
    const queryClient = useQueryClient();
    const [password, setPassword] = useState("");
    const [show2FAModal, setShow2FAModal] = useState(false);
    const [isError, setIsError] = useState(false);

    const logUser = useLogin({
        onSuccess: (data) => {
            if (data.isTwoFactorAuthenticationEnabled) {
                setShow2FAModal(true);
            } else {
                queryClient.setQueryData(["user"], data);
            }
        },
        onError: () => {
            setIsError(true);
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
            {show2FAModal && (
                <TwoFactorAuthLoginModal hide={() => setShow2FAModal(false)} />
            )}
            <div className="flex flex-col gap-7 bg-discord-dark-grey p-8 rounded-md">
                <form onSubmit={handleSubmit}>
                    <div className="text-white text-2xl font-extrabold">
                        Welcome back!
                    </div>
                    <div className="mb-4 opacity-50">
                        We're so excited to see you again!
                    </div>
                    <div className="mb-6">
                        <label
                            htmlFor="email"
                            className="text-left block mb-2 text-sm font-bold
							    text-white"
                        >
                            USERNAME
                            <span className="text-discord-red"> *</span>
                        </label>

                        <input
                            type="text"
                            autoComplete="username"
                            id="username"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="bg-discord-light-black text-white
                                text-sm rounded-md login-container h-10 px-2.5"
                            placeholder=""
                            name="username"
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
                                rounded-md block login-container h-10 px-2.5"
                            placeholder=""
                            autoComplete="current-password"
                            name="password"
                        />

                        {isError && (
                            <span className="text-sm text-center text-red-600 opacity-70">
                                Username or password is wrong
                            </span>
                        )}
                    </div>
                    <button
                        type="submit"
                        className="text-white mt-2 bg-indigo-500 hover:translate-y-[-1px] font-bold rounded-lg text-xl w-full   py-2.5 text-center"
                    >
                        Log in
                    </button>
                    <div className="flex text-sm items-center mt-2">
                        Need an account?
                        <Link
                            to="/create-account"
                            className="text-sm ml-1 hover:underline"
                        >
                            <span className="text-discord-blue-link">Register</span>
                        </Link>
                    </div>
                </form>

                <div className="w-full h-[1px] bg-white opacity-15"></div>

                <div className="flex flex-col items-center justify-center">
                    <a href="/api/auth/oauth" className="flex items-center gap-5">
                        <img src="/42-logo.png" alt="" className="h-[35px]" />
                        <button
                            type="submit"
                            className="flex gap-3 text-white bg-white bg-opacity-10  p-5 hover:bg-opacity-15 font-bold rounded-lg text-lg w-full py-2.5 text-center"
                        >
                            Login with 42
                        </button>
                    </a>
                </div>
            </div>
        </div>
    );
};
