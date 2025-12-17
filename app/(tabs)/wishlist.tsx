import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { Heart, ShoppingCart, Trash2, Star, Share2 } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 12 - 10) / 2;

const mockWishlistItems = [
    { id: '1', name: 'Premium Mangoes', price: '₹250', originalPrice: '₹300', rating: 4.7, icon: '🥭', badge: 'Premium' },
    { id: '2', name: 'Denim Jeans', price: '₹1,299', originalPrice: '₹1,999', rating: 4.7, icon: '👖', badge: 'Bestseller' },
    { id: '3', name: 'Wireless Earbuds', price: '₹1,999', originalPrice: '₹3,499', rating: 4.8, icon: '🎧', badge: 'Hot Deal' },
    { id: '4', name: 'Running Shoes', price: '₹2,999', originalPrice: '₹4,999', rating: 4.9, icon: '👟', badge: 'Top Rated' },
    { id: '5', name: 'Smart Watch', price: '₹3,499', originalPrice: '₹5,999', rating: 4.6, icon: '⌚', badge: 'New' },
    { id: '6', name: 'Fresh Strawberries', price: '₹180', originalPrice: '₹220', rating: 4.5, icon: '🍓', badge: 'Organic' },
];

export default function WishlistScreen() {
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();
    const [wishlistItems, setWishlistItems] = useState(mockWishlistItems);

    const removeItem = (id: string) => {
        setWishlistItems(prev => prev.filter(item => item.id !== id));
    };

    const styles = createStyles(colors, isDark);

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <Text style={styles.title}>Wishlist</Text>
                <View style={styles.itemCount}>
                    <Heart size={14} color={colors.white} fill={colors.white} />
                    <Text style={styles.itemCountText}>{wishlistItems.length}</Text>
                </View>
            </View>

            {wishlistItems.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Heart size={80} color={colors.mutedForeground} strokeWidth={1} />
                    <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
                    <Text style={styles.emptySubtitle}>Save items you love to buy later</Text>
                    <Pressable style={styles.exploreButton}>
                        <Text style={styles.exploreButtonText}>Explore Products</Text>
                    </Pressable>
                </View>
            ) : (
                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                    <View style={styles.gridContainer}>
                        {wishlistItems.map((item) => (
                            <View key={item.id} style={styles.productCard}>
                                <View style={styles.productBadge}>
                                    <Text style={styles.productBadgeText}>{item.badge}</Text>
                                </View>
                                <Pressable style={styles.removeButton} onPress={() => removeItem(item.id)}>
                                    <Trash2 size={16} color={colors.destructive} />
                                </Pressable>
                                <View style={styles.productIconContainer}>
                                    <Text style={styles.productIcon}>{item.icon}</Text>
                                </View>
                                <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                                <View style={styles.ratingRow}>
                                    <Star size={12} color="#F59E0B" fill="#F59E0B" />
                                    <Text style={styles.ratingText}>{item.rating}</Text>
                                </View>
                                <View style={styles.priceRow}>
                                    <Text style={styles.productPrice}>{item.price}</Text>
                                    <Text style={styles.originalPrice}>{item.originalPrice}</Text>
                                </View>
                                <View style={styles.actionButtons}>
                                    <Pressable style={styles.shareButton}>
                                        <Share2 size={16} color={colors.primary} />
                                    </Pressable>
                                    <Pressable style={styles.addToCartButton}>
                                        <ShoppingCart size={16} color={colors.white} />
                                        <Text style={styles.addToCartText}>Add</Text>
                                    </Pressable>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Move All to Cart */}
                    <Pressable style={styles.moveAllButton}>
                        <ShoppingCart size={20} color={colors.white} />
                        <Text style={styles.moveAllText}>Move All to Cart</Text>
                    </Pressable>
                </ScrollView>
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
        fontSize: 24,
        fontWeight: '800',
        color: colors.foreground,
    },
    itemCount: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EF4444',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 6,
    },
    itemCountText: {
        color: colors.white,
        fontSize: 13,
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
    exploreButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 24,
    },
    exploreButtonText: {
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
        paddingBottom: 100,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 10,
    },
    productCard: {
        width: CARD_WIDTH,
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 0,
    },
    productBadge: {
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: colors.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        zIndex: 1,
    },
    productBadgeText: {
        color: colors.white,
        fontSize: 9,
        fontWeight: '700',
    },
    removeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    productIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
        marginTop: 20,
        alignSelf: 'center',
    },
    productIcon: {
        fontSize: 30,
    },
    productName: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.foreground,
        marginBottom: 4,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        gap: 4,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.foreground,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 10,
    },
    productPrice: {
        fontSize: 14,
        fontWeight: '800',
        color: colors.primary,
    },
    originalPrice: {
        fontSize: 11,
        color: colors.mutedForeground,
        textDecorationLine: 'line-through',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    shareButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addToCartButton: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: colors.primary,
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    addToCartText: {
        color: colors.white,
        fontSize: 12,
        fontWeight: '700',
    },
    moveAllButton: {
        flexDirection: 'row',
        backgroundColor: colors.primary,
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginTop: 20,
    },
    moveAllText: {
        color: colors.white,
        fontSize: 15,
        fontWeight: '700',
    },
});
