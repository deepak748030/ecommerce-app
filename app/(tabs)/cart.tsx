import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { router } from 'expo-router';
import { Trash2, Plus, Minus, ShoppingBag, Truck, Tag, ArrowRight } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const mockCartItems = [
    { id: '1', name: 'Fresh Apples', price: 120, quantity: 2, icon: '🍎', unit: 'kg' },
    { id: '2', name: 'Summer T-Shirt', price: 599, quantity: 1, icon: '👕', unit: 'pc' },
    { id: '3', name: 'Organic Bananas', price: 60, quantity: 3, icon: '🍌', unit: 'dozen' },
    { id: '4', name: 'Sneakers', price: 2499, quantity: 1, icon: '👟', unit: 'pair' },
];

export default function CartScreen() {
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();
    const [cartItems, setCartItems] = useState(mockCartItems);

    const updateQuantity = (id: string, delta: number) => {
        setCartItems(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const removeItem = (id: string) => {
        setCartItems(prev => prev.filter(item => item.id !== id));
    };

    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const delivery = subtotal > 500 ? 0 : 40;
    const discount = Math.round(subtotal * 0.1);
    const total = subtotal - discount + delivery;

    const styles = createStyles(colors, isDark);

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <Text style={styles.title}>My Cart</Text>
                <View style={styles.itemCount}>
                    <Text style={styles.itemCountText}>{cartItems.length} items</Text>
                </View>
            </View>

            {cartItems.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <ShoppingBag size={80} color={colors.mutedForeground} strokeWidth={1} />
                    <Text style={styles.emptyTitle}>Your cart is empty</Text>
                    <Text style={styles.emptySubtitle}>Add items to start shopping</Text>
                    <Pressable style={styles.shopButton}>
                        <Text style={styles.shopButtonText}>Start Shopping</Text>
                    </Pressable>
                </View>
            ) : (
                <>
                    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                        {/* Free Delivery Banner */}
                        {subtotal < 500 && (
                            <View style={styles.deliveryBanner}>
                                <Truck size={18} color={colors.primary} />
                                <Text style={styles.deliveryText}>
                                    Add ₹{500 - subtotal} more for <Text style={styles.freeText}>FREE delivery</Text>
                                </Text>
                            </View>
                        )}

                        {/* Cart Items */}
                        {cartItems.map((item) => (
                            <View key={item.id} style={styles.cartItem}>
                                <View style={styles.itemIconContainer}>
                                    <Text style={styles.itemIcon}>{item.icon}</Text>
                                </View>
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemName}>{item.name}</Text>
                                    <Text style={styles.itemUnit}>per {item.unit}</Text>
                                    <Text style={styles.itemPrice}>₹{item.price}</Text>
                                </View>
                                <View style={styles.itemActions}>
                                    <Pressable style={styles.deleteButton} onPress={() => removeItem(item.id)}>
                                        <Trash2 size={18} color={colors.destructive} />
                                    </Pressable>
                                    <View style={styles.quantityContainer}>
                                        <Pressable style={styles.qtyButton} onPress={() => updateQuantity(item.id, -1)}>
                                            <Minus size={16} color={colors.foreground} />
                                        </Pressable>
                                        <Text style={styles.qtyText}>{item.quantity}</Text>
                                        <Pressable style={[styles.qtyButton, styles.qtyButtonAdd]} onPress={() => updateQuantity(item.id, 1)}>
                                            <Plus size={16} color={colors.white} />
                                        </Pressable>
                                    </View>
                                </View>
                            </View>
                        ))}

                        {/* Coupon Section */}
                        <Pressable style={styles.couponSection}>
                            <Tag size={20} color={colors.primary} />
                            <Text style={styles.couponText}>Apply Coupon Code</Text>
                            <ArrowRight size={18} color={colors.mutedForeground} />
                        </Pressable>

                        {/* Order Summary */}
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryTitle}>Order Summary</Text>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Subtotal</Text>
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
                            <View style={styles.divider} />
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Total</Text>
                                <Text style={styles.totalValue}>₹{total}</Text>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Checkout Button */}
                    <View style={[styles.checkoutContainer, { paddingBottom: 12 }]}>
                        <Pressable style={styles.checkoutButton} onPress={() => router.push('/checkout' as any)}>
                            <View style={styles.checkoutInfo}>
                                <Text style={styles.checkoutTotal}>₹{total}</Text>
                                <Text style={styles.checkoutItems}>{cartItems.length} items</Text>
                            </View>
                            <View style={styles.checkoutAction}>
                                <Text style={styles.checkoutText}>Checkout</Text>
                                <ArrowRight size={20} color={colors.white} />
                            </View>
                        </Pressable>
                    </View>
                </>
            )}
        </View>
    );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        paddingHorizontal: 6,
        paddingBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.foreground,
    },
    itemCount: {
        backgroundColor: colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    itemCountText: {
        color: colors.white,
        fontSize: 12,
        fontWeight: '700',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.foreground,
        marginTop: 20,
    },
    emptySubtitle: {
        fontSize: 14,
        color: colors.mutedForeground,
        marginTop: 8,
    },
    shopButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 24,
    },
    shopButtonText: {
        color: colors.white,
        fontSize: 14,
        fontWeight: '700',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 6,
        paddingTop: 12,
        paddingBottom: 20,
    },
    deliveryBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.secondary,
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
        gap: 10,
    },
    deliveryText: {
        fontSize: 13,
        color: colors.foreground,
        flex: 1,
    },
    freeText: {
        fontWeight: '700',
        color: colors.primary,
    },
    cartItem: {
        backgroundColor: colors.card,
        borderRadius: 3,
        padding: 6,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 0,
        borderWidth: 1,
        borderColor: colors.border,
    },
    itemIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 4,
        backgroundColor: colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    itemIcon: {
        fontSize: 30,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.foreground,
        marginBottom: 2,
    },
    itemUnit: {
        fontSize: 11,
        color: colors.mutedForeground,
        marginBottom: 4,
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.primary,
    },
    itemActions: {
        alignItems: 'flex-end',
        gap: 10,
    },
    deleteButton: {
        padding: 6,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.secondary,
        borderRadius: 10,
        overflow: 'hidden',
    },
    qtyButton: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    qtyButtonAdd: {
        backgroundColor: colors.primary,
    },
    qtyText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.foreground,
        width: 32,
        textAlign: 'center',
    },
    couponSection: {
        backgroundColor: colors.card,
        borderRadius: 14,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
        borderStyle: 'dashed',
        gap: 12,
    },
    couponText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: colors.foreground,
    },
    summaryCard: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: colors.border,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.foreground,
        marginBottom: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    summaryLabel: {
        fontSize: 14,
        color: colors.mutedForeground,
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.foreground,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: 12,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.foreground,
    },
    totalValue: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.primary,
    },
    checkoutContainer: {
        paddingHorizontal: 6,
        paddingTop: 12,
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    checkoutButton: {
        backgroundColor: colors.primary,
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    checkoutInfo: {},
    checkoutTotal: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.white,
    },
    checkoutItems: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.8)',
    },
    checkoutAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    checkoutText: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.white,
    },
});
