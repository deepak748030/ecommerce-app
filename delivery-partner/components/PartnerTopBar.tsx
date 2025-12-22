import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { router } from 'expo-router';

interface PartnerTopBarProps {
    showBackButton?: boolean;
    title?: string;
}

export default function PartnerTopBar({ showBackButton = false, title }: PartnerTopBarProps) {
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();

    return (
        <View
            style={[
                styles.container,
                {
                    paddingTop: insets.top + 4,
                    backgroundColor: colors.background,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                },
            ]}
        >
            <View style={styles.topRow}>
                {showBackButton ? (
                    <View style={styles.leftSection}>
                        <Pressable
                            style={[styles.backButton, { backgroundColor: colors.secondary }]}
                            onPress={() => router.back()}
                        >
                            <ChevronLeft size={24} color={colors.foreground} />
                        </Pressable>
                        {title && <Text style={[styles.pageTitle, { color: colors.foreground }]}>{title}</Text>}
                    </View>
                ) : (
                    <View style={styles.leftSection}>
                        <Image
                            source={require('../assets/images/app-logo.png')}
                            style={styles.logoImage}
                        />
                        <View>
                            <Text style={[styles.appName, { color: colors.foreground }]}>भ ओ जन</Text>
                            <Text style={[styles.tagline, { color: colors.mutedForeground }]}>Delivery</Text>
                        </View>
                    </View>
                )}

                <View style={styles.rightSection}>
                    <Pressable style={[styles.iconButton, { backgroundColor: colors.secondary }]}>
                        <Bell size={20} color={colors.foreground} strokeWidth={2} />
                        <View style={styles.notificationDot} />
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 6,
        paddingBottom: 12,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pageTitle: {
        fontSize: 17,
        fontWeight: '700',
    },
    logoImage: {
        width: 40,
        height: 40,
        borderRadius: 10,
    },
    appName: {
        fontSize: 15,
        fontWeight: '800',
    },
    tagline: {
        fontSize: 10,
        fontWeight: '600',
        marginTop: 1,
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    notificationDot: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: '#EF4444',
    },
});
