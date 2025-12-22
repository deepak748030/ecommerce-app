import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking, Image, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, Phone, Package, Clock, Navigation, CheckCircle, Store, User, CreditCard } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { router, useLocalSearchParams } from 'expo-router';
import { deliveryOrdersApi, DeliveryOrder, DeliveryOrderItem, getPartnerData, PartnerData } from '../../lib/api';
import PickupOtpModal from '../../components/PickupOtpModal';
import { DeliveryDetailSkeleton } from '../../components/Skeleton';
import KycPendingModal from '../../components/KycPendingModal';

export default function DeliveryDetailScreen() {
    const { colors, isDark } = useTheme();
    const { id } = useLocalSearchParams<{ id: string }>();
    const styles = createStyles(colors, isDark);

    const [order, setOrder] = useState<DeliveryOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPickupOtpModal, setShowPickupOtpModal] = useState(false);
    const [showDeliveryOtpModal, setShowDeliveryOtpModal] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [showKycModal, setShowKycModal] = useState(false);
    const [partnerData, setPartnerData] = useState<PartnerData | null>(null);

    const fetchOrder = async () => {
        try {
            const result = await deliveryOrdersApi.getOrderById(id);
            if (result.success && result.response) {
                setOrder(result.response);
                setError(null);
            } else {
                setError(result.message || 'Failed to load order');
            }
        } catch (err) {
            setError('Failed to load order');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchOrder();
        }
        // Load partner data for KYC check
        const loadPartnerData = async () => {
            const data = await getPartnerData();
            setPartnerData(data);
        };
        loadPartnerData();
    }, [id]);

    const getKycStatus = (): 'pending' | 'under_review' | 'rejected' | 'verified' | null => {
        if (!partnerData) return null;
        const kycStatus = partnerData.kycStatus;
        if (kycStatus === 'approved') return 'verified';
        if (kycStatus === 'submitted') return 'under_review';
        if (kycStatus === 'rejected') return 'rejected';
        return 'pending';
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrder();
    };

    const handleCallCustomer = () => {
        if (order?.customerPhone) {
            Linking.openURL(`tel:${order.customerPhone}`);
        }
    };

    const handleCallVendor = () => {
        if (order?.vendorPhone) {
            Linking.openURL(`tel:${order.vendorPhone}`);
        }
    };

    const handleNavigate = (address: string) => {
        const url = `https://maps.google.com/?q=${encodeURIComponent(address)}`;
        Linking.openURL(url);
    };

    const handleAcceptOrder = async () => {
        if (!order) return;

        // Check KYC status before accepting
        const kycStatus = getKycStatus();
        if (kycStatus !== 'verified') {
            setShowKycModal(true);
            return;
        }

        setActionLoading(true);
        try {
            const result = await deliveryOrdersApi.acceptOrder(order.id);
            if (result.success) {
                fetchOrder();
            }
        } finally {
            setActionLoading(false);
        }
    };

    const kycStatusForModal = getKycStatus();

    const handleInitiatePickup = async () => {
        if (!order) return;
        setOtpLoading(true);
        try {
            const result = await deliveryOrdersApi.initiatePickup(order.id);
            if (result.success) {
                setShowPickupOtpModal(true);
            } else {
                Alert.alert('Error', result.message || 'Failed to send OTP');
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to send OTP');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleVerifyPickupOtp = async (otp: string): Promise<boolean> => {
        if (!order) return false;
        try {
            const result = await deliveryOrdersApi.verifyPickupOtp(order.id, otp);
            if (result.success) {
                setShowPickupOtpModal(false);
                fetchOrder();
                return true;
            }
            return false;
        } catch (err) {
            return false;
        }
    };

    const handleInitiateDelivery = async () => {
        if (!order) return;
        setOtpLoading(true);
        try {
            const result = await deliveryOrdersApi.initiateDelivery(order.id);
            if (result.success) {
                setShowDeliveryOtpModal(true);
            } else {
                Alert.alert('Error', result.message || 'Failed to send OTP');
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to send OTP');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleVerifyDeliveryOtp = async (otp: string): Promise<boolean> => {
        if (!order) return false;
        try {
            const result = await deliveryOrdersApi.verifyDeliveryOtp(order.id, otp);
            if (result.success) {
                setShowDeliveryOtpModal(false);
                router.back();
                return true;
            }
            return false;
        } catch (err) {
            return false;
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.backBtn}>
                        <ArrowLeft size={20} color={colors.foreground} />
                    </Pressable>
                    <Text style={styles.headerTitle}>Order Details</Text>
                    <View style={{ width: 40 }} />
                </View>
                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                    <DeliveryDetailSkeleton />
                </ScrollView>
            </SafeAreaView>
        );
    }

    if (error || !order) {
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
                    <Text style={styles.emptyText}>{error || 'Order not found'}</Text>
                </View>
            </SafeAreaView>
        );
    }

    const items = Array.isArray(order.items) ? order.items : [];
    const itemCount = order.itemCount || (typeof order.items === 'number' ? order.items : items.length);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={20} color={colors.foreground} />
                </Pressable>
                <Text style={styles.headerTitle}>Order Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
            >
                {/* Order Info */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.orderId}>#{order.orderId}</Text>
                        <Text style={styles.amount}>₹{order.amount + order.tip}</Text>
                    </View>
                    <View style={styles.statusRow}>
                        <View style={[styles.statusBadge, { backgroundColor: order.status === 'delivered' ? colors.success + '20' : colors.primary + '20' }]}>
                            <Text style={[styles.statusText, { color: order.status === 'delivered' ? colors.success : colors.primary }]}>
                                {order.status.replace('_', ' ').toUpperCase()}
                            </Text>
                        </View>
                        <Text style={styles.timeText}>{order.estimatedTime} • {order.distance}</Text>
                    </View>
                </View>

                {/* Vendor Info - Show phone only when order is accepted by this partner */}
                <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <Store size={16} color={colors.primary} />
                        <Text style={styles.sectionTitle}>Vendor / Pickup</Text>
                    </View>
                    <View style={styles.contactRow}>
                        <View style={styles.contactInfo}>
                            <Text style={styles.contactName}>Store</Text>
                            <Text style={styles.contactAddress}>{order.pickupAddress}</Text>
                            {order.isAcceptedByMe && order.vendorPhone && (
                                <Text style={styles.contactPhone}>{order.vendorPhone}</Text>
                            )}
                        </View>
                        <View style={styles.contactActions}>
                            {order.isAcceptedByMe && order.vendorPhone && (
                                <Pressable onPress={handleCallVendor} style={styles.callBtn}>
                                    <Phone size={18} color={colors.white} />
                                </Pressable>
                            )}
                            <Pressable onPress={() => handleNavigate(order.pickupAddress)} style={styles.navBtn}>
                                <Navigation size={18} color={colors.primary} />
                            </Pressable>
                        </View>
                    </View>
                </View>

                {/* Customer Info - Show phone only when order is accepted by this partner */}
                <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <User size={16} color={colors.primary} />
                        <Text style={styles.sectionTitle}>Customer / Delivery</Text>
                    </View>
                    <View style={styles.contactRow}>
                        <View style={styles.contactInfo}>
                            <Text style={styles.contactName}>{order.customerName}</Text>
                            <Text style={styles.contactAddress}>{order.deliveryAddress}</Text>
                            {order.isAcceptedByMe && order.customerPhone && (
                                <Text style={styles.contactPhone}>{order.customerPhone}</Text>
                            )}
                        </View>
                        <View style={styles.contactActions}>
                            {order.isAcceptedByMe && order.customerPhone && (
                                <Pressable onPress={handleCallCustomer} style={styles.callBtn}>
                                    <Phone size={18} color={colors.white} />
                                </Pressable>
                            )}
                            <Pressable onPress={() => handleNavigate(order.deliveryAddress)} style={styles.navBtn}>
                                <Navigation size={18} color={colors.primary} />
                            </Pressable>
                        </View>
                    </View>
                </View>

                {/* Items with Images */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Items ({itemCount})</Text>
                    {items.length > 0 ? (
                        items.map((item: DeliveryOrderItem, index: number) => (
                            <View key={item.id || index} style={styles.itemRow}>
                                {item.image ? (
                                    <Image source={{ uri: item.image }} style={styles.itemImage} />
                                ) : (
                                    <View style={styles.itemImagePlaceholder}>
                                        <Package size={20} color={colors.mutedForeground} />
                                    </View>
                                )}
                                <View style={styles.itemDetails}>
                                    <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                                    <View style={styles.itemMeta}>
                                        <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
                                        <Text style={styles.itemPrice}>₹{item.price}</Text>
                                    </View>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={styles.itemRow}>
                            <Package size={14} color={colors.mutedForeground} />
                            <Text style={styles.itemText}>{itemCount} items</Text>
                        </View>
                    )}
                </View>

                {/* Vendor-Set Delivery Details */}
                {(order.deliveryPayment !== undefined && order.deliveryPayment > 0) && (
                    <View style={[styles.card, styles.highlightCard]}>
                        <View style={styles.sectionHeader}>
                            <CreditCard size={16} color={colors.success} />
                            <Text style={[styles.sectionTitle, { color: colors.success }]}>Your Payment</Text>
                        </View>
                        <View style={styles.vendorDetailsGrid}>
                            <View style={styles.vendorDetailItem}>
                                <Text style={styles.vendorDetailLabel}>Amount</Text>
                                <Text style={styles.vendorDetailValue}>₹{order.deliveryPayment}</Text>
                            </View>
                            {order.deliveryTimeMinutes !== undefined && order.deliveryTimeMinutes > 0 && (
                                <View style={styles.vendorDetailItem}>
                                    <Text style={styles.vendorDetailLabel}>Time</Text>
                                    <Text style={styles.vendorDetailValue}>
                                        {order.deliveryTimeMinutes >= 60
                                            ? `${Math.floor(order.deliveryTimeMinutes / 60)}h ${order.deliveryTimeMinutes % 60}m`
                                            : `${order.deliveryTimeMinutes} min`
                                        }
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Payment Breakdown */}
                <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <CreditCard size={16} color={colors.primary} />
                        <Text style={styles.sectionTitle}>Order Payment</Text>
                    </View>
                    {order.paymentMethod && (
                        <View style={styles.paymentRow}>
                            <Text style={styles.paymentLabel}>Payment Method</Text>
                            <Text style={styles.paymentValue}>{order.paymentMethod.toUpperCase()}</Text>
                        </View>
                    )}
                    <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>Delivery Fee</Text>
                        <Text style={styles.paymentValue}>₹{order.amount}</Text>
                    </View>
                    <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>Tip</Text>
                        <Text style={styles.paymentValue}>₹{order.tip}</Text>
                    </View>
                    <View style={[styles.paymentRow, styles.paymentTotal]}>
                        <Text style={styles.paymentTotalLabel}>Your Earnings</Text>
                        <Text style={styles.paymentTotalValue}>₹{order.amount + order.tip}</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Actions */}
            {order.status !== 'delivered' && order.status !== 'cancelled' && (
                <View style={styles.bottomActions}>
                    {order.status === 'pending' && !order.isAcceptedByMe && (
                        <Pressable
                            style={[styles.primaryBtn, actionLoading && styles.disabledBtn]}
                            onPress={handleAcceptOrder}
                            disabled={actionLoading}
                        >
                            {actionLoading ? (
                                <ActivityIndicator color={colors.white} size="small" />
                            ) : (
                                <Text style={styles.primaryBtnText}>Accept Order</Text>
                            )}
                        </Pressable>
                    )}
                    {order.status === 'accepted' && order.isAcceptedByMe && (
                        <Pressable
                            style={[styles.primaryBtn, (actionLoading || otpLoading) && styles.disabledBtn]}
                            onPress={handleInitiatePickup}
                            disabled={actionLoading || otpLoading}
                        >
                            {otpLoading ? (
                                <ActivityIndicator color={colors.white} size="small" />
                            ) : (
                                <Text style={styles.primaryBtnText}>Mark as Picked Up</Text>
                            )}
                        </Pressable>
                    )}
                    {(order.status === 'picked_up' || order.status === 'out_for_delivery') && order.isAcceptedByMe && (
                        <Pressable
                            style={[styles.primaryBtn, { backgroundColor: colors.success }, (actionLoading || otpLoading) && styles.disabledBtn]}
                            onPress={handleInitiateDelivery}
                            disabled={actionLoading || otpLoading}
                        >
                            {otpLoading ? (
                                <ActivityIndicator color={colors.white} size="small" />
                            ) : (
                                <>
                                    <CheckCircle size={18} color={colors.white} />
                                    <Text style={styles.primaryBtnText}>Mark as Delivered</Text>
                                </>
                            )}
                        </Pressable>
                    )}
                </View>
            )}

            {/* Pickup OTP Modal */}
            <PickupOtpModal
                visible={showPickupOtpModal}
                onClose={() => setShowPickupOtpModal(false)}
                onVerify={handleVerifyPickupOtp}
                orderNumber={order?.orderId || ''}
                isLoading={otpLoading}
            />

            {/* Delivery OTP Modal */}
            <PickupOtpModal
                visible={showDeliveryOtpModal}
                onClose={() => setShowDeliveryOtpModal(false)}
                onVerify={handleVerifyDeliveryOtp}
                orderNumber={order?.orderId || ''}
                isLoading={otpLoading}
                title="Enter Delivery OTP"
                subtitle={`Ask the customer for the OTP to confirm delivery for order ${order?.orderId || ''}`}
                buttonText="Verify & Deliver"
                hintText="OTP is sent to the customer via notification"
            />

            {/* KYC Pending Modal */}
            <KycPendingModal
                visible={showKycModal}
                onClose={() => setShowKycModal(false)}
                kycStatus={kycStatusForModal === 'verified' ? null : kycStatusForModal}
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
    loadingState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
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
        marginBottom: 12,
    },
    highlightCard: {
        borderWidth: 2,
        borderColor: colors.success,
        backgroundColor: colors.success + '10',
    },
    vendorDetailsGrid: {
        flexDirection: 'row',
        gap: 20,
        marginTop: 8,
    },
    vendorDetailItem: {
        flex: 1,
    },
    vendorDetailLabel: {
        fontSize: 12,
        color: colors.mutedForeground,
        marginBottom: 4,
    },
    vendorDetailValue: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.success,
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
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.foreground,
    },
    contactRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    contactInfo: {
        flex: 1,
    },
    contactName: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.foreground,
        marginBottom: 4,
    },
    contactAddress: {
        fontSize: 12,
        color: colors.mutedForeground,
        lineHeight: 18,
    },
    contactPhone: {
        fontSize: 13,
        color: colors.primary,
        marginTop: 4,
        fontWeight: '500',
    },
    contactActions: {
        flexDirection: 'row',
        gap: 8,
    },
    callBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    navBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    itemImage: {
        width: 50,
        height: 50,
        borderRadius: 8,
        backgroundColor: colors.muted,
    },
    itemImagePlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 8,
        backgroundColor: colors.muted,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemDetails: {
        flex: 1,
    },
    itemName: {
        fontSize: 13,
        fontWeight: '500',
        color: colors.foreground,
        marginBottom: 4,
    },
    itemMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemQty: {
        fontSize: 12,
        color: colors.mutedForeground,
    },
    itemPrice: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.foreground,
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
        paddingHorizontal: 16,
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
    disabledBtn: {
        opacity: 0.7,
    },
});