import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, MapPin, CreditCard, Wallet, Smartphone, ChevronRight, ShieldCheck, Plus } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useCart } from '@/hooks/useCart';
import { useAddress, Address } from '@/hooks/useAddress';
import { getToken } from '@/lib/api';

const paymentMethods = [
    { id: 'upi', name: 'UPI', icon: Smartphone, description: 'Pay using UPI apps' },
    { id: 'card', name: 'Credit/Debit Card', icon: CreditCard, description: 'Visa, Mastercard, RuPay' },
    { id: 'wallet', name: 'Wallet', icon: Wallet, description: 'Paytm, PhonePe, etc.' },
];

export default function CheckoutScreen() {
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const { cartItems, subtotal, discount, delivery, tax, total, itemCount, loading: cartLoading } = useCart();
    const { selectedAddress, addresses, loading: addressLoading } = useAddress();
    const [selectedPayment, setSelectedPayment] = useState('upi');
    const [promoCode, setPromoCode] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

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

    const styles = createStyles(colors);

    const handlePlaceOrder = () => {
        if (!selectedAddress) {
            Alert.alert('Address Required', 'Please add a delivery address to continue');
            return;
        }

        if (cartItems.length === 0) {
            Alert.alert('Empty Cart', 'Your cart is empty');
            return;
        }

        router.push({
            pathname: '/payment',
            params: {
                paymentMethod: selectedPayment,
                promoCode: promoCode || ''
            }
        });
    };

    if (cartLoading || addressLoading || isAuthenticated === null) {
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

                {/* Promo Code */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Promo Code</Text>
                    <View style={styles.promoContainer}>
                        <TextInput
                            style={styles.promoInput}
                            placeholder="Enter promo code"
                            placeholderTextColor={colors.mutedForeground}
                            value={promoCode}
                            onChangeText={setPromoCode}
                        />
                        <Pressable style={styles.applyButton}>
                            <Text style={styles.applyButtonText}>Apply</Text>
                        </Pressable>
                    </View>
                </View>

                {/* Order Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Order Summary</Text>
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Subtotal ({itemCount} items)</Text>
                            <Text style={styles.summaryValue}>₹{subtotal}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Discount (10%)</Text>
                            <Text style={[styles.summaryValue, { color: colors.success }]}>-₹{discount}</Text>
                        </View>
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
                    style={[styles.placeOrderButton, !selectedAddress && styles.disabledButton]}
                    onPress={handlePlaceOrder}
                    disabled={!selectedAddress}
                >
                    <Text style={styles.placeOrderText}>Place Order • ₹{total}</Text>
                    <ChevronRight size={20} color={colors.white} />
                </Pressable>
            </View>
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
    applyButton: {
        backgroundColor: colors.primary,
        borderRadius: 10,
        paddingHorizontal: 20,
        justifyContent: 'center',
    },
    applyButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.white,
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
