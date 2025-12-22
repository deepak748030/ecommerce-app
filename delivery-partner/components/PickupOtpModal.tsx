import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Pressable,
    TextInput,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Animated,
} from 'react-native';
import { X, Package, CheckCircle } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';

interface PickupOtpModalProps {
    visible: boolean;
    onClose: () => void;
    onVerify: (otp: string) => Promise<boolean>;
    orderNumber: string;
    isLoading?: boolean;
    title?: string;
    subtitle?: string;
    buttonText?: string;
    hintText?: string;
}

export default function PickupOtpModal({
    visible,
    onClose,
    onVerify,
    orderNumber,
    isLoading = false,
    title = 'Enter Pickup OTP',
    subtitle,
    buttonText = 'Verify & Pick Up',
    hintText = 'OTP is sent to the vendor via notification',
}: PickupOtpModalProps) {
    const { colors, isDark } = useTheme();
    const styles = createStyles(colors, isDark);

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [verifying, setVerifying] = useState(false);
    const inputRefs = useRef<(TextInput | null)[]>([]);
    const slideAnim = useRef(new Animated.Value(300)).current;

    useEffect(() => {
        if (visible) {
            setOtp(['', '', '', '', '', '']);
            setError('');
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 65,
                friction: 11,
            }).start();
            // Focus first input
            setTimeout(() => inputRefs.current[0]?.focus(), 300);
        } else {
            Animated.timing(slideAnim, {
                toValue: 300,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    const handleOtpChange = (value: string, index: number) => {
        if (value.length > 1) {
            // Handle paste
            const pastedOtp = value.slice(0, 6).split('');
            const newOtp = [...otp];
            pastedOtp.forEach((char, i) => {
                if (index + i < 6) newOtp[index + i] = char;
            });
            setOtp(newOtp);
            const lastFilledIndex = Math.min(index + pastedOtp.length - 1, 5);
            inputRefs.current[lastFilledIndex]?.focus();
            return;
        }

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setError('');

        // Move to next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async () => {
        const otpString = otp.join('');
        if (otpString.length !== 6) {
            setError('Please enter 6-digit OTP');
            return;
        }

        setVerifying(true);
        setError('');

        try {
            const success = await onVerify(otpString);
            if (!success) {
                setError('Invalid OTP. Please try again.');
                setOtp(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setVerifying(false);
        }
    };

    const isOtpComplete = otp.every(digit => digit !== '');

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <Pressable style={styles.backdrop} onPress={onClose} />

                <Animated.View
                    style={[
                        styles.modalContainer,
                        { transform: [{ translateY: slideAnim }] },
                    ]}
                >
                    <View style={styles.handle} />

                    <Pressable style={styles.closeBtn} onPress={onClose}>
                        <X size={20} color={colors.mutedForeground} />
                    </Pressable>

                    <View style={styles.iconContainer}>
                        <Package size={32} color={colors.primary} />
                    </View>

                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.subtitle}>
                        {subtitle || `Ask the vendor for the OTP to confirm pickup for order ${orderNumber}`}
                    </Text>

                    <View style={styles.otpContainer}>
                        {otp.map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={ref => {
                                    inputRefs.current[index] = ref;
                                }}
                                style={[
                                    styles.otpInput,
                                    digit && styles.otpInputFilled,
                                    error && styles.otpInputError,
                                ]}
                                value={digit}
                                onChangeText={value => handleOtpChange(value, index)}
                                onKeyPress={e => handleKeyPress(e, index)}
                                keyboardType="number-pad"
                                maxLength={6}
                                selectTextOnFocus
                                editable={!verifying && !isLoading}
                            />
                        ))}
                    </View>

                    {error ? (
                        <Text style={styles.errorText}>{error}</Text>
                    ) : null}

                    <Pressable
                        style={[
                            styles.verifyBtn,
                            (!isOtpComplete || verifying || isLoading) && styles.verifyBtnDisabled,
                        ]}
                        onPress={handleVerify}
                        disabled={!isOtpComplete || verifying || isLoading}
                    >
                        {verifying || isLoading ? (
                            <ActivityIndicator color={colors.white} size="small" />
                        ) : (
                            <>
                                <CheckCircle size={20} color={colors.white} />
                                <Text style={styles.verifyBtnText}>{buttonText}</Text>
                            </>
                        )}
                    </Pressable>

                    <Text style={styles.hintText}>
                        {hintText}
                    </Text>
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const createStyles = (colors: any, isDark: boolean) =>
    StyleSheet.create({
        overlay: {
            flex: 1,
            justifyContent: 'flex-end',
        },
        backdrop: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
        modalContainer: {
            backgroundColor: colors.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
            paddingBottom: 40,
            alignItems: 'center',
        },
        handle: {
            width: 40,
            height: 4,
            backgroundColor: colors.border,
            borderRadius: 2,
            marginBottom: 20,
        },
        closeBtn: {
            position: 'absolute',
            top: 16,
            right: 16,
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.muted,
            alignItems: 'center',
            justifyContent: 'center',
        },
        iconContainer: {
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: colors.primary + '15',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
        },
        title: {
            fontSize: 20,
            fontWeight: '700',
            color: colors.foreground,
            marginBottom: 8,
        },
        subtitle: {
            fontSize: 14,
            color: colors.mutedForeground,
            textAlign: 'center',
            marginBottom: 24,
            paddingHorizontal: 20,
        },
        otpContainer: {
            flexDirection: 'row',
            gap: 10,
            marginBottom: 16,
        },
        otpInput: {
            width: 48,
            height: 56,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: colors.border,
            backgroundColor: colors.background,
            fontSize: 24,
            fontWeight: '700',
            color: colors.foreground,
            textAlign: 'center',
        },
        otpInputFilled: {
            borderColor: colors.primary,
            backgroundColor: colors.primary + '10',
        },
        otpInputError: {
            borderColor: colors.destructive,
        },
        errorText: {
            fontSize: 13,
            color: colors.destructive,
            marginBottom: 16,
        },
        verifyBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            backgroundColor: colors.primary,
            paddingVertical: 16,
            paddingHorizontal: 32,
            borderRadius: 12,
            width: '100%',
            marginBottom: 16,
        },
        verifyBtnDisabled: {
            opacity: 0.6,
        },
        verifyBtnText: {
            fontSize: 16,
            fontWeight: '700',
            color: colors.white,
        },
        hintText: {
            fontSize: 12,
            color: colors.mutedForeground,
        },
    });