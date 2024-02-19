import React, { createContext, useContext, useState, ReactNode } from "react";

// Define a TypeScript type for loginResponse
export interface LoginResponse {
    // Define the properties you expect to receive from the login API response
    // For example, if you expect a 'username' property, you can define it like this:
    username: string;
    avatarUrl: string;
    bio: string;
    createdAt: string;
    email: string;
    id: number;
    lastname: string;
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
