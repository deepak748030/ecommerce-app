import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';

export default function RootLayout() {
    const { isDark } = useTheme();

    return (
        <SafeAreaProvider>
            <>
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="auth" />
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="delivery/[id]" />
                    <Stack.Screen name="earnings-history" />
                    <Stack.Screen name="settings" />
                </Stack>
                <StatusBar style={isDark ? 'light' : 'dark'} />
            </>
        </SafeAreaProvider>
    );
}
