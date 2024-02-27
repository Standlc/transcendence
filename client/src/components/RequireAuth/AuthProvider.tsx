import React, {
    createContext,
    useContext,
    useState,
    ReactNode,
    useEffect,
} from "react";
import { Timestamp } from "../../../../api/src/types/schema";

// Define a TypeScript type for loginResponse
export interface LoginResponse {
    // Define the properties you expect to receive from the login API response
    // For example, if you expect a 'username' property, you can define it like this:
    username: string;
    avatarUrl: string | null;
    bio: string | null;
    createdAt: Timestamp;
    email: string | null;
    id: number;
    lastname: string | null;
    firstname: string | null;
    rating: number;
    // Add other properties as needed
}

interface AuthProviderProps {
    children: ReactNode;
}

const AuthContext = createContext<{
    loginResponse: LoginResponse | null;
    login: (data: LoginResponse) => void;
    logout: () => void;
}>(
    // Provide an initial value for the context, specifying the loginResponse is initially null
    { loginResponse: null, login: () => {}, logout: () => {} }
);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [loginResponse, setLoginResponse] = useState<LoginResponse | null>(null);

    useEffect(() => {
        const storedLoginResponse = localStorage.getItem("loginResponse");
        if (storedLoginResponse) {
            setLoginResponse(JSON.parse(storedLoginResponse));
        }
    }, []);

    const login = (data: LoginResponse) => {
        setLoginResponse(data);
        // Stockez les informations de connexion dans localStorage
        localStorage.setItem("loginResponse", JSON.stringify(data));
    };

    const logout = () => {
        setLoginResponse(null);
        // Assurez-vous également de nettoyer le localStorage
        localStorage.removeItem("loginResponse");
    };

    return (
        <AuthContext.Provider value={{ loginResponse, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
