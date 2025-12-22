import { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Image,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Phone } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { deliveryPartnerAuthApi } from '../../lib/api';

export default function PhoneScreen() {
    const { colors } = useTheme();
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSendOtp = async () => {
        if (loading) return; // Prevent multiple clicks

        if (phone.length < 10) {
            setError('Please enter a valid 10-digit phone number');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await deliveryPartnerAuthApi.login(phone);

            if (result.success && result.response) {
                router.push({
                    pathname: '/auth/otp' as any,
                    params: {
                        phone,
                        isNewUser: result.response.isNewUser ? 'true' : 'false',
                        isProfileComplete: result.response.isProfileComplete ? 'true' : 'false',
                    },
                });
            } else {
                setError(result.message || 'Failed to send OTP');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.content}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <View style={styles.header}>
                    <Image
                        source={require('../../assets/images/app-logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={[styles.title, { color: colors.foreground }]}>SwiftDrop Partner</Text>
                    <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                        Deliver happiness, earn rewards
                    </Text>
                </View>

                <View style={styles.form}>
                    <Text style={[styles.label, { color: colors.foreground }]}>Mobile Number</Text>
                    <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Phone size={20} color={colors.mutedForeground} />
                        <Text style={[styles.prefix, { color: colors.foreground }]}>+91</Text>
                        <TextInput
                            style={[styles.input, { color: colors.foreground }]}
                            placeholder="Enter your mobile number"
                            placeholderTextColor={colors.mutedForeground}
                            keyboardType="phone-pad"
                            maxLength={10}
                            value={phone}
                            onChangeText={(text) => {
                                setPhone(text.replace(/[^0-9]/g, ''));
                                setError('');
                            }}
                        />
                    </View>

                    {error ? <Text style={styles.error}>{error}</Text> : null}

                    <TouchableOpacity
                        style={[
                            styles.button,
                            { backgroundColor: phone.length === 10 ? colors.primary : colors.muted }
                        ]}
                        onPress={handleSendOtp}
                        disabled={loading || phone.length < 10}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Get OTP</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <Text style={[styles.footer, { color: colors.mutedForeground }]}>
                    By continuing, you agree to our Terms of Service and Privacy Policy
                </Text>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 6,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logo: {
        width: 80,
        height: 80,
        marginBottom: 16,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
    },
    subtitle: {
        fontSize: 14,
        marginTop: 4,
    },
    form: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 52,
        gap: 8,
    },
    prefix: {
        fontSize: 16,
        fontWeight: '500',
    },
    input: {
        flex: 1,
        fontSize: 16,
    },
    error: {
        color: '#ef4444',
        fontSize: 13,
        marginTop: 8,
    },
    button: {
        height: 52,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        textAlign: 'center',
        fontSize: 12,
        paddingHorizontal: 20,
    },
});
