import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Switch, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Package, MapPin, Clock, IndianRupee, ChevronRight, Bell, Moon, Sun } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { mockPartner, mockActiveDeliveries, mockPendingDeliveries, mockEarnings } from '../../lib/mockData';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
    const { colors, isDark, toggleTheme } = useTheme();
    const [isOnline, setIsOnline] = useState(mockPartner.isOnline);

    const styles = createStyles(colors, isDark);

    const activeCount = mockActiveDeliveries.length;
    const pendingCount = mockPendingDeliveries.length;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.logoContainer}>
                        <Package size={24} color={colors.primary} />
                    </View>
                    <View>
                        <Text style={styles.greeting}>Hi, {mockPartner.name.split(' ')[0]}!</Text>
                        <Text style={styles.subGreeting}>SwiftDrop Partner</Text>
                    </View>
                </View>
                <View style={styles.headerRight}>
                    <Pressable onPress={toggleTheme} style={styles.iconBtn}>
                        {isDark ? <Sun size={20} color={colors.foreground} /> : <Moon size={20} color={colors.foreground} />}
                    </Pressable>
                    <Pressable style={styles.iconBtn}>
                        <Bell size={20} color={colors.foreground} />
                    </Pressable>
                </View>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Online Status Card */}
                <View style={styles.statusCard}>
                    <View style={styles.statusLeft}>
                        <View style={[styles.statusDot, isOnline && styles.statusDotOnline]} />
                        <Text style={styles.statusText}>{isOnline ? 'You are Online' : 'You are Offline'}</Text>
                    </View>
                    <Switch
                        value={isOnline}
                        onValueChange={setIsOnline}
                        trackColor={{ false: colors.muted, true: colors.primary }}
                        thumbColor={colors.white}
                    />
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={[styles.statCard, { backgroundColor: colors.statCard1 }]}>
                        <IndianRupee size={18} color={colors.primary} />
                        <Text style={styles.statValue}>₹{mockEarnings.today}</Text>
                        <Text style={styles.statLabel}>Today's Earnings</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: colors.statCard2 }]}>
                        <Package size={18} color={colors.primary} />
                        <Text style={styles.statValue}>{mockEarnings.totalDeliveries}</Text>
                        <Text style={styles.statLabel}>Total Deliveries</Text>
                    </View>
                </View>

                {/* Active Deliveries */}
                {activeCount > 0 && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Active Deliveries</Text>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{activeCount}</Text>
                            </View>
                        </View>
                        {mockActiveDeliveries.map((delivery) => (
                            <Pressable
                                key={delivery.id}
                                style={styles.deliveryCard}
                                onPress={() => router.push({ pathname: '/delivery/[id]' as any, params: { id: delivery.id } })}
                            >
                                <View style={styles.deliveryHeader}>
                                    <Text style={styles.orderId}>#{delivery.orderId}</Text>
                                    <View style={[styles.statusBadge, delivery.status === 'accepted' ? styles.acceptedBadge : styles.pendingBadge]}>
                                        <Text style={styles.statusBadgeText}>{delivery.status.replace('_', ' ').toUpperCase()}</Text>
                                    </View>
                                </View>
                                <View style={styles.addressRow}>
                                    <MapPin size={14} color={colors.success} />
                                    <Text style={styles.addressText} numberOfLines={1}>{delivery.pickupAddress}</Text>
                                </View>
                                <View style={styles.addressRow}>
                                    <MapPin size={14} color={colors.destructive} />
                                    <Text style={styles.addressText} numberOfLines={1}>{delivery.deliveryAddress}</Text>
                                </View>
                                <View style={styles.deliveryFooter}>
                                    <View style={styles.infoRow}>
                                        <Clock size={12} color={colors.mutedForeground} />
                                        <Text style={styles.infoText}>{delivery.estimatedTime}</Text>
                                    </View>
                                    <Text style={styles.amountText}>₹{delivery.amount + delivery.tip}</Text>
                                </View>
                            </Pressable>
                        ))}
                    </>
                )}

                {/* New Orders Available */}
                {pendingCount > 0 && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>New Orders Available</Text>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{pendingCount}</Text>
                            </View>
                        </View>
                        {mockPendingDeliveries.slice(0, 2).map((delivery) => (
                            <Pressable
                                key={delivery.id}
                                style={styles.deliveryCard}
                                onPress={() => router.push({ pathname: '/delivery/[id]' as any, params: { id: delivery.id } })}
                            >
                                <View style={styles.deliveryHeader}>
                                    <Text style={styles.orderId}>#{delivery.orderId}</Text>
                                    <Text style={styles.distanceText}>{delivery.distance}</Text>
                                </View>
                                <View style={styles.addressRow}>
                                    <MapPin size={14} color={colors.success} />
                                    <Text style={styles.addressText} numberOfLines={1}>{delivery.pickupAddress}</Text>
                                </View>
                                <View style={styles.addressRow}>
                                    <MapPin size={14} color={colors.destructive} />
                                    <Text style={styles.addressText} numberOfLines={1}>{delivery.deliveryAddress}</Text>
                                </View>
                                <View style={styles.deliveryFooter}>
                                    <View style={styles.acceptBtn}>
                                        <Text style={styles.acceptBtnText}>Accept Order</Text>
                                    </View>
                                    <Text style={styles.amountText}>₹{delivery.amount + delivery.tip}</Text>
                                </View>
                            </Pressable>
                        ))}
                    </>
                )}
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
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    logoContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    greeting: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.foreground,
    },
    subGreeting: {
        fontSize: 12,
        color: colors.mutedForeground,
    },
    headerRight: {
        flexDirection: 'row',
        gap: 8,
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
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
    statusCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.card,
        padding: 14,
        borderRadius: 12,
        marginBottom: 14,
    },
    statusLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.destructive,
    },
    statusDotOnline: {
        backgroundColor: colors.success,
    },
    statusText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.foreground,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 18,
    },
    statCard: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        gap: 6,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.foreground,
    },
    statLabel: {
        fontSize: 11,
        color: colors.mutedForeground,
        fontWeight: '500',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.foreground,
    },
    badge: {
        backgroundColor: colors.primary,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    badgeText: {
        color: colors.white,
        fontSize: 11,
        fontWeight: '700',
    },
    deliveryCard: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
    },
    deliveryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    orderId: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.foreground,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    acceptedBadge: {
        backgroundColor: colors.success + '20',
    },
    pendingBadge: {
        backgroundColor: colors.warning + '20',
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.foreground,
    },
    distanceText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.mutedForeground,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    addressText: {
        fontSize: 12,
        color: colors.foreground,
        flex: 1,
    },
    deliveryFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    infoText: {
        fontSize: 11,
        color: colors.mutedForeground,
    },
    amountText: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.primary,
    },
    acceptBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 8,
    },
    acceptBtnText: {
        color: colors.white,
        fontSize: 12,
        fontWeight: '700',
    },
});
