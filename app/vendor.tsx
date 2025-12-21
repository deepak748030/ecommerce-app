import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { router, useFocusEffect } from 'expo-router';
import {
    ArrowLeft,
    Plus,
    Package,
    ShoppingBag,
    TrendingUp,
} from 'lucide-react-native';
import { vendorApi, categoriesApi, Category, Product, VendorOrder, VendorAnalytics } from '@/lib/api';
import { ActionModal } from '@/components/ActionModal';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { VendorAnalytics as VendorAnalyticsTab } from '@/components/vendor/VendorAnalytics';
import { VendorProducts } from '@/components/vendor/VendorProducts';
import { VendorCreateProduct } from '@/components/vendor/VendorCreateProduct';
import { VendorOrders } from '@/components/vendor/VendorOrders';

type TabType = 'analytics' | 'create' | 'products' | 'orders';

export default function VendorScreen() {
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const styles = createStyles(colors);

    const [activeTab, setActiveTab] = useState<TabType>('analytics');

    // Analytics state
    const [analytics, setAnalytics] = useState<VendorAnalytics | null>(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);

    // Products state
    const [products, setProducts] = useState<Product[]>([]);
    const [productsLoading, setProductsLoading] = useState(true);

    // Orders state
    const [orders, setOrders] = useState<VendorOrder[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

    // Create product state
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
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

    const loadAnalytics = async () => {
        try {
            setAnalyticsLoading(true);
            const result = await vendorApi.getAnalytics();
            if (result.success && result.response) {
                setAnalytics(result.response);
            }
        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setAnalyticsLoading(false);
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
            loadAnalytics();
            loadProducts();
            loadOrders();
        }, [])
    );

    const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
        setUpdatingOrderId(orderId);
        try {
            const result = await vendorApi.updateOrderStatus(orderId, newStatus);
            if (result.success) {
                setInfoModalData({
                    title: 'Success',
                    message: `Order status updated to ${newStatus.replace(/_/g, ' ')}`,
                    type: 'success'
                });
                setShowInfoModal(true);
                loadOrders();
                loadAnalytics();
            } else {
                setInfoModalData({ title: 'Error', message: result.message || 'Failed to update status', type: 'error' });
                setShowInfoModal(true);
            }
        } catch (error) {
            setInfoModalData({ title: 'Error', message: 'Failed to update order status', type: 'error' });
            setShowInfoModal(true);
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const handleCreateProduct = async (productForm: any, category: Category) => {
        setIsSubmitting(true);
        try {
            const productData = {
                title: productForm.title.trim(),
                description: productForm.description.trim(),
                price: parseFloat(productForm.price),
                mrp: productForm.mrp ? parseFloat(productForm.mrp) : parseFloat(productForm.price),
                category: category._id,
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
                loadAnalytics();
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
        setSelectedCategory(null);
        setEditingProduct(null);
    };

    const handleEditProduct = (product: Product) => {
        setEditingProduct(product);
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
                loadAnalytics();
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

    const showInfo = (title: string, message: string, type: 'info' | 'success' | 'error') => {
        setInfoModalData({ title, message, type });
        setShowInfoModal(true);
    };

    const getInitialForm = () => {
        if (editingProduct) {
            return {
                title: editingProduct.title,
                description: editingProduct.description,
                price: editingProduct.price.toString(),
                mrp: editingProduct.mrp.toString(),
                location: editingProduct.location,
                fullLocation: editingProduct.fullLocation,
                badge: editingProduct.badge,
                image: editingProduct.image,
                images: editingProduct.images || [],
            };
        }
        return {
            title: '',
            description: '',
            price: '',
            mrp: '',
            location: '',
            fullLocation: '',
            badge: '',
            image: '',
            images: [],
        };
    };

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

            {/* Tab Bar */}
            <View style={styles.tabBar}>
                <Pressable
                    style={[styles.tab, activeTab === 'analytics' && styles.tabActive]}
                    onPress={() => setActiveTab('analytics')}
                >
                    <TrendingUp size={16} color={activeTab === 'analytics' ? colors.primary : colors.mutedForeground} />
                    <Text style={[styles.tabText, activeTab === 'analytics' && styles.tabTextActive]}>
                        Analytics
                    </Text>
                </Pressable>
                <Pressable
                    style={[styles.tab, activeTab === 'products' && styles.tabActive]}
                    onPress={() => setActiveTab('products')}
                >
                    <Package size={16} color={activeTab === 'products' ? colors.primary : colors.mutedForeground} />
                    <Text style={[styles.tabText, activeTab === 'products' && styles.tabTextActive]}>
                        Products
                    </Text>
                </Pressable>
                <Pressable
                    style={[styles.tab, activeTab === 'create' && styles.tabActive]}
                    onPress={() => {
                        resetForm();
                        setActiveTab('create');
                    }}
                >
                    <Plus size={16} color={activeTab === 'create' ? colors.primary : colors.mutedForeground} />
                    <Text style={[styles.tabText, activeTab === 'create' && styles.tabTextActive]}>
                        Create
                    </Text>
                </Pressable>
                <Pressable
                    style={[styles.tab, activeTab === 'orders' && styles.tabActive]}
                    onPress={() => setActiveTab('orders')}
                >
                    <ShoppingBag size={16} color={activeTab === 'orders' ? colors.primary : colors.mutedForeground} />
                    <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>
                        Orders
                    </Text>
                </Pressable>
            </View>

            {/* Tab Content */}
            <View style={styles.tabContent}>
                {activeTab === 'analytics' && (
                    <VendorAnalyticsTab analytics={analytics} loading={analyticsLoading} />
                )}
                {activeTab === 'products' && (
                    <VendorProducts
                        products={products}
                        loading={productsLoading}
                        onEdit={handleEditProduct}
                        onDelete={(product) => {
                            setProductToDelete(product);
                            setShowDeleteModal(true);
                        }}
                        onCreatePress={() => {
                            resetForm();
                            setActiveTab('create');
                        }}
                    />
                )}
                {activeTab === 'create' && (
                    <VendorCreateProduct
                        categories={categories}
                        editingProduct={editingProduct}
                        initialForm={getInitialForm()}
                        selectedCategory={selectedCategory}
                        isSubmitting={isSubmitting}
                        onSubmit={handleCreateProduct}
                        onCancel={resetForm}
                        onCategorySelect={setSelectedCategory}
                        onShowInfo={showInfo}
                    />
                )}
                {activeTab === 'orders' && (
                    <VendorOrders
                        orders={orders}
                        loading={ordersLoading}
                        updatingOrderId={updatingOrderId}
                        onUpdateStatus={handleUpdateOrderStatus}
                    />
                )}
            </View>

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

const createStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
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
        paddingHorizontal: 6,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 4,
    },
    tabActive: {
        borderBottomWidth: 2,
        borderBottomColor: colors.primary,
    },
    tabText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.mutedForeground,
    },
    tabTextActive: {
        color: colors.primary,
    },
    tabContent: {
        flex: 1,
    },
});
