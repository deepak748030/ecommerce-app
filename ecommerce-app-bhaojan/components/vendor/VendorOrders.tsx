import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    Pressable,
    ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { ShoppingBag, ChevronDown, CheckCircle } from 'lucide-react-native';
import { VendorOrder, getImageUrl } from '@/lib/api';
import { VendorOrderSkeleton } from '@/components/Skeleton';
import { ShippingModal } from './ShippingModal';

// Removed 'delivered' - vendors cannot mark as delivered
const STATUS_OPTIONS = [
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'cancelled', label: 'Cancelled' },
];

interface Props {
    orders: VendorOrder[];
    loading: boolean;
    updatingOrderId: string | null;
    onUpdateStatus: (orderId: string, newStatus: string, deliveryPayment?: number, deliveryTimeMinutes?: number) => void;
    onLoadMore?: () => void;
    loadingMore?: boolean;
    hasMore?: boolean;
}

export function VendorOrders({ orders, loading, updatingOrderId, onUpdateStatus, onLoadMore, loadingMore, hasMore }: Props) {
    const { colors } = useTheme();
    const styles = createStyles(colors);
    const [showStatusPicker, setShowStatusPicker] = useState<string | null>(null);
    const [showShippingModal, setShowShippingModal] = useState(false);
    const [selectedOrderForShipping, setSelectedOrderForShipping] = useState<VendorOrder | null>(null);

    const handleEndReached = useCallback(() => {
        if (onLoadMore && hasMore && !loadingMore) {
            onLoadMore();
        }
    }, [onLoadMore, hasMore, loadingMore]);

    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={colors.primary} />
            </View>
        );
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending': return colors.warning;
            case 'confirmed':
            case 'processing': return colors.primary;
            case 'shipped':
            case 'cancelled': return colors.destructive;
            default: return colors.mutedForeground;
        }
    };

    const formatStatus = (status: string) => {
        return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

    const handleStatusUpdate = (orderId: string, newStatus: string, order: VendorOrder) => {
        setShowStatusPicker(null);

        // If shipping, show the modal to get payment and time
        if (newStatus === 'shipped') {
            console.log('Opening shipping modal for order:', order.orderNumber);
            setSelectedOrderForShipping(order);
            // Use setTimeout to ensure state updates properly
            setTimeout(() => {
                setShowShippingModal(true);
            }, 100);
            return;
        }

        onUpdateStatus(orderId, newStatus);
    };

    const handleShippingConfirm = (deliveryPayment: number, deliveryTimeMinutes: number) => {
        if (selectedOrderForShipping) {
            onUpdateStatus(selectedOrderForShipping._id, 'shipped', deliveryPayment, deliveryTimeMinutes);
            setShowShippingModal(false);
            setSelectedOrderForShipping(null);
        }
    };

    const handleShippingModalClose = () => {
        setShowShippingModal(false);
        setSelectedOrderForShipping(null);
    };

    const renderOrderCard = ({ item }: { item: VendorOrder }) => (
        <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
                <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {formatStatus(item.status)}
                    </Text>
                </View>
            </View>

            <View style={styles.orderCustomer}>
                <Text style={styles.customerName}>{item.user?.name || 'N/A'}</Text>
                <Text style={styles.customerPhone}>{item.user?.phone || ''}</Text>
            </View>

            <View style={styles.orderItems}>
                {item.items.slice(0, 2).map((orderItem, index) => (
                    <View key={index} style={styles.orderItemRow}>
                        <Image source={{ uri: getImageUrl(orderItem.image) }} style={styles.orderItemImage} />
                        <View style={styles.orderItemInfo}>
                            <Text style={styles.orderItemName} numberOfLines={1}>{orderItem.name}</Text>
                            <Text style={styles.orderItemQty}>Qty: {orderItem.quantity} × ₹{orderItem.price}</Text>
                        </View>
                    </View>
                ))}
                {item.items.length > 2 && (
                    <Text style={styles.moreItems}>+{item.items.length - 2} more items</Text>
                )}
            </View>

            <View style={styles.orderFooter}>
                <Text style={styles.orderDate}>
                    {new Date(item.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                    })}
                </Text>
                <Text style={styles.orderTotal}>₹{item.vendorSubtotal}</Text>
            </View>

            {/* Update Status */}
            <View style={styles.updateStatusSection}>
                <Text style={styles.updateStatusLabel}>Status:</Text>
                <Pressable
                    style={styles.statusPickerButton}
                    onPress={() => setShowStatusPicker(showStatusPicker === item._id ? null : item._id)}
                    disabled={updatingOrderId === item._id}
                >
                    {updatingOrderId === item._id ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                        <>
                            <Text style={styles.statusPickerText}>{formatStatus(item.status)}</Text>
                            <ChevronDown size={16} color={colors.mutedForeground} />
                        </>
                    )}
                </Pressable>
            </View>

            {showStatusPicker === item._id && (
                <View style={styles.statusDropdown}>
                    {STATUS_OPTIONS.map((option) => (
                        <Pressable
                            key={option.value}
                            style={[
                                styles.statusOption,
                                item.status === option.value && styles.statusOptionSelected
                            ]}
                            onPress={() => handleStatusUpdate(item._id, option.value, item)}
                        >
                            <View style={[styles.statusDotSmall, { backgroundColor: getStatusColor(option.value) }]} />
                            <Text style={[
                                styles.statusOptionText,
                                item.status === option.value && styles.statusOptionTextSelected
                            ]}>
                                {option.label}
                            </Text>
                            {item.status === option.value && (
                                <CheckCircle size={14} color={colors.primary} />
                            )}
                        </Pressable>
                    ))}
                </View>
            )}
        </View>
    );

    if (loading) {
        return (
            <View style={styles.listContent}>
                {[1, 2, 3].map((i) => (
                    <VendorOrderSkeleton key={i} />
                ))}
            </View>
        );
    }

    if (orders.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <ShoppingBag size={60} color={colors.mutedForeground} />
                <Text style={styles.emptyTitle}>No Orders Yet</Text>
                <Text style={styles.emptyText}>Orders for your products will appear here</Text>
            </View>
        );
    }

    return (
        <>
            <FlatList
                data={orders}
                keyExtractor={(item) => item._id}
                renderItem={renderOrderCard}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.3}
                ListFooterComponent={renderFooter}
            />
            <ShippingModal
                visible={showShippingModal}
                orderNumber={selectedOrderForShipping?.orderNumber || ''}
                onClose={handleShippingModalClose}
                onConfirm={handleShippingConfirm}
                loading={updatingOrderId === selectedOrderForShipping?._id}
            />
        </>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
    loadingMore: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.foreground,
        marginTop: 16,
    },
    emptyText: {
        fontSize: 14,
        color: colors.mutedForeground,
        textAlign: 'center',
        marginTop: 8,
    },
    listContent: {
        paddingHorizontal: 6,
        paddingTop: 12,
        paddingBottom: 100,
    },
    orderCard: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: colors.border,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    orderNumber: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.foreground,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600',
    },
    orderCustomer: {
        marginBottom: 8,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    customerName: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.foreground,
    },
    customerPhone: {
        fontSize: 11,
        color: colors.mutedForeground,
    },
    orderItems: {
        gap: 6,
        marginBottom: 8,
    },
    orderItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    orderItemImage: {
        width: 36,
        height: 36,
        borderRadius: 6,
        backgroundColor: colors.muted,
    },
    orderItemInfo: {
        flex: 1,
        marginLeft: 8,
    },
    orderItemName: {
        fontSize: 12,
        fontWeight: '500',
        color: colors.foreground,
    },
    orderItemQty: {
        fontSize: 11,
        color: colors.mutedForeground,
    },
    moreItems: {
        fontSize: 11,
        color: colors.mutedForeground,
        fontStyle: 'italic',
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    orderDate: {
        fontSize: 11,
        color: colors.mutedForeground,
    },
    orderTotal: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.primary,
    },
    updateStatusSection: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    updateStatusLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.foreground,
    },
    statusPickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.secondary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        gap: 4,
    },
    statusPickerText: {
        fontSize: 12,
        fontWeight: '500',
        color: colors.foreground,
    },
    statusDropdown: {
        marginTop: 8,
        backgroundColor: colors.background,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    statusOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        gap: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    statusOptionSelected: {
        backgroundColor: colors.primary + '10',
    },
    statusDotSmall: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusOptionText: {
        flex: 1,
        fontSize: 13,
        color: colors.foreground,
    },
    statusOptionTextSelected: {
        fontWeight: '600',
        color: colors.primary,
    },
});
