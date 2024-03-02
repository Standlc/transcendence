import React, {
    createContext,
    useContext,
    useState,
    ReactNode,
    useEffect,
} from "react";
import { AppUser } from "@api/types/clientSchema";

interface AuthProviderProps {
    children: ReactNode;
}

const AuthContext = createContext<{
    loginResponse: AppUser | null;
    login: (data: AppUser) => void;
    logout: () => void;
}>({ loginResponse: null, login: () => {}, logout: () => {} });

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [loginResponse, setLoginResponse] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const storedLoginResponse = localStorage.getItem("loginResponse");
                console.log("Stored login response:", storedLoginResponse);
                if (storedLoginResponse) {
                    const userData = JSON.parse(storedLoginResponse);
                    console.log("User data:", userData);
                    setLoginResponse(userData);
                } else {
                    await checkAuthCookie();
                }
            } catch (error) {
                console.error("Error checking authentication:", error);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const checkAuthCookie = async () => {
        try {
            const response = await fetch("http://localhost:3000/api/auth/token", {
                method: "GET",
                credentials: "include", // Important for cookies to be sent and received
            });
            if (response.ok) {
                const data: AppUser = await response.json();
                login(data); // Appel de la fonction login lorsque l'authentification réussit
            } else {
                console.log("Not authenticated via cookie");
                // Gérer la non-authentification ici, par exemple, rediriger vers la page de connexion
            }
        } catch (error) {
            console.error("Error checking auth cookie:", error);
        }
    };

    const login = (data: AppUser) => {
        console.log("Logging in with data:", data);
        setLoginResponse(data);
        localStorage.setItem("loginResponse", JSON.stringify(data));
        console.log("loginResponse set:", data);
    };

    const logout = () => {
        console.log("Logging out");
        setLoginResponse(null);
        localStorage.removeItem("loginResponse"); // Suppression des données de connexion lors de la déconnexion
        // Autres actions de déconnexion...
    };

    if (loading) {
        // Affichage d'un indicateur de chargement pendant la vérification de l'authentification
        return <div>Loading...</div>;
    }

    return (
        <AuthContext.Provider value={{ loginResponse, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext); // Récupération du contexte d'authentification dans les composants
};
