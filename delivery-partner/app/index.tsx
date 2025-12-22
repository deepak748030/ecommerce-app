import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { isPartnerLoggedIn, getPartnerData, deliveryPartnerAuthApi } from '../lib/api';
import { useTheme } from '../hooks/useTheme';

export default function Index() {
    const { colors } = useTheme();
    const [isChecking, setIsChecking] = useState(true);
    const [authState, setAuthState] = useState<'logged_in' | 'needs_setup' | 'logged_out'>('logged_out');
    const [partnerId, setPartnerId] = useState<string | null>(null);

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const loggedIn = await isPartnerLoggedIn();

            if (!loggedIn) {
                setAuthState('logged_out');
                setIsChecking(false);
                return;
            }

            // User has token, check if profile is complete
            const localData = await getPartnerData();

            if (localData) {
                if (localData.isProfileComplete) {
                    setAuthState('logged_in');
                } else {
                    setPartnerId(localData.id);
                    setAuthState('needs_setup');
                }
                setIsChecking(false);
                return;
            }

            // No local data, fetch from server
            const result = await deliveryPartnerAuthApi.getMe();

            if (result.success && result.response) {
                if (result.response.isProfileComplete) {
                    setAuthState('logged_in');
                } else {
                    setPartnerId(result.response.id);
                    setAuthState('needs_setup');
                }
            } else {
                // Token invalid or expired
                setAuthState('logged_out');
            }
        } catch (error) {
            console.log('Error checking auth status:', error);
            setAuthState('logged_out');
        } finally {
            setIsChecking(false);
        }
    };

    if (isChecking) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (authState === 'logged_in') {
        return <Redirect href="/(tabs)" />;
    }

    if (authState === 'needs_setup' && partnerId) {
        return <Redirect href={`/auth/vehicle-setup?partnerId=${partnerId}` as any} />;
    }

    return <Redirect href="/auth/phone" />;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
