import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, IndianRupee, Wallet, Smartphone, CreditCard, Package, ArrowUpCircle, ArrowDownCircle } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { vendorApi, WalletTransaction, WithdrawalRequest } from '@/lib/api';
import { TransactionSkeleton } from '@/components/Skeleton';

interface CombinedTransaction {
    id: string;
    title: string;
    description: string;
    amount: number;
    type: 'credit' | 'debit' | 'withdrawal' | 'refund_debit';
    status: string;
    date: string;
    paymentMethod?: string;
    orderNumber?: string;
}

export default function TransactionsScreen() {
    const { colors } = useTheme();
    const [transactions, setTransactions] = useState<CombinedTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const insets = useSafeAreaInsets();

    const fetchTransactions = useCallback(async (pageNum: number = 1, isRefresh: boolean = false) => {
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

            // Fetch both wallet transactions and withdrawals
            const [walletResult, withdrawalResult] = await Promise.all([
                vendorApi.getWalletTransactions(pageNum, 15),
                pageNum === 1 ? vendorApi.getWithdrawalHistory(1, 50) : Promise.resolve({ success: true, response: { data: [] } }),
            ]);

            let combinedTxns: CombinedTransaction[] = [];

            // Process wallet transactions
            if (walletResult.success && walletResult.response?.data) {
                const walletTxns = walletResult.response.data.map((txn: WalletTransaction) => ({
                    id: txn._id,
                    title: txn.type === 'credit' ? 'Order Payment' : txn.type === 'withdrawal' ? 'Withdrawal' : 'Refund Deduction',
                    description: txn.description || '',
                    amount: txn.amount,
                    type: txn.type,
                    status: txn.status,
                    date: txn.createdAt,
                    orderNumber: txn.order?.orderNumber,
                }));
                combinedTxns = [...combinedTxns, ...walletTxns];
            }

            // Add withdrawals only on first page
            if (pageNum === 1 && withdrawalResult.success && withdrawalResult.response?.data) {
                const withdrawalTxns = withdrawalResult.response.data
                    .filter((w: WithdrawalRequest) => w.status === 'completed' || w.status === 'rejected')
                    .map((w: WithdrawalRequest) => ({
                        id: `withdrawal-${w._id}`,
                        title: w.status === 'completed' ? 'Withdrawal Completed' : 'Withdrawal Rejected',
                        description: w.status === 'rejected' ? w.rejectionReason || 'Request rejected' : `Via ${w.paymentMethod?.toUpperCase()}`,
                        amount: w.amount,
                        type: 'withdrawal' as const,
                        status: w.status,
                        date: w.processedAt || w.createdAt,
                        paymentMethod: w.paymentMethod,
                    }));
                combinedTxns = [...combinedTxns, ...withdrawalTxns];
            }

            // Sort by date (newest first)
            combinedTxns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            if (pageNum === 1) {
                setTransactions(combinedTxns);
            } else {
                setTransactions(prev => [...prev, ...combinedTxns]);
            }

            // Check if has more
            const totalPages = walletResult.response?.pages || 1;
            setHasMore(pageNum < totalPages);
            setPage(pageNum);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchTransactions(1, false);
        }, [fetchTransactions])
    );

    const onRefresh = useCallback(() => {
        fetchTransactions(1, true);
    }, [fetchTransactions]);

    const handleLoadMore = useCallback(() => {
        if (!loadingMore && hasMore && !loading) {
            fetchTransactions(page + 1, false);
        }
    }, [loadingMore, hasMore, loading, page, fetchTransactions]);

    const getTransactionIcon = (type: string, status: string) => {
        if (type === 'credit') {
            return <ArrowDownCircle size={20} color={colors.success} />;
        }
        if (type === 'withdrawal') {
            return status === 'completed'
                ? <ArrowUpCircle size={20} color={colors.primary} />
                : <ArrowUpCircle size={20} color={colors.destructive} />;
        }
        return <ArrowUpCircle size={20} color={colors.destructive} />;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const styles = createStyles(colors);

    const renderTransaction = ({ item }: { item: CombinedTransaction }) => {
        const isCredit = item.type === 'credit' && item.status === 'completed';
        const isWithdrawalComplete = item.type === 'withdrawal' && item.status === 'completed';
        const isDebit = item.type === 'refund_debit' || (item.type === 'withdrawal' && item.status !== 'completed');

        return (
            <View style={styles.transactionCard}>
                <View style={styles.iconContainer}>
                    {getTransactionIcon(item.type, item.status)}
                </View>
                <View style={styles.transactionInfo}>
                    <Text style={styles.transactionTitle} numberOfLines={1}>
                        {item.title}
                    </Text>
                    <Text style={styles.transactionDesc} numberOfLines={1}>
                        {item.description}
                    </Text>
                    {item.orderNumber && (
                        <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
                    )}
                    <Text style={styles.transactionDate}>
                        {formatDate(item.date)} • {formatTime(item.date)}
                    </Text>
                </View>
                <View style={styles.amountSection}>
                    <Text style={[
                        styles.amountText,
                        isCredit && styles.creditAmount,
                        isWithdrawalComplete && styles.withdrawalAmount,
                        isDebit && styles.debitAmount,
                    ]}>
                        {isCredit ? '+' : '-'}₹{item.amount.toLocaleString('en-IN')}
                    </Text>
                    <View style={[
                        styles.statusBadge,
                        item.status === 'completed' && styles.completedBadge,
                        item.status === 'pending' && styles.pendingBadge,
                        item.status === 'rejected' && styles.rejectedBadge,
                    ]}>
                        <Text style={[
                            styles.statusText,
                            item.status === 'completed' && styles.completedText,
                            item.status === 'pending' && styles.pendingText,
                            item.status === 'rejected' && styles.rejectedText,
                        ]}>
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={colors.primary} />
            </View>
        );
    };

    const renderSkeletons = () => (
        <View style={styles.skeletonContainer}>
            {[1, 2, 3, 4, 5].map((i) => (
                <TransactionSkeleton key={i} />
            ))}
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.foreground} />
                </Pressable>
                <Text style={styles.headerTitle}>Transaction History</Text>
                <View style={styles.placeholder} />
            </View>

            {loading && !refreshing ? (
                <View style={styles.listContent}>
                    {renderSkeletons()}
                </View>
            ) : transactions.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Wallet size={60} color={colors.mutedForeground} />
                    <Text style={styles.emptyTitle}>No transactions yet</Text>
                    <Text style={styles.emptySubtitle}>Your wallet transactions will appear here</Text>
                </View>
            ) : (
                <FlatList
                    data={transactions}
                    renderItem={renderTransaction}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={colors.primary}
                            colors={[colors.primary]}
                        />
                    }
                    ListFooterComponent={renderFooter}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.3}
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 6,
        paddingVertical: 6,
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.foreground,
    },
    placeholder: {
        width: 32,
    },
    skeletonContainer: {
        gap: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
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
        textAlign: 'center',
    },
    listContent: {
        paddingHorizontal: 6,
        gap: 8,
        paddingBottom: 20,
        paddingTop: 8,
    },
    transactionCard: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        gap: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.muted,
        alignItems: 'center',
        justifyContent: 'center',
    },
    transactionInfo: {
        flex: 1,
        gap: 2,
    },
    transactionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.foreground,
    },
    transactionDesc: {
        fontSize: 12,
        color: colors.mutedForeground,
    },
    orderNumber: {
        fontSize: 11,
        color: colors.primary,
        fontWeight: '500',
    },
    transactionDate: {
        fontSize: 11,
        color: colors.mutedForeground,
    },
    amountSection: {
        alignItems: 'flex-end',
        gap: 4,
    },
    amountText: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.foreground,
    },
    creditAmount: {
        color: colors.success,
    },
    withdrawalAmount: {
        color: colors.primary,
    },
    debitAmount: {
        color: colors.destructive,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    completedBadge: {
        backgroundColor: colors.success + '20',
    },
    pendingBadge: {
        backgroundColor: colors.warning + '20',
    },
    rejectedBadge: {
        backgroundColor: colors.destructive + '20',
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600',
    },
    completedText: {
        color: colors.success,
    },
    pendingText: {
        color: colors.warning,
    },
    rejectedText: {
        color: colors.destructive,
    },
    footerLoader: {
        paddingVertical: 20,
        alignItems: 'center',
    },
});
