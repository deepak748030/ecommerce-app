import React, { useState, useRef } from 'react';
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
    ScrollView,
    Image,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { LinearGradient } from 'expo-linear-gradient';
import { Phone, ArrowRight, Shield, Sparkles } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function PhoneAuthScreen() {
    const { colors, isDark } = useTheme();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [countryCode, setCountryCode] = useState('+91');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const buttonScale = useRef(new Animated.Value(1)).current;
    const shakeAnimation = useRef(new Animated.Value(0)).current;

    const styles = createStyles(colors, isDark);

    const validatePhoneNumber = (number: string) => {
        const cleaned = number.replace(/\D/g, '');
        return cleaned.length === 10;
    };

    const handlePhoneChange = (text: string) => {
        const cleaned = text.replace(/\D/g, '').slice(0, 10);
        setPhoneNumber(cleaned);
        setError('');
    };

    const triggerShake = () => {
        Animated.sequence([
            Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    const handleContinue = async () => {
        if (!validatePhoneNumber(phoneNumber)) {
            setError('Please enter a valid 10-digit mobile number');
            triggerShake();
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const { authApi } = await import('@/lib/api');
            const fullPhone = `${countryCode}${phoneNumber}`;
            const result = await authApi.login(fullPhone);

            if (result.success) {
                router.push({
                    pathname: '/auth/otp' as any,
                    params: { phone: fullPhone },
                });
            } else {
                setError(result.message || 'Failed to send OTP');
                triggerShake();
            }
        } catch (err) {
            setError('Network error. Please try again.');
            triggerShake();
        } finally {
            setIsLoading(false);
        }
    };

    const handlePressIn = () => {
        Animated.spring(buttonScale, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(buttonScale, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };

    const formatPhoneDisplay = (number: string) => {
        if (number.length <= 5) return number;
        return `${number.slice(0, 5)} ${number.slice(5)}`;
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={[colors.background, colors.card + '50', colors.background]}
                style={styles.gradient}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header Image */}
                    <View style={styles.imageContainer}>
                        <View style={[styles.imagePlaceholder, { backgroundColor: '#D97706' + '20' }]}>
                            <Text style={styles.imageEmoji}>🍽️</Text>
                        </View>
                        <View style={[styles.decorCircle1, { backgroundColor: '#D97706' + '15' }]} />
                        <View style={[styles.decorCircle2, { backgroundColor: '#22C55E' + '15' }]} />
                    </View>

                    {/* Welcome Text */}
                    <View style={styles.headerContainer}>
                        <Text style={[styles.welcomeText, { color: colors.mutedForeground }]}>Welcome to</Text>
                        <Text style={[styles.brandNameEnglish, { color: colors.mutedForeground }]}>The Art Of</Text>
                        <Text style={[styles.brandName, { color: '#92400E' }]}>भ ओ जन</Text>
                        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                            Celebrate the joy of food
                        </Text>
                    </View>

                    {/* Phone Input Section */}
                    <View style={styles.formContainer}>
                        <Text style={[styles.inputLabel, { color: colors.foreground }]}>
                            Enter your mobile number
                        </Text>

                        <Animated.View
                            style={[
                                styles.inputWrapper,
                                {
                                    backgroundColor: colors.card,
                                    borderColor: error ? colors.destructive : colors.border,
                                    transform: [{ translateX: shakeAnimation }],
                                },
                            ]}
                        >
                            <View style={[styles.countryCodeContainer, { borderRightColor: colors.border }]}>
                                <Text style={[styles.flag]}>🇮🇳</Text>
                                <Text style={[styles.countryCode, { color: colors.foreground }]}>{countryCode}</Text>
                            </View>

                            <TextInput
                                style={[styles.phoneInput, { color: colors.foreground }]}
                                placeholder="00000 00000"
                                placeholderTextColor={colors.mutedForeground + '60'}
                                keyboardType="phone-pad"
                                value={formatPhoneDisplay(phoneNumber)}
                                onChangeText={handlePhoneChange}
                                maxLength={11}
                                autoFocus
                            />

                            {phoneNumber.length === 10 && (
                                <View style={[styles.validIcon, { backgroundColor: colors.success }]}>
                                    <Text style={styles.checkmark}>✓</Text>
                                </View>
                            )}
                        </Animated.View>

                        {error ? (
                            <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
                        ) : (
                            <View style={styles.helperContainer}>
                                <Shield size={14} color={colors.mutedForeground} />
                                <Text style={[styles.helperText, { color: colors.mutedForeground }]}>
                                    Your number is safe and secure with us
                                </Text>
                            </View>
                        )}

                        {/* Continue Button */}
                        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                            <Pressable
                                style={[
                                    styles.continueButton,
                                    {
                                        backgroundColor: phoneNumber.length === 10 ? colors.primary : colors.muted,
                                        opacity: isLoading ? 0.7 : 1,
                                    },
                                ]}
                                onPress={handleContinue}
                                onPressIn={handlePressIn}
                                onPressOut={handlePressOut}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <View style={styles.loadingDots}>
                                        <View style={[styles.dot, { backgroundColor: colors.white }]} />
                                        <View style={[styles.dot, { backgroundColor: colors.white }]} />
                                        <View style={[styles.dot, { backgroundColor: colors.white }]} />
                                    </View>
                                ) : (
                                    <>
                                        <Text style={[styles.continueText, { color: colors.white }]}>
                                            Continue
                                        </Text>
                                        <ArrowRight size={20} color={colors.white} />
                                    </>
                                )}
                            </Pressable>
                        </Animated.View>
                    </View>

                    {/* Terms */}
                    <View style={styles.termsContainer}>
                        <Text style={[styles.termsText, { color: colors.mutedForeground }]}>
                            By continuing, you agree to our{' '}
                            <Text style={[styles.termsLink, { color: colors.primary }]}>Terms of Service</Text>
                            {' '}and{' '}
                            <Text style={[styles.termsLink, { color: colors.primary }]}>Privacy Policy</Text>
                        </Text>
                    </View>
                </ScrollView>
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
        scrollContent: {
            flexGrow: 1,
            paddingHorizontal: 16,
        },
        imageContainer: {
            alignItems: 'center',
            marginTop: 24,
            marginBottom: 16,
            position: 'relative',
        },
        imagePlaceholder: {
            width: 120,
            height: 120,
            borderRadius: 60,
            alignItems: 'center',
            justifyContent: 'center',
        },
        imageEmoji: {
            fontSize: 56,
        },
        decorCircle1: {
            position: 'absolute',
            width: 40,
            height: 40,
            borderRadius: 20,
            top: 8,
            left: width / 2 - 100,
        },
        decorCircle2: {
            position: 'absolute',
            width: 28,
            height: 28,
            borderRadius: 14,
            bottom: 12,
            right: width / 2 - 90,
        },
        headerContainer: {
            alignItems: 'center',
            marginBottom: 28,
        },
        welcomeText: {
            fontSize: 14,
            fontWeight: '500',
            marginBottom: 2,
        },
        brandNameEnglish: {
            fontSize: 14,
            fontWeight: '600',
            letterSpacing: 1,
            marginBottom: 2,
        },
        brandName: {
            fontSize: 32,
            fontWeight: '800',
            letterSpacing: 2,
            marginBottom: 6,
        },
        subtitle: {
            fontSize: 13,
            textAlign: 'center',
        },
        formContainer: {
            marginBottom: 24,
        },
        inputLabel: {
            fontSize: 14,
            fontWeight: '600',
            marginBottom: 10,
        },
        inputWrapper: {
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: 12,
            borderWidth: 1.5,
            overflow: 'hidden',
            height: 50,
        },
        countryCodeContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            height: '100%',
            borderRightWidth: 1,
            gap: 4,
        },
        flag: {
            fontSize: 16,
        },
        countryCode: {
            fontSize: 14,
            fontWeight: '600',
        },
        phoneInput: {
            flex: 1,
            fontSize: 15,
            fontWeight: '600',
            paddingHorizontal: 12,
            letterSpacing: 1.5,
        },
        validIcon: {
            width: 24,
            height: 24,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
        },
        checkmark: {
            color: 'white',
            fontSize: 12,
            fontWeight: '700',
        },
        errorText: {
            fontSize: 12,
            marginTop: 6,
            marginLeft: 4,
        },
        helperContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 10,
            gap: 6,
        },
        helperText: {
            fontSize: 12,
        },
        continueButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            height: 48,
            borderRadius: 12,
            marginTop: 20,
            gap: 6,
        },
        continueText: {
            fontSize: 15,
            fontWeight: '700',
        },
        loadingDots: {
            flexDirection: 'row',
            gap: 5,
        },
        dot: {
            width: 6,
            height: 6,
            borderRadius: 3,
        },
        termsContainer: {
            paddingBottom: 20,
        },
        termsText: {
            fontSize: 11,
            textAlign: 'center',
            lineHeight: 16,
        },
        termsLink: {
            fontWeight: '600',
        },
    });
