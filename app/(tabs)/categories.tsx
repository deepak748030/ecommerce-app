import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { Search, ChevronRight, Sparkles } from 'lucide-react-native';
import { router } from 'expo-router';

// Categories that match mock data products
const allCategories = [
    { id: '1', name: 'Fruits', searchKey: 'Fruits', image: 'https://images.pexels.com/photos/1132047/pexels-photo-1132047.jpeg?auto=compress&cs=tinysrgb&w=200', items: 4, color: '#DCFCE7' },
    { id: '2', name: 'Fashion', searchKey: 'Fashion', image: 'https://images.pexels.com/photos/934070/pexels-photo-934070.jpeg?auto=compress&cs=tinysrgb&w=200', items: 4, color: '#E0E7FF' },
    { id: '3', name: 'Weddings', searchKey: 'Weddings', image: 'https://images.pexels.com/photos/1983046/pexels-photo-1983046.jpeg?auto=compress&cs=tinysrgb&w=200', items: 2, color: '#FCE7F3' },
    { id: '4', name: 'Birthday Parties', searchKey: 'Birthday Parties', image: 'https://images.pexels.com/photos/1857157/pexels-photo-1857157.jpeg?auto=compress&cs=tinysrgb&w=200', items: 2, color: '#FEF3C7' },
    { id: '5', name: 'Corporate Events', searchKey: 'Corporate Events', image: 'https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=200', items: 1, color: '#CFFAFE' },
    { id: '6', name: 'Concerts & Music', searchKey: 'Concerts & Music', image: 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=200', items: 1, color: '#F3E8FF' },
];

export default function CategoriesScreen() {
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const handleCategoryPress = (category: typeof allCategories[0]) => {
        setSelectedCategory(category.id);
        router.push({ pathname: '/search', params: { category: category.searchKey } });
    };

    const styles = createStyles(colors);

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
                <View style={styles.categoriesGrid}>
                    {allCategories.map((category) => (
                        <Pressable
                            key={category.id}
                            style={[
                                styles.categoryCard,
                                selectedCategory === category.id && styles.selectedCategoryCard
                            ]}
                            onPress={() => handleCategoryPress(category)}
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
});
