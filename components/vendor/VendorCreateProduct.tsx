import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Image,
    TextInput,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Camera, X, Plus, ChevronDown } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Category, Product } from '@/lib/api';

interface ProductFormData {
    title: string;
    description: string;
    price: string;
    mrp: string;
    location: string;
    fullLocation: string;
    badge: string;
    image: string;
    images: string[];
}

interface Props {
    categories: Category[];
    editingProduct: Product | null;
    initialForm: ProductFormData;
    selectedCategory: Category | null;
    isSubmitting: boolean;
    onSubmit: (form: ProductFormData, category: Category) => void;
    onCancel: () => void;
    onCategorySelect: (category: Category) => void;
    onShowInfo: (title: string, message: string, type: 'info' | 'success' | 'error') => void;
}

export function VendorCreateProduct({
    categories,
    editingProduct,
    initialForm,
    selectedCategory,
    isSubmitting,
    onSubmit,
    onCancel,
    onCategorySelect,
    onShowInfo,
}: Props) {
    const { colors } = useTheme();
    const styles = createStyles(colors);

    const [productForm, setProductForm] = useState<ProductFormData>(initialForm);
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);

    const pickImage = async (isMain: boolean = true) => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            onShowInfo('Permission Denied', 'Camera roll permission is required!', 'error');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
            base64: true,
        });

        if (!result.canceled && result.assets[0]) {
            const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
            if (isMain) {
                setProductForm(prev => ({ ...prev, image: base64Image }));
            } else {
                setProductForm(prev => ({ ...prev, images: [...prev.images, base64Image] }));
            }
        }
    };

    const removeImage = (index: number) => {
        setProductForm(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = () => {
        if (!productForm.title.trim()) {
            onShowInfo('Error', 'Product title is required', 'error');
            return;
        }
        if (!productForm.price.trim() || isNaN(Number(productForm.price))) {
            onShowInfo('Error', 'Valid price is required', 'error');
            return;
        }
        if (!selectedCategory) {
            onShowInfo('Error', 'Please select a category', 'error');
            return;
        }
        onSubmit(productForm, selectedCategory);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
                <Text style={styles.formTitle}>
                    {editingProduct ? 'Edit Product' : 'Create New Product'}
                </Text>

                {/* Main Image */}
                <Text style={styles.inputLabel}>Product Image *</Text>
                <Pressable style={styles.imagePicker} onPress={() => pickImage(true)}>
                    {productForm.image ? (
                        <Image source={{ uri: productForm.image }} style={styles.mainImage} />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Camera size={28} color={colors.mutedForeground} />
                            <Text style={styles.imagePlaceholderText}>Tap to add image</Text>
                        </View>
                    )}
                </Pressable>

                {/* Additional Images */}
                <Text style={styles.inputLabel}>Additional Images</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.additionalImages}>
                    {productForm.images.map((img, index) => (
                        <View key={index} style={styles.additionalImageContainer}>
                            <Image source={{ uri: img }} style={styles.additionalImage} />
                            <Pressable style={styles.removeImageButton} onPress={() => removeImage(index)}>
                                <X size={12} color={colors.white} />
                            </Pressable>
                        </View>
                    ))}
                    <Pressable style={styles.addImageButton} onPress={() => pickImage(false)}>
                        <Plus size={20} color={colors.mutedForeground} />
                    </Pressable>
                </ScrollView>

                {/* Title */}
                <Text style={styles.inputLabel}>Product Title *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter product title"
                    placeholderTextColor={colors.mutedForeground}
                    value={productForm.title}
                    onChangeText={(text) => setProductForm(prev => ({ ...prev, title: text }))}
                />

                {/* Description */}
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Enter product description"
                    placeholderTextColor={colors.mutedForeground}
                    value={productForm.description}
                    onChangeText={(text) => setProductForm(prev => ({ ...prev, description: text }))}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                />

                {/* Category */}
                <Text style={styles.inputLabel}>Category *</Text>
                <Pressable
                    style={styles.categoryPicker}
                    onPress={() => setShowCategoryPicker(!showCategoryPicker)}
                >
                    <Text style={selectedCategory ? styles.categoryText : styles.categoryPlaceholder}>
                        {selectedCategory?.name || 'Select a category'}
                    </Text>
                    <ChevronDown size={18} color={colors.mutedForeground} />
                </Pressable>
                {showCategoryPicker && (
                    <View style={styles.categoryDropdown}>
                        {categories.map(cat => (
                            <Pressable
                                key={cat._id}
                                style={[
                                    styles.categoryOption,
                                    selectedCategory?._id === cat._id && styles.categoryOptionSelected
                                ]}
                                onPress={() => {
                                    onCategorySelect(cat);
                                    setShowCategoryPicker(false);
                                }}
                            >
                                <Text style={[
                                    styles.categoryOptionText,
                                    selectedCategory?._id === cat._id && styles.categoryOptionTextSelected
                                ]}>
                                    {cat.name}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                )}

                {/* Price & MRP */}
                <View style={styles.priceRow}>
                    <View style={styles.priceField}>
                        <Text style={styles.inputLabel}>Price (₹) *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0"
                            placeholderTextColor={colors.mutedForeground}
                            value={productForm.price}
                            onChangeText={(text) => setProductForm(prev => ({ ...prev, price: text }))}
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={styles.priceField}>
                        <Text style={styles.inputLabel}>MRP (₹)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0"
                            placeholderTextColor={colors.mutedForeground}
                            value={productForm.mrp}
                            onChangeText={(text) => setProductForm(prev => ({ ...prev, mrp: text }))}
                            keyboardType="numeric"
                        />
                    </View>
                </View>

                {/* Location */}
                <Text style={styles.inputLabel}>Location</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g., Mumbai"
                    placeholderTextColor={colors.mutedForeground}
                    value={productForm.location}
                    onChangeText={(text) => setProductForm(prev => ({ ...prev, location: text }))}
                />

                {/* Badge */}
                <Text style={styles.inputLabel}>Badge (optional)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g., New, Sale"
                    placeholderTextColor={colors.mutedForeground}
                    value={productForm.badge}
                    onChangeText={(text) => setProductForm(prev => ({ ...prev, badge: text }))}
                />

                {/* Action Buttons */}
                <View style={styles.formActions}>
                    {editingProduct && (
                        <Pressable style={styles.cancelButton} onPress={onCancel}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </Pressable>
                    )}
                    <Pressable
                        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator size="small" color={colors.white} />
                        ) : (
                            <Text style={styles.submitButtonText}>
                                {editingProduct ? 'Update Product' : 'Create Product'}
                            </Text>
                        )}
                    </Pressable>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
    formContainer: {
        flex: 1,
        paddingHorizontal: 6,
        paddingTop: 12,
    },
    formTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: colors.foreground,
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.foreground,
        marginBottom: 6,
        marginTop: 14,
    },
    input: {
        backgroundColor: colors.input,
        borderRadius: 10,
        padding: 12,
        fontSize: 14,
        color: colors.foreground,
        borderWidth: 1,
        borderColor: colors.border,
    },
    textArea: {
        minHeight: 70,
        paddingTop: 12,
    },
    imagePicker: {
        width: '100%',
        height: 160,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: colors.input,
        borderWidth: 1,
        borderColor: colors.border,
        borderStyle: 'dashed',
    },
    mainImage: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    imagePlaceholderText: {
        fontSize: 12,
        color: colors.mutedForeground,
        marginTop: 6,
    },
    additionalImages: {
        marginTop: 6,
    },
    additionalImageContainer: {
        position: 'relative',
        marginRight: 8,
    },
    additionalImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
    },
    removeImageButton: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: colors.destructive,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addImageButton: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: colors.input,
        borderWidth: 1,
        borderColor: colors.border,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    categoryPicker: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.input,
        borderRadius: 10,
        padding: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    categoryText: {
        fontSize: 14,
        color: colors.foreground,
    },
    categoryPlaceholder: {
        fontSize: 14,
        color: colors.mutedForeground,
    },
    categoryDropdown: {
        backgroundColor: colors.card,
        borderRadius: 10,
        marginTop: 4,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    categoryOption: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    categoryOptionSelected: {
        backgroundColor: colors.primary + '15',
    },
    categoryOptionText: {
        fontSize: 14,
        color: colors.foreground,
    },
    categoryOptionTextSelected: {
        color: colors.primary,
        fontWeight: '600',
    },
    priceRow: {
        flexDirection: 'row',
        gap: 10,
    },
    priceField: {
        flex: 1,
    },
    formActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 20,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: colors.secondary,
        borderRadius: 10,
        padding: 14,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.foreground,
    },
    submitButton: {
        flex: 2,
        backgroundColor: colors.primary,
        borderRadius: 10,
        padding: 14,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.white,
    },
});
