import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Star, ShoppingCart, Minus, Plus, ChevronRight } from 'lucide-react-native';
import { mockReviews, getFavorites, toggleFavorite, Review } from '@/lib/mockData';
import { productsApi, Product, getImageUrl } from '@/lib/api';
import { ImageCarousel } from '@/components/ImageCarousel';
import { useTheme } from '@/hooks/useTheme';
import { useCart } from '@/hooks/useCart';

const { width: screenWidth } = Dimensions.get('window');

interface ProductDisplay {
  id: string;
  title: string;
  description: string;
  price: number;
  mrp: number;
  category: string;
  image: string;
  images: string[];
  badge: string;
  location: string;
  fullLocation: string;
  rating: number;
  reviews: number;
  date: string;
  time: string;
  services: string[];
}

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const { addToCart } = useCart();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState<ProductDisplay | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id || typeof id !== 'string') {
        setError('Invalid product ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await productsApi.getById(id);

        if (response.success && response.response) {
          const apiProduct = response.response;

          // Transform API response to display format
          const categoryName = typeof apiProduct.category === 'object'
            ? apiProduct.category.name
            : apiProduct.category || 'General';

          const displayProduct: ProductDisplay = {
            id: apiProduct._id,
            title: apiProduct.title,
            description: apiProduct.description || '',
            price: apiProduct.price,
            mrp: apiProduct.mrp || apiProduct.price,
            category: categoryName,
            image: getImageUrl(apiProduct.image),
            images: apiProduct.images?.length > 0
              ? apiProduct.images.map(img => getImageUrl(img))
              : [getImageUrl(apiProduct.image)],
            badge: apiProduct.badge || '',
            location: apiProduct.location || '',
            fullLocation: apiProduct.fullLocation || '',
            rating: apiProduct.rating || 4.5,
            reviews: apiProduct.reviews || 0,
            date: apiProduct.date || '',
            time: apiProduct.time || '',
            services: apiProduct.services || [],
          };

          setProduct(displayProduct);

          // Load reviews for this product
          const productReviews = mockReviews.filter(r => r.eventId === id);
          setReviews(productReviews);
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

    const loadFavorites = async () => {
      const favs = await getFavorites();
      setFavorites(favs);
    };
    loadFavorites();
  }, [id]);

  const styles = createStyles(colors);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.errorText, { marginTop: 12 }]}>Loading product...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Product not found'}</Text>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const handleToggleFavorite = async () => {
    await toggleFavorite(product.id);
    const updatedFavorites = await getFavorites();
    setFavorites(updatedFavorites);
  };

  const isFavorite = favorites.includes(product.id);
  const discountPercent = product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  const increaseQuantity = () => setQuantity(prev => prev + 1);
  const decreaseQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  const handleAddToCart = async () => {
    if (!product) return;

    setAddingToCart(true);
    try {
      await addToCart(product.id, quantity);
      Alert.alert('Added to Cart', `${product.title} (x${quantity}) added to your cart!`, [
        { text: 'Continue Shopping', style: 'cancel' },
        { text: 'View Cart', onPress: () => router.push('/cart') }
      ]);
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Failed to add item to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;

    // Add to cart first then go to checkout
    try {
      await addToCart(product.id, quantity);
      router.push('/checkout');
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to proceed. Please try again.');
    }
  };

  // Calculate rating distribution (mock data for now)
  const totalReviews = product.reviews || 0;
  const ratingDistribution = {
    5: Math.round(totalReviews * 0.6),
    4: Math.round(totalReviews * 0.25),
    3: Math.round(totalReviews * 0.08),
    2: Math.round(totalReviews * 0.04),
    1: Math.round(totalReviews * 0.03),
  };

  const getBarWidth = (count: number) => {
    if (totalReviews === 0) return 0;
    return (count / totalReviews) * 100;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        <ImageCarousel
          images={product.images}
          badge={product.badge}
          showBackButton={true}
          showFavoriteButton={true}
          isFavorite={isFavorite}
          onBackPress={() => router.back()}
          onFavoritePress={handleToggleFavorite}
          height={260}
        />

        <View style={styles.content}>
          {/* Category Badge */}
          <View style={[styles.categoryBadge, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.categoryText, { color: colors.primary }]}>{product.category}</Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.foreground }]}>{product.title}</Text>

          {/* Price Section */}
          <View style={styles.priceSection}>
            <Text style={[styles.price, { color: colors.foreground }]}>₹{product.price.toLocaleString()}</Text>
            {product.mrp > product.price && (
              <>
                <Text style={[styles.mrpPrice, { color: colors.mutedForeground }]}>₹{product.mrp.toLocaleString()}</Text>
                <View style={[styles.discountBadge, { backgroundColor: colors.success }]}>
                  <Text style={styles.discountText}>{discountPercent}% OFF</Text>
                </View>
              </>
            )}
          </View>

          {/* Quantity Selector */}
          <View style={[styles.quantitySection, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.quantityLabel, { color: colors.foreground }]}>Quantity</Text>
            <View style={styles.quantityControls}>
              <Pressable
                style={[styles.quantityBtn, { backgroundColor: colors.secondary }]}
                onPress={decreaseQuantity}
              >
                <Minus size={16} color={colors.foreground} />
              </Pressable>
              <Text style={[styles.quantityValue, { color: colors.foreground }]}>{quantity}</Text>
              <Pressable
                style={[styles.quantityBtn, { backgroundColor: colors.primary }]}
                onPress={increaseQuantity}
              >
                <Plus size={16} color={colors.primaryForeground} />
              </Pressable>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Description</Text>
            <Text style={[styles.description, { color: colors.mutedForeground }]}>{product.description}</Text>
          </View>

          {/* Features */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Features</Text>
            {product.services.map((service, index) => (
              <View key={index} style={styles.featureRow}>
                <View style={[styles.featureDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.featureText, { color: colors.mutedForeground }]}>{service}</Text>
              </View>
            ))}
          </View>

          {/* Ratings & Reviews - Play Store Style */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Ratings & Reviews</Text>

            <View style={[styles.ratingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.ratingsContainer}>
                {/* Left: Big Rating */}
                <View style={styles.ratingLeft}>
                  <Text style={[styles.ratingBig, { color: colors.foreground }]}>{product.rating}</Text>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={12}
                        color={star <= Math.floor(product.rating) ? colors.warning : colors.muted}
                        fill={star <= Math.floor(product.rating) ? colors.warning : 'transparent'}
                      />
                    ))}
                  </View>
                  <Text style={[styles.totalReviewsText, { color: colors.mutedForeground }]}>{totalReviews} reviews</Text>
                </View>

                {/* Right: Rating Bars */}
                <View style={styles.ratingBars}>
                  {[5, 4, 3, 2, 1].map((star) => (
                    <View key={star} style={styles.ratingBarRow}>
                      <Text style={[styles.starNum, { color: colors.mutedForeground }]}>{star}</Text>
                      <Star size={10} color={colors.warning} fill={colors.warning} />
                      <View style={[styles.barBg, { backgroundColor: colors.muted }]}>
                        <View
                          style={[
                            styles.barFill,
                            { backgroundColor: colors.primary, width: `${getBarWidth(ratingDistribution[star as keyof typeof ratingDistribution])}%` }
                          ]}
                        />
                      </View>
                      <Text style={[styles.barCount, { color: colors.mutedForeground }]}>
                        {ratingDistribution[star as keyof typeof ratingDistribution]}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Recent Reviews */}
            {reviews.length > 0 && (
              <View style={styles.reviewsList}>
                {reviews.slice(0, 3).map((review) => (
                  <View key={review.id} style={[styles.reviewItem, { borderBottomColor: colors.border }]}>
                    <View style={styles.reviewHeader}>
                      <Image source={{ uri: review.userAvatar }} style={styles.reviewerAvatar} />
                      <View style={styles.reviewerInfo}>
                        <Text style={[styles.reviewerName, { color: colors.foreground }]}>{review.userName}</Text>
                        <View style={styles.reviewMeta}>
                          <View style={styles.reviewStars}>
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star
                                key={i}
                                size={10}
                                color={i <= review.rating ? colors.warning : colors.muted}
                                fill={i <= review.rating ? colors.warning : 'transparent'}
                              />
                            ))}
                          </View>
                          <Text style={[styles.reviewDate, { color: colors.mutedForeground }]}>{review.date}</Text>
                        </View>
                      </View>
                    </View>
                    <Text style={[styles.reviewComment, { color: colors.mutedForeground }]} numberOfLines={2}>
                      {review.comment}
                    </Text>
                  </View>
                ))}

                {reviews.length > 3 && (
                  <Pressable style={styles.seeAllBtn}>
                    <Text style={[styles.seeAllText, { color: colors.primary }]}>See all reviews</Text>
                    <ChevronRight size={16} color={colors.primary} />
                  </Pressable>
                )}
              </View>
            )}

            {reviews.length === 0 && (
              <Text style={[styles.noReviews, { color: colors.mutedForeground }]}>No reviews yet</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <SafeAreaView edges={['bottom']} style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <View style={styles.bottomContent}>
          <View style={styles.totalSection}>
            <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Total</Text>
            <Text style={[styles.totalPrice, { color: colors.foreground }]}>₹{(product.price * quantity).toLocaleString()}</Text>
          </View>
          <View style={styles.actionButtons}>
            <Pressable
              style={[styles.cartBtn, { backgroundColor: colors.secondary, borderColor: colors.primary }, addingToCart && { opacity: 0.6 }]}
              onPress={handleAddToCart}
              disabled={addingToCart}
            >
              {addingToCart ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <ShoppingCart size={18} color={colors.primary} />
              )}
            </Pressable>
            <Pressable style={[styles.buyBtn, { backgroundColor: colors.primary }]} onPress={handleBuyNow}>
              <Text style={[styles.buyBtnText, { color: colors.primaryForeground }]}>Buy Now</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginBottom: 12,
  },
  backBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backBtnText: {
    color: colors.primaryForeground,
    fontWeight: '600',
    fontSize: 13,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 24,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  price: {
    fontSize: 22,
    fontWeight: '800',
  },
  mrpPrice: {
    fontSize: 14,
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  quantitySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  quantityLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityValue: {
    fontSize: 15,
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    lineHeight: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  featureDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  featureText: {
    fontSize: 13,
  },
  ratingsCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  ratingsContainer: {
    flexDirection: 'row',
  },
  ratingLeft: {
    alignItems: 'center',
    paddingRight: 16,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    minWidth: 80,
  },
  ratingBig: {
    fontSize: 36,
    fontWeight: '800',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  totalReviewsText: {
    fontSize: 11,
    marginTop: 4,
  },
  ratingBars: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: 'center',
  },
  ratingBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  starNum: {
    fontSize: 11,
    width: 12,
    textAlign: 'center',
  },
  barBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  barCount: {
    fontSize: 10,
    width: 28,
    textAlign: 'right',
  },
  reviewsList: {
    marginTop: 4,
  },
  reviewItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  reviewerInfo: {
    flex: 1,
    marginLeft: 8,
  },
  reviewerName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  reviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 1,
  },
  reviewDate: {
    fontSize: 10,
  },
  reviewComment: {
    fontSize: 12,
    lineHeight: 18,
    marginLeft: 40,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  noReviews: {
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 16,
  },
  bottomBar: {
    borderTopWidth: 1,
  },
  bottomContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  totalSection: {},
  totalLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: '800',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cartBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  buyBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buyBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
