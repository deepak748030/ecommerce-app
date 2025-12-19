import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Package, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

const mockOrders = [
    {
        id: '1',
        orderNumber: 'ORD-2024-001',
        date: 'Dec 15, 2024',
        status: 'Delivered',
        total: 2499,
        items: 3,
        image: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=300',
    },
    {
        id: '2',
        orderNumber: 'ORD-2024-002',
        date: 'Dec 12, 2024',
        status: 'In Transit',
        total: 1299,
        items: 2,
        image: 'https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=300',
    },
    {
        id: '3',
        orderNumber: 'ORD-2024-003',
        date: 'Dec 10, 2024',
        status: 'Processing',
        total: 899,
        items: 1,
        image: 'https://images.pexels.com/photos/3780681/pexels-photo-3780681.jpeg?auto=compress&cs=tinysrgb&w=300',
    },
];

export default function MyOrdersScreen() {
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();

    const styles = createStyles(colors);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Delivered': return colors.success;
            case 'In Transit': return colors.warning;
            case 'Processing': return colors.primary;
            case 'Cancelled': return colors.destructive;
            default: return colors.mutedForeground;
        }
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                    <ArrowLeft size={22} color={colors.foreground} />
                </Pressable>
                <Text style={styles.headerTitle}>My Orders</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {mockOrders.map((order) => (
                    <Pressable
                        key={order.id}
                        style={styles.orderCard}
                        onPress={() => router.push(`/order/${order.id}` as any)}
                    >
                        <Image source={{ uri: order.image }} style={styles.orderImage} />
                        <View style={styles.orderInfo}>
                            <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                            <Text style={styles.orderDate}>{order.date}</Text>
                            <View style={styles.orderMeta}>
                                <Text style={styles.orderItems}>{order.items} items</Text>
                                <Text style={styles.orderTotal}>₹{order.total.toLocaleString()}</Text>
                            </View>
                        </View>
                        <View style={styles.orderRight}>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                                <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>{order.status}</Text>
                            </View>
                            <ChevronRight size={18} color={colors.mutedForeground} />
                        </View>
                    </Pressable>
                ))}

                {mockOrders.length === 0 && (
                    <View style={styles.emptyState}>
                        <Package size={60} color={colors.mutedForeground} />
                        <Text style={styles.emptyTitle}>No orders yet</Text>
                        <Text style={styles.emptySubtitle}>Start shopping to see your orders here</Text>
                    </View>
                )}
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
    orderCard: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    orderImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
    },
    orderInfo: {
        flex: 1,
        marginLeft: 12,
    },
    orderNumber: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.foreground,
        marginBottom: 2,
    },
    orderDate: {
        fontSize: 12,
        color: colors.mutedForeground,
        marginBottom: 4,
    },
    orderMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    orderItems: {
        fontSize: 12,
        color: colors.mutedForeground,
    },
    orderTotal: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.primary,
    },
    orderRight: {
        alignItems: 'flex-end',
        gap: 8,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.foreground,
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: colors.mutedForeground,
        marginTop: 4,
    },
});