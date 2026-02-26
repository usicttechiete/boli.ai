import { Session, User } from '@supabase/supabase-js';
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';

// ─── Types ──────────────────────────────────────────────────────────────────

interface AuthState {
    session: Session | null;
    user: User | null;
    isLoading: boolean;
}

interface AuthContextValue extends AuthState {
    /** Sign in with email + password. Returns error message or null on success. */
    signIn: (email: string, password: string) => Promise<string | null>;
    /** Sign up with email + password + optional metadata. Returns error message or null. */
    signUp: (
        email: string,
        password: string,
        metadata?: { full_name?: string }
    ) => Promise<string | null>;
    /** Sign out the current user. */
    signOut: () => Promise<void>;
    /** Get the current access token for API calls. */
    getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ───────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<AuthState>({
        session: null,
        user: null,
        isLoading: true,
    });

    // ── Bootstrap: read persisted session + listen for changes ──────────────
    useEffect(() => {
        // 1. Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setState({
                session,
                user: session?.user ?? null,
                isLoading: false,
            });
        });

        // 2. Subscribe to auth state changes (login, logout, token refresh)
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setState({
                session,
                user: session?.user ?? null,
                isLoading: false,
            });
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // ── Actions ─────────────────────────────────────────────────────────────

    const signIn = useCallback(async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) return error.message;
        return null;
    }, []);

    const signUp = useCallback(
        async (
            email: string,
            password: string,
            metadata?: { full_name?: string }
        ) => {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: metadata, // stored in raw_user_meta_data → used by DB trigger
                },
            });

            if (error) return error.message;

            // Supabase may require email verification
            if (data.session === null && data.user) {
                Alert.alert(
                    'Verify your email',
                    'Please check your inbox and confirm your email address before signing in.'
                );
            }
            return null;
        },
        []
    );

    const signOut = useCallback(async () => {
        await supabase.auth.signOut();
    }, []);

    const getAccessToken = useCallback(async () => {
        const {
            data: { session },
        } = await supabase.auth.getSession();
        return session?.access_token ?? null;
    }, []);

    // ── Memoised value ──────────────────────────────────────────────────────
    const value = useMemo<AuthContextValue>(
        () => ({
            ...state,
            signIn,
            signUp,
            signOut,
            getAccessToken,
        }),
        [state, signIn, signUp, signOut, getAccessToken]
    );

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used within an <AuthProvider>');
    }
    return ctx;
}
