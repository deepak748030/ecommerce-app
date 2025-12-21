import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Image,
    TextInput,
    ActivityIndicator,
    FlatList,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { router, useFocusEffect } from 'expo-router';
import {
    ArrowLeft,
    Plus,
    Package,
    ShoppingBag,
    Camera,
    X,
    ChevronDown,
    Trash2,
    Edit,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { vendorApi, categoriesApi, Category, Product, VendorOrder, getImageUrl } from '@/lib/api';
import { ActionModal } from '@/components/ActionModal';
import { ConfirmationModal } from '@/components/ConfirmationModal';

type TabType = 'create' | 'products' | 'orders';

export default function VendorScreen() {
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();
    const styles = createStyles(colors, isDark);

    const [activeTab, setActiveTab] = useState<TabType>('products');
    const [isLoading, setIsLoading] = useState(false);

    // Products state
    const [products, setProducts] = useState<Product[]>([]);
    const [productsLoading, setProductsLoading] = useState(true);

    // Orders state
    const [orders, setOrders] = useState<VendorOrder[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(true);

    // Create product state
    const [categories, setCategories] = useState<Category[]>([]);
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [productForm, setProductForm] = useState({
        title: '',
        description: '',
        price: '',
        mrp: '',
        location: '',
        fullLocation: '',
        badge: '',
        image: '',
        images: [] as string[],
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Modal states
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [infoModalData, setInfoModalData] = useState({ title: '', message: '', type: 'info' as 'info' | 'success' | 'error' });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);

    const loadCategories = async () => {
        try {
            const result = await categoriesApi.getAll();
            if (result.success && result.response) {
                setCategories(result.response.data);
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    };

    const loadProducts = async () => {
        try {
            setProductsLoading(true);
            const result = await vendorApi.getProducts();
            if (result.success && result.response) {
                setProducts(result.response.data);
            }
        } catch (error) {
            console.error('Error loading vendor products:', error);
        } finally {
            setProductsLoading(false);
        }
    };

    const loadOrders = async () => {
        try {
            setOrdersLoading(true);
            const result = await vendorApi.getOrders();
            if (result.success && result.response) {
                setOrders(result.response.data);
            }
        } catch (error) {
            console.error('Error loading vendor orders:', error);
        } finally {
            setOrdersLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadCategories();
            loadProducts();
            loadOrders();
        }, [])
    );

    const pickImage = async (isMain: boolean = true) => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            setInfoModalData({ title: 'Permission Denied', message: 'Camera roll permission is required!', type: 'error' });
            setShowInfoModal(true);
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

    const handleCreateProduct = async () => {
        if (!productForm.title.trim()) {
            setInfoModalData({ title: 'Error', message: 'Product title is required', type: 'error' });
            setShowInfoModal(true);
            return;
        }
        if (!productForm.price.trim() || isNaN(Number(productForm.price))) {
            setInfoModalData({ title: 'Error', message: 'Valid price is required', type: 'error' });
            setShowInfoModal(true);
            return;
        }
        if (!selectedCategory) {
            setInfoModalData({ title: 'Error', message: 'Please select a category', type: 'error' });
            setShowInfoModal(true);
            return;
        }

        setIsSubmitting(true);
        try {
            const productData = {
                title: productForm.title.trim(),
                description: productForm.description.trim(),
                price: parseFloat(productForm.price),
                mrp: productForm.mrp ? parseFloat(productForm.mrp) : parseFloat(productForm.price),
                category: selectedCategory._id,
                image: productForm.image,
                images: productForm.images,
                badge: productForm.badge.trim(),
                location: productForm.location.trim(),
                fullLocation: productForm.fullLocation.trim(),
            };

            let result;
            if (editingProduct) {
                result = await vendorApi.updateProduct(editingProduct._id, productData);
            } else {
                result = await vendorApi.createProduct(productData);
            }

            if (result.success) {
                setInfoModalData({
                    title: 'Success',
                    message: editingProduct ? 'Product updated successfully!' : 'Product created successfully!',
                    type: 'success'
                });
                setShowInfoModal(true);
                resetForm();
                loadProducts();
                setActiveTab('products');
            } else {
                setInfoModalData({ title: 'Error', message: result.message || 'Failed to save product', type: 'error' });
                setShowInfoModal(true);
            }
        } catch (error) {
            setInfoModalData({ title: 'Error', message: 'Failed to save product', type: 'error' });
            setShowInfoModal(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setProductForm({
            title: '',
            description: '',
            price: '',
            mrp: '',
            location: '',
            fullLocation: '',
            badge: '',
            image: '',
            images: [],
        });
        setSelectedCategory(null);
        setEditingProduct(null);
    };

    const handleEditProduct = (product: Product) => {
        setEditingProduct(product);
        setProductForm({
            title: product.title,
            description: product.description,
            price: product.price.toString(),
            mrp: product.mrp.toString(),
            location: product.location,
            fullLocation: product.fullLocation,
            badge: product.badge,
            image: product.image,
            images: product.images || [],
        });
        const cat = categories.find(c =>
            c._id === (typeof product.category === 'string' ? product.category : product.category._id)
        );
        setSelectedCategory(cat || null);
        setActiveTab('create');
    };

    const handleDeleteProduct = async () => {
        if (!productToDelete) return;

        try {
            const result = await vendorApi.deleteProduct(productToDelete._id);
            if (result.success) {
                setInfoModalData({ title: 'Success', message: 'Product deleted successfully!', type: 'success' });
                setShowInfoModal(true);
                loadProducts();
            } else {
                setInfoModalData({ title: 'Error', message: result.message || 'Failed to delete product', type: 'error' });
                setShowInfoModal(true);
            }
        } catch (error) {
            setInfoModalData({ title: 'Error', message: 'Failed to delete product', type: 'error' });
            setShowInfoModal(true);
        } finally {
            setShowDeleteModal(false);
            setProductToDelete(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending': return colors.warning;
            case 'confirmed':
            case 'processing': return colors.primary;
            case 'shipped':
            case 'out_for_delivery': return colors.accent;
            case 'delivered': return colors.success;
            case 'cancelled': return colors.destructive;
            default: return colors.mutedForeground;
        }
    };

    const formatStatus = (status: string) => {
        return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
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
                <Pressable style={styles.actionButton} onPress={() => handleEditProduct(item)}>
                    <Edit size={18} color={colors.primary} />
                </Pressable>
                <Pressable
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => {
                        setProductToDelete(item);
                        setShowDeleteModal(true);
                    }}
                >
                    <Trash2 size={18} color={colors.destructive} />
                </Pressable>
            </View>
        </View>
    );

    const renderOrderCard = ({ item }: { item: VendorOrder }) => (
        <Pressable style={styles.orderCard}>
            <View style={styles.orderHeader}>
                <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {formatStatus(item.status)}
                    </Text>
                </View>
            </View>

            <View style={styles.orderCustomer}>
                <Text style={styles.customerLabel}>Customer:</Text>
                <Text style={styles.customerName}>{item.user?.name || 'N/A'}</Text>
                <Text style={styles.customerPhone}>{item.user?.phone || ''}</Text>
            </View>

            <View style={styles.orderItems}>
                {item.items.map((orderItem, index) => (
                    <View key={index} style={styles.orderItemRow}>
                        <Image source={{ uri: getImageUrl(orderItem.image) }} style={styles.orderItemImage} />
                        <View style={styles.orderItemInfo}>
                            <Text style={styles.orderItemName} numberOfLines={1}>{orderItem.name}</Text>
                            <Text style={styles.orderItemQty}>Qty: {orderItem.quantity} × ₹{orderItem.price}</Text>
                        </View>
                    </View>
                ))}
            </View>

            <View style={styles.orderFooter}>
                <Text style={styles.orderDate}>
                    {new Date(item.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                    })}
                </Text>
                <Text style={styles.orderTotal}>₹{item.vendorSubtotal}</Text>
            </View>

            <View style={styles.shippingInfo}>
                <Text style={styles.shippingLabel}>Ship to:</Text>
                <Text style={styles.shippingAddress}>
                    {item.shippingAddress?.address}, {item.shippingAddress?.city} - {item.shippingAddress?.pincode}
                </Text>
            </View>
        </Pressable>
    );

    const renderCreateTab = () => (
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
                            <Camera size={32} color={colors.mutedForeground} />
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
                                <X size={14} color={colors.white} />
                            </Pressable>
                        </View>
                    ))}
                    <Pressable style={styles.addImageButton} onPress={() => pickImage(false)}>
                        <Plus size={24} color={colors.mutedForeground} />
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
                    numberOfLines={4}
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
                    <ChevronDown size={20} color={colors.mutedForeground} />
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
                                    setSelectedCategory(cat);
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

                {/* Full Location */}
                <Text style={styles.inputLabel}>Full Address</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Complete address"
                    placeholderTextColor={colors.mutedForeground}
                    value={productForm.fullLocation}
                    onChangeText={(text) => setProductForm(prev => ({ ...prev, fullLocation: text }))}
                    multiline
                    numberOfLines={2}
                    textAlignVertical="top"
                />

                {/* Badge */}
                <Text style={styles.inputLabel}>Badge (optional)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g., New, Sale, Hot"
                    placeholderTextColor={colors.mutedForeground}
                    value={productForm.badge}
                    onChangeText={(text) => setProductForm(prev => ({ ...prev, badge: text }))}
                />

                {/* Action Buttons */}
                <View style={styles.formActions}>
                    {editingProduct && (
                        <Pressable style={styles.cancelButton} onPress={resetForm}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </Pressable>
                    )}
                    <Pressable
                        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                        onPress={handleCreateProduct}
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

    const renderProductsTab = () => (
        <View style={styles.tabContent}>
            {productsLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Loading products...</Text>
                </View>
            ) : products.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Package size={60} color={colors.mutedForeground} />
                    <Text style={styles.emptyTitle}>No Products Yet</Text>
                    <Text style={styles.emptyText}>Create your first product to start selling</Text>
                    <Pressable style={styles.createButton} onPress={() => setActiveTab('create')}>
                        <Plus size={20} color={colors.white} />
                        <Text style={styles.createButtonText}>Create Product</Text>
                    </Pressable>
                </View>
            ) : (
                <FlatList
                    data={products}
                    keyExtractor={(item) => item._id}
                    renderItem={renderProductCard}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );

    const renderOrdersTab = () => (
        <View style={styles.tabContent}>
            {ordersLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Loading orders...</Text>
                </View>
            ) : orders.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <ShoppingBag size={60} color={colors.mutedForeground} />
                    <Text style={styles.emptyTitle}>No Orders Yet</Text>
                    <Text style={styles.emptyText}>Orders for your products will appear here</Text>
                </View>
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={(item) => item._id}
                    renderItem={renderOrderCard}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                    <ArrowLeft size={24} color={colors.foreground} />
                </Pressable>
                <Text style={styles.headerTitle}>Vendor Dashboard</Text>
                <View style={styles.headerRight} />
            </View>

            {/* Sub-tabs */}
            <View style={styles.tabBar}>
                <Pressable
                    style={[styles.tab, activeTab === 'products' && styles.tabActive]}
                    onPress={() => setActiveTab('products')}
                >
                    <Package size={18} color={activeTab === 'products' ? colors.primary : colors.mutedForeground} />
                    <Text style={[styles.tabText, activeTab === 'products' && styles.tabTextActive]}>
                        My Products
                    </Text>
                </Pressable>
                <Pressable
                    style={[styles.tab, activeTab === 'create' && styles.tabActive]}
                    onPress={() => {
                        resetForm();
                        setActiveTab('create');
                    }}
                >
                    <Plus size={18} color={activeTab === 'create' ? colors.primary : colors.mutedForeground} />
                    <Text style={[styles.tabText, activeTab === 'create' && styles.tabTextActive]}>
                        Create
                    </Text>
                </Pressable>
                <Pressable
                    style={[styles.tab, activeTab === 'orders' && styles.tabActive]}
                    onPress={() => setActiveTab('orders')}
                >
                    <ShoppingBag size={18} color={activeTab === 'orders' ? colors.primary : colors.mutedForeground} />
                    <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>
                        Orders
                    </Text>
                </Pressable>
            </View>

            {/* Tab Content */}
            {activeTab === 'create' && renderCreateTab()}
            {activeTab === 'products' && renderProductsTab()}
            {activeTab === 'orders' && renderOrdersTab()}

            {/* Modals */}
            <ActionModal
                isVisible={showInfoModal}
                onClose={() => setShowInfoModal(false)}
                type={infoModalData.type}
                title={infoModalData.title}
                message={infoModalData.message}
                buttons={[{ text: 'OK', onPress: () => { }, primary: true }]}
            />

            <ConfirmationModal
                isVisible={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setProductToDelete(null);
                }}
                onConfirm={handleDeleteProduct}
                title="Delete Product"
                message={`Are you sure you want to delete "${productToDelete?.title}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                confirmDestructive={true}
            />
        </View>
    );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
        color: colors.foreground,
        textAlign: 'center',
    },
    headerRight: {
        width: 40,
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingHorizontal: 8,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 6,
    },
    tabActive: {
        borderBottomWidth: 2,
        borderBottomColor: colors.primary,
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.mutedForeground,
    },
    tabTextActive: {
        color: colors.primary,
    },
    tabContent: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: colors.mutedForeground,
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
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 20,
        gap: 8,
    },
    createButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.white,
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    productCard: {
        flexDirection: 'row',
        backgroundColor: colors.card,
        borderRadius: 14,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    productImage: {
        width: 80,
        height: 80,
        borderRadius: 10,
        backgroundColor: colors.muted,
    },
    productInfo: {
        flex: 1,
        marginLeft: 12,
    },
    productTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.foreground,
        marginBottom: 4,
    },
    productPrice: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.primary,
    },
    productMrp: {
        fontSize: 12,
        color: colors.mutedForeground,
        textDecorationLine: 'line-through',
    },
    productMeta: {
        flexDirection: 'row',
        marginTop: 4,
    },
    productCategory: {
        fontSize: 11,
        color: colors.mutedForeground,
        backgroundColor: colors.secondary,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    productActions: {
        justifyContent: 'center',
        gap: 8,
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteButton: {
        backgroundColor: colors.destructive + '15',
    },
    orderCard: {
        backgroundColor: colors.card,
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    orderNumber: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.foreground,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    orderCustomer: {
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    customerLabel: {
        fontSize: 11,
        color: colors.mutedForeground,
        marginBottom: 2,
    },
    customerName: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.foreground,
    },
    customerPhone: {
        fontSize: 12,
        color: colors.mutedForeground,
    },
    orderItems: {
        gap: 8,
        marginBottom: 12,
    },
    orderItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    orderItemImage: {
        width: 44,
        height: 44,
        borderRadius: 8,
        backgroundColor: colors.muted,
    },
    orderItemInfo: {
        flex: 1,
        marginLeft: 10,
    },
    orderItemName: {
        fontSize: 13,
        fontWeight: '500',
        color: colors.foreground,
    },
    orderItemQty: {
        fontSize: 12,
        color: colors.mutedForeground,
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    orderDate: {
        fontSize: 12,
        color: colors.mutedForeground,
    },
    orderTotal: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.primary,
    },
    shippingInfo: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    shippingLabel: {
        fontSize: 11,
        color: colors.mutedForeground,
        marginBottom: 2,
    },
    shippingAddress: {
        fontSize: 12,
        color: colors.foreground,
    },
    formContainer: {
        flex: 1,
        padding: 16,
    },
    formTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.foreground,
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.foreground,
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        backgroundColor: colors.input,
        borderRadius: 12,
        padding: 14,
        fontSize: 14,
        color: colors.foreground,
        borderWidth: 1,
        borderColor: colors.border,
    },
    textArea: {
        minHeight: 80,
        paddingTop: 14,
    },
    imagePicker: {
        width: '100%',
        height: 180,
        borderRadius: 14,
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
        fontSize: 13,
        color: colors.mutedForeground,
        marginTop: 8,
    },
    additionalImages: {
        marginTop: 8,
    },
    additionalImageContainer: {
        position: 'relative',
        marginRight: 10,
    },
    additionalImage: {
        width: 70,
        height: 70,
        borderRadius: 10,
    },
    removeImageButton: {
        position: 'absolute',
        top: -6,
        right: -6,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: colors.destructive,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addImageButton: {
        width: 70,
        height: 70,
        borderRadius: 10,
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
        borderRadius: 12,
        padding: 14,
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
        borderRadius: 12,
        marginTop: 4,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    categoryOption: {
        padding: 14,
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
        gap: 12,
    },
    priceField: {
        flex: 1,
    },
    formActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: colors.secondary,
        borderRadius: 12,
        padding: 16,
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
        borderRadius: 12,
        padding: 16,
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
