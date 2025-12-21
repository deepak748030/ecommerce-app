import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Wallet, TrendingUp, Calendar } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import PartnerTopBar from '@/components/partner/PartnerTopBar';
import { mockEarningsHistory, mockPartnerStats } from '@/lib/partnerMockData';

export default function PartnerEarnings() {
    const { colors } = useTheme();

    const totalEarnings = mockEarningsHistory.reduce((sum, day) => sum + day.amount, 0);
    const totalDeliveries = mockEarningsHistory.reduce((sum, day) => sum + day.deliveries, 0);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <PartnerTopBar showBackButton title="Earnings" />

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Total Earnings Card */}
                <View style={[styles.totalCard, { backgroundColor: colors.primary }]}>
                    <View style={styles.totalIconCircle}>
                        <Wallet size={24} color={colors.primary} />
                    </View>
                    <Text style={styles.totalLabel}>This Week's Earnings</Text>
                    <Text style={styles.totalAmount}>₹{totalEarnings}</Text>
                    <Text style={styles.totalSub}>{totalDeliveries} deliveries completed</Text>
                </View>

                {/* Summary Stats */}
                <View style={styles.summaryRow}>
                    <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <TrendingUp size={18} color={colors.primary} />
                        <Text style={[styles.summaryValue, { color: colors.foreground }]}>₹{mockPartnerStats.todayEarnings}</Text>
                        <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Today</Text>
                    </View>
                    <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Calendar size={18} color="#8B5CF6" />
                        <Text style={[styles.summaryValue, { color: colors.foreground }]}>₹{totalEarnings}</Text>
                        <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>This Week</Text>
                    </View>
                </View>

                {/* Earnings History */}
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Earnings History</Text>

                {mockEarningsHistory.map((day, index) => (
                    <View
                        key={index}
                        style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    >
                        <View>
                            <Text style={[styles.historyDate, { color: colors.foreground }]}>{day.date}</Text>
                            <Text style={[styles.historyDeliveries, { color: colors.mutedForeground }]}>
                                {day.deliveries} deliveries
                            </Text>
                        </View>
                        <Text style={[styles.historyAmount, { color: colors.primary }]}>₹{day.amount}</Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 6,
        paddingBottom: 100,
    },
    totalCard: {
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        marginTop: 8,
    },
    totalIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    totalLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        fontWeight: '600',
    },
    totalAmount: {
        color: '#FFFFFF',
        fontSize: 32,
        fontWeight: '800',
        marginTop: 4,
    },
    totalSub: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 11,
        marginTop: 4,
    },
    summaryRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 14,
    },
    summaryCard: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: '800',
        marginTop: 6,
    },
    summaryLabel: {
        fontSize: 11,
        marginTop: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        marginTop: 20,
        marginBottom: 10,
    },
    historyCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 8,
    },
    historyDate: {
        fontSize: 14,
        fontWeight: '600',
    },
    historyDeliveries: {
        fontSize: 11,
        marginTop: 2,
    },
    historyAmount: {
        fontSize: 16,
        fontWeight: '800',
    },
});
