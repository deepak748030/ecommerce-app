import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Package, Clock, CheckCircle, XCircle } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import { deliveryOrdersApi, DeliveryOrder } from '../../lib/api';
import { router } from 'expo-router';

type TabType = 'active' | 'pending' | 'completed';

export default function OrdersScreen() {
    const { colors, isDark } = useTheme();
    const [activeTab, setActiveTab] = useState<TabType>('active');

    // Orders state
    const [orders, setOrders] = useState<DeliveryOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    // Pagination state
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalCounts, setTotalCounts] = useState({ active: 0, pending: 0, completed: 0 });

    const styles = createStyles(colors, isDark);

    const fetchOrders = useCallback(async (pageNum: number = 1, isRefresh: boolean = false) => {
        try {
            if (pageNum === 1) {
                if (isRefresh) {
                    setRefreshing(true);
                } else {
                    setLoading(true);
                }
            } else {
                setLoadingMore(true);
            }

            let result;
            switch (activeTab) {
                case 'active':
                    result = await deliveryOrdersApi.getActiveOrders(pageNum, 10);
                    break;
                case 'pending':
                    result = await deliveryOrdersApi.getAvailableOrders(pageNum, 10);
                    break;
                case 'completed':
                    result = await deliveryOrdersApi.getOrderHistory(pageNum, 10);
                    break;
            }

            if (result.success && result.response) {
                const newOrders = result.response.data || [];

                if (pageNum === 1) {
                    setOrders(newOrders);
                } else {
                    setOrders(prev => [...prev, ...newOrders]);
                }

                setHasMore(result.response.hasMore);
                setPage(pageNum);

                // Update total count for current tab
                setTotalCounts(prev => ({
                    ...prev,
                    [activeTab]: result.response?.total || 0,
                }));
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    }, [activeTab]);

    // Fetch all tab counts
    const fetchAllCounts = useCallback(async () => {
        try {
            const [activeResult, pendingResult, completedResult] = await Promise.all([
                deliveryOrdersApi.getActiveOrders(1, 1),
                deliveryOrdersApi.getAvailableOrders(1, 1),
                deliveryOrdersApi.getOrderHistory(1, 1),
            ]);

            setTotalCounts({
                active: activeResult.response?.total || 0,
                pending: pendingResult.response?.total || 0,
                completed: completedResult.response?.total || 0,
            });
        } catch (error) {
            console.error('Error fetching counts:', error);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchOrders(1, false);
            fetchAllCounts();
        }, [fetchOrders, fetchAllCounts])
    );

    // Reset and fetch when tab changes
    const handleTabChange = (tab: TabType) => {
        if (tab !== activeTab) {
            setActiveTab(tab);
            setOrders([]);
            setPage(1);
            setHasMore(true);
        }
    };

    // Refetch when activeTab changes
    React.useEffect(() => {
        fetchOrders(1, false);
    }, [activeTab]);

    const handleRefresh = useCallback(() => {
        fetchOrders(1, true);
        fetchAllCounts();
    }, [fetchOrders, fetchAllCounts]);

    const handleLoadMore = useCallback(() => {
        if (!loadingMore && hasMore && !loading) {
            fetchOrders(page + 1, false);
        }
    }, [loadingMore, hasMore, loading, page, fetchOrders]);

    const tabs: { key: TabType; label: string; count: number }[] = [
        { key: 'active', label: 'Active', count: totalCounts.active },
        { key: 'pending', label: 'Pending', count: totalCounts.pending },
        { key: 'completed', label: 'Completed', count: totalCounts.completed },
    ];

    const renderOrder = ({ item }: { item: DeliveryOrder }) => (
        <Pressable
            style={styles.orderCard}
            onPress={() => router.push({ pathname: '/delivery/[id]' as any, params: { id: item.id } })}
        >
            <View style={styles.orderHeader}>
                <View style={styles.orderIdRow}>
                    <Text style={styles.orderId}>#{item.orderId}</Text>
                    {item.status === 'delivered' && (
                        <CheckCircle size={16} color={colors.success} />
                    )}
                    {item.status === 'cancelled' && (
                        <XCircle size={16} color={colors.destructive} />
                    )}
                </View>
                <Text style={styles.orderAmount}>₹{item.amount + item.tip}</Text>
            </View>

            <View style={styles.addressSection}>
                <View style={styles.addressRow}>
                    <View style={[styles.dot, { backgroundColor: colors.success }]} />
                    <Text style={styles.addressText} numberOfLines={1}>{item.pickupAddress}</Text>
                </View>
                <View style={styles.addressLine} />
                <View style={styles.addressRow}>
                    <View style={[styles.dot, { backgroundColor: colors.destructive }]} />
                    <Text style={styles.addressText} numberOfLines={1}>{item.deliveryAddress}</Text>
                </View>
            </View>

            <View style={styles.orderFooter}>
                <View style={styles.infoRow}>
                    <Clock size={12} color={colors.mutedForeground} />
                    <Text style={styles.infoText}>{item.estimatedTime}</Text>
                </View>
            </View>
        </Pressable>
    );

    const renderEmpty = () => (
        <View style={styles.emptyState}>
            <Package size={48} color={colors.mutedForeground} />
            <Text style={styles.emptyText}>No orders in this category</Text>
        </View>
    );

    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={colors.primary} />
            </View>
        );
    };

    const renderSkeleton = () => (
        <View style={styles.skeletonContainer}>
            {[1, 2, 3].map((i) => (
                <View key={i} style={styles.skeletonCard}>
                    <View style={styles.skeletonHeader}>
                        <View style={[styles.skeletonLine, { width: 80 }]} />
                        <View style={[styles.skeletonLine, { width: 60 }]} />
                    </View>
                    <View style={styles.skeletonAddress}>
                        <View style={[styles.skeletonLine, { width: '100%' }]} />
                        <View style={[styles.skeletonLine, { width: '80%' }]} />
                    </View>
                    <View style={styles.skeletonFooter}>
                        <View style={[styles.skeletonLine, { width: 80 }]} />
                        <View style={[styles.skeletonLine, { width: 50 }]} />
                    </View>
                </View>
            ))}
        </View>
    );

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
                        onPress={() => handleTabChange(tab.key)}
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

            {loading && !refreshing ? (
                renderSkeleton()
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={(item) => item.id}
                    renderItem={renderOrder}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor={colors.primary}
                            colors={[colors.primary]}
                        />
                    }
                    ListEmptyComponent={renderEmpty}
                    ListFooterComponent={renderFooter}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.3}
                />
            )}
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
    scrollContent: {
        paddingHorizontal: 6,
        paddingBottom: 100,
        flexGrow: 1,
    },
    emptyState: {
        flex: 1,
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
    footerLoader: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    skeletonContainer: {
        paddingHorizontal: 6,
        gap: 10,
    },
    skeletonCard: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 12,
    },
    skeletonHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    skeletonAddress: {
        gap: 8,
        marginBottom: 12,
    },
    skeletonFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    skeletonLine: {
        height: 12,
        backgroundColor: colors.muted,
        borderRadius: 4,
    },
});
