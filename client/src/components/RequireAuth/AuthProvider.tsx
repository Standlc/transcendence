import React, { createContext, useContext, useState, ReactNode } from "react";
import { Timestamp } from "../../../../api/src/types/schema";

// Define a TypeScript type for loginResponse
export interface LoginResponse {
    username: string;
    avatarUrl: string | null;
    bio: string | null;
    createdAt: Timestamp;
    email: string | null;
    id: number;
    lastname: string | null;
    firstname: string | null;
    rating: number;
}

interface AuthProviderProps {
    children: ReactNode;
}

const AuthContext = createContext<{
    loginResponse: LoginResponse | null;
    login: (data: LoginResponse) => void;
    logout: () => void;
}>({ loginResponse: null, login: () => {}, logout: () => {} });

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [loginResponse, setLoginResponse] = useState<LoginResponse | null>(null);
    // const navigate = useNavigat();

    const login = (data: LoginResponse) => {
        setLoginResponse(data);
    };

    const logout = () => {
        setLoginResponse(null);
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
