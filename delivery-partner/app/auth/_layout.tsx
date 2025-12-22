import { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { setSessionExpiredCallback, clearAllPartnerData } from '../../lib/api';

export default function RootLayout() {
    const { isDark } = useTheme();

    useEffect(() => {
        // Set up session expired callback
        setSessionExpiredCallback(async () => {
            await clearAllPartnerData();
            router.replace('/auth/phone');
        });
    }, []);

    return (
        <SafeAreaProvider>
            <>
                <Stack screenOptions={{ headerShown: false }} />
                <StatusBar style={isDark ? 'light' : 'dark'} />
            </>
        </SafeAreaProvider>
    );
}
