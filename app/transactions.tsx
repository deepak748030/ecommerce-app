import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, IndianRupee, Wallet, Smartphone, CreditCard, ShoppingBag } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { EmptyState } from '@/components/EmptyState';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Transaction {
    id: string;
    title: string;
    amount: number;
    type: 'payment' | 'refund';
    paymentMethod: string;
    date: string;
}

// Mock transactions data
const mockTransactions: Transaction[] = [
    { id: '1', title: 'Fresh Apples', amount: 120, type: 'payment', paymentMethod: 'upi', date: '2025-01-15' },
    { id: '2', title: 'Summer T-Shirt', amount: 599, type: 'payment', paymentMethod: 'card', date: '2025-01-14' },
    { id: '3', title: 'Organic Bananas - Refund', amount: 60, type: 'refund', paymentMethod: 'wallet', date: '2025-01-13' },
    { id: '4', title: 'Premium Mangoes', amount: 250, type: 'payment', paymentMethod: 'upi', date: '2025-01-12' },
    { id: '5', title: 'Denim Jeans', amount: 1299, type: 'payment', paymentMethod: 'card', date: '2025-01-10' },
];

export default function TransactionsScreen() {
    const { colors } = useTheme();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const insets = useSafeAreaInsets();

    useFocusEffect(
        useCallback(() => {
            setTransactions(mockTransactions);
        }, [])
    );

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

    const renderTransaction = ({ item }: { item: Transaction }) => {
        const isRefund = item.type === 'refund';

        return (
            <View style={styles.transactionCard}>
                <View style={styles.transactionInfo}>
                    <Text style={styles.eventTitle} numberOfLines={1}>
                        {item.title}
                    </Text>
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
            </View>
        );
    };

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
                <EmptyState
                    title="No transactions yet"
                    actionLabel="Browse Products"
                    onAction={() => router.push('/(tabs)')}
                />
            ) : (
                <FlatList
                    data={transactions}
                    renderItem={renderTransaction}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
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
    listContent: {
        paddingHorizontal: 6,
        gap: 2,
        paddingBottom: 20,
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
        gap: 4,
    },
    eventTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.foreground,
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
