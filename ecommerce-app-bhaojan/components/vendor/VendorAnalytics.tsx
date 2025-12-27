import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import {
    TrendingUp,
    DollarSign,
    ShoppingCart,
    Package,
    Wallet,
    Clock,
    ArrowUpRight,
} from 'lucide-react-native';
import { VendorAnalytics as VendorAnalyticsType, getImageUrl, vendorApi } from '@/lib/api';
import { VendorAnalyticsSkeleton } from '@/components/Skeleton';
import { WithdrawModal, WithdrawData } from './WithdrawModal';

interface Props {
    analytics: VendorAnalyticsType | null;
    loading: boolean;
    onRefresh?: () => void;
}

export function VendorAnalytics({ analytics, loading, onRefresh }: Props) {
    const { colors } = useTheme();
    const styles = createStyles(colors);
    const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending': return colors.warning;
            case 'confirmed':
            case 'processing': return colors.primary;
            case 'shipped':
            case 'out_for_delivery': return colors.accent;
            case 'delivered': return colors.success;
            case 'cancelled': return colors.destructive;
            default: return colors.mutedForeground;
        }
    };

    const formatStatus = (status: string) => {
        return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

    const handleWithdraw = async (data: WithdrawData): Promise<{ success: boolean; message?: string }> => {
        try {
            const result = await vendorApi.requestWithdrawal(data);
            if (result.success) {
                onRefresh?.();
                return { success: true };
            }
            return { success: false, message: result.message || 'Failed to process withdrawal' };
        } catch (error) {
            return { success: false, message: 'Something went wrong' };
        }
    };

    if (loading) {
        return <VendorAnalyticsSkeleton />;
    }

    if (!analytics) {
        return (
            <View style={styles.emptyContainer}>
                <TrendingUp size={60} color={colors.mutedForeground} />
                <Text style={styles.emptyTitle}>No Analytics Data</Text>
                <Text style={styles.emptyText}>Start selling to see your analytics</Text>
            </View>
        );
    }

    const wallet = analytics.wallet || { balance: 0, pendingBalance: 0, totalEarnings: 0, totalWithdrawn: 0, currencySymbol: '₹' };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* Wallet Card */}
            <View style={[styles.walletCard, { backgroundColor: colors.primary }]}>
                <View style={styles.walletHeader}>
                    <View style={styles.walletHeaderLeft}>
                        <View style={styles.walletIcon}>
                            <Wallet size={18} color={colors.primaryForeground} />
                        </View>
                        <Text style={styles.walletTitle}>Wallet Balance</Text>
                    </View>
                    {wallet.balance >= 100 && (
                        <TouchableOpacity
                            style={styles.withdrawBtn}
                            onPress={() => setWithdrawModalVisible(true)}
                        >
                            <ArrowUpRight size={14} color={colors.primary} />
                            <Text style={styles.withdrawBtnText}>Withdraw</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <Text style={styles.walletBalance}>₹{wallet.balance.toLocaleString('en-IN')}</Text>
                <View style={styles.walletRow}>
                    <View style={styles.walletItem}>
                        <Clock size={12} color={colors.primaryForeground} style={{ opacity: 0.8 }} />
                        <Text style={styles.walletLabel}>Pending</Text>
                        <Text style={styles.walletValue}>₹{wallet.pendingBalance.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.walletDivider} />
                    <View style={styles.walletItem}>
                        <TrendingUp size={12} color={colors.primaryForeground} style={{ opacity: 0.8 }} />
                        <Text style={styles.walletLabel}>Earned</Text>
                        <Text style={styles.walletValue}>₹{wallet.totalEarnings.toLocaleString('en-IN')}</Text>
                    </View>
                </View>
            </View>

            {/* Withdraw Modal */}
            <WithdrawModal
                visible={withdrawModalVisible}
                onClose={() => setWithdrawModalVisible(false)}
                availableBalance={wallet.balance}
                onSubmit={handleWithdraw}
            />

            {/* Stats Cards */}
            <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: colors.primary + '15' }]}>
                    <View style={[styles.statIcon, { backgroundColor: colors.primary }]}>
                        <DollarSign size={18} color={colors.white} />
                    </View>
                    <Text style={styles.statValue}>₹{analytics.totalRevenue.toLocaleString('en-IN')}</Text>
                    <Text style={styles.statLabel}>Total Revenue</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.accent + '15' }]}>
                    <View style={[styles.statIcon, { backgroundColor: colors.accent }]}>
                        <ShoppingCart size={18} color={colors.white} />
                    </View>
                    <Text style={styles.statValue}>{analytics.totalOrders}</Text>
                    <Text style={styles.statLabel}>Total Orders</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.success + '15' }]}>
                    <View style={[styles.statIcon, { backgroundColor: colors.success }]}>
                        <Package size={18} color={colors.white} />
                    </View>
                    <Text style={styles.statValue}>{analytics.totalProducts}</Text>
                    <Text style={styles.statLabel}>Products</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.warning + '15' }]}>
                    <View style={[styles.statIcon, { backgroundColor: colors.warning }]}>
                        <TrendingUp size={18} color={colors.white} />
                    </View>
                    <Text style={styles.statValue}>{analytics.totalItemsSold}</Text>
                    <Text style={styles.statLabel}>Items Sold</Text>
                </View>
            </View>

            {/* Order Status Summary */}
            <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Order Status</Text>
                <View style={styles.orderStatusRow}>
                    <View style={styles.orderStatusItem}>
                        <View style={[styles.statusDot, { backgroundColor: colors.warning }]} />
                        <Text style={styles.orderStatusValue}>{analytics.pendingOrders}</Text>
                        <Text style={styles.orderStatusLabel}>Pending</Text>
                    </View>
                    <View style={styles.orderStatusItem}>
                        <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                        <Text style={styles.orderStatusValue}>{analytics.deliveredOrders}</Text>
                        <Text style={styles.orderStatusLabel}>Delivered</Text>
                    </View>
                    <View style={styles.orderStatusItem}>
                        <View style={[styles.statusDot, { backgroundColor: colors.destructive }]} />
                        <Text style={styles.orderStatusValue}>{analytics.cancelledOrders}</Text>
                        <Text style={styles.orderStatusLabel}>Cancelled</Text>
                    </View>
                </View>
            </View>

            {/* Top Products */}
            <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Top Products</Text>
                {analytics.topProducts.length === 0 ? (
                    <Text style={styles.emptyText}>No sales data yet</Text>
                ) : (
                    analytics.topProducts.map((product, index) => (
                        <View key={product.productId} style={styles.topProductRow}>
                            <Text style={styles.topProductRank}>#{index + 1}</Text>
                            <Image source={{ uri: getImageUrl(product.image) }} style={styles.topProductImage} />
                            <View style={styles.topProductInfo}>
                                <Text style={styles.topProductName} numberOfLines={1}>{product.name}</Text>
                                <Text style={styles.topProductStats}>
                                    {product.totalSold} sold • ₹{product.revenue.toLocaleString()}
                                </Text>
                            </View>
                        </View>
                    ))
                )}
            </View>

            {/* Recent Orders */}
            <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Recent Orders</Text>
                {analytics.recentOrders.length === 0 ? (
                    <Text style={styles.emptyText}>No orders yet</Text>
                ) : (
                    analytics.recentOrders.map((order) => (
                        <View key={order._id} style={styles.recentOrderRow}>
                            <View style={styles.recentOrderInfo}>
                                <Text style={styles.recentOrderNumber}>#{order.orderNumber}</Text>
                                <Text style={styles.recentOrderCustomer}>{order.customerName}</Text>
                            </View>
                            <View style={styles.recentOrderRight}>
                                <Text style={styles.recentOrderTotal}>₹{order.total}</Text>
                                <View style={[styles.miniStatusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                                    <Text style={[styles.miniStatusText, { color: getStatusColor(order.status) }]}>
                                        {formatStatus(order.status)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ))
                )}
            </View>

            <View style={{ height: 100 }} />
        </ScrollView>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 6,
        paddingTop: 12,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: colors.mutedForeground,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.foreground,
        marginTop: 16,
    },
    emptyText: {
        fontSize: 14,
        color: colors.mutedForeground,
        textAlign: 'center',
        marginTop: 8,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 16,
    },
    statCard: {
        width: '48%',
        padding: 14,
        borderRadius: 14,
        alignItems: 'center',
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.foreground,
    },
    statLabel: {
        fontSize: 11,
        color: colors.mutedForeground,
        marginTop: 4,
    },
    sectionCard: {
        backgroundColor: colors.card,
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.foreground,
        marginBottom: 12,
    },
    orderStatusRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    orderStatusItem: {
        alignItems: 'center',
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginBottom: 6,
    },
    orderStatusValue: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.foreground,
    },
    orderStatusLabel: {
        fontSize: 11,
        color: colors.mutedForeground,
        marginTop: 2,
    },
    topProductRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    topProductRank: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.primary,
        width: 28,
    },
    topProductImage: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: colors.muted,
    },
    topProductInfo: {
        flex: 1,
        marginLeft: 10,
    },
    topProductName: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.foreground,
    },
    topProductStats: {
        fontSize: 11,
        color: colors.mutedForeground,
        marginTop: 2,
    },
    recentOrderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    recentOrderInfo: {
        flex: 1,
    },
    recentOrderNumber: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.foreground,
    },
    recentOrderCustomer: {
        fontSize: 11,
        color: colors.mutedForeground,
    },
    recentOrderRight: {
        alignItems: 'flex-end',
    },
    recentOrderTotal: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.primary,
    },
    miniStatusBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 4,
    },
    miniStatusText: {
        fontSize: 9,
        fontWeight: '600',
    },
    walletCard: {
        borderRadius: 14,
        padding: 12,
        marginBottom: 14,
    },
    walletHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    walletHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    walletIcon: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    walletTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.primaryForeground,
        opacity: 0.9,
    },
    withdrawBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primaryForeground,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        gap: 4,
    },
    withdrawBtnText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.primary,
    },
    walletBalance: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.primaryForeground,
        marginBottom: 6,
    },
    walletRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    walletItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    walletLabel: {
        fontSize: 10,
        color: colors.primaryForeground,
        opacity: 0.8,
    },
    walletValue: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.primaryForeground,
    },
    walletDivider: {
        width: 1,
        height: 16,
        backgroundColor: 'rgba(255,255,255,0.3)',
        marginHorizontal: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    modalLabel: {
        fontSize: 13,
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        fontSize: 14,
        marginBottom: 14,
    },
    submitBtn: {
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    submitBtnText: {
        fontSize: 15,
        fontWeight: '700',
    },
});
