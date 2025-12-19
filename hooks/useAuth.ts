import { useEffect, useState } from 'react';
import { router, usePathname } from 'expo-router';
import { getToken, getStoredUser, AuthUser } from '@/lib/api';

const PUBLIC_ROUTES = ['/auth/phone', '/auth/otp', '/auth/profile-setup', '/'];

export function useAuth() {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const pathname = usePathname();

    const checkAuth = async () => {
        try {
            const token = await getToken();
            const storedUser = await getStoredUser();

            setIsAuthenticated(!!token);
            setUser(storedUser);

            // If not authenticated and not on a public route, redirect to login
            if (!token && !PUBLIC_ROUTES.includes(pathname)) {
                router.replace('/auth/phone');
            }
        } catch (error) {
            console.error('Auth check error:', error);
            setIsAuthenticated(false);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, [pathname]);

    return { isAuthenticated, user, isLoading, refreshAuth: checkAuth };
}

export function useRequireAuth() {
    const { isAuthenticated, user, isLoading, refreshAuth } = useAuth();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoading && !isAuthenticated && !PUBLIC_ROUTES.includes(pathname)) {
            router.replace('/auth/phone');
        }
    }, [isAuthenticated, isLoading, pathname]);

    return { isAuthenticated, user, isLoading, refreshAuth };
}
