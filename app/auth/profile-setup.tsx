import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    Animated,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Mail, MapPin, Camera, Check, Sparkles } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileSetupScreen() {
    const { colors, isDark } = useTheme();
    const { phone } = useLocalSearchParams<{ phone: string }>();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [avatar, setAvatar] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

    const buttonScale = useRef(new Animated.Value(1)).current;

    const styles = createStyles(colors, isDark);

    const validateEmail = (email: string) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setAvatar(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        const newErrors: { name?: string; email?: string } = {};

        if (!name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (email && !validateEmail(email)) {
            newErrors.email = 'Please enter a valid email';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsLoading(true);

        // Save user profile
        const userProfile = {
            phone,
            name: name.trim(),
            email: email.trim(),
            address: address.trim(),
            avatar,
            createdAt: new Date().toISOString(),
        };

        await AsyncStorage.setItem('user_profile', JSON.stringify(userProfile));
        await AsyncStorage.setItem('user_phone', phone || '');

        setTimeout(() => {
            setIsLoading(false);
            router.replace('/(tabs)');
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

    const isFormValid = name.trim().length > 0;

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
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.headerContainer}>
                        <View style={[styles.iconBadge, { backgroundColor: colors.primary + '20' }]}>
                            <Sparkles size={24} color={colors.primary} />
                        </View>
                        <Text style={[styles.title, { color: colors.foreground }]}>
                            Complete Your Profile
                        </Text>
                        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                            Help us personalize your experience
                        </Text>
                    </View>

                    {/* Avatar Section */}
                    <Pressable style={styles.avatarContainer} onPress={handlePickImage}>
                        <View
                            style={[
                                styles.avatarWrapper,
                                { backgroundColor: colors.card, borderColor: colors.primary },
                            ]}
                        >
                            {avatar ? (
                                <Image source={{ uri: avatar }} style={styles.avatarImage} />
                            ) : (
                                <User size={40} color={colors.mutedForeground} />
                            )}
                        </View>
                        <View style={[styles.cameraButton, { backgroundColor: colors.primary }]}>
                            <Camera size={16} color={colors.white} />
                        </View>
                    </Pressable>
                    <Text style={[styles.avatarHint, { color: colors.mutedForeground }]}>
                        Tap to add photo
                    </Text>

                    {/* Form */}
                    <View style={styles.formContainer}>
                        {/* Name Input */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.foreground }]}>
                                Full Name <Text style={{ color: colors.destructive }}>*</Text>
                            </Text>
                            <View
                                style={[
                                    styles.inputWrapper,
                                    {
                                        backgroundColor: colors.card,
                                        borderColor: errors.name ? colors.destructive : colors.border,
                                    },
                                ]}
                            >
                                <User size={20} color={colors.mutedForeground} />
                                <TextInput
                                    style={[styles.input, { color: colors.foreground }]}
                                    placeholder="Enter your full name"
                                    placeholderTextColor={colors.mutedForeground + '80'}
                                    value={name}
                                    onChangeText={(text) => {
                                        setName(text);
                                        setErrors({ ...errors, name: undefined });
                                    }}
                                    autoCapitalize="words"
                                />
                            </View>
                            {errors.name && (
                                <Text style={[styles.errorText, { color: colors.destructive }]}>{errors.name}</Text>
                            )}
                        </View>

                        {/* Email Input */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.foreground }]}>
                                Email Address
                            </Text>
                            <View
                                style={[
                                    styles.inputWrapper,
                                    {
                                        backgroundColor: colors.card,
                                        borderColor: errors.email ? colors.destructive : colors.border,
                                    },
                                ]}
                            >
                                <Mail size={20} color={colors.mutedForeground} />
                                <TextInput
                                    style={[styles.input, { color: colors.foreground }]}
                                    placeholder="Enter your email (optional)"
                                    placeholderTextColor={colors.mutedForeground + '80'}
                                    value={email}
                                    onChangeText={(text) => {
                                        setEmail(text);
                                        setErrors({ ...errors, email: undefined });
                                    }}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                            {errors.email && (
                                <Text style={[styles.errorText, { color: colors.destructive }]}>{errors.email}</Text>
                            )}
                        </View>

                        {/* Address Input */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.foreground }]}>
                                Delivery Address
                            </Text>
                            <View
                                style={[
                                    styles.inputWrapper,
                                    styles.addressInput,
                                    { backgroundColor: colors.card, borderColor: colors.border },
                                ]}
                            >
                                <MapPin size={20} color={colors.mutedForeground} style={styles.addressIcon} />
                                <TextInput
                                    style={[styles.input, styles.addressTextInput, { color: colors.foreground }]}
                                    placeholder="Enter your delivery address (optional)"
                                    placeholderTextColor={colors.mutedForeground + '80'}
                                    value={address}
                                    onChangeText={setAddress}
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Submit Button */}
                    <Animated.View style={[styles.buttonContainer, { transform: [{ scale: buttonScale }] }]}>
                        <Pressable
                            style={[
                                styles.submitButton,
                                {
                                    backgroundColor: isFormValid ? colors.primary : colors.muted,
                                    opacity: isLoading ? 0.7 : 1,
                                },
                            ]}
                            onPress={handleSubmit}
                            onPressIn={handlePressIn}
                            onPressOut={handlePressOut}
                            disabled={!isFormValid || isLoading}
                        >
                            {isLoading ? (
                                <View style={styles.loadingDots}>
                                    <View style={[styles.dot, { backgroundColor: colors.white }]} />
                                    <View style={[styles.dot, { backgroundColor: colors.white }]} />
                                    <View style={[styles.dot, { backgroundColor: colors.white }]} />
                                </View>
                            ) : (
                                <>
                                    <Check size={20} color={colors.white} />
                                    <Text style={[styles.submitText, { color: colors.white }]}>
                                        Complete Setup
                                    </Text>
                                </>
                            )}
                        </Pressable>
                    </Animated.View>

                    {/* Skip */}
                    <Pressable
                        style={styles.skipButton}
                        onPress={() => {
                            AsyncStorage.setItem('user_phone', phone || '');
                            router.replace('/(tabs)');
                        }}
                    >
                        <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Skip for now</Text>
                    </Pressable>
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
            paddingTop: 24,
            paddingBottom: 32,
        },
        headerContainer: {
            alignItems: 'center',
            marginBottom: 32,
        },
        iconBadge: {
            width: 56,
            height: 56,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
        },
        title: {
            fontSize: 26,
            fontWeight: '800',
            marginBottom: 8,
        },
        subtitle: {
            fontSize: 15,
            textAlign: 'center',
        },
        avatarContainer: {
            alignSelf: 'center',
            position: 'relative',
            marginBottom: 8,
        },
        avatarWrapper: {
            width: 100,
            height: 100,
            borderRadius: 50,
            borderWidth: 3,
            borderStyle: 'dashed',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
        },
        avatarImage: {
            width: '100%',
            height: '100%',
        },
        cameraButton: {
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 32,
            height: 32,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
        },
        avatarHint: {
            textAlign: 'center',
            fontSize: 13,
            marginBottom: 32,
        },
        formContainer: {
            gap: 20,
            marginBottom: 32,
        },
        inputGroup: {
            gap: 8,
        },
        inputLabel: {
            fontSize: 14,
            fontWeight: '600',
        },
        inputWrapper: {
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: 14,
            borderWidth: 1.5,
            paddingHorizontal: 16,
            height: 54,
            gap: 12,
        },
        input: {
            flex: 1,
            fontSize: 16,
        },
        addressInput: {
            height: 100,
            alignItems: 'flex-start',
            paddingTop: 16,
        },
        addressIcon: {
            marginTop: 2,
        },
        addressTextInput: {
            height: '100%',
        },
        errorText: {
            fontSize: 12,
            marginLeft: 4,
        },
        buttonContainer: {
            marginBottom: 16,
        },
        submitButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            height: 56,
            borderRadius: 16,
            gap: 8,
        },
        submitText: {
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
        skipButton: {
            alignItems: 'center',
            paddingVertical: 12,
        },
        skipText: {
            fontSize: 15,
            fontWeight: '500',
        },
    });
