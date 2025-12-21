import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Star, Package, ChevronRight, Settings, HelpCircle, FileText, LogOut, Moon, Sun, Bike } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { mockPartner } from '../../lib/mockData';
import { router } from 'expo-router';

export default function ProfileScreen() {
    const { colors, isDark, toggleTheme } = useTheme();
    const styles = createStyles(colors, isDark);

    const menuItems = [
        { icon: Bike, label: 'Vehicle Details', route: '/settings' },
        { icon: FileText, label: 'Documents', route: '/settings' },
        { icon: HelpCircle, label: 'Help & Support', route: '/settings' },
        { icon: Settings, label: 'Settings', route: '/settings' },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>My Profile</Text>
                <Pressable onPress={toggleTheme} style={styles.themeBtn}>
                    {isDark ? <Sun size={18} color={colors.foreground} /> : <Moon size={18} color={colors.foreground} />}
                </Pressable>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        <User size={32} color={colors.primary} />
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{mockPartner.name}</Text>
                        <Text style={styles.profilePhone}>{mockPartner.phone}</Text>
                    </View>
                    <Pressable style={styles.editBtn}>
                        <Text style={styles.editBtnText}>Edit</Text>
                    </Pressable>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <View style={[styles.statIcon, { backgroundColor: colors.statCard1 }]}>
                            <Star size={16} color={colors.primary} />
                        </View>
                        <Text style={styles.statValue}>{mockPartner.rating}</Text>
                        <Text style={styles.statLabel}>Rating</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <View style={[styles.statIcon, { backgroundColor: colors.statCard2 }]}>
                            <Package size={16} color={colors.primary} />
                        </View>
                        <Text style={styles.statValue}>{mockPartner.totalDeliveries}</Text>
                        <Text style={styles.statLabel}>Deliveries</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <View style={[styles.statIcon, { backgroundColor: colors.secondary }]}>
                            <Bike size={16} color={colors.primary} />
                        </View>
                        <Text style={styles.statValue}>{mockPartner.vehicleType}</Text>
                        <Text style={styles.statLabel}>Vehicle</Text>
                    </View>
                </View>

                {/* Vehicle Info */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>Vehicle Information</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Vehicle Number</Text>
                        <Text style={styles.infoValue}>{mockPartner.vehicleNumber}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Vehicle Type</Text>
                        <Text style={styles.infoValue}>{mockPartner.vehicleType.charAt(0).toUpperCase() + mockPartner.vehicleType.slice(1)}</Text>
                    </View>
                </View>

                {/* Menu Items */}
                <View style={styles.menuCard}>
                    {menuItems.map((item, index) => (
                        <Pressable key={index} style={styles.menuItem} onPress={() => router.push(item.route as any)}>
                            <View style={styles.menuLeft}>
                                <item.icon size={18} color={colors.foreground} />
                                <Text style={styles.menuLabel}>{item.label}</Text>
                            </View>
                            <ChevronRight size={16} color={colors.mutedForeground} />
                        </Pressable>
                    ))}
                </View>

                {/* Logout */}
                <Pressable style={styles.logoutBtn}>
                    <LogOut size={18} color={colors.destructive} />
                    <Text style={styles.logoutText}>Logout</Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 12,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.foreground,
    },
    themeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.card,
        alignItems: 'center',
        justifyContent: 'center',
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
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 14,
        marginBottom: 14,
    },
    avatarContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileInfo: {
        flex: 1,
        marginLeft: 12,
    },
    profileName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.foreground,
    },
    profilePhone: {
        fontSize: 12,
        color: colors.mutedForeground,
        marginTop: 2,
    },
    editBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 8,
    },
    editBtnText: {
        color: colors.white,
        fontSize: 12,
        fontWeight: '600',
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 14,
        marginBottom: 14,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        gap: 6,
    },
    statIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statDivider: {
        width: 1,
        backgroundColor: colors.border,
    },
    statValue: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.foreground,
    },
    statLabel: {
        fontSize: 10,
        color: colors.mutedForeground,
    },
    infoCard: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 14,
        marginBottom: 14,
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.foreground,
        marginBottom: 10,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    infoLabel: {
        fontSize: 12,
        color: colors.mutedForeground,
    },
    infoValue: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.foreground,
    },
    menuCard: {
        backgroundColor: colors.card,
        borderRadius: 12,
        marginBottom: 14,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    menuLabel: {
        fontSize: 14,
        color: colors.foreground,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 14,
    },
    logoutText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.destructive,
    },
});
