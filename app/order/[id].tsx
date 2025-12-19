import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Package, MapPin, CreditCard, Clock, CheckCircle, Truck, Box, Star } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { ordersApi, reviewsApi, Order, ReviewableProduct, getImageUrl } from '@/lib/api';
import { ReviewModal } from '@/components/ReviewModal';

export default function OrderDetailScreen() {
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [reviewModalVisible, setReviewModalVisible] = useState(false);
    const [reviewableProducts, setReviewableProducts] = useState<ReviewableProduct[]>([]);
    const [canReview, setCanReview] = useState(false);

    const fetchOrder = useCallback(async () => {
        if (!id) return;
        try {
            setError(null);
            const result = await ordersApi.getById(id);
            if (result.success && result.response) {
                setOrder(result.response);
            } else {
                setError(result.message || 'Failed to fetch order');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [id]);

    useEffect(() => {
        fetchOrder();
    }, [fetchOrder]);

    // Check if user can review when order is delivered
    useEffect(() => {
        const checkCanReview = async () => {
            if (!id || !order || order.status !== 'delivered') {
                setCanReview(false);
                setReviewableProducts([]);
                return;
            }

            try {
                const result = await reviewsApi.canReviewOrder(id);
                if (result.success && result.response) {
                    setCanReview(result.response.canReview);
                    setReviewableProducts(result.response.reviewableProducts);
                }
            } catch (err) {
                console.error('Error checking review status:', err);
            }
        };

        checkCanReview();
    }, [id, order?.status]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchOrder();
    }, [fetchOrder]);

    const handleReviewSubmitted = async () => {
        // Refresh reviewable products after a review is submitted
        if (!id) return;
        try {
            const result = await reviewsApi.canReviewOrder(id);
            if (result.success && result.response) {
                setCanReview(result.response.canReview);
                setReviewableProducts(result.response.reviewableProducts);
            }
        } catch (err) {
            console.error('Error refreshing review status:', err);
        }
    };

    const handleCancelOrder = () => {
        Alert.alert(
            'Cancel Order',
            'Are you sure you want to cancel this order?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        if (!order) return;
                        setCancelling(true);
                        try {
                            const result = await ordersApi.cancel(order._id);
                            if (result.success && result.response) {
                                setOrder(result.response.order);
                                Alert.alert('Success', 'Order cancelled and refund initiated');
                            } else {
                                Alert.alert('Error', result.message || 'Failed to cancel order');
                            }
                        } catch (err) {
                            Alert.alert('Error', 'Network error. Please try again.');
                        } finally {
                            setCancelling(false);
                        }
                    }
                },
            ]
        );
    };

    const styles = createStyles(colors);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered': return colors.success;
            case 'shipped':
            case 'out_for_delivery': return colors.warning;
            case 'confirmed':
            case 'processing': return colors.primary;
            case 'cancelled': return colors.destructive;
            default: return colors.mutedForeground;
        }
    };

    const formatStatus = (status: string) => {
        return status.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getTimelineIcon = (status: string, completed: boolean) => {
        const color = completed ? colors.success : colors.mutedForeground;
        switch (status) {
            case 'Order Placed':
                return <Box size={16} color={color} />;
            case 'Order Confirmed':
                return <CheckCircle size={16} color={color} />;
            case 'Shipped':
                return <Package size={16} color={color} />;
            case 'Out for Delivery':
                return <Truck size={16} color={color} />;
            case 'Delivered':
                return <CheckCircle size={16} color={color} />;
            default:
                return <Clock size={16} color={color} />;
        }
    };

    const formatPaymentMethod = (method: string) => {
        switch (method) {
            case 'upi': return 'UPI';
            case 'card': return 'Credit/Debit Card';
            case 'wallet': return 'Wallet';
            case 'cod': return 'Cash on Delivery';
            default: return method;
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
                    <Pressable style={styles.backButton} onPress={() => router.back()}>
                        <ArrowLeft size={22} color={colors.foreground} />
                    </Pressable>
                    <Text style={styles.headerTitle}>Order Details</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </View>
        );
    }

    if (error || !order) {
        return (
            <View style={styles.container}>
                <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
                    <Pressable style={styles.backButton} onPress={() => router.back()}>
                        <ArrowLeft size={22} color={colors.foreground} />
                    </Pressable>
                    <Text style={styles.headerTitle}>Order Details</Text>
                </View>
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>{error || 'Order not found'}</Text>
                    <Pressable style={styles.retryButton} onPress={fetchOrder}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                    <ArrowLeft size={22} color={colors.foreground} />
                </Pressable>
                <Text style={styles.headerTitle}>Order Details</Text>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Order Summary Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View>
                            <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                            <Text style={styles.orderDate}>Placed on {formatDate(order.createdAt)}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                            <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                                {formatStatus(order.status)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Order Items */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Items ({order.items.length})</Text>
                    {order.items.map((item, index) => (
                        <View key={index} style={[styles.itemRow, index < order.items.length - 1 && styles.itemBorder]}>
                            <Image source={{ uri: getImageUrl(item.image) }} style={styles.itemImage} />
                            <View style={styles.itemInfo}>
                                <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                                <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                            </View>
                            <Text style={styles.itemPrice}>₹{item.price.toLocaleString()}</Text>
                        </View>
                    ))}
                </View>

                {/* Order Timeline */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Order Timeline</Text>
                    {order.timeline.map((step, index) => (
                        <View key={index} style={styles.timelineItem}>
                            <View style={styles.timelineIconContainer}>
                                {getTimelineIcon(step.status, step.completed)}
                                {index < order.timeline.length - 1 && (
                                    <View style={[styles.timelineLine, step.completed && styles.timelineLineCompleted]} />
                                )}
                            </View>
                            <View style={styles.timelineContent}>
                                <Text style={[styles.timelineStatus, step.completed && styles.timelineStatusCompleted]}>
                                    {step.status}
                                </Text>
                                <Text style={styles.timelineDate}>{formatDate(step.date)}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Shipping Address */}
                <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                        <MapPin size={18} color={colors.primary} />
                        <Text style={styles.sectionTitle}>Shipping Address</Text>
                    </View>
                    <Text style={styles.addressName}>{order.shippingAddress.name}</Text>
                    <Text style={styles.addressText}>{order.shippingAddress.address}</Text>
                    <Text style={styles.addressText}>
                        {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                    </Text>
                    <Text style={styles.addressPhone}>{order.shippingAddress.phone}</Text>
                </View>

                {/* Payment Info */}
                <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                        <CreditCard size={18} color={colors.primary} />
                        <Text style={styles.sectionTitle}>Payment Details</Text>
                    </View>
                    <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>Payment Method</Text>
                        <Text style={styles.paymentValue}>{formatPaymentMethod(order.paymentMethod)}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>Subtotal</Text>
                        <Text style={styles.paymentValue}>₹{order.subtotal.toLocaleString()}</Text>
                    </View>
                    <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>Shipping</Text>
                        <Text style={styles.paymentValue}>{order.shipping === 0 ? 'Free' : `₹${order.shipping}`}</Text>
                    </View>
                    <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>Tax</Text>
                        <Text style={styles.paymentValue}>₹{order.tax}</Text>
                    </View>
                    {order.discount > 0 && (
                        <View style={styles.paymentRow}>
                            <Text style={styles.paymentLabel}>Discount</Text>
                            <Text style={[styles.paymentValue, { color: colors.success }]}>-₹{order.discount}</Text>
                        </View>
                    )}
                    <View style={styles.divider} />
                    <View style={styles.paymentRow}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>₹{order.total.toLocaleString()}</Text>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    {['pending', 'confirmed', 'processing'].includes(order.status) && (
                        <Pressable
                            style={styles.cancelButton}
                            onPress={handleCancelOrder}
                            disabled={cancelling}
                        >
                            {cancelling ? (
                                <ActivityIndicator size="small" color={colors.destructive} />
                            ) : (
                                <Text style={styles.cancelButtonText}>Cancel Order</Text>
                            )}
                        </Pressable>
                    )}
                    {order.status === 'delivered' && canReview && (
                        <Pressable
                            style={styles.reviewButton}
                            onPress={() => setReviewModalVisible(true)}
                        >
                            <Star size={18} color={colors.warning} fill={colors.warning} />
                            <Text style={styles.reviewButtonText}>Write a Review</Text>
                        </Pressable>
                    )}
                    {order.status === 'delivered' && !canReview && reviewableProducts.length === 0 && (
                        <View style={styles.reviewedBadge}>
                            <CheckCircle size={16} color={colors.success} />
                            <Text style={[styles.reviewedText, { color: colors.success }]}>All items reviewed</Text>
                        </View>
                    )}
                    <Pressable style={styles.primaryButton} onPress={() => router.push('/help-support' as any)}>
                        <Text style={styles.primaryButtonText}>Need Help?</Text>
                    </Pressable>
                </View>
            </ScrollView>

            {/* Review Modal */}
            <ReviewModal
                visible={reviewModalVisible}
                onClose={() => setReviewModalVisible(false)}
                orderId={order._id}
                products={reviewableProducts}
                onReviewSubmitted={handleReviewSubmitted}
            />
        </View>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingHorizontal: 6,
        paddingVertical: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.foreground,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 6,
        paddingVertical: 12,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    orderNumber: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.foreground,
        marginBottom: 4,
    },
    orderDate: {
        fontSize: 13,
        color: colors.mutedForeground,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.foreground,
        marginBottom: 12,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    itemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    itemImage: {
        width: 56,
        height: 56,
        borderRadius: 8,
    },
    itemInfo: {
        flex: 1,
        marginLeft: 12,
    },
    itemName: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.foreground,
        marginBottom: 4,
    },
    itemQuantity: {
        fontSize: 12,
        color: colors.mutedForeground,
    },
    itemPrice: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.primary,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 0,
    },
    timelineIconContainer: {
        alignItems: 'center',
        marginRight: 12,
    },
    timelineLine: {
        width: 2,
        height: 30,
        backgroundColor: colors.border,
        marginTop: 4,
    },
    timelineLineCompleted: {
        backgroundColor: colors.success,
    },
    timelineContent: {
        flex: 1,
        paddingBottom: 20,
    },
    timelineStatus: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.mutedForeground,
        marginBottom: 2,
    },
    timelineStatusCompleted: {
        color: colors.foreground,
    },
    timelineDate: {
        fontSize: 12,
        color: colors.mutedForeground,
    },
    addressName: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.foreground,
        marginBottom: 4,
    },
    addressText: {
        fontSize: 13,
        color: colors.mutedForeground,
        lineHeight: 20,
    },
    addressPhone: {
        fontSize: 13,
        color: colors.primary,
        marginTop: 6,
    },
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    paymentLabel: {
        fontSize: 13,
        color: colors.mutedForeground,
    },
    paymentValue: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.foreground,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: 10,
    },
    totalLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.foreground,
    },
    totalValue: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.primary,
    },
    actionButtons: {
        gap: 10,
        marginTop: 8,
    },
    cancelButton: {
        backgroundColor: colors.destructive + '20',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.destructive,
    },
    cancelButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.destructive,
    },
    reviewButton: {
        backgroundColor: colors.warning + '20',
        borderRadius: 12,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    reviewButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.warning,
    },
    reviewedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
    },
    reviewedText: {
        fontSize: 13,
        fontWeight: '600',
    },
    secondaryButton: {
        backgroundColor: colors.secondary,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    secondaryButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.foreground,
    },
    primaryButton: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    primaryButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.white,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: colors.mutedForeground,
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: colors.white,
        fontSize: 14,
        fontWeight: '600',
    },
});