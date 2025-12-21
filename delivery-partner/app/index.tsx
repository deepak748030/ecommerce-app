import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch } from 'react-native';
import { Package, Wallet, Star, TrendingUp, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import PartnerTopBar from '@/components/partner/PartnerTopBar';
import OrderCard from '@/components/partner/OrderCard';
import { mockPartnerStats, mockDeliveryOrders, DeliveryOrder } from '@/lib/partnerMockData';
import { router } from 'expo-router';

export default function PartnerHome() {
    const { colors, isDark } = useTheme();
    const [isOnline, setIsOnline] = useState(true);
    const [orders, setOrders] = useState<DeliveryOrder[]>(mockDeliveryOrders);

    const pendingOrders = orders.filter((o) => o.status === 'pending').slice(0, 2);

    const handleAcceptOrder = (orderId: string) => {
        setOrders((prev) =>
            prev.map((o) => (o.id === orderId ? { ...o, status: 'picked' as const } : o))
        );
    };

    const stats = [
        {
            icon: Package,
            label: 'Deliveries',
            value: mockPartnerStats.todayDeliveries.toString(),
            color: colors.primary,
        },
        {
            icon: Wallet,
            label: 'Earnings',
            value: `₹${mockPartnerStats.todayEarnings}`,
            color: '#8B5CF6',
        },
        {
            icon: TrendingUp,
            label: 'Pending',
            value: mockPartnerStats.pendingOrders.toString(),
            color: colors.warning,
        },
        {
            icon: Star,
            label: 'Rating',
            value: mockPartnerStats.rating.toString(),
            color: '#EAB308',
        },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <PartnerTopBar />

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Online Toggle */}
                <View style={[styles.onlineCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View>
                        <Text style={[styles.onlineTitle, { color: colors.foreground }]}>
                            {isOnline ? "You're Online" : "You're Offline"}
                        </Text>
                        <Text style={[styles.onlineSubtitle, { color: colors.mutedForeground }]}>
                            {isOnline ? 'Accepting new orders' : 'Not receiving orders'}
                        </Text>
                    </View>
                    <Switch
                        value={isOnline}
                        onValueChange={setIsOnline}
                        trackColor={{ false: colors.muted, true: colors.primary + '60' }}
                        thumbColor={isOnline ? colors.primary : colors.mutedForeground}
                    />
                </View>

                {/* Stats Grid */}
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Today's Stats</Text>
                <View style={styles.statsGrid}>
                    {stats.map((stat, index) => (
                        <View
                            key={index}
                            style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                        >
                            <View style={[styles.statIconCircle, { backgroundColor: stat.color + '20' }]}>
                                <stat.icon size={18} color={stat.color} />
                            </View>
                            <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}</Text>
                            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
                        </View>
                    ))}
                </View>

                {/* New Orders */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>New Orders</Text>
                    <Pressable style={styles.viewAllButton} onPress={() => router.push('/partner/orders' as any)}>
                        <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
                        <ChevronRight size={16} color={colors.primary} />
                    </Pressable>
                </View>

                {pendingOrders.length > 0 ? (
                    pendingOrders.map((order) => (
                        <OrderCard key={order.id} order={order} onAccept={() => handleAcceptOrder(order.id)} />
                    ))
                ) : (
                    <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Package size={40} color={colors.mutedForeground} />
                        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No new orders</Text>
                    </View>
                )}
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
    onlineCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        marginTop: 8,
    },
    onlineTitle: {
        fontSize: 15,
        fontWeight: '700',
    },
    onlineSubtitle: {
        fontSize: 11,
        marginTop: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        marginTop: 16,
        marginBottom: 10,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 10,
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    viewAllText: {
        fontSize: 12,
        fontWeight: '600',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    statCard: {
        width: '48%',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
    },
    statIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
    },
    statLabel: {
        fontSize: 11,
        marginTop: 2,
    },
    emptyCard: {
        padding: 30,
        borderRadius: 14,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 13,
        marginTop: 10,
    },
});
