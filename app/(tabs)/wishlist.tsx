import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { Heart, ShoppingBag, Trash2, Star, MapPin } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 12 - 8) / 2;

const mockWishlistItems = [
    { id: '1', title: 'Premium Mangoes', price: 250, mrp: 300, rating: 4.7, reviews: 189, image: 'https://images.pexels.com/photos/918643/pexels-photo-918643.jpeg?auto=compress&cs=tinysrgb&w=300', badge: 'Premium', location: 'Tropical Store' },
    { id: '2', title: 'Denim Jeans', price: 1299, mrp: 1999, rating: 4.7, reviews: 892, image: 'https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=300', badge: 'Bestseller', location: 'Style Store' },
    { id: '3', title: 'Wireless Earbuds', price: 1999, mrp: 3499, rating: 4.8, reviews: 1234, image: 'https://images.pexels.com/photos/3780681/pexels-photo-3780681.jpeg?auto=compress&cs=tinysrgb&w=300', badge: 'Hot Deal', location: 'Tech Hub' },
    { id: '4', title: 'Running Shoes', price: 2999, mrp: 4999, rating: 4.9, reviews: 567, image: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=300', badge: 'Top Rated', location: 'Sports World' },
    { id: '5', title: 'Smart Watch', price: 3499, mrp: 5999, rating: 4.6, reviews: 445, image: 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=300', badge: 'New', location: 'Gadget Zone' },
    { id: '6', title: 'Fresh Strawberries', price: 180, mrp: 220, rating: 4.5, reviews: 234, image: 'https://images.pexels.com/photos/46174/strawberries-berries-fruit-freshness-46174.jpeg?auto=compress&cs=tinysrgb&w=300', badge: 'Organic', location: 'Farm Fresh' },
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
                            <Pressable key={item.id} style={styles.card}>
                                <View style={styles.imageContainer}>
                                    <Image source={{ uri: item.image }} style={styles.image} />

                                    {item.badge && (
                                        <View style={styles.badge}>
                                            <Text style={styles.badgeText}>{item.badge}</Text>
                                        </View>
                                    )}

                                    {item.mrp && item.mrp > item.price && (
                                        <View style={styles.discountBadge}>
                                            <Text style={styles.discountText}>
                                                {Math.round(((item.mrp - item.price) / item.mrp) * 100)}% OFF
                                            </Text>
                                        </View>
                                    )}

                                    <Pressable
                                        style={styles.removeButton}
                                        onPress={() => removeItem(item.id)}
                                    >
                                        <Trash2 size={14} color={colors.destructive} />
                                    </Pressable>
                                </View>

                                <View style={styles.content}>
                                    <Text style={styles.cardTitle} numberOfLines={1}>
                                        {item.title}
                                    </Text>

                                    <View style={styles.locationRow}>
                                        <MapPin size={10} color={colors.mutedForeground} />
                                        <Text style={styles.location} numberOfLines={1}>
                                            {item.location}
                                        </Text>
                                    </View>

                                    <View style={styles.bottomRow}>
                                        <View style={styles.ratingContainer}>
                                            <Star size={10} color={colors.warning} fill={colors.warning} />
                                            <Text style={styles.rating}>
                                                {item.rating} ({item.reviews})
                                            </Text>
                                        </View>

                                        <View style={styles.priceSection}>
                                            <View style={styles.priceWrapper}>
                                                {item.mrp && item.mrp > item.price && (
                                                    <Text style={styles.mrpPrice}>₹{item.mrp.toLocaleString()}</Text>
                                                )}
                                                <Text style={styles.price}>₹{item.price.toLocaleString()}</Text>
                                            </View>
                                            <Pressable style={styles.bagButton}>
                                                <ShoppingBag size={14} color={colors.primaryForeground} />
                                            </Pressable>
                                        </View>
                                    </View>
                                </View>
                            </Pressable>
                        ))}
                    </View>

                    {/* Move All to Cart */}
                    <Pressable style={styles.moveAllButton}>
                        <ShoppingBag size={20} color={colors.white} />
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
        gap: 8,
    },
    card: {
        width: CARD_WIDTH,
        backgroundColor: colors.card,
        borderRadius: 6,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
        height: 175,
    },
    imageContainer: {
        position: 'relative',
    },
    image: {
        width: '100%',
        height: 85,
        resizeMode: 'cover',
    },
    badge: {
        position: 'absolute',
        top: 6,
        left: 6,
        backgroundColor: colors.warning,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeText: {
        color: colors.foreground,
        fontSize: 8,
        fontWeight: 'bold',
    },
    discountBadge: {
        position: 'absolute',
        top: 6,
        right: 30,
        backgroundColor: colors.success,
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 3,
    },
    discountText: {
        fontSize: 7,
        fontWeight: 'bold',
        color: colors.white,
    },
    removeButton: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: 5,
        borderRadius: 4,
    },
    content: {
        padding: 6,
        flex: 1,
        justifyContent: 'space-between',
    },
    cardTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.foreground,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    location: {
        fontSize: 10,
        color: colors.mutedForeground,
        flex: 1,
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    rating: {
        fontSize: 10,
        color: colors.mutedForeground,
    },
    priceSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    priceWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    mrpPrice: {
        fontSize: 9,
        color: colors.mutedForeground,
        textDecorationLine: 'line-through',
    },
    price: {
        fontSize: 11,
        fontWeight: 'bold',
        color: colors.primary,
    },
    bagButton: {
        backgroundColor: colors.primary,
        padding: 5,
        borderRadius: 4,
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
