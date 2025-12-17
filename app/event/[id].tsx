import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Dimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Star, MessageCircle, ShoppingCart, Heart, Minus, Plus } from 'lucide-react-native';
import { allProducts, mockReviews, getFavorites, toggleFavorite, Event, Review } from '@/lib/mockData';
import { ImageCarousel } from '@/components/ImageCarousel';
import { useTheme } from '@/hooks/useTheme';

const { width: screenWidth } = Dimensions.get('window');

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState('details');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState<Event | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    // Find product from all products (mockEvents + trending + fashion)
    const foundProduct = allProducts.find(e => e.id === id);
    setProduct(foundProduct || null);

    // Get reviews for this product
    const productReviews = mockReviews.filter(r => r.eventId === id);
    setReviews(productReviews);

    // Load favorites
    const loadFavorites = async () => {
      const favs = await getFavorites();
      setFavorites(favs);
    };
    loadFavorites();
  }, [id]);

  const styles = createStyles(colors);

  if (!product) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Product not found</Text>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
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

  const handleAddToCart = () => {
    router.push('/cart');
  };

  const handleBuyNow = () => {
    router.push(`/booking/${product.id}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
          height={280}
        />

        <View style={styles.content}>
          {/* Category & Rating Row */}
          <View style={styles.topRow}>
            <View style={[styles.categoryBadge, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.categoryText, { color: colors.primary }]}>{product.category}</Text>
            </View>
            <View style={styles.ratingRow}>
              <Star size={16} color={colors.warning} fill={colors.warning} />
              <Text style={[styles.ratingText, { color: colors.foreground }]}>{product.rating}</Text>
              <Text style={[styles.reviewCount, { color: colors.mutedForeground }]}>({product.reviews})</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.foreground }]}>{product.title}</Text>

          {/* Location */}
          <View style={styles.locationRow}>
            <MapPin size={16} color={colors.mutedForeground} />
            <Text style={[styles.locationText, { color: colors.mutedForeground }]}>{product.fullLocation}</Text>
          </View>

          {/* Price Section */}
          <View style={styles.priceSection}>
            <View style={styles.priceRow}>
              <Text style={[styles.price, { color: colors.foreground }]}>₹{product.price.toLocaleString()}</Text>
              {product.mrp > product.price && (
                <Text style={[styles.mrpPrice, { color: colors.mutedForeground }]}>₹{product.mrp.toLocaleString()}</Text>
              )}
              {discountPercent > 0 && (
                <View style={[styles.discountBadge, { backgroundColor: colors.success }]}>
                  <Text style={styles.discountText}>{discountPercent}% OFF</Text>
                </View>
              )}
            </View>
          </View>

          {/* Quantity Selector */}
          <View style={[styles.quantitySection, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.quantityLabel, { color: colors.foreground }]}>Quantity</Text>
            <View style={styles.quantityControls}>
              <Pressable
                style={[styles.quantityBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                onPress={decreaseQuantity}
              >
                <Minus size={18} color={colors.foreground} />
              </Pressable>
              <Text style={[styles.quantityValue, { color: colors.foreground }]}>{quantity}</Text>
              <Pressable
                style={[styles.quantityBtn, { backgroundColor: colors.primary }]}
                onPress={increaseQuantity}
              >
                <Plus size={18} color={colors.primaryForeground} />
              </Pressable>
            </View>
          </View>

          {/* Seller Info */}
          <View style={[styles.sellerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sellerHeader}>
              <Text style={[styles.sellerTitle, { color: colors.foreground }]}>Seller Information</Text>
            </View>
            <View style={styles.sellerContent}>
              <Image source={{ uri: product.vendor.avatar }} style={styles.sellerAvatar} />
              <View style={styles.sellerDetails}>
                <Text style={[styles.sellerName, { color: colors.foreground }]}>{product.vendor.name}</Text>
                <Text style={[styles.sellerExp, { color: colors.mutedForeground }]}>{product.vendor.experience}</Text>
              </View>
              <Pressable style={[styles.chatBtn, { backgroundColor: colors.secondary }]}>
                <MessageCircle size={20} color={colors.primary} />
              </Pressable>
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <View style={[styles.tabsList, { backgroundColor: colors.secondary }]}>
              <Pressable
                style={[styles.tab, activeTab === 'details' && { backgroundColor: colors.card }]}
                onPress={() => setActiveTab('details')}
              >
                <Text style={[styles.tabText, { color: activeTab === 'details' ? colors.foreground : colors.mutedForeground }]}>
                  Details
                </Text>
              </Pressable>
              <Pressable
                style={[styles.tab, activeTab === 'reviews' && { backgroundColor: colors.card }]}
                onPress={() => setActiveTab('reviews')}
              >
                <Text style={[styles.tabText, { color: activeTab === 'reviews' ? colors.foreground : colors.mutedForeground }]}>
                  Reviews
                </Text>
              </Pressable>
            </View>

            <View style={styles.tabContent}>
              {activeTab === 'details' ? (
                <View>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Description</Text>
                  <Text style={[styles.description, { color: colors.mutedForeground }]}>{product.description}</Text>

                  <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 16 }]}>Features</Text>
                  {product.services.map((service, index) => (
                    <View key={index} style={styles.featureRow}>
                      <View style={[styles.featureDot, { backgroundColor: colors.primary }]} />
                      <Text style={[styles.featureText, { color: colors.mutedForeground }]}>{service}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View>
                  <View style={styles.reviewsHeader}>
                    <View style={styles.ratingSummary}>
                      <Star size={24} color={colors.warning} fill={colors.warning} />
                      <Text style={[styles.ratingBig, { color: colors.foreground }]}>{product.rating}</Text>
                      <Text style={[styles.totalReviews, { color: colors.mutedForeground }]}>({product.reviews} reviews)</Text>
                    </View>
                  </View>

                  {reviews.length === 0 ? (
                    <Text style={[styles.noReviews, { color: colors.mutedForeground }]}>No reviews yet</Text>
                  ) : (
                    reviews.map((review) => (
                      <View key={review.id} style={[styles.reviewItem, { borderBottomColor: colors.border }]}>
                        <View style={styles.reviewHeader}>
                          <Image source={{ uri: review.userAvatar }} style={styles.reviewerAvatar} />
                          <View style={styles.reviewerInfo}>
                            <Text style={[styles.reviewerName, { color: colors.foreground }]}>{review.userName}</Text>
                            <View style={styles.reviewStars}>
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={12}
                                  color={i < review.rating ? colors.warning : colors.muted}
                                  fill={i < review.rating ? colors.warning : 'transparent'}
                                />
                              ))}
                            </View>
                          </View>
                          <Text style={[styles.reviewDate, { color: colors.mutedForeground }]}>{review.date}</Text>
                        </View>
                        <Text style={[styles.reviewComment, { color: colors.mutedForeground }]}>{review.comment}</Text>
                      </View>
                    ))
                  )}
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.totalSection}>
          <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Total Price</Text>
          <Text style={[styles.totalPrice, { color: colors.foreground }]}>₹{(product.price * quantity).toLocaleString()}</Text>
        </View>
        <View style={styles.actionButtons}>
          <Pressable style={[styles.cartBtn, { backgroundColor: colors.secondary, borderColor: colors.primary }]} onPress={handleAddToCart}>
            <ShoppingCart size={20} color={colors.primary} />
          </Pressable>
          <Pressable style={[styles.buyBtn, { backgroundColor: colors.primary }]} onPress={handleBuyNow}>
            <Text style={[styles.buyBtnText, { color: colors.primaryForeground }]}>Buy Now</Text>
          </Pressable>
        </View>
      </View>
    </View>
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
    paddingHorizontal: 6,
    paddingTop: 16,
    paddingBottom: 120,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.mutedForeground,
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: {
    color: colors.primaryForeground,
    fontWeight: '600',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700',
  },
  reviewCount: {
    fontSize: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  locationText: {
    fontSize: 13,
  },
  priceSection: {
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  price: {
    fontSize: 26,
    fontWeight: '800',
  },
  mrpPrice: {
    fontSize: 16,
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  quantitySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  quantityLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quantityBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: '700',
    minWidth: 30,
    textAlign: 'center',
  },
  sellerCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  sellerHeader: {
    marginBottom: 12,
  },
  sellerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  sellerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  sellerDetails: {
    flex: 1,
    marginLeft: 12,
  },
  sellerName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  sellerExp: {
    fontSize: 12,
  },
  chatBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsContainer: {
    marginTop: 8,
  },
  tabsList: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabContent: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  featureText: {
    fontSize: 14,
  },
  reviewsHeader: {
    marginBottom: 16,
  },
  ratingSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingBig: {
    fontSize: 24,
    fontWeight: '800',
  },
  totalReviews: {
    fontSize: 14,
  },
  noReviews: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  reviewItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  reviewerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewDate: {
    fontSize: 11,
  },
  reviewComment: {
    fontSize: 13,
    lineHeight: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  totalSection: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: '800',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cartBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  buyBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buyBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
