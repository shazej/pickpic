"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { SessionProvider, useSession, signIn, signOut as authSignOut } from "next-auth/react";

interface User {
    id: string;
    email: string;
    name?: string;
    roles?: string[]; // Todo: Add roles
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name?: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthProviderContent({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (status === "loading") {
            setLoading(true);
        } else {
            if (session?.user) {
                setUser({
                    id: session.user.id as string,
                    email: session.user.email as string,
                    name: session.user.name as string,
                    roles: (session.user as any).roles,
                });
            } else {
                setUser(null);
            }
            setLoading(false);
        }
    }, [session, status]);

    const login = async (email: string, password: string) => {
        const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        if (result?.error) {
            throw new Error(result.error);
        }
        router.push('/');
    };

    const register = async (email: string, password: string, name?: string) => {
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Registration failed');
            }

            // After register, sign in to get the session
            await login(email, password);
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const signOut = async () => {
        await authSignOut({ redirect: false });
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function AuthProvider({ children }: { children: ReactNode }) {
    return (
        <SessionProvider>
            <AuthProviderContent>
                {children}
            </AuthProviderContent>
        </SessionProvider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
