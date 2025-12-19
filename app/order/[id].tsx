import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Package, MapPin, CreditCard, Clock, CheckCircle, Truck, Box } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

const mockOrderDetails: Record<string, any> = {
    '1': {
        id: '1',
        orderNumber: 'ORD-2024-001',
        date: 'Dec 15, 2024',
        status: 'Delivered',
        deliveredDate: 'Dec 18, 2024',
        total: 2499,
        subtotal: 2299,
        shipping: 100,
        discount: 0,
        tax: 100,
        paymentMethod: 'UPI',
        shippingAddress: {
            name: 'John Doe',
            phone: '+91 9876543210',
            address: '123 Main Street, Apartment 4B',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001',
        },
        items: [
            {
                id: '1',
                name: 'Diamond Pendant Necklace',
                price: 1299,
                quantity: 1,
                image: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=300',
            },
            {
                id: '2',
                name: 'Gold Hoop Earrings',
                price: 699,
                quantity: 1,
                image: 'https://images.pexels.com/photos/1191531/pexels-photo-1191531.jpeg?auto=compress&cs=tinysrgb&w=300',
            },
            {
                id: '3',
                name: 'Silver Bracelet',
                price: 301,
                quantity: 1,
                image: 'https://images.pexels.com/photos/1453008/pexels-photo-1453008.jpeg?auto=compress&cs=tinysrgb&w=300',
            },
        ],
        timeline: [
            { status: 'Order Placed', date: 'Dec 15, 2024 10:30 AM', completed: true },
            { status: 'Order Confirmed', date: 'Dec 15, 2024 11:00 AM', completed: true },
            { status: 'Shipped', date: 'Dec 16, 2024 02:00 PM', completed: true },
            { status: 'Out for Delivery', date: 'Dec 18, 2024 09:00 AM', completed: true },
            { status: 'Delivered', date: 'Dec 18, 2024 03:30 PM', completed: true },
        ],
    },
    '2': {
        id: '2',
        orderNumber: 'ORD-2024-002',
        date: 'Dec 12, 2024',
        status: 'In Transit',
        deliveredDate: null,
        total: 1299,
        subtotal: 1199,
        shipping: 50,
        discount: 0,
        tax: 50,
        paymentMethod: 'Card',
        shippingAddress: {
            name: 'John Doe',
            phone: '+91 9876543210',
            address: '123 Main Street, Apartment 4B',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001',
        },
        items: [
            {
                id: '1',
                name: 'Pearl Drop Earrings',
                price: 799,
                quantity: 1,
                image: 'https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=300',
            },
            {
                id: '2',
                name: 'Rose Gold Ring',
                price: 500,
                quantity: 1,
                image: 'https://images.pexels.com/photos/1616096/pexels-photo-1616096.jpeg?auto=compress&cs=tinysrgb&w=300',
            },
        ],
        timeline: [
            { status: 'Order Placed', date: 'Dec 12, 2024 02:15 PM', completed: true },
            { status: 'Order Confirmed', date: 'Dec 12, 2024 02:45 PM', completed: true },
            { status: 'Shipped', date: 'Dec 13, 2024 10:00 AM', completed: true },
            { status: 'Out for Delivery', date: 'Expected Dec 20, 2024', completed: false },
            { status: 'Delivered', date: '-', completed: false },
        ],
    },
    '3': {
        id: '3',
        orderNumber: 'ORD-2024-003',
        date: 'Dec 10, 2024',
        status: 'Processing',
        deliveredDate: null,
        total: 899,
        subtotal: 849,
        shipping: 0,
        discount: 0,
        tax: 50,
        paymentMethod: 'Net Banking',
        shippingAddress: {
            name: 'John Doe',
            phone: '+91 9876543210',
            address: '123 Main Street, Apartment 4B',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001',
        },
        items: [
            {
                id: '1',
                name: 'Emerald Stud Earrings',
                price: 899,
                quantity: 1,
                image: 'https://images.pexels.com/photos/3780681/pexels-photo-3780681.jpeg?auto=compress&cs=tinysrgb&w=300',
            },
        ],
        timeline: [
            { status: 'Order Placed', date: 'Dec 10, 2024 09:00 AM', completed: true },
            { status: 'Order Confirmed', date: 'Dec 10, 2024 09:30 AM', completed: true },
            { status: 'Shipped', date: 'Processing...', completed: false },
            { status: 'Out for Delivery', date: '-', completed: false },
            { status: 'Delivered', date: '-', completed: false },
        ],
    },
};

export default function OrderDetailScreen() {
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const { id } = useLocalSearchParams<{ id: string }>();

    const order = mockOrderDetails[id || '1'];

    const styles = createStyles(colors);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Delivered': return colors.success;
            case 'In Transit': return colors.warning;
            case 'Processing': return colors.primary;
            case 'Cancelled': return colors.destructive;
            default: return colors.mutedForeground;
        }
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

    if (!order) {
        return (
            <View style={styles.container}>
                <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
                    <Pressable style={styles.backButton} onPress={() => router.back()}>
                        <ArrowLeft size={22} color={colors.foreground} />
                    </Pressable>
                    <Text style={styles.headerTitle}>Order Details</Text>
                </View>
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>Order not found</Text>
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

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Order Summary Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View>
                            <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                            <Text style={styles.orderDate}>Placed on {order.date}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                            <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>{order.status}</Text>
                        </View>
                    </View>
                </View>

                {/* Order Items */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Items ({order.items.length})</Text>
                    {order.items.map((item: any, index: number) => (
                        <View key={item.id} style={[styles.itemRow, index < order.items.length - 1 && styles.itemBorder]}>
                            <Image source={{ uri: item.image }} style={styles.itemImage} />
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
                    {order.timeline.map((step: any, index: number) => (
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
                                <Text style={styles.timelineDate}>{step.date}</Text>
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
                        <Text style={styles.paymentValue}>{order.paymentMethod}</Text>
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
                    {order.status === 'Delivered' && (
                        <Pressable style={styles.secondaryButton}>
                            <Text style={styles.secondaryButtonText}>Write a Review</Text>
                        </Pressable>
                    )}
                    <Pressable style={styles.primaryButton}>
                        <Text style={styles.primaryButtonText}>Need Help?</Text>
                    </Pressable>
                </View>
            </ScrollView>
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
        alignItems: 'center',
        marginBottom: 8,
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
        fontSize: 16,
        fontWeight: '800',
        color: colors.primary,
    },
    actionButtons: {
        gap: 10,
        marginTop: 8,
    },
    primaryButton: {
        backgroundColor: colors.primary,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: colors.white,
        fontSize: 15,
        fontWeight: '700',
    },
    secondaryButton: {
        backgroundColor: colors.secondary,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    secondaryButtonText: {
        color: colors.foreground,
        fontSize: 15,
        fontWeight: '600',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: colors.mutedForeground,
    },
});
