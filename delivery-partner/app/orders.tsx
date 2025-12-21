import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import PartnerTopBar from '@/components/partner/PartnerTopBar';
import OrderCard from '@/components/partner/OrderCard';
import { mockDeliveryOrders, DeliveryOrder } from '@/lib/partnerMockData';

type FilterType = 'all' | 'pending' | 'active' | 'completed';

export default function PartnerOrders() {
    const { colors } = useTheme();
    const [filter, setFilter] = useState<FilterType>('all');
    const [orders, setOrders] = useState<DeliveryOrder[]>(mockDeliveryOrders);

    const filters: { key: FilterType; label: string }[] = [
        { key: 'all', label: 'All' },
        { key: 'pending', label: 'Pending' },
        { key: 'active', label: 'Active' },
        { key: 'completed', label: 'Completed' },
    ];

    const filteredOrders = orders.filter((order) => {
        if (filter === 'all') return true;
        if (filter === 'pending') return order.status === 'pending';
        if (filter === 'active') return order.status === 'picked' || order.status === 'delivering';
        if (filter === 'completed') return order.status === 'delivered';
        return true;
    });

    const handlePickup = (orderId: string) => {
        setOrders((prev) =>
            prev.map((o) => (o.id === orderId ? { ...o, status: 'picked' as const } : o))
        );
    };

    const handleDeliver = (orderId: string) => {
        setOrders((prev) =>
            prev.map((o) => (o.id === orderId ? { ...o, status: 'delivered' as const } : o))
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <PartnerTopBar showBackButton title="Orders" />

            {/* Filters */}
            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    {filters.map((f) => (
                        <Pressable
                            key={f.key}
                            style={[
                                styles.filterButton,
                                {
                                    backgroundColor: filter === f.key ? colors.primary : colors.card,
                                    borderColor: filter === f.key ? colors.primary : colors.border,
                                },
                            ]}
                            onPress={() => setFilter(f.key)}
                        >
                            <Text
                                style={[
                                    styles.filterText,
                                    { color: filter === f.key ? '#FFFFFF' : colors.foreground },
                                ]}
                            >
                                {f.label}
                            </Text>
                        </Pressable>
                    ))}
                </ScrollView>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {filteredOrders.map((order) => (
                    <OrderCard
                        key={order.id}
                        order={order}
                        onPickup={order.status === 'pending' ? () => handlePickup(order.id) : undefined}
                        onDeliver={order.status === 'picked' ? () => handleDeliver(order.id) : undefined}
                    />
                ))}

                {filteredOrders.length === 0 && (
                    <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No orders found</Text>
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
    filterContainer: {
        paddingHorizontal: 6,
        paddingVertical: 10,
    },
    filterScroll: {
        gap: 8,
    },
    filterButton: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    filterText: {
        fontSize: 12,
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 6,
        paddingBottom: 100,
    },
    emptyCard: {
        padding: 40,
        borderRadius: 14,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 13,
    },
});
