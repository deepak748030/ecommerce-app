import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Package, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { ordersApi, Order, getImageUrl } from '@/lib/api';
import { OrderCardSkeleton } from '@/components/Skeleton';

export default function MyOrdersScreen() {
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchOrders = useCallback(async () => {
        try {
            setError(null);
            const result = await ordersApi.getAll();
            if (result.success && result.response) {
                setOrders(result.response.data);
            } else {
                setError(result.message || 'Failed to fetch orders');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchOrders();
    }, [fetchOrders]);

    const styles = createStyles(colors);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered': return colors.success;
            case 'shipped':
            case 'out_for_delivery': return colors.warning;
            case 'confirmed':
            case 'processing': return colors.primary;
            case 'cancelled': return colors.destructive;
            default: return colors.mutedForeground;
        }
    };

    const formatStatus = (status: string) => {
        return status.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const renderOrder = ({ item }: { item: Order }) => (
        <Pressable
            style={styles.orderCard}
            onPress={() => router.push(`/order/${item._id}` as any)}
        >
            <Image
                source={{ uri: getImageUrl(item.items[0]?.image) }}
                style={styles.orderImage}
            />
            <View style={styles.orderInfo}>
                <Text style={styles.orderNumber}>{item.orderNumber}</Text>
                <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
                <View style={styles.orderMeta}>
                    <Text style={styles.orderItems}>{item.items.length} items</Text>
                    <Text style={styles.orderTotal}>₹{item.total.toLocaleString()}</Text>
                </View>
            </View>
            <View style={styles.orderRight}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {formatStatus(item.status)}
                    </Text>
                </View>
                <ChevronRight size={18} color={colors.mutedForeground} />
            </View>
        </Pressable>
    );

    const renderSkeletons = () => (
        <View style={styles.skeletonContainer}>
            {[1, 2, 3, 4, 5].map((i) => (
                <OrderCardSkeleton key={i} />
            ))}
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                    <ArrowLeft size={22} color={colors.foreground} />
                </Pressable>
                <Text style={styles.headerTitle}>My Orders</Text>
            </View>

            {loading ? (
                <View style={styles.scrollContent}>
                    {renderSkeletons()}
                </View>
            ) : (
                <FlatList
                    data={orders}
                    renderItem={renderOrder}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListHeaderComponent={error ? (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>{error}</Text>
                            <Pressable style={styles.retryButton} onPress={fetchOrders}>
                                <Text style={styles.retryButtonText}>Retry</Text>
                            </Pressable>
                        </View>
                    ) : null}
                    ListEmptyComponent={!error ? (
                        <View style={styles.emptyState}>
                            <Package size={60} color={colors.mutedForeground} />
                            <Text style={styles.emptyTitle}>No orders yet</Text>
                            <Text style={styles.emptySubtitle}>Start shopping to see your orders here</Text>
                        </View>
                    ) : null}
                />
            )}
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
    scrollContent: {
        paddingHorizontal: 6,
        paddingVertical: 12,
        paddingBottom: 40,
    },
    skeletonContainer: {
        gap: 8,
    },
    errorContainer: {
        backgroundColor: colors.destructive + '20',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        alignItems: 'center',
    },
    errorText: {
        color: colors.destructive,
        fontSize: 14,
        marginBottom: 12,
    },
    retryButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 8,
    },
    retryButtonText: {
        color: colors.white,
        fontSize: 14,
        fontWeight: '600',
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
