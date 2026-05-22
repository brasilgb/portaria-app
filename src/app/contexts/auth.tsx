import { createContext } from 'react';

interface AuthContextData {
    signed: boolean;
    user: object | null;
    signIn(): void;
    signOut(): void;
}

interface AuthProviderProps {
    children: React.ReactNode;
}

export const AuthContext = createContext({});

export default function AuthProvider({ children }: AuthProviderProps) {
    return (
        <AuthContext.Provider value={{ signed: false, user: null, signIn() { }, signOut() { } }}>
            {children}
        </AuthContext.Provider>
    )
}