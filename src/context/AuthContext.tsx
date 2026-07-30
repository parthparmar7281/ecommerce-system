import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { getProfile, signOut } from "../services/authService";
import { supabase } from "../lib/supabase-client";
import type { UserProfile } from "../types/user";

interface AuthContextType {
    user: UserProfile | null;
    loading: boolean;
    logout: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const currentUserIdRef = useRef<string | null>(null);

    const fetchProfile = async (userId: string) => {
        // Prevent duplicate calls if this user profile is already loaded/fetching
        if (currentUserIdRef.current === userId) {
            return;
        }
        currentUserIdRef.current = userId;

        try {
            setLoading(true);
            const { data, error } = await getProfile();
            console.log("Fetched User Profile:", data);
            if (error || !data) {
                setUser(null);
                currentUserIdRef.current = null;
            } else {
                setUser(data as UserProfile);
            }
        } catch (err) {
            console.error("Failed to load user profile", err);
            setUser(null);
            currentUserIdRef.current = null;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const initializeAuth = async () => {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                await fetchProfile(session.user.id);
            } else {
                setLoading(false);
            }
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                await fetchProfile(session.user.id);
            } else {
                setUser(null);
                currentUserIdRef.current = null;
                setLoading(false);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const logout = async () => {
        await signOut();
        setUser(null);
        currentUserIdRef.current = null;
        window.location.href = "/";
    };

    const refreshProfile = async () => {
        // Clear cached ID ref so it forces a reload
        currentUserIdRef.current = null;
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            await fetchProfile(session.user.id);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, logout, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
