import { AppUser } from "@api/types/clientSchema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { Link } from "react-router-dom";

export const Register = () => {
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");

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
            // navigate("/home");
        },
        onError: () => {
            console.log("Error");
        },
    });

    //   const { addError } = useContext(ErrorContext);
    const queryClient = useQueryClient();
    const registerUser = useMutation({
        mutationFn: async () => {
            const response = await axios.post<AppUser>("/api/users/register", {
                username,
                password,
                firstname: "",
                lastname: "",
            });
            console.log(response.data);
            return response.data;
        },
        onSuccess: (user) => {
            logUser.mutate({
                username,
                password,
            });
        },
        onError: (err) => {
            console.log(err);
        },
    });

    const checkPassword = () => {

        const uppercaseRegex = /[A-Z]/;
        const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
        const numberRegex = /[0-9]/;

        if (
            password.trim().length < 8 ||
            !uppercaseRegex.test(password) ||
            !specialCharRegex.test(password) ||
            !numberRegex.test(password)
        ) {
            alert(
                "Password must contain at least one uppercase letter, one special character, and one number and 8 lenght min"
            );
            return;
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        checkPassword();
        registerUser.mutate();
    };

    return (
        <div
            className="bg-discord-light-black min-h-screen w-full
				flex items-center justify-center"
        >
            <div className="bg-discord-dark-grey flex p-8 rounded-l">
                <form
                    onSubmit={handleSubmit}>
                    <div className="text-white text-2xl font-bold mb-5">
                        Creer un compte
                    </div>

                    <div className="mb-6">
                        <label
                            htmlFor="nickname"
                            className="text-left font-bold block mb-2 text-sm
								text-white"
                        >
                            NOM D'UTILISATEUR{" "}
                            <span className="text-discord-red">*</span>
                        </label>
                        <input
                            type="text"
                            id="username"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="bg-discord-light-black text-white text-sm
								rounded-l block login-container h-10 px-2.5"
                            placeholder=""
                        />
                    </div>
                    <div className="mb-6">
                        <label
                            htmlFor="password"
                            className="text-left font-bold block text-sm
								text-white"
                        >
                            MOT DE PASSE <span className="text-discord-red">*</span>
                        </label>
                        <div className="mb-2 text-left text-greyple text-sm">
                            1 upper, 1 lower, 1 digit, 1 special character, 8 min length
                        </div>
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
                    </div>
                    <button
                        type="submit"
                        className="text-white bg-blurple hover:bg-blurple-hover font-bold rounded-lg text-s w-full   py-2.5 text-center mb-6"
                    >
                        Continuer
                    </button>
                    <a
                        href="/"
                        className="flex text-sm text-discord-blue-link items-center mt-2"
                    >
                        Tu as deja un compte ?
                    </a>
                </form>
            </div>
        </div>
    );
};

