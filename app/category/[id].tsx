import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Star, Heart, SlidersHorizontal, Search } from 'lucide-react-native';
import { productsApi, categoriesApi, Product, Category, getImageUrl } from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 25) / 2;
const FAVORITES_KEY = 'favorites';

export default function CategoryProductsScreen() {
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();
    const { id } = useLocalSearchParams<{ id: string }>();

    const [products, setProducts] = useState<Product[]>([]);
    const [category, setCategory] = useState<Category | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [favorites, setFavorites] = useState<string[]>([]);

    const fetchData = useCallback(async () => {
        if (!id) return;

        try {
            const [productsRes, categoryRes] = await Promise.all([
                productsApi.getByCategory(id),
                categoriesApi.getById(id),
            ]);

            if (productsRes.success && productsRes.response?.data) {
                setProducts(productsRes.response.data);
            }

            if (categoryRes.success && categoryRes.response) {
                setCategory(categoryRes.response);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Load favorites
    useEffect(() => {
        const loadFavorites = async () => {
            try {
                const stored = await AsyncStorage.getItem(FAVORITES_KEY);
                if (stored) {
                    setFavorites(JSON.parse(stored));
                }
            } catch (error) {
                setFavorites([]);
            }
        };
        loadFavorites();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [fetchData]);

    const handleToggleFavorite = async (productId: string) => {
        try {
            let updatedFavorites: string[];
            if (favorites.includes(productId)) {
                updatedFavorites = favorites.filter(fid => fid !== productId);
            } else {
                updatedFavorites = [...favorites, productId];
            }
            setFavorites(updatedFavorites);
            await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    };

    const styles = createStyles(colors, isDark);

    const handleProductPress = (productId: string) => {
        router.push(`/event/${productId}`);
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading products...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <View style={styles.headerLeft}>
                    <Pressable style={styles.backButton} onPress={() => router.back()}>
                        <ArrowLeft size={22} color={colors.foreground} strokeWidth={2.5} />
                    </Pressable>
                    <View>
                        <Text style={styles.title}>{category?.name || 'Products'}</Text>
                        <Text style={styles.subtitle}>{products.length} products found</Text>
                    </View>
                </View>
                <View style={styles.headerButtons}>
                    <Pressable style={styles.iconButton} onPress={() => router.push('/search')}>
                        <Search size={20} color={colors.foreground} />
                    </Pressable>
                    <Pressable style={styles.iconButton}>
                        <SlidersHorizontal size={20} color={colors.foreground} />
                    </Pressable>
                </View>
            </View>

            {/* Products Grid */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
            >
                {products.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No products found in this category</Text>
                        <Pressable style={styles.browseButton} onPress={() => router.back()}>
                            <Text style={styles.browseButtonText}>Browse Other Categories</Text>
                        </Pressable>
                    </View>
                ) : (
                    <View style={styles.productsGrid}>
                        {products.map((product) => (
                            <Pressable
                                key={product._id}
                                style={styles.productCard}
                                onPress={() => handleProductPress(product._id)}
                            >
                                <View style={styles.imageContainer}>
                                    <Image source={{ uri: getImageUrl(product.image) }} style={styles.productImage} />
                                    {product.badge && (
                                        <View style={styles.badge}>
                                            <Text style={styles.badgeText}>{product.badge}</Text>
                                        </View>
                                    )}
                                    <Pressable
                                        style={styles.heartButton}
                                        onPress={() => handleToggleFavorite(product._id)}
                                    >
                                        <Heart
                                            size={18}
                                            color={favorites.includes(product._id) ? '#ff4757' : colors.mutedForeground}
                                            fill={favorites.includes(product._id) ? '#ff4757' : 'transparent'}
                                        />
                                    </Pressable>
                                </View>
                                <View style={styles.productInfo}>
                                    <Text style={styles.productTitle} numberOfLines={2}>{product.title}</Text>
                                    <View style={styles.ratingRow}>
                                        <Star size={12} color="#FBBF24" fill="#FBBF24" />
                                        <Text style={styles.rating}>{product.rating}</Text>
                                        <Text style={styles.reviews}>({product.reviews})</Text>
                                    </View>
                                    <View style={styles.priceRow}>
                                        <Text style={styles.price}>₹{product.price.toLocaleString()}</Text>
                                        {product.mrp > product.price && (
                                            <Text style={styles.mrp}>₹{product.mrp.toLocaleString()}</Text>
                                        )}
                                    </View>
                                </View>
                            </Pressable>
                        ))}
                    </View>
                )}
            </ScrollView>
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
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: colors.mutedForeground,
    },
    header: {
        paddingHorizontal: 10,
        paddingBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.foreground,
    },
    subtitle: {
        fontSize: 12,
        color: colors.mutedForeground,
        marginTop: 2,
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 6,
        paddingBottom: 100,
    },
    productsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    productCard: {
        width: CARD_WIDTH,
        backgroundColor: colors.card,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
    },
    imageContainer: {
        position: 'relative',
        width: '100%',
        height: CARD_WIDTH,
    },
    productImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    badge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: colors.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    heartButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    productInfo: {
        padding: 12,
    },
    productTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.foreground,
        marginBottom: 6,
        lineHeight: 18,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 6,
    },
    rating: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.foreground,
    },
    reviews: {
        fontSize: 11,
        color: colors.mutedForeground,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    price: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.primary,
    },
    mrp: {
        fontSize: 12,
        color: colors.mutedForeground,
        textDecorationLine: 'line-through',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        fontSize: 16,
        color: colors.mutedForeground,
        marginBottom: 16,
    },
    browseButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    browseButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});