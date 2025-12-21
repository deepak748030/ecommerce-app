import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wallet, TrendingUp, Package, Star, ChevronRight, IndianRupee } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { mockEarnings, mockEarningsHistory } from '../../lib/mockData';
import { router } from 'expo-router';

export default function EarningsScreen() {
    const { colors, isDark } = useTheme();
    const styles = createStyles(colors, isDark);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>My Earnings</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Main Earnings Card */}
                <View style={styles.mainCard}>
                    <Text style={styles.mainLabel}>Total This Month</Text>
                    <Text style={styles.mainAmount}>₹{mockEarnings.thisMonth.toLocaleString()}</Text>
                    <View style={styles.mainDivider} />
                    <View style={styles.mainStats}>
                        <View style={styles.mainStatItem}>
                            <Text style={styles.mainStatValue}>₹{mockEarnings.thisWeek}</Text>
                            <Text style={styles.mainStatLabel}>This Week</Text>
                        </View>
                        <View style={styles.mainStatDivider} />
                        <View style={styles.mainStatItem}>
                            <Text style={styles.mainStatValue}>₹{mockEarnings.today}</Text>
                            <Text style={styles.mainStatLabel}>Today</Text>
                        </View>
                    </View>
                </View>

                {/* Stats Cards */}
                <View style={styles.statsRow}>
                    <View style={[styles.statCard, { backgroundColor: colors.statCard1 }]}>
                        <Package size={18} color={colors.primary} />
                        <Text style={styles.statValue}>{mockEarnings.totalDeliveries}</Text>
                        <Text style={styles.statLabel}>Deliveries</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: colors.statCard2 }]}>
                        <IndianRupee size={18} color={colors.primary} />
                        <Text style={styles.statValue}>₹{mockEarnings.totalTips}</Text>
                        <Text style={styles.statLabel}>Total Tips</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: colors.secondary }]}>
                        <Star size={18} color={colors.primary} />
                        <Text style={styles.statValue}>{mockEarnings.avgRating}</Text>
                        <Text style={styles.statLabel}>Rating</Text>
                    </View>
                </View>

                {/* Recent History */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Earnings</Text>
                    <Pressable style={styles.viewAllBtn} onPress={() => router.push('/earnings-history' as any)}>
                        <Text style={styles.viewAllText}>View All</Text>
                        <ChevronRight size={14} color={colors.primary} />
                    </Pressable>
                </View>

                {mockEarningsHistory.map((item, index) => (
                    <View key={index} style={styles.historyCard}>
                        <View style={styles.historyLeft}>
                            <Text style={styles.historyDate}>{item.date}</Text>
                            <Text style={styles.historyDeliveries}>{item.deliveries} deliveries</Text>
                        </View>
                        <View style={styles.historyRight}>
                            <Text style={styles.historyAmount}>₹{item.amount}</Text>
                            {item.tips > 0 && (
                                <Text style={styles.historyTips}>+₹{item.tips} tips</Text>
                            )}
                        </View>
                    </View>
                ))}
            </ScrollView>
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
    scrollView: {
        flex: 1,
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
    viewAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    viewAllText: {
        fontSize: 12,
        color: colors.primary,
        fontWeight: '600',
    },
    historyCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 10,
        padding: 12,
        marginBottom: 8,
    },
    historyLeft: {},
    historyDate: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.foreground,
    },
    historyDeliveries: {
        fontSize: 11,
        color: colors.mutedForeground,
        marginTop: 2,
    },
    historyRight: {
        alignItems: 'flex-end',
    },
    historyAmount: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.foreground,
    },
    historyTips: {
        fontSize: 11,
        color: colors.success,
        marginTop: 2,
    },
});
