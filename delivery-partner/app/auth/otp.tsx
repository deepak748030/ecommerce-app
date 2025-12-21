import { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { API_BASE_URL } from '../../lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function OtpScreen() {
    const { colors } = useTheme();
    const params = useLocalSearchParams();
    const phone = params.phone as string;
    const isNewUser = params.isNewUser === 'true';
    const isProfileComplete = params.isProfileComplete === 'true';

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resendTimer, setResendTimer] = useState(30);

    const inputRefs = useRef<(TextInput | null)[]>([]);

    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendTimer]);

    const handleOtpChange = (value: string, index: number) => {
        if (value.length > 1) {
            value = value[value.length - 1];
        }

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setError('');

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerifyOtp = async () => {
        const otpString = otp.join('');
        if (otpString.length !== 6) {
            setError('Please enter complete OTP');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_BASE_URL}/delivery-partner/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, otp: otpString }),
            });

            const data = await response.json();

            if (data.success) {
                // Save token and partner data
                await AsyncStorage.setItem('partnerToken', data.response.token);
                await AsyncStorage.setItem('partnerData', JSON.stringify(data.response.partner));

                if (data.response.isNewUser || !data.response.partner.isProfileComplete) {
                    // New user - go to vehicle setup
                    router.replace({
                        pathname: '/auth/vehicle-setup' as any,
                        params: { partnerId: data.response.partner.id },
                    });
                } else {
                    // Existing user - go to home
                    router.replace('/(tabs)' as any);
                }
            } else {
                setError(data.message || 'Invalid OTP');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendTimer > 0) return;

        try {
            const response = await fetch(`${API_BASE_URL}/delivery-partner/auth/resend-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone }),
            });

            const data = await response.json();
            if (data.success) {
                setResendTimer(30);
                setOtp(['', '', '', '', '', '']);
            }
        } catch (err) {
            setError('Failed to resend OTP');
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <ArrowLeft size={24} color={colors.foreground} />
            </TouchableOpacity>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.foreground }]}>Verify OTP</Text>
                    <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                        Enter the 6-digit code sent to +91 {phone}
                    </Text>
                    <Text style={[styles.hint, { color: colors.primary }]}>
                        Use OTP: 123456
                    </Text>
                </View>

                <View style={styles.otpContainer}>
                    {otp.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={(ref) => {
                                inputRefs.current[index] = ref;
                            }}
                            style={[
                                styles.otpInput,
                                {
                                    backgroundColor: colors.card,
                                    borderColor: digit ? colors.primary : colors.border,
                                    color: colors.foreground,
                                },
                            ]}
                            keyboardType="number-pad"
                            maxLength={1}
                            value={digit}
                            onChangeText={(value) => handleOtpChange(value.replace(/[^0-9]/g, ''), index)}
                            onKeyPress={(e) => handleKeyPress(e, index)}
                        />
                    ))}
                </View>

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.primary }]}
                    onPress={handleVerifyOtp}
                    disabled={loading || otp.join('').length !== 6}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Verify & Continue</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.resendButton}
                    onPress={handleResendOtp}
                    disabled={resendTimer > 0}
                >
                    <Text style={[styles.resendText, { color: colors.mutedForeground }]}>
                        Didn't receive code?{' '}
                        <Text style={{ color: resendTimer > 0 ? colors.mutedForeground : colors.primary }}>
                            {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                        </Text>
                    </Text>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backButton: {
        padding: 6,
        marginLeft: 6,
    },
    content: {
        flex: 1,
        paddingHorizontal: 6,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
    },
    subtitle: {
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
    hint: {
        fontSize: 13,
        marginTop: 8,
        fontWeight: '600',
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 24,
    },
    otpInput: {
        width: 48,
        height: 52,
        borderWidth: 1.5,
        borderRadius: 10,
        fontSize: 20,
        fontWeight: '600',
        textAlign: 'center',
    },
    error: {
        color: '#ef4444',
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 16,
    },
    button: {
        height: 52,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    resendButton: {
        marginTop: 20,
        alignItems: 'center',
    },
    resendText: {
        fontSize: 14,
    },
});
