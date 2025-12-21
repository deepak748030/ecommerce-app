import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useCart } from '@/hooks/useCart';
import { router } from 'expo-router';
import { Trash2, Plus, Minus, ShoppingBag, Truck, ArrowRight } from 'lucide-react-native';
import { CartItemSkeleton } from '@/components/Skeleton';

const { width } = Dimensions.get('window');

export default function CartScreen() {
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();
    const {
        cartItems,
        loading,
        updateQuantity,
        removeFromCart,
        subtotal,
        discount,
        delivery,
        total,
        refreshCart
    } = useCart();

    useEffect(() => {
        refreshCart();
    }, []);

    const handleUpdateQuantity = (productId: string, delta: number) => {
        updateQuantity(productId, delta);
    };

    const handleRemoveItem = (productId: string) => {
        removeFromCart(productId);
    };

    const styles = createStyles(colors, isDark);

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
                    <Text style={styles.title}>My Cart</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>0</Text>
                    </View>
                </View>
                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                    {[1, 2, 3].map((i) => (
                        <CartItemSkeleton key={i} />
                    ))}
                </ScrollView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
                <Text style={styles.title}>My Cart</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{cartItems.length}</Text>
                </View>
            </View>

            {cartItems.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <ShoppingBag size={80} color={colors.mutedForeground} strokeWidth={1} />
                    <Text style={styles.emptyTitle}>Your cart is empty</Text>
                    <Text style={styles.emptySubtitle}>Add items to start shopping</Text>
                    <Pressable style={styles.shopButton} onPress={() => router.push('/(tabs)')}>
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
                            <View key={item.productId} style={styles.cartItem}>
                                <Image
                                    source={{ uri: item.image }}
                                    style={styles.itemImage}
                                />
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                                    <Text style={styles.itemUnit}>per {item.unit}</Text>
                                    <View style={styles.priceRow}>
                                        <Text style={styles.itemPrice}>₹{item.price}</Text>
                                        {item.mrp > item.price && (
                                            <Text style={styles.itemMrp}>₹{item.mrp}</Text>
                                        )}
                                    </View>
                                </View>
                                <View style={styles.itemActions}>
                                    <Pressable style={styles.deleteButton} onPress={() => handleRemoveItem(item.productId)}>
                                        <Trash2 size={18} color={colors.destructive} />
                                    </Pressable>
                                    <View style={styles.quantityContainer}>
                                        <Pressable style={styles.qtyButton} onPress={() => handleUpdateQuantity(item.productId, -1)}>
                                            <Minus size={16} color={colors.foreground} />
                                        </Pressable>
                                        <Text style={styles.qtyText}>{item.quantity}</Text>
                                        <Pressable style={[styles.qtyButton, styles.qtyButtonAdd]} onPress={() => handleUpdateQuantity(item.productId, 1)}>
                                            <Plus size={16} color={colors.white} />
                                        </Pressable>
                                    </View>
                                </View>
                            </View>
                        ))}


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
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingHorizontal: 16,
        paddingBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    title: {
        fontSize: 17,
        fontWeight: '700',
        color: colors.foreground,
    },
    badge: {
        backgroundColor: colors.primary,
        minWidth: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    badgeText: {
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
        borderRadius: 10,
        padding: 10,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    itemImage: {
        width: 70,
        height: 70,
        borderRadius: 8,
        backgroundColor: colors.secondary,
    },
    itemInfo: {
        flex: 1,
        marginLeft: 12,
    },
    itemName: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.foreground,
        marginBottom: 2,
    },
    itemUnit: {
        fontSize: 11,
        color: colors.mutedForeground,
        marginBottom: 4,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.primary,
    },
    itemMrp: {
        fontSize: 12,
        color: colors.mutedForeground,
        textDecorationLine: 'line-through',
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
