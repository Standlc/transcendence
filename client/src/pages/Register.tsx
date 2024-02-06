import { Checkbox } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const generateYearOptions = () => {
    let currentYear = new Date().getFullYear();
    let years = [];
    for (let i = currentYear; i >= currentYear - 100; i--) {
        years.push(
            <option key={i} value={i}>
                {i}
            </option>
        );
    }
    return years;
};

export const Register = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [nickname, setNickname] = useState("");
    const [day, setDay] = useState("");
    const [month, setMonth] = useState("");
    const [year, setYear] = useState("");
    const [isSubscribed, setIsSubscribed] = useState(false);

    const handleCheckboxChange = (event) => {
        setIsSubscribed(event.target.checked);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            const response = await fetch("http://localhost:5000/api/users/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username,
                    password,
                    firstname: "",
                    lastname: "",
                }),
            });
            console.log(JSON.stringify({ username, password }));
            console.log(response, "response");
            if (response.ok) {
                const data = await response.text();
                console.log("Login successful:", data);

                // Stocker le token d'authentification si nécessaire, par exemple dans localStorage
                // localStorage.setItem('token', data.token);

                navigate("/"); // Rediriger vers la route home ou dashboard
            } else {
                // Gérer les erreurs, par exemple en montrant un message à l'utilisateur
                console.error("Login failed:", response.status);
                // Afficher un message d'erreur
            }
        } catch (error) {
            console.log("response", response);
            console.error("Network error:", error);
            // Afficher un message d'erreur
        }
    };

    return (
        <div
            className="bg-discord-light-black min-h-screen w-full
				flex items-center justify-center"
        >
            <div className="bg-discord-dark-grey flex p-8 rounded-l">
                <form onSubmit={handleSubmit}>
                    <div className="text-white text-2xl font-bold">Creer un compte</div>
                    <div className="mb-6">
                        <label
                            htmlFor="email"
                            className="text-left block mb-2 text-sm font-bold
								text-white"
                        >
                            E-MAIL
                        </label>

                        <input
                            type="text"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-discord-light-black text-white 
								text-sm rounded-l login-container h-10 px-2.5"
                            placeholder=""
                        />
                    </div>
                    <div className="mb-6">
                        <label
                            htmlFor="nickname"
                            className="text-left font-bold block mb-2 text-sm
								text-white"
                        >
                            NOM D'AFFICHAGE
                        </label>
                        <input
                            type="text"
                            id="nickname"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            className="bg-discord-light-black text-white text-sm 
								rounded-l block login-container h-10 px-2.5"
                            placeholder=""
                        />
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
                            className="text-left font-bold block mb-2 text-sm
								text-white"
                        >
                            MOT DE PASSE <span className="text-discord-red">*</span>
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
                    </div>
                    <div className="mb-6">
                        <label
                            htmlFor="password"
                            className="text-left font-bold block mb-2 text-sm
								text-white"
                        >
                            DATE DE NAISSANCE{" "}
                        </label>
                        <div className="flex gap-3">
                            <select
                                id="day"
                                value={day}
                                onChange={(e) => setDay(e.target.value)}
                                className="bg-discord-light-black text-white text-sm rounded-l w-1/3 h-10 px-2.5"
                            >
                                {/* Générer les jours */}
                                {[...Array(31)].map((_, index) => (
                                    <option key={index} value={index + 1}>
                                        {index + 1}
                                    </option>
                                ))}
                            </select>
                            <select
                                id="month"
                                required
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                                className="bg-discord-light-black text-white text-sm w-1/3  rounded-l h-10 px-2.5"
                            >
                                {/* Générer les mois */}
                                {[
                                    "Janvier",
                                    "Février",
                                    "Mars",
                                    "Avril",
                                    "Mai",
                                    "Juin",
                                    "Juillet",
                                    "Août",
                                    "Septembre",
                                    "Octobre",
                                    "Novembre",
                                    "Décembre",
                                ].map((month, index) => (
                                    <option key={index} value={index + 1}>
                                        {month}
                                    </option>
                                ))}
                            </select>
                            <select
                                id="year"
                                required
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                className="bg-discord-light-black text-white text-sm w-1/3  rounded-l h-10 px-2.5"
                            >
                                {generateYearOptions()}
                            </select>
                        </div>
                    </div>
                    <div className="mb-6 flex items-center">
                        <Checkbox
                            checked={isSubscribed}
                            onChange={handleCheckboxChange}
                        />
                        <label
                            htmlFor="subscribe"
                            className="text-sm text-greyple text-left m"
                        >
                            Je veux bien recevoir des e-mails à propos des mises à jour
                            de <br />
                            Discord, des astuces ou des offres spéciales.
                        </label>
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
