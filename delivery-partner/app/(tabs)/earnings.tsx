import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wallet, Package, Star, ChevronRight, IndianRupee } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import { earningsApi, EarningsSummary, EarningsHistoryItem } from '../../lib/api';
import { router } from 'expo-router';

export default function EarningsScreen() {
    const { colors, isDark } = useTheme();
    const styles = createStyles(colors, isDark);

    const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
    const [history, setHistory] = useState<EarningsHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async (isRefresh: boolean = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const [earningsResult, historyResult] = await Promise.all([
                earningsApi.getEarnings(),
                earningsApi.getEarningsHistory(1, 5),
            ]);

            if (earningsResult.success && earningsResult.response) {
                setEarnings(earningsResult.response);
            }

            if (historyResult.success && historyResult.response) {
                setHistory(historyResult.response.data || []);
            }
        } catch (error) {
            console.error('Error fetching earnings:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchData(false);
        }, [fetchData])
    );

    const handleRefresh = useCallback(() => {
        fetchData(true);
    }, [fetchData]);

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

            <ScrollView
                style={styles.scrollView}
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
            >
                {/* Main Earnings Card */}
                <View style={styles.mainCard}>
                    <Text style={styles.mainLabel}>Total This Month</Text>
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

                {/* Recent History */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Earnings</Text>
                    <Pressable style={styles.viewAllBtn} onPress={() => router.push('/earnings-history' as any)}>
                        <Text style={styles.viewAllText}>View All</Text>
                        <ChevronRight size={14} color={colors.primary} />
                    </Pressable>
                </View>

                {history.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Wallet size={40} color={colors.mutedForeground} />
                        <Text style={styles.emptyText}>No earnings history yet</Text>
                        <Text style={styles.emptySubtext}>Complete deliveries to see your earnings here</Text>
                    </View>
                ) : (
                    history.map((item, index) => (
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
                    ))
                )}
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
});
