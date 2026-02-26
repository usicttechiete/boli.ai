import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
}

/**
 * A hook that returns an `apiCall` function which automatically attaches
 * the Supabase access token to every request's Authorization header.
 *
 * Usage:
 *   const { apiCall } = useApi();
 *   const result = await apiCall('/api/profile', { method: 'GET' });
 */
export function useApi() {
    const { getAccessToken } = useAuth();

    const apiCall = useCallback(
        async <T = any>(
            path: string,
            options: RequestInit = {}
        ): Promise<ApiResponse<T>> => {
            try {
                const token = await getAccessToken();

                const url = `${API_BASE}${path}`;
                const headers: Record<string, string> = {
                    ...(options.headers as Record<string, string>),
                };

                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                // Don't set Content-Type for FormData (browser will set it with boundary)
                if (!(options.body instanceof FormData)) {
                    headers['Content-Type'] = 'application/json';
                }

                const res = await fetch(url, {
                    ...options,
                    headers,
                });

                const json = await res.json();

                if (!res.ok) {
                    return {
                        success: false,
                        error: json.error || {
                            code: 'UNKNOWN_ERROR',
                            message: `Request failed with status ${res.status}`,
                        },
                    };
                }

                return json;
            } catch (error) {
                console.error('API call failed:', error);
                return {
                    success: false,
                    error: {
                        code: 'NETWORK_ERROR',
                        message: error instanceof Error ? error.message : 'Network request failed',
                    },
                };
            }
        },
        [getAccessToken]
    );

    // Keep backward compatibility
    const fetchApi = useCallback(
        async <T = any>(path: string, options: RequestInit = {}): Promise<T> => {
            const result = await apiCall<T>(path, options);
            if (!result.success) {
                throw new Error(result.error?.message ?? 'Request failed');
            }
            return result.data as T;
        },
        [apiCall]
    );

    return { apiCall, fetchApi };
}
