import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { Search, ChevronRight, Sparkles, SlidersHorizontal } from 'lucide-react-native';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 12 - 16) / 2;

const allCategories = [
    { id: '1', name: 'Fruits & Vegetables', image: 'https://images.pexels.com/photos/1132047/pexels-photo-1132047.jpeg?auto=compress&cs=tinysrgb&w=200', items: 248, color: '#DCFCE7' },
    { id: '2', name: 'Fashion & Apparel', image: 'https://images.pexels.com/photos/934070/pexels-photo-934070.jpeg?auto=compress&cs=tinysrgb&w=200', items: 1256, color: '#E0E7FF' },
    { id: '3', name: 'Electronics', image: 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg?auto=compress&cs=tinysrgb&w=200', items: 856, color: '#FEF3C7' },
    { id: '4', name: 'Home & Living', image: 'https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg?auto=compress&cs=tinysrgb&w=200', items: 534, color: '#FCE7F3' },
    { id: '5', name: 'Beauty & Health', image: 'https://images.pexels.com/photos/2587370/pexels-photo-2587370.jpeg?auto=compress&cs=tinysrgb&w=200', items: 678, color: '#FED7AA' },
    { id: '6', name: 'Sports & Fitness', image: 'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=200', items: 345, color: '#CFFAFE' },
    { id: '7', name: 'Toys & Games', image: 'https://images.pexels.com/photos/163036/mario-luigi-yoschi-figures-163036.jpeg?auto=compress&cs=tinysrgb&w=200', items: 423, color: '#D1FAE5' },
    { id: '8', name: 'Books & Stationery', image: 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=200', items: 567, color: '#FEE2E2' },
    { id: '9', name: 'Jewelry & Watches', image: 'https://images.pexels.com/photos/248077/pexels-photo-248077.jpeg?auto=compress&cs=tinysrgb&w=200', items: 234, color: '#E5E7EB' },
    { id: '10', name: 'Baby & Kids', image: 'https://images.pexels.com/photos/35188/child-childrens-baby-children-s.jpg?auto=compress&cs=tinysrgb&w=200', items: 456, color: '#DBEAFE' },
    { id: '11', name: 'Groceries', image: 'https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=200', items: 892, color: '#FEF9C3' },
    { id: '12', name: 'Pet Supplies', image: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=200', items: 178, color: '#F3E8FF' },
];

export default function CategoriesScreen() {
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const styles = createStyles(colors, isDark);

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

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Featured Banner */}
                <Pressable style={styles.featuredBanner}>
                    <View style={styles.featuredContent}>
                        <View style={styles.featuredBadge}>
                            <Sparkles size={12} color={colors.primary} />
                            <Text style={styles.featuredBadgeText}>Featured</Text>
                        </View>
                        <Text style={styles.featuredTitle}>Explore All Products</Text>
                        <Text style={styles.featuredSubtitle}>Browse 5000+ products across all categories</Text>
                    </View>
                    <Text style={styles.featuredEmoji}>🛍️</Text>
                </Pressable>

                {/* Categories Grid */}
                <View style={styles.categoriesGrid}>
                    {allCategories.map((category) => (
                        <Pressable
                            key={category.id}
                            style={[
                                styles.categoryCard,
                                selectedCategory === category.id && styles.selectedCategoryCard
                            ]}
                            onPress={() => router.push(`/category/${category.id}` as any)}
                        >
                            <View style={[styles.categoryIconBg, { backgroundColor: category.color }]}>
                                <Image source={{ uri: category.image }} style={styles.categoryImage} />
                            </View>
                            <View style={styles.categoryInfo}>
                                <Text style={styles.categoryName} numberOfLines={1}>{category.name}</Text>
                                <Text style={styles.categoryItems}>{category.items} items</Text>
                            </View>
                            <ChevronRight size={18} color={colors.mutedForeground} />
                        </Pressable>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
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
});
