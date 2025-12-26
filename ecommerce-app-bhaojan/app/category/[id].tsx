import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Dimensions, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useWishlist } from '@/hooks/useWishlist';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, SlidersHorizontal, Search } from 'lucide-react-native';
import { productsApi, categoriesApi, Product, Category } from '@/lib/api';
import { ProductCardSkeleton } from '@/components/Skeleton';
import EventCard from '@/components/EventCard';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 25) / 2;
const PAGE_LIMIT = 10;

export default function CategoryProductsScreen() {
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();
    const { isFavorite, toggleFavorite } = useWishlist();
    const { id } = useLocalSearchParams<{ id: string }>();

    const [products, setProducts] = useState<Product[]>([]);
    const [category, setCategory] = useState<Category | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);

    const fetchData = useCallback(async (pageNum: number = 1, refresh: boolean = false) => {
        if (!id) return;

        try {
            if (pageNum === 1) {
                const categoryRes = await categoriesApi.getById(id);
                if (categoryRes.success && categoryRes.response) {
                    setCategory(categoryRes.response);
                }
            }

            const productsRes = await productsApi.getByCategory(id, { limit: PAGE_LIMIT, page: pageNum });

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

    const styles = createStyles(colors, isDark);

    const renderProduct = ({ item }: { item: Product }) => (
        <View style={styles.productCardContainer}>
            <EventCard
                event={item}
                isFavorite={isFavorite(item._id)}
                onToggleFavorite={() => toggleFavorite(item._id)}
            />
        </View>
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
    productCardContainer: {
        width: CARD_WIDTH,
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
