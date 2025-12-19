import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Pressable,
    TextInput,
    Image,
    ActivityIndicator,
    Alert,
    ScrollView,
} from 'react-native';
import { X, Star } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { reviewsApi, ReviewableProduct, getImageUrl } from '@/lib/api';

interface ReviewModalProps {
    visible: boolean;
    onClose: () => void;
    orderId: string;
    products: ReviewableProduct[];
    onReviewSubmitted: () => void;
}

export function ReviewModal({
    visible,
    onClose,
    orderId,
    products,
    onReviewSubmitted,
}: ReviewModalProps) {
    const { colors } = useTheme();
    const [selectedProduct, setSelectedProduct] = useState<ReviewableProduct | null>(
        products.length === 1 ? products[0] : null
    );
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!selectedProduct) {
            Alert.alert('Error', 'Please select a product to review');
            return;
        }

        if (rating === 0) {
            Alert.alert('Error', 'Please select a rating');
            return;
        }

        setSubmitting(true);
        try {
            const response = await reviewsApi.create({
                productId: selectedProduct.productId,
                orderId,
                rating,
                comment: comment.trim(),
            });

            if (response.success) {
                Alert.alert('Success', 'Thank you for your review!');
                onReviewSubmitted();
                resetAndClose();
            } else {
                Alert.alert('Error', response.message || 'Failed to submit review');
            }
        } catch (error) {
            console.error('Submit review error:', error);
            Alert.alert('Error', 'Failed to submit review. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const resetAndClose = () => {
        setSelectedProduct(products.length === 1 ? products[0] : null);
        setRating(0);
        setComment('');
        onClose();
    };

    const styles = createStyles(colors);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={resetAndClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: colors.card }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: colors.foreground }]}>
                            Write a Review
                        </Text>
                        <Pressable onPress={resetAndClose} style={styles.closeBtn}>
                            <X size={24} color={colors.foreground} />
                        </Pressable>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Product Selection */}
                        {products.length > 1 && (
                            <View style={styles.section}>
                                <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                                    Select Product
                                </Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {products.map((product) => (
                                        <Pressable
                                            key={product.productId}
                                            style={[
                                                styles.productItem,
                                                { borderColor: colors.border },
                                                selectedProduct?.productId === product.productId && {
                                                    borderColor: colors.primary,
                                                    backgroundColor: colors.secondary,
                                                },
                                            ]}
                                            onPress={() => setSelectedProduct(product)}
                                        >
                                            <Image
                                                source={{ uri: getImageUrl(product.image) }}
                                                style={styles.productImage}
                                            />
                                            <Text
                                                style={[styles.productName, { color: colors.foreground }]}
                                                numberOfLines={2}
                                            >
                                                {product.name}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* Selected Product Display */}
                        {selectedProduct && products.length === 1 && (
                            <View style={styles.selectedProductRow}>
                                <Image
                                    source={{ uri: getImageUrl(selectedProduct.image) }}
                                    style={styles.selectedProductImage}
                                />
                                <Text
                                    style={[styles.selectedProductName, { color: colors.foreground }]}
                                    numberOfLines={2}
                                >
                                    {selectedProduct.name}
                                </Text>
                            </View>
                        )}

                        {/* Rating */}
                        <View style={styles.section}>
                            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                                Your Rating
                            </Text>
                            <View style={styles.starsContainer}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Pressable
                                        key={star}
                                        onPress={() => setRating(star)}
                                        style={styles.starBtn}
                                    >
                                        <Star
                                            size={36}
                                            color={star <= rating ? colors.warning : colors.muted}
                                            fill={star <= rating ? colors.warning : 'transparent'}
                                        />
                                    </Pressable>
                                ))}
                            </View>
                            <Text style={[styles.ratingText, { color: colors.mutedForeground }]}>
                                {rating === 0
                                    ? 'Tap to rate'
                                    : rating === 1
                                        ? 'Poor'
                                        : rating === 2
                                            ? 'Fair'
                                            : rating === 3
                                                ? 'Good'
                                                : rating === 4
                                                    ? 'Very Good'
                                                    : 'Excellent'}
                            </Text>
                        </View>

                        {/* Comment */}
                        <View style={styles.section}>
                            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                                Your Review (Optional)
                            </Text>
                            <TextInput
                                style={[
                                    styles.textInput,
                                    {
                                        backgroundColor: colors.background,
                                        borderColor: colors.border,
                                        color: colors.foreground,
                                    },
                                ]}
                                placeholder="Share your experience with this product..."
                                placeholderTextColor={colors.mutedForeground}
                                multiline
                                numberOfLines={4}
                                maxLength={500}
                                value={comment}
                                onChangeText={setComment}
                                textAlignVertical="top"
                            />
                            <Text style={[styles.charCount, { color: colors.mutedForeground }]}>
                                {comment.length}/500
                            </Text>
                        </View>
                    </ScrollView>

                    {/* Submit Button */}
                    <Pressable
                        style={[
                            styles.submitBtn,
                            { backgroundColor: colors.primary },
                            (submitting || rating === 0 || !selectedProduct) && { opacity: 0.5 },
                        ]}
                        onPress={handleSubmit}
                        disabled={submitting || rating === 0 || !selectedProduct}
                    >
                        {submitting ? (
                            <ActivityIndicator color={colors.primaryForeground} />
                        ) : (
                            <Text style={[styles.submitBtnText, { color: colors.primaryForeground }]}>
                                Submit Review
                            </Text>
                        )}
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}

const createStyles = (colors: any) =>
    StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-end',
        },
        container: {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '85%',
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        title: {
            fontSize: 18,
            fontWeight: '700',
        },
        closeBtn: {
            padding: 4,
        },
        content: {
            padding: 16,
        },
        section: {
            marginBottom: 20,
        },
        sectionLabel: {
            fontSize: 14,
            fontWeight: '600',
            marginBottom: 10,
        },
        productItem: {
            width: 100,
            padding: 8,
            borderRadius: 10,
            borderWidth: 2,
            marginRight: 10,
            alignItems: 'center',
        },
        productImage: {
            width: 60,
            height: 60,
            borderRadius: 8,
            marginBottom: 6,
        },
        productName: {
            fontSize: 11,
            textAlign: 'center',
        },
        selectedProductRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16,
            padding: 12,
            borderRadius: 10,
            backgroundColor: colors.secondary,
        },
        selectedProductImage: {
            width: 50,
            height: 50,
            borderRadius: 8,
            marginRight: 12,
        },
        selectedProductName: {
            flex: 1,
            fontSize: 14,
            fontWeight: '600',
        },
        starsContainer: {
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
        },
        starBtn: {
            padding: 4,
        },
        ratingText: {
            textAlign: 'center',
            marginTop: 8,
            fontSize: 14,
        },
        textInput: {
            borderWidth: 1,
            borderRadius: 10,
            padding: 12,
            fontSize: 14,
            minHeight: 100,
        },
        charCount: {
            textAlign: 'right',
            fontSize: 12,
            marginTop: 4,
        },
        submitBtn: {
            margin: 16,
            padding: 16,
            borderRadius: 12,
            alignItems: 'center',
        },
        submitBtnText: {
            fontSize: 16,
            fontWeight: '700',
        },
    });
