import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, IndianRupee, Wallet, Smartphone, CreditCard, Package } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ordersApi, Transaction } from '@/lib/api';

interface TransactionDisplay {
    id: string;
    title: string;
    transactionId: string;
    orderNumber: string;
    amount: number;
    type: 'payment' | 'refund';
    paymentMethod: string;
    date: string;
    status: string;
}

export default function TransactionsScreen() {
    const { colors } = useTheme();
    const [transactions, setTransactions] = useState<TransactionDisplay[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const insets = useSafeAreaInsets();

    const fetchTransactions = useCallback(async () => {
        try {
            const result = await ordersApi.getTransactions();
            if (result.success && result.response?.data) {
                const txns = result.response.data;
                const displayTxns: TransactionDisplay[] = txns.map((txn: Transaction) => {
                    const orderData = typeof txn.order === 'object' ? txn.order : null;
                    return {
                        id: txn._id,
                        title: orderData?.items?.[0]?.name || txn.description || 'Transaction',
                        transactionId: txn.transactionId,
                        orderNumber: orderData?.orderNumber || '',
                        amount: txn.amount,
                        type: txn.type,
                        paymentMethod: txn.paymentMethod,
                        date: txn.createdAt,
                        status: txn.status,
                    };
                });
                setTransactions(displayTxns);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchTransactions();
        }, [fetchTransactions])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchTransactions();
    }, [fetchTransactions]);

    const getPaymentMethodIcon = (method: string) => {
        switch (method?.toLowerCase()) {
            case 'upi':
                return <Smartphone size={16} color={colors.mutedForeground} />;
            case 'card':
                return <CreditCard size={16} color={colors.mutedForeground} />;
            default:
                return <Wallet size={16} color={colors.mutedForeground} />;
        }
    };

    const formatPaymentMethod = (method: string) => {
        switch (method?.toLowerCase()) {
            case 'upi':
                return 'UPI';
            case 'card':
                return 'Card';
            case 'wallet':
                return 'Wallet';
            default:
                return method || 'Unknown';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const styles = createStyles(colors);

    const renderTransaction = ({ item }: { item: TransactionDisplay }) => {
        const isRefund = item.type === 'refund';

        return (
            <Pressable
                style={styles.transactionCard}
                onPress={() => router.push(`/order/${item.id}` as any)}
            >
                <View style={styles.transactionInfo}>
                    <Text style={styles.eventTitle} numberOfLines={1}>
                        {item.title}
                    </Text>
                    <Text style={styles.transactionId}>{item.transactionId}</Text>
                    <Text style={styles.orderNumber}>{item.orderNumber}</Text>
                    <Text style={styles.bookingDate}>
                        {formatDate(item.date)}
                    </Text>
                    <View style={styles.paymentMethodRow}>
                        {getPaymentMethodIcon(item.paymentMethod)}
                        <Text style={styles.paymentMethodText}>
                            {formatPaymentMethod(item.paymentMethod)}
                        </Text>
                    </View>
                </View>

                <View style={styles.amountSection}>
                    <View style={styles.amountRow}>
                        <Text style={[styles.amountSign, isRefund ? styles.refundedSign : styles.debitedSign]}>
                            {isRefund ? '+' : '-'}
                        </Text>
                        <IndianRupee size={14} color={isRefund ? colors.success : colors.foreground} />
                        <Text style={[styles.amountText, isRefund && styles.refundedAmount]}>
                            {item.amount.toLocaleString('en-IN')}
                        </Text>
                    </View>
                    <Text style={[styles.statusLabel, isRefund ? styles.refundedLabel : styles.debitedLabel]}>
                        {isRefund ? 'Refunded' : 'Debited'}
                    </Text>
                </View>
            </Pressable>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft size={24} color={colors.foreground} />
                    </Pressable>
                    <Text style={styles.headerTitle}>Transaction History</Text>
                    <View style={styles.placeholder} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </View>
        );
    }

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

            {transactions.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Package size={60} color={colors.mutedForeground} />
                    <Text style={styles.emptyTitle}>No transactions yet</Text>
                    <Text style={styles.emptySubtitle}>Your order transactions will appear here</Text>
                    <Pressable style={styles.shopButton} onPress={() => router.push('/(tabs)')}>
                        <Text style={styles.shopButtonText}>Start Shopping</Text>
                    </Pressable>
                </View>
            ) : (
                <FlatList
                    data={transactions}
                    renderItem={renderTransaction}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    shopButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 10,
        marginTop: 20,
    },
    shopButtonText: {
        color: colors.white,
        fontSize: 14,
        fontWeight: '600',
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
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: colors.border,
    },
    transactionInfo: {
        flex: 1,
        gap: 2,
    },
    eventTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.foreground,
    },
    transactionId: {
        fontSize: 11,
        color: colors.mutedForeground,
    },
    orderNumber: {
        fontSize: 12,
        color: colors.primary,
        fontWeight: '500',
    },
    bookingDate: {
        fontSize: 12,
        color: colors.mutedForeground,
    },
    paymentMethodRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    paymentMethodText: {
        fontSize: 12,
        color: colors.mutedForeground,
    },
    amountSection: {
        alignItems: 'flex-end',
        gap: 4,
    },
    amountRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    amountSign: {
        fontSize: 16,
        fontWeight: '700',
        marginRight: 2,
    },
    debitedSign: {
        color: colors.foreground,
    },
    refundedSign: {
        color: colors.success,
    },
    amountText: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.foreground,
    },
    refundedAmount: {
        color: colors.success,
    },
    statusLabel: {
        fontSize: 11,
        fontWeight: '500',
    },
    debitedLabel: {
        color: colors.mutedForeground,
    },
    refundedLabel: {
        color: colors.success,
    },
});
