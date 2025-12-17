import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions, Image } from 'react-native';
import { Heart, Star, ArrowRight, Sparkles, Flame, Zap } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import TopBar from '@/components/TopBar';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const BANNER_WIDTH = width - 12;
const CARD_WIDTH = (width - 12 - 8) / 2;

const categories = [
  { id: '1', name: 'Fruits', image: 'https://images.pexels.com/photos/1132047/pexels-photo-1132047.jpeg?auto=compress&cs=tinysrgb&w=200', color: '#FEE2E2' },
  { id: '2', name: 'Vegetables', image: 'https://images.pexels.com/photos/2255935/pexels-photo-2255935.jpeg?auto=compress&cs=tinysrgb&w=200', color: '#DCFCE7' },
  { id: '3', name: 'Fashion', image: 'https://images.pexels.com/photos/934070/pexels-photo-934070.jpeg?auto=compress&cs=tinysrgb&w=200', color: '#E0E7FF' },
  { id: '4', name: 'Electronics', image: 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg?auto=compress&cs=tinysrgb&w=200', color: '#FEF3C7' },
  { id: '5', name: 'Home', image: 'https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg?auto=compress&cs=tinysrgb&w=200', color: '#FCE7F3' },
  { id: '6', name: 'Beauty', image: 'https://images.pexels.com/photos/2587370/pexels-photo-2587370.jpeg?auto=compress&cs=tinysrgb&w=200', color: '#FED7AA' },
  { id: '7', name: 'Sports', image: 'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=200', color: '#CFFAFE' },
  { id: '8', name: 'Toys', image: 'https://images.pexels.com/photos/163036/mario-luigi-yoschi-figures-163036.jpeg?auto=compress&cs=tinysrgb&w=200', color: '#D1FAE5' },
];

const trendingProducts = [
  { id: '1', name: 'Fresh Apples', price: '₹120', originalPrice: '₹150', rating: 4.8, reviews: 234, image: 'https://images.pexels.com/photos/1510392/pexels-photo-1510392.jpeg?auto=compress&cs=tinysrgb&w=300', badge: 'Sale', discount: '20% OFF' },
  { id: '2', name: 'Organic Bananas', price: '₹60', originalPrice: '₹80', rating: 4.9, reviews: 456, image: 'https://images.pexels.com/photos/2872755/pexels-photo-2872755.jpeg?auto=compress&cs=tinysrgb&w=300', badge: 'Organic', discount: '25% OFF' },
  { id: '3', name: 'Premium Mangoes', price: '₹250', originalPrice: '₹300', rating: 4.7, reviews: 189, image: 'https://images.pexels.com/photos/918643/pexels-photo-918643.jpeg?auto=compress&cs=tinysrgb&w=300', badge: 'Premium', discount: '17% OFF' },
  { id: '4', name: 'Fresh Oranges', price: '₹90', originalPrice: '₹110', rating: 4.6, reviews: 321, image: 'https://images.pexels.com/photos/42059/citrus-diet-food-fresh-42059.jpeg?auto=compress&cs=tinysrgb&w=300', badge: 'Fresh', discount: '18% OFF' },
];

const fashionProducts = [
  { id: '1', name: 'Summer T-Shirt', price: '₹599', originalPrice: '₹999', rating: 4.5, reviews: 567, image: 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=300', badge: 'Trending' },
  { id: '2', name: 'Denim Jeans', price: '₹1,299', originalPrice: '₹1,999', rating: 4.7, reviews: 892, image: 'https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=300', badge: 'Bestseller' },
  { id: '3', name: 'Sneakers', price: '₹2,499', originalPrice: '₹3,999', rating: 4.8, reviews: 1234, image: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=300', badge: 'Hot Deal' },
  { id: '4', name: 'Sunglasses', price: '₹799', originalPrice: '₹1,499', rating: 4.4, reviews: 445, image: 'https://images.pexels.com/photos/701877/pexels-photo-701877.jpeg?auto=compress&cs=tinysrgb&w=300', badge: 'New' },
];

const banners = [
  {
    id: '1',
    title: 'Flash Sale',
    subtitle: 'Up to 70% off on electronics & fashion',
    badge: '🔥 HOT',
    image: '🛍️',
    gradient: ['#FF6B6B', '#EE5A5A'],
  },
  {
    id: '2',
    title: 'Fresh Arrivals',
    subtitle: 'Farm fresh fruits & vegetables delivered daily',
    badge: '🌿 NEW',
    image: '🥬',
    gradient: ['#22C55E', '#16A34A'],
  },
  {
    id: '3',
    title: 'Fashion Week',
    subtitle: 'Latest trends at unbeatable prices',
    badge: '✨ STYLE',
    image: '👗',
    gradient: ['#8B5CF6', '#7C3AED'],
  },
];

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const [currentBanner, setCurrentBanner] = useState(0);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const bannerScrollRef = useRef<ScrollView>(null);

  const handleBannerScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / BANNER_WIDTH);
    setCurrentBanner(index);
  };

  const toggleWishlist = (id: string) => {
    setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const styles = createStyles(colors, isDark);

  return (
    <View style={styles.container}>
      <TopBar />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Banner Carousel */}
        <ScrollView
          ref={bannerScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleBannerScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.bannerScrollContainer}
        >
          {banners.map((banner) => (
            <LinearGradient
              key={banner.id}
              colors={isDark ? ['#1E3A2F', banner.gradient[1]] as const : [banner.gradient[0], banner.gradient[1]] as const}
              style={styles.banner}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.bannerBadge}>
                <Text style={styles.bannerBadgeText}>{banner.badge}</Text>
              </View>
              <View style={styles.bannerRow}>
                <View style={styles.bannerContent}>
                  <Text style={styles.bannerTitle}>{banner.title}</Text>
                  <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                  <Pressable style={styles.shopNowButton}>
                    <Text style={styles.shopNowText}>Shop Now</Text>
                    <ArrowRight size={14} color={colors.primary} />
                  </Pressable>
                </View>
                <View style={styles.bannerImageContainer}>
                  <Text style={styles.bannerImage}>{banner.image}</Text>
                </View>
              </View>
            </LinearGradient>
          ))}
        </ScrollView>

        {/* Banner Dots */}
        <View style={styles.bannerDots}>
          {banners.map((_, index) => (
            <Pressable key={index} onPress={() => {
              bannerScrollRef.current?.scrollTo({ x: index * BANNER_WIDTH, animated: true });
              setCurrentBanner(index);
            }}>
              <View style={[styles.dot, currentBanner === index && styles.activeDot]} />
            </Pressable>
          ))}
        </View>

        {/* Categories */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Sparkles size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Shop by Category</Text>
          </View>
          <Pressable style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>See All</Text>
            <ArrowRight size={14} color={colors.primary} />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.map((category) => (
            <Pressable key={category.id} style={styles.categoryCard}>
              <View style={[styles.categoryIconContainer, { backgroundColor: category.color }]}>
                <Image source={{ uri: category.image }} style={styles.categoryImage} />
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Trending Products */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Flame size={18} color="#EF4444" />
            <Text style={styles.sectionTitle}>Trending Now</Text>
          </View>
          <Pressable style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All</Text>
            <ArrowRight size={14} color={colors.primary} />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.productsContainer}
        >
          {trendingProducts.map((product) => (
            <Pressable key={product.id} style={styles.productCard}>
              <View style={styles.productBadge}>
                <Text style={styles.productBadgeText}>{product.discount}</Text>
              </View>
              <Pressable
                style={styles.wishlistButton}
                onPress={() => toggleWishlist(`trend-${product.id}`)}
              >
                <Heart
                  size={18}
                  color={wishlist.includes(`trend-${product.id}`) ? '#EF4444' : colors.mutedForeground}
                  fill={wishlist.includes(`trend-${product.id}`) ? '#EF4444' : 'transparent'}
                />
              </Pressable>
              <Image source={{ uri: product.image }} style={styles.productImage} />
              <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
              <View style={styles.ratingRow}>
                <Star size={12} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.ratingText}>{product.rating}</Text>
                <Text style={styles.reviewsText}>({product.reviews})</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.productPrice}>{product.price}</Text>
                <Text style={styles.originalPrice}>{product.originalPrice}</Text>
              </View>
              <Pressable style={styles.addToCartButton}>
                <Text style={styles.addToCartText}>Add to Cart</Text>
              </Pressable>
            </Pressable>
          ))}
        </ScrollView>

        {/* Fashion Products */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Zap size={18} color="#8B5CF6" />
            <Text style={styles.sectionTitle}>Fashion Picks</Text>
          </View>
          <Pressable style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All</Text>
            <ArrowRight size={14} color={colors.primary} />
          </Pressable>
        </View>

        <View style={styles.gridContainer}>
          {fashionProducts.map((product) => (
            <Pressable key={product.id} style={styles.gridProductCard}>
              <View style={[styles.productBadge, { backgroundColor: '#8B5CF6' }]}>
                <Text style={styles.productBadgeText}>{product.badge}</Text>
              </View>
              <Pressable
                style={styles.wishlistButton}
                onPress={() => toggleWishlist(`fashion-${product.id}`)}
              >
                <Heart
                  size={18}
                  color={wishlist.includes(`fashion-${product.id}`) ? '#EF4444' : colors.mutedForeground}
                  fill={wishlist.includes(`fashion-${product.id}`) ? '#EF4444' : 'transparent'}
                />
              </Pressable>
              <Image source={{ uri: product.image }} style={styles.gridProductImage} />
              <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
              <View style={styles.ratingRow}>
                <Star size={12} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.ratingText}>{product.rating}</Text>
                <Text style={styles.reviewsText}>({product.reviews})</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.productPrice}>{product.price}</Text>
                <Text style={styles.originalPrice}>{product.originalPrice}</Text>
              </View>
              <Pressable style={styles.addToCartButton}>
                <Text style={styles.addToCartText}>Add to Cart</Text>
              </Pressable>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 6,
    paddingBottom: 100,
  },
  bannerScrollContainer: {
    paddingTop: 8,
  },
  banner: {
    width: BANNER_WIDTH,
    borderRadius: 16,
    padding: 18,
    minHeight: 150,
    marginRight: 12,
  },
  bannerBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  bannerBadgeText: {
    color: colors.foreground,
    fontSize: 11,
    fontWeight: '800',
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
  },
  bannerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    maxWidth: '85%',
    marginBottom: 12,
  },
  shopNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 4,
  },
  shopNowText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  bannerImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerImage: {
    fontSize: 42,
  },
  bannerDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 16,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.mutedForeground,
  },
  activeDot: {
    backgroundColor: colors.primary,
    width: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.foreground,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
  },
  categoriesContainer: {
    gap: 12,
    marginBottom: 20,
  },
  categoryCard: {
    alignItems: 'center',
    width: 72,
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  categoryImage: {
    width: 60,
    height: 60,
    borderRadius: 16,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.foreground,
  },
  productsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  productCard: {
    width: 160,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  productBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 1,
  },
  productBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  wishlistButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  productImage: {
    width: '100%',
    height: 100,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 10,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.foreground,
  },
  reviewsText: {
    fontSize: 11,
    color: colors.mutedForeground,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  originalPrice: {
    fontSize: 12,
    color: colors.mutedForeground,
    textDecorationLine: 'line-through',
  },
  addToCartButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  addToCartText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 20,
  },
  gridProductCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gridProductImage: {
    width: '100%',
    height: 90,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 10,
  },
});
