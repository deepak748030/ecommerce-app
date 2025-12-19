import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { Heart, ShoppingBag } from 'lucide-react-native';
import EventCard from '@/components/EventCard';
import { Event } from '@/lib/mockData';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 20) / 2;

const mockWishlistItems: Event[] = [
    { id: '1', title: 'Premium Mangoes', price: 250, mrp: 300, rating: 4.7, reviews: 189, image: 'https://images.pexels.com/photos/918643/pexels-photo-918643.jpeg?auto=compress&cs=tinysrgb&w=300', badge: 'Premium', location: 'Tropical Store', images: [], fullLocation: '', category: '', description: '', date: '', time: '', services: [], vendor: { id: '', name: '', avatar: '', phone: '', email: '', experience: '' } },
    { id: '2', title: 'Denim Jeans', price: 1299, mrp: 1999, rating: 4.7, reviews: 892, image: 'https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=300', badge: 'Bestseller', location: 'Style Store', images: [], fullLocation: '', category: '', description: '', date: '', time: '', services: [], vendor: { id: '', name: '', avatar: '', phone: '', email: '', experience: '' } },
    { id: '3', title: 'Wireless Earbuds', price: 1999, mrp: 3499, rating: 4.8, reviews: 1234, image: 'https://images.pexels.com/photos/3780681/pexels-photo-3780681.jpeg?auto=compress&cs=tinysrgb&w=300', badge: 'Hot Deal', location: 'Tech Hub', images: [], fullLocation: '', category: '', description: '', date: '', time: '', services: [], vendor: { id: '', name: '', avatar: '', phone: '', email: '', experience: '' } },
    { id: '4', title: 'Running Shoes', price: 2999, mrp: 4999, rating: 4.9, reviews: 567, image: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=300', badge: 'Top Rated', location: 'Sports World', images: [], fullLocation: '', category: '', description: '', date: '', time: '', services: [], vendor: { id: '', name: '', avatar: '', phone: '', email: '', experience: '' } },
    { id: '5', title: 'Smart Watch', price: 3499, mrp: 5999, rating: 4.6, reviews: 445, image: 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=300', badge: 'New', location: 'Gadget Zone', images: [], fullLocation: '', category: '', description: '', date: '', time: '', services: [], vendor: { id: '', name: '', avatar: '', phone: '', email: '', experience: '' } },
    { id: '6', title: 'Fresh Strawberries', price: 180, mrp: 220, rating: 4.5, reviews: 234, image: 'https://images.pexels.com/photos/46174/strawberries-berries-fruit-freshness-46174.jpeg?auto=compress&cs=tinysrgb&w=300', badge: 'Organic', location: 'Farm Fresh', images: [], fullLocation: '', category: '', description: '', date: '', time: '', services: [], vendor: { id: '', name: '', avatar: '', phone: '', email: '', experience: '' } },
];

export default function WishlistScreen() {
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const [wishlistItems, setWishlistItems] = useState(mockWishlistItems);

    const removeItem = (id: string) => {
        setWishlistItems(prev => prev.filter(item => item.id !== id));
    };

    const styles = createStyles(colors);

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
                <Text style={styles.title}>Wishlist</Text>
                <View style={styles.badge}>
                    <Heart size={12} color={colors.white} fill={colors.white} />
                    <Text style={styles.badgeText}>{wishlistItems.length}</Text>
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
                            <View key={item.id} style={styles.cardWrapper}>
                                <EventCard
                                    event={item}
                                    isFavorite={true}
                                    onToggleFavorite={() => removeItem(item.id)}
                                />
                            </View>
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

const createStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
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
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EF4444',
        paddingHorizontal: 10,
        height: 26,
        borderRadius: 13,
        gap: 4,
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
        paddingHorizontal: 16,
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
        // paddingHorizontal: 24,
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
    cardWrapper: {
        width: CARD_WIDTH,
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
