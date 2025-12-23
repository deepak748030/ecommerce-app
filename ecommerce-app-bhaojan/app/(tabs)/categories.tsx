import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { Search, ChevronRight, Sparkles } from 'lucide-react-native';
import { router } from 'expo-router';
import { categoriesApi, Category, getImageUrl } from '@/lib/api';
import { CategoryCardSkeleton } from '@/components/Skeleton';
import { CachedImage } from '@/components/CachedImage';

export default function CategoriesScreen() {
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchCategories = useCallback(async () => {
        try {
            const response = await categoriesApi.getAll();
            if (response.success && response.response?.data) {
                setCategories(response.response.data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchCategories();
    }, [fetchCategories]);

    const handleCategoryPress = (category: Category) => {
        setSelectedCategory(category._id);
        router.push({ pathname: '/category/[id]', params: { id: category._id } });
    };

    const styles = createStyles(colors);

    const renderSkeletons = () => (
        <View style={styles.categoriesGrid}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <CategoryCardSkeleton key={i} />
            ))}
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
                <Text style={styles.title}>Categories</Text>
                <View style={styles.headerButtons}>
                    <Pressable style={styles.iconButton} onPress={() => router.push('/search')}>
                        <Search size={20} color={colors.foreground} strokeWidth={2} />
                    </Pressable>
                </View>
            </View>

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
                {/* Featured Banner */}
                <Pressable style={styles.featuredBanner} onPress={() => router.push('/search')}>
                    <View style={styles.featuredContent}>
                        <View style={styles.featuredBadge}>
                            <Sparkles size={12} color={colors.primary} />
                            <Text style={styles.featuredBadgeText}>Featured</Text>
                        </View>
                        <Text style={styles.featuredTitle}>Explore All Products</Text>
                        <Text style={styles.featuredSubtitle}>Browse all products across categories</Text>
                    </View>
                    <Text style={styles.featuredEmoji}>🛍️</Text>
                </Pressable>

                {/* Categories Grid */}
                {loading ? (
                    renderSkeletons()
                ) : (
                    <View style={styles.categoriesGrid}>
                        {categories.map((category) => (
                            <Pressable
                                key={category._id}
                                style={[
                                    styles.categoryCard,
                                    selectedCategory === category._id && styles.selectedCategoryCard
                                ]}
                                onPress={() => handleCategoryPress(category)}
                            >
                                <View style={[styles.categoryIconBg, { backgroundColor: category.color || '#E0E7FF' }]}>
                                    <CachedImage uri={getImageUrl(category.image)} style={styles.categoryImage} />
                                </View>
                                <View style={styles.categoryInfo}>
                                    <Text style={styles.categoryName} numberOfLines={1}>{category.name}</Text>
                                    <Text style={styles.categoryItems}>{category.itemsCount || 0} items</Text>
                                </View>
                                <ChevronRight size={18} color={colors.mutedForeground} />
                            </Pressable>
                        ))}
                    </View>
                )}

                {!loading && categories.length === 0 && (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No categories found</Text>
                    </View>
                )}
            </ScrollView>
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
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
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
        paddingHorizontal: 6,
        paddingTop: 12,
        paddingBottom: 100,
    },
    featuredBanner: {
        backgroundColor: colors.card,
        borderRadius: 8,
        padding: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    featuredContent: {
        flex: 1,
    },
    featuredBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.secondary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    featuredBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.primary,
    },
    featuredTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.foreground,
        marginBottom: 4,
    },
    featuredSubtitle: {
        fontSize: 12,
        color: colors.mutedForeground,
    },
    featuredEmoji: {
        fontSize: 48,
    },
    categoriesGrid: {
        gap: 1,
    },
    categoryCard: {
        backgroundColor: colors.card,
        borderRadius: 3,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    selectedCategoryCard: {
        borderColor: colors.primary,
        borderWidth: 2,
    },
    categoryIconBg: {
        width: 52,
        height: 52,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
        overflow: 'hidden',
    },
    categoryImage: {
        width: 52,
        height: 52,
        borderRadius: 14,
    },
    categoryInfo: {
        flex: 1,
    },
    categoryName: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.foreground,
        marginBottom: 2,
    },
    categoryItems: {
        fontSize: 12,
        color: colors.mutedForeground,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyText: {
        fontSize: 14,
        color: colors.mutedForeground,
    },
});
