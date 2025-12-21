import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, Phone, Package, Clock, Navigation, CheckCircle } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { mockActiveDeliveries, mockPendingDeliveries, mockCompletedDeliveries } from '../../lib/mockData';
import { router, useLocalSearchParams } from 'expo-router';

export default function DeliveryDetailScreen() {
    const { colors, isDark } = useTheme();
    const { id } = useLocalSearchParams<{ id: string }>();
    const styles = createStyles(colors, isDark);

    // Find delivery from all lists
    const allDeliveries = [...mockActiveDeliveries, ...mockPendingDeliveries, ...mockCompletedDeliveries];
    const delivery = allDeliveries.find(d => d.id === id);

    if (!delivery) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.backBtn}>
                        <ArrowLeft size={20} color={colors.foreground} />
                    </Pressable>
                    <Text style={styles.headerTitle}>Order Details</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>Delivery not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    const handleCall = () => {
        Linking.openURL(`tel:${delivery.customerPhone}`);
    };

    const handleNavigate = (address: string) => {
        const url = `https://maps.google.com/?q=${encodeURIComponent(address)}`;
        Linking.openURL(url);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={20} color={colors.foreground} />
                </Pressable>
                <Text style={styles.headerTitle}>Order Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Order Info */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.orderId}>#{delivery.orderId}</Text>
                        <Text style={styles.amount}>₹{delivery.amount + delivery.tip}</Text>
                    </View>
                    <View style={styles.statusRow}>
                        <View style={[styles.statusBadge, { backgroundColor: delivery.status === 'delivered' ? colors.success + '20' : colors.primary + '20' }]}>
                            <Text style={[styles.statusText, { color: delivery.status === 'delivered' ? colors.success : colors.primary }]}>
                                {delivery.status.replace('_', ' ').toUpperCase()}
                            </Text>
                        </View>
                        <Text style={styles.timeText}>{delivery.estimatedTime} • {delivery.distance}</Text>
                    </View>
                </View>

                {/* Customer Info */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Customer</Text>
                    <View style={styles.customerRow}>
                        <View style={styles.customerInfo}>
                            <Text style={styles.customerName}>{delivery.customerName}</Text>
                            <Text style={styles.customerPhone}>{delivery.customerPhone}</Text>
                        </View>
                        <Pressable onPress={handleCall} style={styles.callBtn}>
                            <Phone size={18} color={colors.white} />
                        </Pressable>
                    </View>
                </View>

                {/* Addresses */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Addresses</Text>

                    <Pressable style={styles.addressCard} onPress={() => handleNavigate(delivery.pickupAddress)}>
                        <View style={styles.addressLeft}>
                            <View style={[styles.addressDot, { backgroundColor: colors.success }]} />
                            <View style={styles.addressInfo}>
                                <Text style={styles.addressLabel}>Pickup</Text>
                                <Text style={styles.addressText}>{delivery.pickupAddress}</Text>
                            </View>
                        </View>
                        <Navigation size={18} color={colors.primary} />
                    </Pressable>

                    <View style={styles.addressDivider} />

                    <Pressable style={styles.addressCard} onPress={() => handleNavigate(delivery.deliveryAddress)}>
                        <View style={styles.addressLeft}>
                            <View style={[styles.addressDot, { backgroundColor: colors.destructive }]} />
                            <View style={styles.addressInfo}>
                                <Text style={styles.addressLabel}>Delivery</Text>
                                <Text style={styles.addressText}>{delivery.deliveryAddress}</Text>
                            </View>
                        </View>
                        <Navigation size={18} color={colors.primary} />
                    </Pressable>
                </View>

                {/* Items */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Items ({delivery.items.length})</Text>
                    {delivery.items.map((item, index) => (
                        <View key={index} style={styles.itemRow}>
                            <Package size={14} color={colors.mutedForeground} />
                            <Text style={styles.itemText}>{item}</Text>
                        </View>
                    ))}
                </View>

                {/* Payment Breakdown */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Payment</Text>
                    <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>Delivery Fee</Text>
                        <Text style={styles.paymentValue}>₹{delivery.amount}</Text>
                    </View>
                    <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>Tip</Text>
                        <Text style={styles.paymentValue}>₹{delivery.tip}</Text>
                    </View>
                    <View style={[styles.paymentRow, styles.paymentTotal]}>
                        <Text style={styles.paymentTotalLabel}>Total Earnings</Text>
                        <Text style={styles.paymentTotalValue}>₹{delivery.amount + delivery.tip}</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Actions */}
            {delivery.status !== 'delivered' && delivery.status !== 'cancelled' && (
                <View style={styles.bottomActions}>
                    {delivery.status === 'pending' && (
                        <Pressable style={styles.primaryBtn}>
                            <Text style={styles.primaryBtnText}>Accept Order</Text>
                        </Pressable>
                    )}
                    {delivery.status === 'accepted' && (
                        <Pressable style={styles.primaryBtn}>
                            <Text style={styles.primaryBtnText}>Mark as Picked Up</Text>
                        </Pressable>
                    )}
                    {delivery.status === 'picked_up' && (
                        <Pressable style={styles.primaryBtn}>
                            <Text style={styles.primaryBtnText}>Start Delivery</Text>
                        </Pressable>
                    )}
                    {delivery.status === 'in_transit' && (
                        <Pressable style={[styles.primaryBtn, { backgroundColor: colors.success }]}>
                            <CheckCircle size={18} color={colors.white} />
                            <Text style={styles.primaryBtnText}>Mark as Delivered</Text>
                        </Pressable>
                    )}
                </View>
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
        paddingHorizontal: 6,
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 6,
        paddingBottom: 100,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: colors.mutedForeground,
    },
    card: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    orderId: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.foreground,
    },
    amount: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.primary,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
    },
    timeText: {
        fontSize: 12,
        color: colors.mutedForeground,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.foreground,
        marginBottom: 12,
    },
    customerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    customerInfo: {},
    customerName: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.foreground,
    },
    customerPhone: {
        fontSize: 12,
        color: colors.mutedForeground,
        marginTop: 2,
    },
    callBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addressCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    addressLeft: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        flex: 1,
    },
    addressDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginTop: 4,
    },
    addressInfo: {
        flex: 1,
    },
    addressLabel: {
        fontSize: 11,
        color: colors.mutedForeground,
        marginBottom: 2,
    },
    addressText: {
        fontSize: 13,
        color: colors.foreground,
    },
    addressDivider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: 12,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 6,
    },
    itemText: {
        fontSize: 13,
        color: colors.foreground,
    },
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
    },
    paymentLabel: {
        fontSize: 13,
        color: colors.mutedForeground,
    },
    paymentValue: {
        fontSize: 13,
        color: colors.foreground,
    },
    paymentTotal: {
        borderTopWidth: 1,
        borderTopColor: colors.border,
        marginTop: 8,
        paddingTop: 10,
    },
    paymentTotalLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.foreground,
    },
    paymentTotalValue: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.primary,
    },
    bottomActions: {
        paddingHorizontal: 6,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.background,
    },
    primaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: colors.primary,
        paddingVertical: 14,
        borderRadius: 12,
    },
    primaryBtnText: {
        color: colors.white,
        fontSize: 15,
        fontWeight: '700',
    },
});
