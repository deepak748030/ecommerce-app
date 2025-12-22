import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image, Dimensions, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Star, Heart, SlidersHorizontal, Search } from 'lucide-react-native';
import { productsApi, categoriesApi, Product, Category, getImageUrl } from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProductCardSkeleton } from '@/components/Skeleton';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 25) / 2;
const FAVORITES_KEY = 'favorites';
const PAGE_LIMIT = 10;

export default function CategoryProductsScreen() {
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();
    const { id } = useLocalSearchParams<{ id: string }>();

    const [products, setProducts] = useState<Product[]>([]);
    const [category, setCategory] = useState<Category | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [favorites, setFavorites] = useState<string[]>([]);

    const fetchData = useCallback(async (pageNum: number = 1, refresh: boolean = false) => {
        if (!id) return;

        try {
            if (pageNum === 1) {
                const categoryRes = await categoriesApi.getById(id);
                if (categoryRes.success && categoryRes.response) {
                    setCategory(categoryRes.response);
                }
            }

            const productsRes = await productsApi.getByCategory(id);

            if (productsRes.success && productsRes.response?.data) {
                const newProducts = productsRes.response.data;
                if (refresh || pageNum === 1) {
                    setProducts(newProducts);
                } else {
                    setProducts(prev => [...prev, ...newProducts]);
                }
                setHasMore(newProducts.length >= PAGE_LIMIT);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
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
        setPage(1);
        fetchData(1, true);
    }, [fetchData]);

    const loadMore = useCallback(() => {
        if (!loadingMore && hasMore && !loading) {
            setLoadingMore(true);
            const nextPage = page + 1;
            setPage(nextPage);
            fetchData(nextPage);
        }
    }, [loadingMore, hasMore, loading, page, fetchData]);

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

    const renderProduct = ({ item }: { item: Product }) => (
        <Pressable
            style={styles.productCard}
            onPress={() => handleProductPress(item._id)}
        >
            <View style={styles.imageContainer}>
                <Image source={{ uri: getImageUrl(item.image) }} style={styles.productImage} />
                {item.badge && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                )}
                <Pressable
                    style={styles.heartButton}
                    onPress={() => handleToggleFavorite(item._id)}
                >
                    <Heart
                        size={18}
                        color={favorites.includes(item._id) ? '#ff4757' : colors.mutedForeground}
                        fill={favorites.includes(item._id) ? '#ff4757' : 'transparent'}
                    />
                </Pressable>
            </View>
            <View style={styles.productInfo}>
                <Text style={styles.productTitle} numberOfLines={2}>{item.title}</Text>
                <View style={styles.ratingRow}>
                    <Star size={12} color="#FBBF24" fill="#FBBF24" />
                    <Text style={styles.rating}>{item.rating}</Text>
                    <Text style={styles.reviews}>({item.reviews})</Text>
                </View>
                <View style={styles.priceRow}>
                    <Text style={styles.price}>₹{item.price.toLocaleString()}</Text>
                    {item.mrp > item.price && (
                        <Text style={styles.mrp}>₹{item.mrp.toLocaleString()}</Text>
                    )}
                </View>
            </View>
        </Pressable>
    );

    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={colors.primary} />
            </View>
        );
    };

    const renderSkeletons = () => (
        <View style={styles.productsGrid}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <ProductCardSkeleton key={i} />
            ))}
        </View>
    );

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
            {loading ? (
                <View style={styles.scrollContent}>
                    {renderSkeletons()}
                </View>
            ) : products.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No products found in this category</Text>
                    <Pressable style={styles.browseButton} onPress={() => router.back()}>
                        <Text style={styles.browseButtonText}>Browse Other Categories</Text>
                    </Pressable>
                </View>
            ) : (
                <FlatList
                    data={products}
                    renderItem={renderProduct}
                    keyExtractor={(item) => item._id}
                    numColumns={2}
                    columnWrapperStyle={styles.columnWrapper}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={colors.primary}
                            colors={[colors.primary]}
                        />
                    }
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={renderFooter}
                />
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
    scrollContent: {
        padding: 6,
        paddingBottom: 100,
    },
    listContent: {
        padding: 6,
        paddingBottom: 100,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    productsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
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
    footerLoader: {
        paddingVertical: 20,
        alignItems: 'center',
    },
});
