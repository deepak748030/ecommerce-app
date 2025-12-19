import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Bell, Globe, Lock, Smartphone, Trash2, Info } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

export default function AppSettingsScreen() {
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const [notifications, setNotifications] = useState(true);
    const [orderUpdates, setOrderUpdates] = useState(true);
    const [promotions, setPromotions] = useState(false);
    const [biometric, setBiometric] = useState(false);

    const styles = createStyles(colors);

    const settingSections = [
        {
            title: 'Notifications',
            items: [
                {
                    id: 'push',
                    icon: Bell,
                    label: 'Push Notifications',
                    subtitle: 'Receive push notifications',
                    type: 'switch',
                    value: notifications,
                    onToggle: setNotifications,
                },
                {
                    id: 'orders',
                    icon: Smartphone,
                    label: 'Order Updates',
                    subtitle: 'Get notified about order status',
                    type: 'switch',
                    value: orderUpdates,
                    onToggle: setOrderUpdates,
                },
                {
                    id: 'promo',
                    icon: Bell,
                    label: 'Promotions & Offers',
                    subtitle: 'Receive promotional notifications',
                    type: 'switch',
                    value: promotions,
                    onToggle: setPromotions,
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
                    icon: Trash2,
                    label: 'Clear Cache',
                    subtitle: 'Free up storage space',
                    type: 'button',
                    destructive: false,
                },
                {
                    id: 'delete',
                    icon: Trash2,
                    label: 'Delete Account',
                    subtitle: 'Permanently delete your account',
                    type: 'button',
                    destructive: true,
                },
            ],
        },
    ];

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                    <ArrowLeft size={22} color={colors.foreground} />
                </Pressable>
                <Text style={styles.headerTitle}>App Settings</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {settingSections.map((section) => (
                    <View key={section.title} style={styles.section}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        <View style={styles.sectionCard}>
                            {section.items.map((item, index) => {
                                const IconComponent = item.icon;
                                const isDestructive = 'destructive' in item && item.destructive;
                                return (
                                    <Pressable
                                        key={item.id}
                                        style={[
                                            styles.settingItem,
                                            index < section.items.length - 1 && styles.settingItemBorder,
                                        ]}
                                    >
                                        <View style={[styles.settingIcon, isDestructive && { backgroundColor: colors.destructive + '20' }]}>
                                            <IconComponent size={18} color={isDestructive ? colors.destructive : colors.primary} />
                                        </View>
                                        <View style={styles.settingInfo}>
                                            <Text style={[styles.settingLabel, isDestructive && { color: colors.destructive }]}>
                                                {item.label}
                                            </Text>
                                            <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                                        </View>
                                        {item.type === 'switch' && 'value' in item && 'onToggle' in item && (
                                            <Switch
                                                value={item.value as boolean}
                                                onValueChange={item.onToggle as (value: boolean) => void}
                                                trackColor={{ false: colors.border, true: colors.primary }}
                                                thumbColor={colors.white}
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
    settingSubtitle: {
        fontSize: 12,
        color: colors.mutedForeground,
        marginTop: 2,
    },
});