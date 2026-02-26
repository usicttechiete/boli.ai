import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

/**
 * A hook that returns a `fetchApi` function which automatically attaches
 * the Supabase access token to every request's Authorization header.
 *
 * Usage:
 *   const { fetchApi } = useApi();
 *   const data = await fetchApi('/api/profile', { method: 'GET' });
 */
export function useApi() {
    const { getAccessToken } = useAuth();

    const fetchApi = useCallback(
        async <T = any>(
            path: string,
            options: RequestInit = {}
        ): Promise<T> => {
            const token = await getAccessToken();
            if (!token) {
                throw new Error('Not authenticated');
            }

            const url = `${API_BASE}${path}`;
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                ...(options.headers as Record<string, string>),
            };

            const res = await fetch(url, {
                ...options,
                headers,
            });

            const json = await res.json();

            if (!res.ok || !json.success) {
                throw new Error(
                    json.error?.message ?? `Request failed with status ${res.status}`
                );
            }

            return json.data as T;
        },
        [getAccessToken]
    );

    return { fetchApi };
}
