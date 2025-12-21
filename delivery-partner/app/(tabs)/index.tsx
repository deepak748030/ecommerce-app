import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Switch, Dimensions, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Package, MapPin, Clock, IndianRupee, Bell, Moon, Sun, User } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { router } from 'expo-router';
import { deliveryPartnerAuthApi, getPartnerData, PartnerData, deliveryOrdersApi, DeliveryOrder } from '../../lib/api';
import { HomeScreenSkeleton } from '../../components/Skeleton';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
    const { colors, isDark, toggleTheme } = useTheme();
    const [partnerData, setPartnerData] = useState<PartnerData | null>(null);
    const [isOnline, setIsOnline] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [toggleLoading, setToggleLoading] = useState(false);
    const [acceptLoading, setAcceptLoading] = useState<string | null>(null);

    const [activeOrders, setActiveOrders] = useState<DeliveryOrder[]>([]);
    const [availableOrders, setAvailableOrders] = useState<DeliveryOrder[]>([]);

    const styles = createStyles(colors, isDark);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Load partner data
            const localData = await getPartnerData();
            if (localData) {
                setPartnerData(localData);
                setIsOnline(localData.isOnline || false);
            }

            const result = await deliveryPartnerAuthApi.getMe();
            if (result.success && result.response) {
                setPartnerData(result.response);
                setIsOnline(result.response.isOnline || false);
            }

            // Load orders
            await loadOrders();
        } catch (error) {
            console.log('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadOrders = async () => {
        try {
            const [activeResult, availableResult] = await Promise.all([
                deliveryOrdersApi.getActiveOrders(),
                deliveryOrdersApi.getAvailableOrders(),
            ]);

            if (activeResult.success && activeResult.response) {
                setActiveOrders(activeResult.response.data);
            }

            if (availableResult.success && availableResult.response) {
                setAvailableOrders(availableResult.response.data);
            }
        } catch (error) {
            console.log('Error loading orders:', error);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, []);

    const handleToggleOnline = async (value: boolean) => {
        if (toggleLoading) return;

        setToggleLoading(true);
        setIsOnline(value);

        try {
            const result = await deliveryPartnerAuthApi.toggleOnline();
            if (result.success && result.response) {
                setIsOnline(result.response.isOnline);
            } else {
                setIsOnline(!value);
            }
        } catch (error) {
            setIsOnline(!value);
        } finally {
            setToggleLoading(false);
        }
    };

    const handleAcceptOrder = async (orderId: string) => {
        if (acceptLoading) return;

        setAcceptLoading(orderId);
        try {
            const result = await deliveryOrdersApi.acceptOrder(orderId);
            if (result.success) {
                // Reload orders after accepting
                await loadOrders();
            }
        } catch (error) {
            console.log('Error accepting order:', error);
        } finally {
            setAcceptLoading(null);
        }
    };

    const activeCount = activeOrders.length;
    const pendingCount = availableOrders.length;
    const partnerName = partnerData?.name?.split(' ')[0] || 'Partner';

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={styles.logoContainer}>
                            <User size={24} color={colors.primary} />
                        </View>
                        <View>
                            <Text style={styles.greeting}>Loading...</Text>
                            <Text style={styles.subGreeting}>SwiftDrop Partner</Text>
                        </View>
                    </View>
                    <View style={styles.headerRight}>
                        <Pressable onPress={toggleTheme} style={styles.iconBtn}>
                            {isDark ? <Sun size={20} color={colors.foreground} /> : <Moon size={20} color={colors.foreground} />}
                        </Pressable>
                        <Pressable style={styles.iconBtn}>
                            <Bell size={20} color={colors.foreground} />
                        </Pressable>
                    </View>
                </View>
                <HomeScreenSkeleton />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.logoContainer}>
                        {partnerData?.avatar ? (
                            <Image source={{ uri: partnerData.avatar }} style={styles.avatarImage} />
                        ) : (
                            <User size={24} color={colors.primary} />
                        )}
                    </View>
                    <View>
                        <Text style={styles.greeting}>Hi, {partnerName}!</Text>
                        <Text style={styles.subGreeting}>SwiftDrop Partner</Text>
                    </View>
                </View>
                <View style={styles.headerRight}>
                    <Pressable onPress={toggleTheme} style={styles.iconBtn}>
                        {isDark ? <Sun size={20} color={colors.foreground} /> : <Moon size={20} color={colors.foreground} />}
                    </Pressable>
                    <Pressable style={styles.iconBtn}>
                        <Bell size={20} color={colors.foreground} />
                    </Pressable>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
            >
                {/* Online Status Card */}
                <View style={styles.statusCard}>
                    <View style={styles.statusLeft}>
                        <View style={[styles.statusDot, isOnline && styles.statusDotOnline]} />
                        <Text style={styles.statusText}>{isOnline ? 'You are Online' : 'You are Offline'}</Text>
                    </View>
                    <Switch
                        value={isOnline}
                        onValueChange={handleToggleOnline}
                        trackColor={{ false: colors.muted, true: colors.primary }}
                        thumbColor={colors.white}
                        disabled={toggleLoading}
                    />
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={[styles.statCard, { backgroundColor: colors.statCard1 }]}>
                        <IndianRupee size={18} color={colors.primary} />
                        <Text style={styles.statValue}>₹{partnerData?.earnings?.today || 0}</Text>
                        <Text style={styles.statLabel}>Today's Earnings</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: colors.statCard2 }]}>
                        <Package size={18} color={colors.primary} />
                        <Text style={styles.statValue}>{partnerData?.stats?.totalDeliveries || 0}</Text>
                        <Text style={styles.statLabel}>Total Deliveries</Text>
                    </View>
                </View>

                {/* Active Deliveries */}
                {activeCount > 0 && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Active Deliveries</Text>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{activeCount}</Text>
                            </View>
                        </View>
                        {activeOrders.map((delivery) => (
                            <Pressable
                                key={delivery.id}
                                style={styles.deliveryCard}
                                onPress={() => router.push({ pathname: '/delivery/[id]' as any, params: { id: delivery.id } })}
                            >
                                <View style={styles.deliveryHeader}>
                                    <Text style={styles.orderId}>#{delivery.orderId}</Text>
                                    <View style={[styles.statusBadge, delivery.status === 'accepted' ? styles.acceptedBadge : styles.pendingBadge]}>
                                        <Text style={styles.statusBadgeText}>{delivery.status.replace('_', ' ').toUpperCase()}</Text>
                                    </View>
                                </View>
                                <View style={styles.addressRow}>
                                    <MapPin size={14} color={colors.success} />
                                    <Text style={styles.addressText} numberOfLines={1}>{delivery.pickupAddress}</Text>
                                </View>
                                <View style={styles.addressRow}>
                                    <MapPin size={14} color={colors.destructive} />
                                    <Text style={styles.addressText} numberOfLines={1}>{delivery.deliveryAddress}</Text>
                                </View>
                                <View style={styles.deliveryFooter}>
                                    <View style={styles.infoRow}>
                                        <Clock size={12} color={colors.mutedForeground} />
                                        <Text style={styles.infoText}>{delivery.estimatedTime}</Text>
                                    </View>
                                    <Text style={styles.amountText}>₹{delivery.amount + delivery.tip}</Text>
                                </View>
                            </Pressable>
                        ))}
                    </>
                )}

                {/* New Orders Available */}
                {pendingCount > 0 && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>New Orders Available</Text>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{pendingCount}</Text>
                            </View>
                        </View>
                        {availableOrders.slice(0, 5).map((delivery) => (
                            <Pressable
                                key={delivery.id}
                                style={styles.deliveryCard}
                                onPress={() => router.push({ pathname: '/delivery/[id]' as any, params: { id: delivery.id } })}
                            >
                                <View style={styles.deliveryHeader}>
                                    <Text style={styles.orderId}>#{delivery.orderId}</Text>
                                    <Text style={styles.distanceText}>{delivery.distance}</Text>
                                </View>
                                <View style={styles.addressRow}>
                                    <MapPin size={14} color={colors.success} />
                                    <Text style={styles.addressText} numberOfLines={1}>{delivery.pickupAddress}</Text>
                                </View>
                                <View style={styles.addressRow}>
                                    <MapPin size={14} color={colors.destructive} />
                                    <Text style={styles.addressText} numberOfLines={1}>{delivery.deliveryAddress}</Text>
                                </View>
                                <View style={styles.deliveryFooter}>
                                    <Pressable
                                        style={[styles.acceptBtn, acceptLoading === delivery.id && styles.acceptBtnLoading]}
                                        onPress={() => handleAcceptOrder(delivery.id)}
                                        disabled={!!acceptLoading}
                                    >
                                        {acceptLoading === delivery.id ? (
                                            <ActivityIndicator size="small" color={colors.white} />
                                        ) : (
                                            <Text style={styles.acceptBtnText}>Accept Order</Text>
                                        )}
                                    </Pressable>
                                    <Text style={styles.amountText}>₹{delivery.amount + delivery.tip}</Text>
                                </View>
                            </Pressable>
                        ))}
                    </>
                )}

                {/* Empty State */}
                {activeCount === 0 && pendingCount === 0 && !loading && (
                    <View style={styles.emptyState}>
                        <Package size={48} color={colors.mutedForeground} />
                        <Text style={styles.emptyTitle}>No Orders Available</Text>
                        <Text style={styles.emptyText}>
                            {isOnline ? 'New orders will appear here when available' : 'Go online to receive orders'}
                        </Text>
                    </View>
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    logoContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    greeting: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.foreground,
    },
    subGreeting: {
        fontSize: 12,
        color: colors.mutedForeground,
    },
    headerRight: {
        flexDirection: 'row',
        gap: 8,
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.card,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 6,
        paddingBottom: 100,
    },
    statusCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.card,
        padding: 14,
        borderRadius: 12,
        marginBottom: 14,
    },
    statusLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.destructive,
    },
    statusDotOnline: {
        backgroundColor: colors.success,
    },
    statusText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.foreground,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 18,
    },
    statCard: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        gap: 6,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.foreground,
    },
    statLabel: {
        fontSize: 11,
        color: colors.mutedForeground,
        fontWeight: '500',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.foreground,
    },
    badge: {
        backgroundColor: colors.primary,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    badgeText: {
        color: colors.white,
        fontSize: 11,
        fontWeight: '700',
    },
    deliveryCard: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
    },
    deliveryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    orderId: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.foreground,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    acceptedBadge: {
        backgroundColor: colors.success + '20',
    },
    pendingBadge: {
        backgroundColor: colors.warning + '20',
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.foreground,
    },
    distanceText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.mutedForeground,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    addressText: {
        fontSize: 12,
        color: colors.foreground,
        flex: 1,
    },
    deliveryFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 8,
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
    amountText: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.primary,
    },
    acceptBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 8,
        minWidth: 100,
        alignItems: 'center',
    },
    acceptBtnLoading: {
        opacity: 0.7,
    },
    acceptBtnText: {
        color: colors.white,
        fontSize: 12,
        fontWeight: '700',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
        gap: 12,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.foreground,
    },
    emptyText: {
        fontSize: 13,
        color: colors.mutedForeground,
        textAlign: 'center',
    },
});
