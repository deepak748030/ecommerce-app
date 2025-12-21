import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { User, FileText, HelpCircle, Settings, LogOut, ChevronRight, Moon, Sun } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import PartnerTopBar from '@/components/partner/PartnerTopBar';

export default function PartnerAccount() {
    const { colors, isDark, toggleTheme } = useTheme();

    const menuItems = [
        { icon: User, label: 'Edit Profile', onPress: () => { } },
        { icon: FileText, label: 'Documents', onPress: () => { } },
        { icon: HelpCircle, label: 'Help & Support', onPress: () => { } },
        { icon: Settings, label: 'Settings', onPress: () => { } },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <PartnerTopBar showBackButton title="Account" />

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Profile Card */}
                <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
                        <Text style={styles.avatarText}>RS</Text>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={[styles.profileName, { color: colors.foreground }]}>Rajesh Singh</Text>
                        <Text style={[styles.profilePhone, { color: colors.mutedForeground }]}>+91 98765 43210</Text>
                    </View>
                    <View style={[styles.verifiedBadge, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.verifiedText, { color: colors.primary }]}>Verified</Text>
                    </View>
                </View>

                {/* Theme Toggle */}
                <Pressable
                    style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={toggleTheme}
                >
                    <View style={[styles.menuIcon, { backgroundColor: isDark ? '#8B5CF620' : colors.primary + '20' }]}>
                        {isDark ? <Moon size={18} color="#8B5CF6" /> : <Sun size={18} color={colors.primary} />}
                    </View>
                    <Text style={[styles.menuLabel, { color: colors.foreground }]}>
                        {isDark ? 'Dark Mode' : 'Light Mode'}
                    </Text>
                    <ChevronRight size={18} color={colors.mutedForeground} />
                </Pressable>

                {/* Menu Items */}
                {menuItems.map((item, index) => (
                    <Pressable
                        key={index}
                        style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={item.onPress}
                    >
                        <View style={[styles.menuIcon, { backgroundColor: colors.secondary }]}>
                            <item.icon size={18} color={colors.foreground} />
                        </View>
                        <Text style={[styles.menuLabel, { color: colors.foreground }]}>{item.label}</Text>
                        <ChevronRight size={18} color={colors.mutedForeground} />
                    </Pressable>
                ))}

                {/* Logout */}
                <Pressable style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[styles.menuIcon, { backgroundColor: colors.destructive + '20' }]}>
                        <LogOut size={18} color={colors.destructive} />
                    </View>
                    <Text style={[styles.menuLabel, { color: colors.destructive }]}>Logout</Text>
                    <ChevronRight size={18} color={colors.mutedForeground} />
                </Pressable>

                {/* App Version */}
                <Text style={[styles.version, { color: colors.mutedForeground }]}>SpeedDrop Partner v1.0.0</Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 6,
        paddingBottom: 100,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        marginTop: 8,
    },
    avatarCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
    },
    profileInfo: {
        flex: 1,
        marginLeft: 12,
    },
    profileName: {
        fontSize: 16,
        fontWeight: '700',
    },
    profilePhone: {
        fontSize: 12,
        marginTop: 2,
    },
    verifiedBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    verifiedText: {
        fontSize: 11,
        fontWeight: '700',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        marginTop: 10,
    },
    menuIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuLabel: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 12,
    },
    version: {
        fontSize: 11,
        textAlign: 'center',
        marginTop: 30,
    },
});
