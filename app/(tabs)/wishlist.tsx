import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { Heart, ShoppingBag } from 'lucide-react-native';
import EventCard from '@/components/EventCard';
import { Product, productsApi } from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 20) / 2;
const FAVORITES_KEY = 'favorites';

export default function WishlistScreen() {
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
    const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchWishlistProducts = useCallback(async () => {
        try {
            const stored = await AsyncStorage.getItem(FAVORITES_KEY);
            const ids = stored ? JSON.parse(stored) : [];
            setFavoriteIds(ids);

            if (ids.length === 0) {
                setWishlistItems([]);
                setLoading(false);
                setRefreshing(false);
                return;
            }

            // Fetch all products and filter by favorite IDs
            const response = await productsApi.getAll({ limit: 100 });
            if (response.success && response.response?.data) {
                const favorites = response.response.data.filter(p => ids.includes(p._id));
                setWishlistItems(favorites);
            }
        } catch (error) {
            console.error('Error fetching wishlist:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchWishlistProducts();
    }, [fetchWishlistProducts]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchWishlistProducts();
    }, [fetchWishlistProducts]);

    const removeItem = async (id: string) => {
        try {
            const updatedIds = favoriteIds.filter(fid => fid !== id);
            setFavoriteIds(updatedIds);
            setWishlistItems(prev => prev.filter(item => item._id !== id));
            await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedIds));
        } catch (error) {
            console.error('Error removing from wishlist:', error);
        }
    };

    const styles = createStyles(colors);

    if (loading) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

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
                    <Pressable style={styles.exploreButton} onPress={() => router.push('/search')}>
                        <Text style={styles.exploreButtonText}>Explore Products</Text>
                    </Pressable>
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={colors.primary}
                            colors={[colors.primary]}
                        />
                    }
                >
                    <View style={styles.gridContainer}>
                        {wishlistItems.map((item) => (
                            <View key={item._id} style={styles.cardWrapper}>
                                <EventCard
                                    event={item}
                                    isFavorite={true}
                                    onToggleFavorite={() => removeItem(item._id)}
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