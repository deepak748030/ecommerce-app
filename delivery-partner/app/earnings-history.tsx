import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Wallet } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { earningsApi, EarningsHistoryItem } from '../lib/api';
import { router } from 'expo-router';

export default function EarningsHistoryScreen() {
    const { colors, isDark } = useTheme();
    const styles = createStyles(colors, isDark);

    const [history, setHistory] = useState<EarningsHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const fetchHistory = useCallback(async (pageNum: number = 1, isRefresh: boolean = false) => {
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

            const result = await earningsApi.getEarningsHistory(pageNum, 15);

            if (result.success && result.response) {
                const newHistory = result.response.data || [];

                if (pageNum === 1) {
                    setHistory(newHistory);
                } else {
                    setHistory(prev => [...prev, ...newHistory]);
                }

                setHasMore(result.response.hasMore);
                setPage(pageNum);
            }
        } catch (error) {
            console.error('Error fetching earnings history:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchHistory(1, false);
        }, [fetchHistory])
    );

    const handleRefresh = useCallback(() => {
        fetchHistory(1, true);
    }, [fetchHistory]);

    const handleLoadMore = useCallback(() => {
        if (!loadingMore && hasMore && !loading) {
            fetchHistory(page + 1, false);
        }
    }, [loadingMore, hasMore, loading, page, fetchHistory]);

    const renderItem = ({ item }: { item: EarningsHistoryItem }) => (
        <View style={styles.historyCard}>
            <View style={styles.historyLeft}>
                <Text style={styles.historyDate}>{item.date}</Text>
                <Text style={styles.historyDeliveries}>{item.deliveries} deliveries completed</Text>
            </View>
            <View style={styles.historyRight}>
                <Text style={styles.historyAmount}>₹{item.amount}</Text>
                {item.tips > 0 && (
                    <Text style={styles.historyTips}>+₹{item.tips} tips</Text>
                )}
            </View>
        </View>
    );

    const renderEmpty = () => (
        <View style={styles.emptyState}>
            <Wallet size={48} color={colors.mutedForeground} />
            <Text style={styles.emptyText}>No earnings history yet</Text>
            <Text style={styles.emptySubtext}>Complete deliveries to see your daily earnings</Text>
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
            {[1, 2, 3, 4, 5].map(i => (
                <View key={i} style={styles.skeletonCard}>
                    <View style={styles.skeletonLeft}>
                        <View style={[styles.skeletonLine, { width: 120 }]} />
                        <View style={[styles.skeletonLine, { width: 100, height: 10, marginTop: 6 }]} />
                    </View>
                    <View style={styles.skeletonRight}>
                        <View style={[styles.skeletonLine, { width: 60 }]} />
                    </View>
                </View>
            ))}
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={20} color={colors.foreground} />
                </Pressable>
                <Text style={styles.headerTitle}>Earnings History</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading && !refreshing ? (
                renderSkeleton()
            ) : (
                <FlatList
                    data={history}
                    keyExtractor={(item, index) => `${item.rawDate}-${index}`}
                    renderItem={renderItem}
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.card,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.foreground,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 100,
        flexGrow: 1,
    },
    historyCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
    },
    historyLeft: {},
    historyDate: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.foreground,
    },
    historyDeliveries: {
        fontSize: 12,
        color: colors.mutedForeground,
        marginTop: 4,
    },
    historyRight: {
        alignItems: 'flex-end',
    },
    historyAmount: {
        fontSize: 17,
        fontWeight: '800',
        color: colors.foreground,
    },
    historyTips: {
        fontSize: 12,
        color: colors.success,
        marginTop: 2,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        gap: 10,
    },
    emptyText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.foreground,
    },
    emptySubtext: {
        fontSize: 12,
        color: colors.mutedForeground,
        textAlign: 'center',
    },
    footerLoader: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    skeletonContainer: {
        paddingHorizontal: 16,
        gap: 10,
    },
    skeletonCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 14,
    },
    skeletonLeft: {},
    skeletonRight: {
        alignItems: 'flex-end',
    },
    skeletonLine: {
        height: 14,
        backgroundColor: colors.muted,
        borderRadius: 4,
    },
});
