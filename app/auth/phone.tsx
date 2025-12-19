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

        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            router.push({
                pathname: '/auth/otp' as any,
                params: { phone: `${countryCode}${phoneNumber}` },
            });
        }, 1000);
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
                        <View style={[styles.imagePlaceholder, { backgroundColor: colors.primary + '20' }]}>
                            <Text style={styles.imageEmoji}>🥛</Text>
                        </View>
                        <View style={[styles.decorCircle1, { backgroundColor: colors.primary + '15' }]} />
                        <View style={[styles.decorCircle2, { backgroundColor: colors.success + '15' }]} />
                    </View>

                    {/* Welcome Text */}
                    <View style={styles.headerContainer}>
                        <Text style={[styles.welcomeText, { color: colors.mutedForeground }]}>Welcome to</Text>
                        <Text style={[styles.brandName, { color: colors.foreground }]}>Milkey</Text>
                        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                            Fresh dairy delivered to your doorstep
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
            paddingHorizontal: 24,
        },
        imageContainer: {
            alignItems: 'center',
            marginTop: 40,
            marginBottom: 24,
            position: 'relative',
        },
        imagePlaceholder: {
            width: 160,
            height: 160,
            borderRadius: 80,
            alignItems: 'center',
            justifyContent: 'center',
        },
        imageEmoji: {
            fontSize: 80,
        },
        decorCircle1: {
            position: 'absolute',
            width: 60,
            height: 60,
            borderRadius: 30,
            top: 10,
            left: width / 2 - 120,
        },
        decorCircle2: {
            position: 'absolute',
            width: 40,
            height: 40,
            borderRadius: 20,
            bottom: 20,
            right: width / 2 - 110,
        },
        headerContainer: {
            alignItems: 'center',
            marginBottom: 40,
        },
        welcomeText: {
            fontSize: 16,
            fontWeight: '500',
            marginBottom: 4,
        },
        brandName: {
            fontSize: 36,
            fontWeight: '800',
            letterSpacing: 1,
            marginBottom: 8,
        },
        subtitle: {
            fontSize: 14,
            textAlign: 'center',
        },
        formContainer: {
            marginBottom: 32,
        },
        inputLabel: {
            fontSize: 16,
            fontWeight: '600',
            marginBottom: 12,
        },
        inputWrapper: {
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: 16,
            borderWidth: 2,
            overflow: 'hidden',
            height: 60,
        },
        countryCodeContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            height: '100%',
            borderRightWidth: 1,
            gap: 6,
        },
        flag: {
            fontSize: 20,
        },
        countryCode: {
            fontSize: 16,
            fontWeight: '600',
        },
        phoneInput: {
            flex: 1,
            fontSize: 18,
            fontWeight: '600',
            paddingHorizontal: 16,
            letterSpacing: 2,
        },
        validIcon: {
            width: 28,
            height: 28,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 16,
        },
        checkmark: {
            color: 'white',
            fontSize: 14,
            fontWeight: '700',
        },
        errorText: {
            fontSize: 13,
            marginTop: 8,
            marginLeft: 4,
        },
        helperContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 12,
            gap: 6,
        },
        helperText: {
            fontSize: 13,
        },
        continueButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            height: 56,
            borderRadius: 16,
            marginTop: 24,
            gap: 8,
        },
        continueText: {
            fontSize: 16,
            fontWeight: '700',
        },
        loadingDots: {
            flexDirection: 'row',
            gap: 6,
        },
        dot: {
            width: 8,
            height: 8,
            borderRadius: 4,
        },
        termsContainer: {
            paddingBottom: 24,
        },
        termsText: {
            fontSize: 12,
            textAlign: 'center',
            lineHeight: 18,
        },
        termsLink: {
            fontWeight: '600',
        },
    });
