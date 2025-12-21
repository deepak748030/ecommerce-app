import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    Pressable,
    ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Package, Plus, Edit, Trash2 } from 'lucide-react-native';
import { Product, getImageUrl } from '@/lib/api';
import { VendorProductSkeleton } from '@/components/Skeleton';

interface Props {
    products: Product[];
    loading: boolean;
    onEdit: (product: Product) => void;
    onDelete: (product: Product) => void;
    onCreatePress: () => void;
    onLoadMore?: () => void;
    loadingMore?: boolean;
    hasMore?: boolean;
}

export function VendorProducts({ products, loading, onEdit, onDelete, onCreatePress, onLoadMore, loadingMore, hasMore }: Props) {
    const { colors } = useTheme();
    const styles = createStyles(colors);

    const handleEndReached = useCallback(() => {
        if (onLoadMore && hasMore && !loadingMore) {
            onLoadMore();
        }
    }, [onLoadMore, hasMore, loadingMore]);

    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={colors.primary} />
            </View>
        );
    };

    const renderProductCard = ({ item }: { item: Product }) => (
        <View style={styles.productCard}>
            <Image source={{ uri: getImageUrl(item.image) }} style={styles.productImage} />
            <View style={styles.productInfo}>
                <Text style={styles.productTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.productPrice}>₹{item.price}</Text>
                {item.mrp > item.price && (
                    <Text style={styles.productMrp}>₹{item.mrp}</Text>
                )}
                <View style={styles.productMeta}>
                    <Text style={styles.productCategory}>
                        {typeof item.category === 'object' ? item.category.name : 'N/A'}
                    </Text>
                </View>
            </View>
            <View style={styles.productActions}>
                <Pressable style={styles.actionButton} onPress={() => onEdit(item)}>
                    <Edit size={16} color={colors.primary} />
                </Pressable>
                <Pressable
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => onDelete(item)}
                >
                    <Trash2 size={16} color={colors.destructive} />
                </Pressable>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.listContent}>
                {[1, 2, 3, 4].map((i) => (
                    <VendorProductSkeleton key={i} />
                ))}
            </View>
        );
    }

    if (products.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Package size={60} color={colors.mutedForeground} />
                <Text style={styles.emptyTitle}>No Products Yet</Text>
                <Text style={styles.emptyText}>Create your first product to start selling</Text>
                <Pressable style={styles.createButton} onPress={onCreatePress}>
                    <Plus size={18} color={colors.white} />
                    <Text style={styles.createButtonText}>Create Product</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <FlatList
            data={products}
            keyExtractor={(item) => item._id}
            renderItem={renderProductCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.3}
            ListFooterComponent={renderFooter}
        />
    );
}

const createStyles = (colors: any) => StyleSheet.create({
    loadingMore: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.foreground,
        marginTop: 16,
    },
    emptyText: {
        fontSize: 14,
        color: colors.mutedForeground,
        textAlign: 'center',
        marginTop: 8,
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 10,
        marginTop: 20,
        gap: 6,
    },
    createButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.white,
    },
    listContent: {
        paddingHorizontal: 6,
        paddingTop: 12,
        paddingBottom: 100,
    },
    productCard: {
        flexDirection: 'row',
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: colors.border,
    },
    productImage: {
        width: 70,
        height: 70,
        borderRadius: 8,
        backgroundColor: colors.muted,
    },
    productInfo: {
        flex: 1,
        marginLeft: 10,
    },
    productTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.foreground,
        marginBottom: 4,
    },
    productPrice: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.primary,
    },
    productMrp: {
        fontSize: 11,
        color: colors.mutedForeground,
        textDecorationLine: 'line-through',
    },
    productMeta: {
        flexDirection: 'row',
        marginTop: 4,
    },
    productCategory: {
        fontSize: 10,
        color: colors.mutedForeground,
        backgroundColor: colors.secondary,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    productActions: {
        justifyContent: 'center',
        gap: 6,
    },
    actionButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteButton: {
        backgroundColor: colors.destructive + '15',
    },
});
