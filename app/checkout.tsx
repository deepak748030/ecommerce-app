import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, Image, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, MapPin, CreditCard, Wallet, Smartphone, ChevronRight, ShieldCheck, Plus, Package, Tag, X, Check } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useCart } from '@/hooks/useCart';
import { useAddress, Address } from '@/hooks/useAddress';
import { ordersApi, couponsApi, getToken, Coupon } from '@/lib/api';
import { Banknote } from 'lucide-react-native';
import { SuccessModal } from '@/components/SuccessModal';

const paymentMethods = [
    { id: 'cod', name: 'Cash on Delivery', icon: Banknote, description: 'Pay when you receive' },
    { id: 'upi', name: 'UPI', icon: Smartphone, description: 'Pay using UPI apps' },
    { id: 'card', name: 'Credit/Debit Card', icon: CreditCard, description: 'Visa, Mastercard, RuPay' },
    { id: 'wallet', name: 'Wallet', icon: Wallet, description: 'Paytm, PhonePe, etc.' },
];

interface BuyNowItem {
    productId: string;
    name: string;
    price: number;
    mrp: number;
    quantity: number;
    image: string;
}

export default function CheckoutScreen() {
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const params = useLocalSearchParams();

    // Check if this is a direct "Buy Now" purchase
    const isBuyNow = params.buyNow === 'true';
    const buyNowItem: BuyNowItem | null = isBuyNow ? {
        productId: params.productId as string,
        name: params.productName as string,
        price: parseFloat(params.productPrice as string),
        mrp: parseFloat(params.productMrp as string),
        quantity: parseInt(params.quantity as string, 10),
        image: params.productImage as string,
    } : null;

    const { cartItems, subtotal: cartSubtotal, discount: cartDiscount, delivery: cartDelivery, tax: cartTax, total: cartTotal, itemCount: cartItemCount, loading: cartLoading, getCartForOrder, clearCart } = useCart();
    const { selectedAddress, addresses, loading: addressLoading } = useAddress();
    const [selectedPayment, setSelectedPayment] = useState('cod');
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [orderId, setOrderId] = useState<string | null>(null);

    // Coupon state
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponError, setCouponError] = useState('');

    // Calculate base totals
    const baseSubtotal = isBuyNow && buyNowItem ? buyNowItem.price * buyNowItem.quantity : cartSubtotal;
    const mrpTotal = isBuyNow && buyNowItem ? buyNowItem.mrp * buyNowItem.quantity : baseSubtotal;
    const itemCount = isBuyNow && buyNowItem ? buyNowItem.quantity : cartItemCount;

    // Calculate discount (coupon or default 10%)
    const couponDiscount = appliedCoupon?.discountAmount || 0;
    const defaultDiscount = appliedCoupon ? 0 : Math.round(baseSubtotal * 0.1);
    const totalDiscount = couponDiscount + defaultDiscount;

    const delivery = baseSubtotal > 500 ? 0 : 40;
    const tax = Math.round(baseSubtotal * 0.05);
    const total = baseSubtotal - totalDiscount + delivery + tax;

    // Get display items for showing what's being purchased
    const displayItems = isBuyNow && buyNowItem ? [{
        productId: buyNowItem.productId,
        name: buyNowItem.name,
        price: buyNowItem.price,
        quantity: buyNowItem.quantity,
        image: buyNowItem.image,
    }] : cartItems;

    useEffect(() => {
        const checkAuth = async () => {
            const token = await getToken();
            setIsAuthenticated(!!token);
            if (!token) {
                Alert.alert(
                    'Login Required',
                    'Please login to continue with checkout',
                    [
                        { text: 'Cancel', onPress: () => router.back() },
                        { text: 'Login', onPress: () => router.push('/auth/phone') }
                    ]
                );
            }
        };
        checkAuth();
    }, []);

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            setCouponError('Please enter a coupon code');
            return;
        }

        setCouponLoading(true);
        setCouponError('');

        try {
            const result = await couponsApi.validate(couponCode.trim(), baseSubtotal);

            if (result.success && result.response) {
                setAppliedCoupon(result.response);
                setCouponCode('');
                setCouponError('');
            } else {
                setCouponError(result.message || 'Invalid coupon code');
            }
        } catch (error) {
            console.error('Coupon validation error:', error);
            setCouponError('Failed to validate coupon');
        } finally {
            setCouponLoading(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponError('');
    };

    const styles = createStyles(colors);

    const handlePlaceOrder = async () => {
        if (!selectedAddress) {
            Alert.alert('Address Required', 'Please add a delivery address to continue');
            return;
        }

        if (!isBuyNow && cartItems.length === 0) {
            Alert.alert('Empty Cart', 'Your cart is empty');
            return;
        }

        setIsProcessing(true);

        try {
            let orderItems: { productId: string; quantity: number }[];

            if (isBuyNow && buyNowItem) {
                orderItems = [{
                    productId: buyNowItem.productId,
                    quantity: buyNowItem.quantity,
                }];
            } else {
                const cartForOrder = await getCartForOrder();
                if (cartForOrder.length === 0) {
                    Alert.alert('Error', 'Your cart is empty');
                    setIsProcessing(false);
                    return;
                }
                orderItems = cartForOrder.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                }));
            }

            const orderData = {
                items: orderItems,
                shippingAddress: {
                    name: selectedAddress.name,
                    phone: selectedAddress.phone,
                    address: selectedAddress.address,
                    city: selectedAddress.city,
                    state: selectedAddress.state,
                    pincode: selectedAddress.pincode,
                },
                paymentMethod: selectedPayment,
                promoCode: appliedCoupon?.code,
            };

            const result = await ordersApi.create(orderData);

            if (result.success && result.response) {
                setOrderId(result.response.order._id);

                if (!isBuyNow) {
                    await clearCart();
                }

                setShowSuccess(true);
            } else {
                Alert.alert('Order Failed', result.message || 'Failed to place order. Please try again.');
            }
        } catch (error) {
            console.error('Order creation error:', error);
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSuccessClose = () => {
        setShowSuccess(false);
        if (orderId) {
            router.replace(`/order/${orderId}` as any);
        } else {
            router.replace('/(tabs)');
        }
    };

    const loading = isBuyNow ? addressLoading : (cartLoading || addressLoading);

    if (loading || isAuthenticated === null) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                    <ArrowLeft size={22} color={colors.foreground} />
                </Pressable>
                <Text style={styles.headerTitle}>Checkout</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Items Being Purchased */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Items ({displayItems.length})</Text>
                        <Package size={18} color={colors.mutedForeground} />
                    </View>
                    <View style={styles.itemsCard}>
                        {displayItems.map((item) => (
                            <View key={item.productId} style={styles.itemRow}>
                                <Image source={{ uri: item.image }} style={styles.itemImage} />
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                                    <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                                </View>
                                <Text style={styles.itemPrice}>₹{(item.price * item.quantity).toLocaleString()}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Delivery Address */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Delivery Address</Text>
                        <Pressable onPress={() => router.push('/saved-addresses')}>
                            <Text style={styles.changeText}>{selectedAddress ? 'Change' : 'Add'}</Text>
                        </Pressable>
                    </View>

                    {selectedAddress ? (
                        <View style={styles.addressCard}>
                            <View style={styles.addressIcon}>
                                <MapPin size={20} color={colors.primary} />
                            </View>
                            <View style={styles.addressInfo}>
                                <View style={styles.addressTypeRow}>
                                    <Text style={styles.addressType}>{selectedAddress.type}</Text>
                                </View>
                                <Text style={styles.addressName}>{selectedAddress.name}</Text>
                                <Text style={styles.addressText}>{selectedAddress.address}</Text>
                                <Text style={styles.addressText}>{selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}</Text>
                                <Text style={styles.addressPhone}>{selectedAddress.phone}</Text>
                            </View>
                        </View>
                    ) : (
                        <Pressable style={styles.addAddressCard} onPress={() => router.push('/saved-addresses')}>
                            <Plus size={24} color={colors.primary} />
                            <Text style={styles.addAddressText}>Add Delivery Address</Text>
                        </Pressable>
                    )}
                </View>

                {/* Apply Coupon */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Apply Coupon</Text>
                    {appliedCoupon ? (
                        <View style={styles.appliedCouponCard}>
                            <View style={styles.appliedCouponInfo}>
                                <View style={styles.couponIconContainer}>
                                    <Tag size={18} color={colors.success} />
                                </View>
                                <View style={styles.appliedCouponText}>
                                    <Text style={styles.appliedCouponCode}>{appliedCoupon.code}</Text>
                                    <Text style={styles.appliedCouponSaving}>You save ₹{couponDiscount}</Text>
                                </View>
                            </View>
                            <Pressable style={styles.removeCouponButton} onPress={handleRemoveCoupon}>
                                <X size={18} color={colors.destructive} />
                            </Pressable>
                        </View>
                    ) : (
                        <View style={styles.couponInputContainer}>
                            <TextInput
                                style={styles.couponInput}
                                placeholder="Enter coupon code"
                                placeholderTextColor={colors.mutedForeground}
                                value={couponCode}
                                onChangeText={(text) => {
                                    setCouponCode(text.toUpperCase());
                                    setCouponError('');
                                }}
                                autoCapitalize="characters"
                                editable={!couponLoading}
                            />
                            <Pressable
                                style={[styles.applyButton, couponLoading && styles.disabledButton]}
                                onPress={handleApplyCoupon}
                                disabled={couponLoading}
                            >
                                {couponLoading ? (
                                    <ActivityIndicator size="small" color={colors.white} />
                                ) : (
                                    <Text style={styles.applyButtonText}>Apply</Text>
                                )}
                            </Pressable>
                        </View>
                    )}
                    {couponError ? (
                        <Text style={styles.couponError}>{couponError}</Text>
                    ) : null}
                </View>

                {/* Payment Method */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Method</Text>
                    <View style={styles.paymentOptions}>
                        {paymentMethods.map((method) => {
                            const IconComponent = method.icon;
                            const isSelected = selectedPayment === method.id;
                            return (
                                <Pressable
                                    key={method.id}
                                    style={[styles.paymentOption, isSelected && styles.paymentOptionSelected]}
                                    onPress={() => setSelectedPayment(method.id)}
                                >
                                    <View style={[styles.paymentIcon, isSelected && styles.paymentIconSelected]}>
                                        <IconComponent size={20} color={isSelected ? colors.white : colors.primary} />
                                    </View>
                                    <View style={styles.paymentInfo}>
                                        <Text style={styles.paymentName}>{method.name}</Text>
                                        <Text style={styles.paymentDesc}>{method.description}</Text>
                                    </View>
                                    <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                                        {isSelected && <View style={styles.radioInner} />}
                                    </View>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                {/* Order Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Order Summary</Text>
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</Text>
                            <Text style={styles.summaryValue}>₹{baseSubtotal}</Text>
                        </View>
                        {appliedCoupon ? (
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Coupon ({appliedCoupon.code})</Text>
                                <Text style={[styles.summaryValue, { color: colors.success }]}>-₹{couponDiscount}</Text>
                            </View>
                        ) : (
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Discount (10%)</Text>
                                <Text style={[styles.summaryValue, { color: colors.success }]}>-₹{defaultDiscount}</Text>
                            </View>
                        )}
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Delivery</Text>
                            <Text style={[styles.summaryValue, delivery === 0 && { color: colors.success }]}>
                                {delivery === 0 ? 'FREE' : `₹${delivery}`}
                            </Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Tax (5%)</Text>
                            <Text style={styles.summaryValue}>₹{tax}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalValue}>₹{total}</Text>
                        </View>
                    </View>
                </View>

                {/* Security Badge */}
                <View style={styles.securityBadge}>
                    <ShieldCheck size={18} color={colors.success} />
                    <Text style={styles.securityText}>Your payment information is secure</Text>
                </View>
            </ScrollView>

            {/* Place Order Button */}
            <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 12 }]}>
                <Pressable
                    style={[styles.placeOrderButton, (!selectedAddress || isProcessing) && styles.disabledButton]}
                    onPress={handlePlaceOrder}
                    disabled={!selectedAddress || isProcessing}
                >
                    {isProcessing ? (
                        <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                        <>
                            <Text style={styles.placeOrderText}>Place Order • ₹{total}</Text>
                            <ChevronRight size={20} color={colors.white} />
                        </>
                    )}
                </Pressable>
            </View>

            <SuccessModal
                isVisible={showSuccess}
                onClose={handleSuccessClose}
                title="Order Placed!"
                message="Your order has been placed successfully. You will receive a confirmation shortly."
            />
        </View>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
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
    section: {
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.foreground,
        marginBottom: 10,
    },
    changeText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.primary,
    },
    addressCard: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 14,
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: colors.border,
        gap: 12,
    },
    addAddressCard: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        borderStyle: 'dashed',
        gap: 8,
    },
    addAddressText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.primary,
    },
    itemsCard: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 12,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    itemImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: colors.secondary,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 13,
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
        color: colors.foreground,
    },
    appliedCouponCard: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: colors.success,
    },
    appliedCouponInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    couponIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: `${colors.success}20`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    appliedCouponText: {
        flex: 1,
    },
    appliedCouponCode: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.foreground,
    },
    appliedCouponSaving: {
        fontSize: 12,
        color: colors.success,
        fontWeight: '600',
    },
    removeCouponButton: {
        padding: 8,
    },
    couponInputContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    couponInput: {
        flex: 1,
        backgroundColor: colors.card,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 14,
        color: colors.foreground,
        borderWidth: 1,
        borderColor: colors.border,
    },
    applyButton: {
        backgroundColor: colors.primary,
        borderRadius: 10,
        paddingHorizontal: 20,
        justifyContent: 'center',
        minWidth: 80,
        alignItems: 'center',
    },
    applyButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.white,
    },
    couponError: {
        fontSize: 12,
        color: colors.destructive,
        marginTop: 8,
    },
    addressIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addressInfo: {
        flex: 1,
    },
    addressTypeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    addressType: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.foreground,
    },
    addressName: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.foreground,
        marginBottom: 2,
    },
    addressText: {
        fontSize: 12,
        color: colors.mutedForeground,
    },
    addressPhone: {
        fontSize: 12,
        color: colors.mutedForeground,
        marginTop: 4,
    },
    paymentOptions: {
        gap: 10,
    },
    paymentOption: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        gap: 12,
    },
    paymentOptionSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.secondary,
    },
    paymentIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    paymentIconSelected: {
        backgroundColor: colors.primary,
    },
    paymentInfo: {
        flex: 1,
    },
    paymentName: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.foreground,
    },
    paymentDesc: {
        fontSize: 11,
        color: colors.mutedForeground,
    },
    radioOuter: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioOuterSelected: {
        borderColor: colors.primary,
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.primary,
    },
    promoContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    promoInput: {
        flex: 1,
        backgroundColor: colors.card,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 14,
        color: colors.foreground,
        borderWidth: 1,
        borderColor: colors.border,
    },
    summaryCard: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.border,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    summaryLabel: {
        fontSize: 13,
        color: colors.mutedForeground,
    },
    summaryValue: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.foreground,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: 10,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
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
    securityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
    },
    securityText: {
        fontSize: 12,
        color: colors.mutedForeground,
    },
    bottomContainer: {
        paddingHorizontal: 6,
        paddingTop: 12,
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    placeOrderButton: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    disabledButton: {
        opacity: 0.6,
    },
    placeOrderText: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.white,
    },
}); 