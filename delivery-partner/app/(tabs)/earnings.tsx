import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wallet, Package, Star, ChevronRight, IndianRupee, ArrowUpRight, ArrowDownLeft, TrendingUp } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import { earningsApi, walletApi, EarningsSummary, WalletBalance, WalletTransaction, WalletTransactionsResponse } from '../../lib/api';
import { router } from 'expo-router';
import { WithdrawModal, WithdrawData } from '../../components/WithdrawModal';

export default function EarningsScreen() {
    const { colors, isDark } = useTheme();
    const styles = createStyles(colors, isDark);

    const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
    const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const fetchData = useCallback(async (isRefresh: boolean = false, pageNum: number = 1) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
                setPage(1);
                pageNum = 1;
            } else if (pageNum === 1) {
                setLoading(true);
            }

            const [earningsResult, walletResult, transactionsResult] = await Promise.all([
                earningsApi.getEarnings(),
                walletApi.getWalletBalance(),
                walletApi.getWalletTransactions(pageNum, 15),
            ]);

            if (earningsResult.success && earningsResult.response) {
                setEarnings(earningsResult.response);
            }

            if (walletResult.success && walletResult.response) {
                setWalletBalance(walletResult.response);
            }

            if (transactionsResult.success && transactionsResult.response) {
                const newTransactions = transactionsResult.response.data || [];
                if (pageNum === 1) {
                    setTransactions(newTransactions);
                } else {
                    setTransactions(prev => [...prev, ...newTransactions]);
                }
                setHasMore(transactionsResult.response.hasMore);
            }
        } catch (error) {
            console.error('Error fetching earnings:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchData(false, 1);
        }, [fetchData])
    );

    const handleRefresh = useCallback(() => {
        fetchData(true);
    }, [fetchData]);

    const handleLoadMore = useCallback(() => {
        if (!loadingMore && hasMore) {
            setLoadingMore(true);
            const nextPage = page + 1;
            setPage(nextPage);
            fetchData(false, nextPage);
        }
    }, [loadingMore, hasMore, page, fetchData]);

    const handleWithdraw = async (data: WithdrawData): Promise<{ success: boolean; message?: string }> => {
        try {
            const result = await walletApi.requestWithdrawal(data);
            if (result.success) {
                fetchData(true);
                return { success: true };
            }
            return { success: false, message: result.message || 'Failed to process withdrawal' };
        } catch (error) {
            return { success: false, message: 'Something went wrong' };
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return colors.success;
            case 'pending': return colors.warning;
            case 'processing': return colors.info || colors.primary;
            case 'rejected': return colors.destructive;
            default: return colors.mutedForeground;
        }
    };

    const renderTransaction = ({ item }: { item: WalletTransaction }) => (
        <View style={styles.transactionCard}>
            <View style={[styles.transactionIcon, { backgroundColor: item.type === 'credit' ? colors.success + '20' : colors.warning + '20' }]}>
                {item.type === 'credit' ? (
                    <TrendingUp size={18} color={colors.success} />
                ) : (
                    <ArrowDownLeft size={18} color={colors.warning} />
                )}
            </View>
            <View style={styles.transactionInfo}>
                <Text style={styles.transactionDesc} numberOfLines={1}>{item.description}</Text>
                <Text style={styles.transactionDate}>{formatDate(item.createdAt)}</Text>
            </View>
            <View style={styles.transactionRight}>
                <Text style={[styles.transactionAmount, { color: item.type === 'credit' ? colors.success : colors.foreground }]}>
                    {item.type === 'credit' ? '+' : '-'}₹{item.amount}
                </Text>
                {item.tip && item.tip > 0 && (
                    <Text style={styles.transactionTip}>+₹{item.tip} tip</Text>
                )}
                {item.type === 'withdrawal' && (
                    <Text style={[styles.transactionStatus, { color: getStatusColor(item.status) }]}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Text>
                )}
            </View>
        </View>
    );

    const renderHeader = () => (
        <>
            {/* Wallet Balance Card */}
            {walletBalance && (
                <View style={styles.mainCard}>
                    <View style={styles.walletHeader}>
                        <Text style={styles.mainLabel}>Wallet Balance</Text>
                        {walletBalance.balance >= 100 && (
                            <Pressable style={styles.withdrawBtn} onPress={() => setWithdrawModalVisible(true)}>
                                <ArrowUpRight size={14} color={colors.primary} />
                                <Text style={styles.withdrawBtnText}>Withdraw</Text>
                            </Pressable>
                        )}
                    </View>
                    <Text style={styles.mainAmount}>₹{walletBalance.balance.toLocaleString()}</Text>
                    <View style={styles.mainDivider} />
                    <View style={styles.mainStats}>
                        <View style={styles.mainStatItem}>
                            <Text style={styles.mainStatValue}>₹{walletBalance.pendingBalance || 0}</Text>
                            <Text style={styles.mainStatLabel}>Pending</Text>
                        </View>
                        <View style={styles.mainStatDivider} />
                        <View style={styles.mainStatItem}>
                            <Text style={styles.mainStatValue}>₹{walletBalance.totalWithdrawn || 0}</Text>
                            <Text style={styles.mainStatLabel}>Withdrawn</Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Monthly Earnings Card */}
            <View style={[styles.mainCard, { backgroundColor: colors.accent }]}>
                <Text style={styles.mainLabel}>This Month</Text>
                <Text style={styles.mainAmount}>₹{(earnings?.thisMonth || 0).toLocaleString()}</Text>
                <View style={styles.mainDivider} />
                <View style={styles.mainStats}>
                    <View style={styles.mainStatItem}>
                        <Text style={styles.mainStatValue}>₹{earnings?.thisWeek || 0}</Text>
                        <Text style={styles.mainStatLabel}>This Week</Text>
                    </View>
                    <View style={styles.mainStatDivider} />
                    <View style={styles.mainStatItem}>
                        <Text style={styles.mainStatValue}>₹{earnings?.today || 0}</Text>
                        <Text style={styles.mainStatLabel}>Today</Text>
                    </View>
                </View>
            </View>

            {/* Stats Cards */}
            <View style={styles.statsRow}>
                <View style={[styles.statCard, { backgroundColor: colors.statCard1 }]}>
                    <Package size={18} color={colors.primary} />
                    <Text style={styles.statValue}>{earnings?.totalDeliveries || 0}</Text>
                    <Text style={styles.statLabel}>Deliveries</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.statCard2 }]}>
                    <IndianRupee size={18} color={colors.primary} />
                    <Text style={styles.statValue}>₹{earnings?.totalTips || 0}</Text>
                    <Text style={styles.statLabel}>Total Tips</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.secondary }]}>
                    <Star size={18} color={colors.primary} />
                    <Text style={styles.statValue}>{earnings?.avgRating?.toFixed(1) || '5.0'}</Text>
                    <Text style={styles.statLabel}>Rating</Text>
                </View>
            </View>

            {/* Transaction History Header */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Transaction History</Text>
            </View>
        </>
    );

    const renderEmpty = () => (
        <View style={styles.emptyState}>
            <Wallet size={40} color={colors.mutedForeground} />
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>Complete deliveries to see your earnings here</Text>
        </View>
    );

    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={colors.primary} />
            </View>
        );
    };

    const renderSkeleton = () => (
        <View style={styles.skeletonContainer}>
            <View style={styles.mainCardSkeleton}>
                <View style={[styles.skeletonLine, { width: 100, marginBottom: 8 }]} />
                <View style={[styles.skeletonLine, { width: 150, height: 32, marginBottom: 14 }]} />
                <View style={styles.mainDivider} />
                <View style={styles.mainStats}>
                    <View style={styles.mainStatItem}>
                        <View style={[styles.skeletonLine, { width: 60 }]} />
                    </View>
                    <View style={styles.mainStatItem}>
                        <View style={[styles.skeletonLine, { width: 60 }]} />
                    </View>
                </View>
            </View>
            <View style={styles.statsRow}>
                {[1, 2, 3].map(i => (
                    <View key={i} style={[styles.statCardSkeleton, { backgroundColor: colors.card }]}>
                        <View style={[styles.skeletonLine, { width: 24, height: 24, borderRadius: 12 }]} />
                        <View style={[styles.skeletonLine, { width: 40, marginTop: 8 }]} />
                        <View style={[styles.skeletonLine, { width: 50, marginTop: 4, height: 8 }]} />
                    </View>
                ))}
            </View>
        </View>
    );

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <Text style={styles.title}>My Earnings</Text>
                </View>
                {renderSkeleton()}
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>My Earnings</Text>
            </View>

            <FlatList
                data={transactions}
                renderItem={renderTransaction}
                keyExtractor={(item, index) => `${item._id}-${index}`}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={renderEmpty}
                ListFooterComponent={renderFooter}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.3}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
            />

            {/* Withdraw Modal */}
            <WithdrawModal
                visible={withdrawModalVisible}
                onClose={() => setWithdrawModalVisible(false)}
                availableBalance={walletBalance?.balance || 0}
                onSubmit={handleWithdraw}
            />
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
    scrollContent: {
        paddingHorizontal: 6,
        paddingBottom: 100,
    },
    mainCard: {
        backgroundColor: colors.primary,
        borderRadius: 16,
        padding: 18,
        marginBottom: 14,
    },
    mainLabel: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 4,
    },
    mainAmount: {
        fontSize: 32,
        fontWeight: '800',
        color: colors.white,
    },
    mainDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginVertical: 14,
    },
    mainStats: {
        flexDirection: 'row',
    },
    mainStatItem: {
        flex: 1,
        alignItems: 'center',
    },
    mainStatDivider: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    mainStatValue: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.white,
    },
    mainStatLabel: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 2,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 18,
    },
    statCard: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        gap: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.foreground,
    },
    statLabel: {
        fontSize: 10,
        color: colors.mutedForeground,
        fontWeight: '500',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.foreground,
    },
    transactionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        gap: 12,
    },
    transactionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    transactionInfo: {
        flex: 1,
    },
    transactionDesc: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.foreground,
    },
    transactionDate: {
        fontSize: 11,
        color: colors.mutedForeground,
        marginTop: 2,
    },
    transactionRight: {
        alignItems: 'flex-end',
    },
    transactionAmount: {
        fontSize: 15,
        fontWeight: '700',
    },
    transactionTip: {
        fontSize: 11,
        color: colors.success,
        marginTop: 2,
    },
    transactionStatus: {
        fontSize: 10,
        fontWeight: '600',
        marginTop: 2,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        gap: 8,
    },
    emptyText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.foreground,
    },
    emptySubtext: {
        fontSize: 12,
        color: colors.mutedForeground,
    },
    loadingMore: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    skeletonContainer: {
        paddingHorizontal: 6,
    },
    mainCardSkeleton: {
        backgroundColor: colors.primary,
        borderRadius: 16,
        padding: 18,
        marginBottom: 14,
        opacity: 0.7,
    },
    statCardSkeleton: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    skeletonLine: {
        height: 14,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 4,
    },
    walletHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
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
});
