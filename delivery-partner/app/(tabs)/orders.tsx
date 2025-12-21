import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Package, MapPin, Clock, CheckCircle, XCircle } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { mockActiveDeliveries, mockPendingDeliveries, mockCompletedDeliveries, Delivery } from '../../lib/mockData';
import { router } from 'expo-router';

type TabType = 'active' | 'pending' | 'completed';

export default function OrdersScreen() {
    const { colors, isDark } = useTheme();
    const [activeTab, setActiveTab] = useState<TabType>('active');

    const styles = createStyles(colors, isDark);

    const tabs: { key: TabType; label: string; count: number }[] = [
        { key: 'active', label: 'Active', count: mockActiveDeliveries.length },
        { key: 'pending', label: 'Pending', count: mockPendingDeliveries.length },
        { key: 'completed', label: 'Completed', count: mockCompletedDeliveries.length },
    ];

    const getDeliveries = (): Delivery[] => {
        switch (activeTab) {
            case 'active':
                return mockActiveDeliveries;
            case 'pending':
                return mockPendingDeliveries;
            case 'completed':
                return mockCompletedDeliveries;
            default:
                return [];
        }
    };

    const deliveries = getDeliveries();

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>My Orders</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                {tabs.map((tab) => (
                    <Pressable
                        key={tab.key}
                        style={[styles.tab, activeTab === tab.key && styles.activeTab]}
                        onPress={() => setActiveTab(tab.key)}
                    >
                        <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                            {tab.label}
                        </Text>
                        <View style={[styles.tabBadge, activeTab === tab.key && styles.activeTabBadge]}>
                            <Text style={[styles.tabBadgeText, activeTab === tab.key && styles.activeTabBadgeText]}>
                                {tab.count}
                            </Text>
                        </View>
                    </Pressable>
                ))}
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {deliveries.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Package size={48} color={colors.mutedForeground} />
                        <Text style={styles.emptyText}>No orders in this category</Text>
                    </View>
                ) : (
                    deliveries.map((delivery) => (
                        <Pressable
                            key={delivery.id}
                            style={styles.orderCard}
                            onPress={() => router.push({ pathname: '/delivery/[id]' as any, params: { id: delivery.id } })}
                        >
                            <View style={styles.orderHeader}>
                                <View style={styles.orderIdRow}>
                                    <Text style={styles.orderId}>#{delivery.orderId}</Text>
                                    {delivery.status === 'delivered' && (
                                        <CheckCircle size={16} color={colors.success} />
                                    )}
                                    {delivery.status === 'cancelled' && (
                                        <XCircle size={16} color={colors.destructive} />
                                    )}
                                </View>
                                <Text style={styles.orderAmount}>₹{delivery.amount + delivery.tip}</Text>
                            </View>

                            <View style={styles.addressSection}>
                                <View style={styles.addressRow}>
                                    <View style={[styles.dot, { backgroundColor: colors.success }]} />
                                    <Text style={styles.addressText} numberOfLines={1}>{delivery.pickupAddress}</Text>
                                </View>
                                <View style={styles.addressLine} />
                                <View style={styles.addressRow}>
                                    <View style={[styles.dot, { backgroundColor: colors.destructive }]} />
                                    <Text style={styles.addressText} numberOfLines={1}>{delivery.deliveryAddress}</Text>
                                </View>
                            </View>

                            <View style={styles.orderFooter}>
                                <View style={styles.infoRow}>
                                    <Clock size={12} color={colors.mutedForeground} />
                                    <Text style={styles.infoText}>{delivery.estimatedTime}</Text>
                                </View>
                                <Text style={styles.distanceText}>{delivery.distance}</Text>
                            </View>
                        </Pressable>
                    ))
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
        paddingHorizontal: 6,
        paddingVertical: 12,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.foreground,
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 6,
        gap: 8,
        marginBottom: 12,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: colors.card,
    },
    activeTab: {
        backgroundColor: colors.primary,
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.mutedForeground,
    },
    activeTabText: {
        color: colors.white,
    },
    tabBadge: {
        backgroundColor: colors.muted,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    activeTabBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    tabBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.mutedForeground,
    },
    activeTabBadgeText: {
        color: colors.white,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 6,
        paddingBottom: 100,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        gap: 12,
    },
    emptyText: {
        fontSize: 14,
        color: colors.mutedForeground,
    },
    orderCard: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    orderIdRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    orderId: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.foreground,
    },
    orderAmount: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.primary,
    },
    addressSection: {
        marginBottom: 12,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    addressLine: {
        width: 1,
        height: 16,
        backgroundColor: colors.border,
        marginLeft: 3.5,
        marginVertical: 4,
    },
    addressText: {
        fontSize: 12,
        color: colors.foreground,
        flex: 1,
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
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
    distanceText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.mutedForeground,
    },
});
