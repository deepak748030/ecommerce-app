import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Bell, Globe, Trash2, Info, RefreshCw } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { authApi, getToken } from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePushNotifications } from '@/hooks/usePushNotifications';

const CACHE_KEY = 'app_cache_data';

export default function AppSettingsScreen() {
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const { expoPushToken } = usePushNotifications();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notifications, setNotifications] = useState(true);
    const [orderUpdates, setOrderUpdates] = useState(true);
    const [promotions, setPromotions] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const styles = createStyles(colors);

    // Load notification settings from server
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const token = await getToken();
            setIsLoggedIn(!!token);

            if (token) {
                const result = await authApi.getNotificationSettings();
                if (result.success && result.response) {
                    setNotifications(result.response.pushEnabled);
                    setOrderUpdates(result.response.orderUpdates);
                    setPromotions(result.response.promotions);
                }
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateSetting = async (
        setting: 'pushEnabled' | 'orderUpdates' | 'promotions',
        value: boolean
    ) => {
        // Update local state immediately
        if (setting === 'pushEnabled') setNotifications(value);
        if (setting === 'orderUpdates') setOrderUpdates(value);
        if (setting === 'promotions') setPromotions(value);

        if (!isLoggedIn) {
            Alert.alert('Login Required', 'Please login to save notification preferences.');
            return;
        }

        setSaving(true);
        try {
            const result = await authApi.updateNotificationSettings({
                [setting]: value,
            });

            if (!result.success) {
                // Revert on failure
                if (setting === 'pushEnabled') setNotifications(!value);
                if (setting === 'orderUpdates') setOrderUpdates(!value);
                if (setting === 'promotions') setPromotions(!value);
                Alert.alert('Error', result.message || 'Failed to update settings');
            }
        } catch (error) {
            console.error('Error updating settings:', error);
            // Revert on failure
            if (setting === 'pushEnabled') setNotifications(!value);
            if (setting === 'orderUpdates') setOrderUpdates(!value);
            if (setting === 'promotions') setPromotions(!value);
        } finally {
            setSaving(false);
        }
    };

    const clearCache = async () => {
        Alert.alert(
            'Clear Cache',
            'This will clear cached data. Are you sure?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    onPress: async () => {
                        try {
                            await AsyncStorage.removeItem(CACHE_KEY);
                            Alert.alert('Success', 'Cache cleared successfully');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to clear cache');
                        }
                    },
                },
            ]
        );
    };

    const deleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        Alert.alert('Contact Support', 'Please contact support to delete your account.');
                    },
                },
            ]
        );
    };

    const settingSections = [
        {
            title: 'Notifications',
            items: [
                {
                    id: 'push',
                    icon: Bell,
                    label: 'Push Notifications',
                    subtitle: expoPushToken ? 'Receive push notifications' : 'Not available on web',
                    type: 'switch',
                    value: notifications,
                    onToggle: (value: boolean) => updateSetting('pushEnabled', value),
                    disabled: !expoPushToken,
                },
                {
                    id: 'orders',
                    icon: Bell,
                    label: 'Order Updates',
                    subtitle: 'Get notified about order status changes',
                    type: 'switch',
                    value: orderUpdates,
                    onToggle: (value: boolean) => updateSetting('orderUpdates', value),
                    disabled: !notifications,
                },
                {
                    id: 'promo',
                    icon: Bell,
                    label: 'Promotions & Offers',
                    subtitle: 'Receive notifications about deals and discounts',
                    type: 'switch',
                    value: promotions,
                    onToggle: (value: boolean) => updateSetting('promotions', value),
                    disabled: !notifications,
                },
            ],
        },
        {
            title: 'General',
            items: [
                {
                    id: 'language',
                    icon: Globe,
                    label: 'Language',
                    subtitle: 'English',
                    type: 'link',
                },
                {
                    id: 'about',
                    icon: Info,
                    label: 'About App',
                    subtitle: 'Version 1.0.0',
                    type: 'link',
                },
            ],
        },
        {
            title: 'Data',
            items: [
                {
                    id: 'clear',
                    icon: RefreshCw,
                    label: 'Clear Cache',
                    subtitle: 'Free up storage space',
                    type: 'button',
                    onPress: clearCache,
                    destructive: false,
                },
                {
                    id: 'delete',
                    icon: Trash2,
                    label: 'Delete Account',
                    subtitle: 'Permanently delete your account',
                    type: 'button',
                    onPress: deleteAccount,
                    destructive: true,
                },
            ],
        },
    ];

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
                    <Pressable style={styles.backButton} onPress={() => router.back()}>
                        <ArrowLeft size={22} color={colors.foreground} />
                    </Pressable>
                    <Text style={styles.headerTitle}>App Settings</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                    <ArrowLeft size={22} color={colors.foreground} />
                </Pressable>
                <Text style={styles.headerTitle}>App Settings</Text>
                {saving && (
                    <ActivityIndicator
                        size="small"
                        color={colors.primary}
                        style={styles.savingIndicator}
                    />
                )}
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {!isLoggedIn && (
                    <View style={styles.loginPrompt}>
                        <Text style={styles.loginPromptText}>
                            Login to sync your notification preferences across devices.
                        </Text>
                    </View>
                )}

                {settingSections.map((section) => (
                    <View key={section.title} style={styles.section}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        <View style={styles.sectionCard}>
                            {section.items.map((item, index) => {
                                const IconComponent = item.icon;
                                const isDestructive = 'destructive' in item && item.destructive;
                                const isDisabled = 'disabled' in item && item.disabled;

                                return (
                                    <Pressable
                                        key={item.id}
                                        style={[
                                            styles.settingItem,
                                            index < section.items.length - 1 && styles.settingItemBorder,
                                            isDisabled && styles.settingItemDisabled,
                                        ]}
                                        onPress={() => {
                                            if (item.type === 'button' && 'onPress' in item && item.onPress) {
                                                item.onPress();
                                            }
                                        }}
                                        disabled={isDisabled}
                                    >
                                        <View style={[
                                            styles.settingIcon,
                                            isDestructive && { backgroundColor: colors.destructive + '20' }
                                        ]}>
                                            <IconComponent
                                                size={18}
                                                color={isDestructive ? colors.destructive : colors.primary}
                                            />
                                        </View>
                                        <View style={styles.settingInfo}>
                                            <Text style={[
                                                styles.settingLabel,
                                                isDestructive && { color: colors.destructive },
                                                isDisabled && styles.settingLabelDisabled,
                                            ]}>
                                                {item.label}
                                            </Text>
                                            <Text style={[
                                                styles.settingSubtitle,
                                                isDisabled && styles.settingSubtitleDisabled,
                                            ]}>
                                                {item.subtitle}
                                            </Text>
                                        </View>
                                        {item.type === 'switch' && 'value' in item && 'onToggle' in item && (
                                            <Switch
                                                value={item.value as boolean}
                                                onValueChange={item.onToggle as (value: boolean) => void}
                                                trackColor={{ false: colors.border, true: colors.primary }}
                                                thumbColor={colors.white}
                                                disabled={isDisabled}
                                            />
                                        )}
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingHorizontal: 6,
        paddingVertical: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.foreground,
        flex: 1,
    },
    savingIndicator: {
        marginRight: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginPrompt: {
        backgroundColor: colors.secondary,
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    loginPromptText: {
        fontSize: 13,
        color: colors.mutedForeground,
        textAlign: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 6,
        paddingVertical: 12,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.mutedForeground,
        marginBottom: 8,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    sectionCard: {
        backgroundColor: colors.card,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
    },
    settingItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    settingItemDisabled: {
        opacity: 0.5,
    },
    settingIcon: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    settingInfo: {
        flex: 1,
    },
    settingLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.foreground,
    },
    settingLabelDisabled: {
        color: colors.mutedForeground,
    },
    settingSubtitle: {
        fontSize: 12,
        color: colors.mutedForeground,
        marginTop: 2,
    },
    settingSubtitleDisabled: {
        color: colors.mutedForeground,
    },
});