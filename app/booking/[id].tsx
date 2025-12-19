import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, MapPin, Check, Package, Truck } from 'lucide-react-native';
import { productsApi, Product, getImageUrl, getToken } from '@/lib/api';
import { useTheme } from '@/hooks/useTheme';
import { useCart } from '@/hooks/useCart';
import { useAddress } from '@/hooks/useAddress';

interface ProductDisplay {
  id: string;
  title: string;
  description: string;
  price: number;
  mrp: number;
  image: string;
  location: string;
  services: string[];
}

export default function BookingFlowScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const { addToCart } = useCart();
  const { selectedAddress } = useAddress();
  const [product, setProduct] = useState<ProductDisplay | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [quantity] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id || typeof id !== 'string') {
        setError('Invalid product ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await productsApi.getById(id);

        if (response.success && response.response) {
          const apiProduct = response.response;
          setProduct({
            id: apiProduct._id,
            title: apiProduct.title,
            description: apiProduct.description || '',
            price: apiProduct.price,
            mrp: apiProduct.mrp || apiProduct.price,
            image: getImageUrl(apiProduct.image),
            location: apiProduct.location || '',
            services: apiProduct.services || [],
          });
        } else {
          setError(response.message || 'Product not found');
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const styles = createStyles(colors);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.mutedForeground }]}>{error || 'Product not found'}</Text>
          <Pressable style={[styles.goBackButton, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
            <Text style={[styles.goBackButtonText, { color: colors.primaryForeground }]}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const discountPercent = product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  const handleProceedToPayment = async () => {
    // Check authentication
    const token = await getToken();
    if (!token) {
      Alert.alert(
        'Login Required',
        'Please login to continue with your order',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => router.push('/auth/phone') }
        ]
      );
      return;
    }

    // Check if address is selected
    if (!selectedAddress) {
      Alert.alert(
        'Address Required',
        'Please add a delivery address to continue',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Address', onPress: () => router.push('/saved-addresses') }
        ]
      );
      return;
    }

    setIsProcessing(true);
    try {
      // Add item to cart and proceed to checkout
      await addToCart(product.id, quantity);
      router.push('/checkout');
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to proceed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Checkout</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Product Card */}
          <View style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Image source={{ uri: product.image }} style={styles.productImage} />
            <View style={styles.productInfo}>
              <Text style={[styles.productTitle, { color: colors.foreground }]} numberOfLines={2}>{product.title}</Text>
              {product.location && (
                <View style={styles.locationRow}>
                  <MapPin size={12} color={colors.mutedForeground} />
                  <Text style={[styles.locationText, { color: colors.mutedForeground }]} numberOfLines={1}>{product.location}</Text>
                </View>
              )}
              <View style={styles.priceRow}>
                <Text style={[styles.productPrice, { color: colors.foreground }]}>₹{product.price.toLocaleString()}</Text>
                {product.mrp > product.price && (
                  <Text style={[styles.mrpPrice, { color: colors.mutedForeground }]}>₹{product.mrp.toLocaleString()}</Text>
                )}
              </View>
              {discountPercent > 0 && (
                <View style={[styles.discountBadge, { backgroundColor: colors.success }]}>
                  <Text style={styles.discountText}>{discountPercent}% OFF</Text>
                </View>
              )}
            </View>
          </View>

          {/* Delivery Info */}
          <View style={[styles.deliveryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.deliveryRow}>
              <View style={[styles.iconBox, { backgroundColor: colors.secondary }]}>
                <Truck size={16} color={colors.primary} />
              </View>
              <View style={styles.deliveryInfo}>
                <Text style={[styles.deliveryTitle, { color: colors.foreground }]}>Free Delivery</Text>
                <Text style={[styles.deliverySubtitle, { color: colors.mutedForeground }]}>Estimated 2-4 business days</Text>
              </View>
            </View>
            <View style={styles.deliveryRow}>
              <View style={[styles.iconBox, { backgroundColor: colors.secondary }]}>
                <Package size={16} color={colors.primary} />
              </View>
              <View style={styles.deliveryInfo}>
                <Text style={[styles.deliveryTitle, { color: colors.foreground }]}>Easy Returns</Text>
                <Text style={[styles.deliverySubtitle, { color: colors.mutedForeground }]}>7 days return policy</Text>
              </View>
            </View>
          </View>

          {/* What's Included */}
          {product.services && product.services.length > 0 && (
            <View style={[styles.includedCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>What's Included</Text>
              {product.services.map((service, index) => (
                <View key={index} style={styles.serviceItem}>
                  <View style={[styles.checkIcon, { backgroundColor: colors.secondary }]}>
                    <Check size={10} color={colors.primary} />
                  </View>
                  <Text style={[styles.serviceText, { color: colors.mutedForeground }]}>{service}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Order Summary */}
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Price ({quantity} item)</Text>
              <Text style={[styles.summaryValue, { color: colors.foreground }]}>₹{product.mrp.toLocaleString()}</Text>
            </View>
            {discountPercent > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Discount</Text>
                <Text style={[styles.summaryValue, { color: colors.success }]}>-₹{(product.mrp - product.price).toLocaleString()}</Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Delivery</Text>
              <Text style={[styles.summaryValue, { color: colors.success }]}>FREE</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryRow}>
              <Text style={[styles.totalLabel, { color: colors.foreground }]}>Total Amount</Text>
              <Text style={[styles.totalValue, { color: colors.foreground }]}>₹{product.price.toLocaleString()}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <SafeAreaView edges={['bottom']} style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <View style={styles.bottomContent}>
          <View style={styles.bottomPrice}>
            <Text style={[styles.bottomLabel, { color: colors.mutedForeground }]}>Total</Text>
            <Text style={[styles.bottomTotal, { color: colors.foreground }]}>₹{product.price.toLocaleString()}</Text>
          </View>
          <Pressable
            style={[styles.proceedButton, { backgroundColor: colors.primary }, isProcessing && { opacity: 0.6 }]}
            onPress={handleProceedToPayment}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.proceedButtonText, { color: colors.primaryForeground }]}>Proceed to Checkout</Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    marginBottom: 12,
  },
  goBackButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  goBackButtonText: {
    fontWeight: '600',
    fontSize: 13,
  },
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingVertical: 12,
    paddingHorizontal: 6,
    paddingBottom: 100,
  },
  productCard: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
    marginLeft: 10,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  locationText: {
    fontSize: 11,
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '800',
  },
  mrpPrice: {
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  deliveryCard: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    gap: 12,
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  deliverySubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  includedCard: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  checkIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceText: {
    fontSize: 12,
    flex: 1,
  },
  summaryCard: {
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  bottomBar: {
    borderTopWidth: 1,
  },
  bottomContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingVertical: 12,
  },
  bottomPrice: {},
  bottomLabel: {
    fontSize: 10,
    marginBottom: 2,
  },
  bottomTotal: {
    fontSize: 16,
    fontWeight: '800',
  },
  proceedButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 160,
    alignItems: 'center',
  },
  proceedButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
