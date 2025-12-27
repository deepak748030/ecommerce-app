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
    ScrollView,
} from 'react-native';
import { X, Star, Truck } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { reviewsApi, ReviewableProduct, getImageUrl } from '@/lib/api';
import { ActionModal } from '@/components/ActionModal';

interface ReviewModalProps {
    visible: boolean;
    onClose: () => void;
    orderId: string;
    products: ReviewableProduct[];
    onReviewSubmitted: () => void;
    hasDeliveryPartner?: boolean;
}

export function ReviewModal({
    visible,
    onClose,
    orderId,
    products,
    onReviewSubmitted,
    hasDeliveryPartner = true,
}: ReviewModalProps) {
    const { colors } = useTheme();
    const [selectedProduct, setSelectedProduct] = useState<ReviewableProduct | null>(null);
    const [rating, setRating] = useState(0);
    const [deliveryRating, setDeliveryRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [infoModalData, setInfoModalData] = useState({ title: '', message: '', type: 'info' as 'info' | 'success' | 'error' });

    // Update selected product when modal opens or products change
    React.useEffect(() => {
        if (visible && products.length > 0) {
            if (products.length === 1) {
                setSelectedProduct(products[0]);
            } else {
                setSelectedProduct(null);
            }
        }
    }, [visible, products]);

    const handleSubmit = async () => {
        if (!selectedProduct) {
            setInfoModalData({ title: 'Error', message: 'Please select a product to review', type: 'error' });
            setShowInfoModal(true);
            return;
        }

        if (rating === 0) {
            setInfoModalData({ title: 'Error', message: 'Please select a product rating', type: 'error' });
            setShowInfoModal(true);
            return;
        }

        setSubmitting(true);
        try {
            const response = await reviewsApi.create({
                productId: selectedProduct.productId,
                orderId,
                rating,
                comment: comment.trim(),
                deliveryRating: hasDeliveryPartner && deliveryRating > 0 ? deliveryRating : undefined,
            });

            if (response.success) {
                setInfoModalData({ title: 'Success', message: 'Thank you for your review!', type: 'success' });
                setShowInfoModal(true);
                onReviewSubmitted();
            } else {
                setInfoModalData({ title: 'Error', message: response.message || 'Failed to submit review', type: 'error' });
                setShowInfoModal(true);
            }
        } catch (error) {
            console.error('Submit review error:', error);
            setInfoModalData({ title: 'Error', message: 'Failed to submit review. Please try again.', type: 'error' });
            setShowInfoModal(true);
        } finally {
            setSubmitting(false);
        }
    };

    const resetAndClose = () => {
        setSelectedProduct(null);
        setRating(0);
        setDeliveryRating(0);
        setComment('');
        onClose();
    };

    const getRatingLabel = (r: number) => {
        if (r === 0) return 'Tap to rate';
        if (r === 1) return 'Poor';
        if (r === 2) return 'Fair';
        if (r === 3) return 'Good';
        if (r === 4) return 'Very Good';
        return 'Excellent';
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

                        {/* Product Rating */}
                        <View style={styles.section}>
                            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                                Product Rating
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
                                {getRatingLabel(rating)}
                            </Text>
                        </View>

                        {/* Delivery Partner Rating */}
                        {hasDeliveryPartner && (
                            <View style={[styles.section, styles.deliverySection, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                                <View style={styles.deliveryHeader}>
                                    <View style={[styles.deliveryIcon, { backgroundColor: colors.primary }]}>
                                        <Truck size={16} color={colors.primaryForeground} />
                                    </View>
                                    <Text style={[styles.sectionLabel, { color: colors.foreground, marginBottom: 0 }]}>
                                        Rate Delivery Partner
                                    </Text>
                                    <Text style={[styles.optionalTag, { color: colors.mutedForeground }]}>
                                        (Optional)
                                    </Text>
                                </View>
                                <View style={styles.starsContainer}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Pressable
                                            key={star}
                                            onPress={() => setDeliveryRating(star)}
                                            style={styles.starBtn}
                                        >
                                            <Star
                                                size={32}
                                                color={star <= deliveryRating ? colors.success : colors.muted}
                                                fill={star <= deliveryRating ? colors.success : 'transparent'}
                                            />
                                        </Pressable>
                                    ))}
                                </View>
                                <Text style={[styles.ratingText, { color: colors.mutedForeground }]}>
                                    {getRatingLabel(deliveryRating)}
                                </Text>
                            </View>
                        )}

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

            {/* Info Modal */}
            <ActionModal
                isVisible={showInfoModal}
                onClose={() => {
                    setShowInfoModal(false);
                    if (infoModalData.type === 'success') {
                        resetAndClose();
                    }
                }}
                type={infoModalData.type}
                title={infoModalData.title}
                message={infoModalData.message}
                buttons={[{ text: 'OK', onPress: () => { }, primary: true }]}
            />
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
            maxHeight: '90%',
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
        deliverySection: {
            padding: 16,
            borderRadius: 12,
            borderWidth: 1,
        },
        deliveryHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12,
            gap: 8,
        },
        deliveryIcon: {
            width: 28,
            height: 28,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
        },
        optionalTag: {
            fontSize: 12,
            fontStyle: 'italic',
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