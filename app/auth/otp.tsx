import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, RefreshCw, Shield, CheckCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const OTP_LENGTH = 6;

export default function OTPScreen() {
    const { colors, isDark } = useTheme();
    const { phone } = useLocalSearchParams<{ phone: string }>();
    const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
    const [focusedIndex, setFocusedIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [resendTimer, setResendTimer] = useState(30);
    const [canResend, setCanResend] = useState(false);
    const [isVerified, setIsVerified] = useState(false);

    const inputRefs = useRef<(TextInput | null)[]>([]);
    const shakeAnimation = useRef(new Animated.Value(0)).current;
    const successScale = useRef(new Animated.Value(0)).current;

    const styles = createStyles(colors, isDark);

    useEffect(() => {
        if (resendTimer > 0 && !canResend) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        } else if (resendTimer === 0) {
            setCanResend(true);
        }
    }, [resendTimer, canResend]);

    useEffect(() => {
        // Auto-focus first input
        setTimeout(() => {
            inputRefs.current[0]?.focus();
        }, 300);
    }, []);

    const triggerShake = () => {
        Animated.sequence([
            Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    const handleOTPChange = (text: string, index: number) => {
        const sanitized = text.replace(/\D/g, '');

        if (sanitized.length > 1) {
            // Handle paste
            const chars = sanitized.slice(0, OTP_LENGTH).split('');
            const newOtp = [...otp];
            chars.forEach((char, i) => {
                if (index + i < OTP_LENGTH) {
                    newOtp[index + i] = char;
                }
            });
            setOtp(newOtp);
            const nextIndex = Math.min(index + chars.length, OTP_LENGTH - 1);
            inputRefs.current[nextIndex]?.focus();
            setFocusedIndex(nextIndex);

            if (newOtp.every((digit) => digit !== '')) {
                verifyOTP(newOtp.join(''));
            }
        } else {
            const newOtp = [...otp];
            newOtp[index] = sanitized;
            setOtp(newOtp);
            setError('');

            if (sanitized && index < OTP_LENGTH - 1) {
                inputRefs.current[index + 1]?.focus();
                setFocusedIndex(index + 1);
            }

            if (newOtp.every((digit) => digit !== '')) {
                verifyOTP(newOtp.join(''));
            }
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
            setFocusedIndex(index - 1);
            const newOtp = [...otp];
            newOtp[index - 1] = '';
            setOtp(newOtp);
        }
    };

    const verifyOTP = async (otpCode: string) => {
        setIsLoading(true);
        setError('');

        // Simulate API verification
        setTimeout(async () => {
            // For demo, accept any 6-digit OTP
            if (otpCode.length === 6) {
                setIsVerified(true);
                Animated.spring(successScale, {
                    toValue: 1,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                }).start();

                // Check if user exists (simulated)
                const existingUser = await AsyncStorage.getItem('user_phone');

                setTimeout(() => {
                    if (existingUser === phone) {
                        // Existing user - go to home
                        router.replace('/(tabs)');
                    } else {
                        // New user - go to profile setup
                        AsyncStorage.setItem('user_phone', phone || '');
                        router.push({
                            pathname: '/auth/profile-setup' as any,
                            params: { phone },
                        });
                    }
                }, 800);
            } else {
                setError('Invalid OTP. Please try again.');
                triggerShake();
                setOtp(Array(OTP_LENGTH).fill(''));
                inputRefs.current[0]?.focus();
                setFocusedIndex(0);
            }
            setIsLoading(false);
        }, 1500);
    };

    const handleResend = () => {
        if (!canResend) return;
        setCanResend(false);
        setResendTimer(30);
        setOtp(Array(OTP_LENGTH).fill(''));
        setError('');
        inputRefs.current[0]?.focus();
        setFocusedIndex(0);
    };

    const maskedPhone = phone
        ? `${phone.slice(0, 5)}****${phone.slice(-2)}`
        : '';

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={[colors.background, colors.card + '30', colors.background]}
                style={styles.gradient}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Pressable
                        style={[styles.backButton, { backgroundColor: colors.card }]}
                        onPress={() => router.back()}
                    >
                        <ArrowLeft size={20} color={colors.foreground} />
                    </Pressable>
                </View>

                <View style={styles.content}>
                    {/* Title */}
                    <View style={styles.titleContainer}>
                        <Text style={[styles.title, { color: colors.foreground }]}>Verify OTP</Text>
                        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                            Enter the 6-digit code sent to{'\n'}
                            <Text style={{ color: colors.primary, fontWeight: '600' }}>{maskedPhone}</Text>
                        </Text>
                    </View>

                    {/* OTP Input */}
                    {isVerified ? (
                        <Animated.View
                            style={[
                                styles.successContainer,
                                { transform: [{ scale: successScale }] },
                            ]}
                        >
                            <View style={[styles.successIcon, { backgroundColor: colors.success + '20' }]}>
                                <CheckCircle size={60} color={colors.success} />
                            </View>
                            <Text style={[styles.successText, { color: colors.success }]}>
                                Verified Successfully!
                            </Text>
                        </Animated.View>
                    ) : (
                        <>
                            <Animated.View
                                style={[
                                    styles.otpContainer,
                                    { transform: [{ translateX: shakeAnimation }] },
                                ]}
                            >
                                {otp.map((digit, index) => (
                                    <View
                                        key={index}
                                        style={[
                                            styles.otpInputWrapper,
                                            {
                                                backgroundColor: colors.card,
                                                borderColor:
                                                    error
                                                        ? colors.destructive
                                                        : focusedIndex === index
                                                            ? colors.primary
                                                            : digit
                                                                ? colors.success
                                                                : colors.border,
                                                borderWidth: focusedIndex === index ? 2 : 1.5,
                                            },
                                        ]}
                                    >
                                        <TextInput
                                            ref={(ref) => { inputRefs.current[index] = ref; }}
                                            style={[
                                                styles.otpInput,
                                                {
                                                    color: colors.foreground,
                                                },
                                            ]}
                                            value={digit}
                                            onChangeText={(text) => handleOTPChange(text, index)}
                                            onKeyPress={(e) => handleKeyPress(e, index)}
                                            onFocus={() => setFocusedIndex(index)}
                                            keyboardType="number-pad"
                                            maxLength={6}
                                            selectTextOnFocus
                                            editable={!isLoading}
                                        />
                                        {focusedIndex === index && !digit && (
                                            <View style={[styles.cursor, { backgroundColor: colors.primary }]} />
                                        )}
                                    </View>
                                ))}
                            </Animated.View>

                            {error ? (
                                <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
                            ) : (
                                <View style={styles.helperContainer}>
                                    <Shield size={14} color={colors.mutedForeground} />
                                    <Text style={[styles.helperText, { color: colors.mutedForeground }]}>
                                        Do not share this OTP with anyone
                                    </Text>
                                </View>
                            )}

                            {/* Loading Indicator */}
                            {isLoading && (
                                <View style={styles.loadingContainer}>
                                    <View style={styles.loadingDots}>
                                        <View style={[styles.dot, styles.dot1, { backgroundColor: colors.primary }]} />
                                        <View style={[styles.dot, styles.dot2, { backgroundColor: colors.primary }]} />
                                        <View style={[styles.dot, styles.dot3, { backgroundColor: colors.primary }]} />
                                    </View>
                                    <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
                                        Verifying...
                                    </Text>
                                </View>
                            )}

                            {/* Resend Section */}
                            <View style={styles.resendContainer}>
                                <Text style={[styles.resendText, { color: colors.mutedForeground }]}>
                                    Didn't receive the code?
                                </Text>
                                {canResend ? (
                                    <Pressable onPress={handleResend} style={styles.resendButton}>
                                        <RefreshCw size={16} color={colors.primary} />
                                        <Text style={[styles.resendLink, { color: colors.primary }]}>Resend OTP</Text>
                                    </Pressable>
                                ) : (
                                    <Text style={[styles.timerText, { color: colors.primary }]}>
                                        Resend in {resendTimer}s
                                    </Text>
                                )}
                            </View>
                        </>
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const createStyles = (colors: any, isDark: boolean) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        gradient: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
        },
        keyboardView: {
            flex: 1,
        },
        header: {
            paddingHorizontal: 20,
            paddingTop: 8,
        },
        backButton: {
            width: 44,
            height: 44,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
        },
        content: {
            flex: 1,
            paddingHorizontal: 24,
            paddingTop: 32,
        },
        titleContainer: {
            marginBottom: 40,
        },
        title: {
            fontSize: 28,
            fontWeight: '800',
            marginBottom: 12,
        },
        subtitle: {
            fontSize: 15,
            lineHeight: 22,
        },
        otpContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: 10,
            marginBottom: 16,
        },
        otpInputWrapper: {
            flex: 1,
            aspectRatio: 1,
            maxWidth: 52,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
        },
        otpInput: {
            fontSize: 24,
            fontWeight: '700',
            textAlign: 'center',
            width: '100%',
            height: '100%',
        },
        cursor: {
            position: 'absolute',
            width: 2,
            height: 24,
            borderRadius: 1,
        },
        errorText: {
            fontSize: 13,
            marginTop: 8,
            textAlign: 'center',
        },
        helperContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 16,
            gap: 6,
        },
        helperText: {
            fontSize: 13,
        },
        loadingContainer: {
            alignItems: 'center',
            marginTop: 32,
        },
        loadingDots: {
            flexDirection: 'row',
            gap: 6,
            marginBottom: 12,
        },
        dot: {
            width: 10,
            height: 10,
            borderRadius: 5,
        },
        dot1: {
            opacity: 0.4,
        },
        dot2: {
            opacity: 0.7,
        },
        dot3: {
            opacity: 1,
        },
        loadingText: {
            fontSize: 14,
            fontWeight: '500',
        },
        resendContainer: {
            alignItems: 'center',
            marginTop: 48,
        },
        resendText: {
            fontSize: 14,
            marginBottom: 8,
        },
        resendButton: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
        },
        resendLink: {
            fontSize: 15,
            fontWeight: '600',
        },
        timerText: {
            fontSize: 15,
            fontWeight: '600',
        },
        successContainer: {
            alignItems: 'center',
            marginTop: 60,
        },
        successIcon: {
            width: 120,
            height: 120,
            borderRadius: 60,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
        },
        successText: {
            fontSize: 20,
            fontWeight: '700',
        },
    });
