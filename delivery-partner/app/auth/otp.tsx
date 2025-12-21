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
    Keyboard,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { deliveryPartnerAuthApi } from '../../lib/api';

export default function OtpScreen() {
    const { colors } = useTheme();
    const params = useLocalSearchParams();
    const phone = params.phone as string;
    const isNewUser = params.isNewUser === 'true';

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [error, setError] = useState('');
    const [resendTimer, setResendTimer] = useState(30);
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

    const inputRefs = useRef<(TextInput | null)[]>([]);

    // Auto focus first input when screen loads
    useEffect(() => {
        const timer = setTimeout(() => {
            inputRefs.current[0]?.focus();
        }, 300);
        return () => clearTimeout(timer);
    }, []);

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
        if (loading) return; // Prevent multiple clicks

        const otpString = otp.join('');
        if (otpString.length !== 6) {
            setError('Please enter complete OTP');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await deliveryPartnerAuthApi.verifyOtp(phone, otpString);

            if (result.success && result.response) {
                if (result.response.isNewUser || !result.response.partner.isProfileComplete) {
                    router.replace({
                        pathname: '/auth/vehicle-setup' as any,
                        params: { partnerId: result.response.partner.id },
                    });
                } else {
                    router.replace('/(tabs)' as any);
                }
            } else {
                setError(result.message || 'Invalid OTP');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendTimer > 0 || resendLoading) return; // Prevent multiple clicks

        setResendLoading(true);
        try {
            const result = await deliveryPartnerAuthApi.resendOtp(phone);
            if (result.success) {
                setResendTimer(30);
                setOtp(['', '', '', '', '', '']);
            } else {
                setError(result.message || 'Failed to resend OTP');
            }
        } catch (err) {
            setError('Failed to resend OTP');
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <ArrowLeft size={24} color={colors.foreground} />
            </TouchableOpacity>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.content}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
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
                                    borderColor: focusedIndex === index ? colors.primary : digit ? colors.primary : colors.border,
                                    color: colors.foreground,
                                },
                            ]}
                            keyboardType="number-pad"
                            maxLength={1}
                            value={digit}
                            onChangeText={(value) => handleOtpChange(value.replace(/[^0-9]/g, ''), index)}
                            onKeyPress={(e) => handleKeyPress(e, index)}
                            onFocus={() => setFocusedIndex(index)}
                            onBlur={() => setFocusedIndex(null)}
                            caretHidden={true}
                        />
                    ))}
                </View>

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <TouchableOpacity
                    style={[
                        styles.button,
                        { backgroundColor: otp.join('').length === 6 ? colors.primary : colors.muted }
                    ]}
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
