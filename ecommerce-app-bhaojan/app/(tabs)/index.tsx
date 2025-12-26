import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions, Animated, NativeSyntheticEvent, NativeScrollEvent, RefreshControl, FlatList, ActivityIndicator } from 'react-native';
import { ArrowRight, Sparkles, Flame, Zap } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useWishlist } from '@/hooks/useWishlist';
import TopBar from '@/components/TopBar';
import EventCard from '@/components/EventCard';
import { CachedImage } from '@/components/CachedImage';
import { LinearGradient } from 'expo-linear-gradient';
import { categoriesApi, productsApi, bannersApi, Product, Category, Banner, getImageUrl } from '@/lib/api';
import { router } from 'expo-router';
import { HomeScreenSkeleton } from '@/components/Skeleton';

const { width } = Dimensions.get('window');
const BANNER_WIDTH = width - 32;
const CARD_WIDTH = (width - 20) / 2;
const SCROLL_THRESHOLD = 50;
const PAGE_LIMIT = 4;

// Default banners in case API fails
const defaultBanners = [
  {
    _id: '1',
    title: 'Fresh Fruits',
    subtitle: 'Farm fresh fruits delivered daily to your door',
    badge: '🍎 FRESH',
    image: '🍊',
    gradient: ['#22C55E', '#16A34A'],
    linkType: 'search' as const,
    linkValue: 'Fruits',
    isActive: true,
    order: 0,
  },
  {
    _id: '2',
    title: 'Fashion Deals',
    subtitle: 'Latest trends at unbeatable prices',
    badge: '✨ STYLE',
    image: '👗',
    gradient: ['#8B5CF6', '#7C3AED'],
    linkType: 'search' as const,
    linkValue: 'Fashion',
    isActive: true,
    order: 1,
  },
  {
    _id: '3',
    title: 'Event Planning',
    subtitle: 'Weddings, birthdays & corporate events',
    badge: '🎉 EVENTS',
    image: '🎊',
    gradient: ['#FF6B6B', '#EE5A5A'],
    linkType: 'search' as const,
    linkValue: 'Weddings',
    isActive: true,
    order: 2,
  },
];

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { isFavorite, toggleFavorite } = useWishlist();
  const [currentBanner, setCurrentBanner] = useState(0);
  const bannerScrollRef = useRef<ScrollView>(null);

  // API data states
  const [banners, setBanners] = useState<Banner[]>(defaultBanners);
  const [categories, setCategories] = useState<Category[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [fashionProducts, setFashionProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Pagination states for trending
  const [trendingPage, setTrendingPage] = useState(1);
  const [trendingHasMore, setTrendingHasMore] = useState(true);
  const [trendingLoadingMore, setTrendingLoadingMore] = useState(false);

  // Pagination states for fashion picks
  const [fashionPage, setFashionPage] = useState(1);
  const [fashionHasMore, setFashionHasMore] = useState(true);
  const [fashionLoadingMore, setFashionLoadingMore] = useState(false);

  // Animation for search bar visibility
  const searchBarAnimation = useRef(new Animated.Value(1)).current;
  const lastScrollY = useRef(0);
  const isSearchBarVisible = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      // Fetch banners, categories, trending and fashion picks in parallel
      const [bannersRes, categoriesRes, trendingRes, fashionRes] = await Promise.all([
        bannersApi.getAll(),
        categoriesApi.getAll(),
        productsApi.getTrending(PAGE_LIMIT, 1),
        productsApi.getFashionPicks(PAGE_LIMIT, 1),
      ]);

      if (bannersRes.success && bannersRes.response?.data && bannersRes.response.data.length > 0) {
        setBanners(bannersRes.response.data);
      }

      if (categoriesRes.success && categoriesRes.response?.data) {
        setCategories(categoriesRes.response.data);
      }

      if (trendingRes.success && trendingRes.response?.data) {
        setTrendingProducts(trendingRes.response.data);
        setTrendingPage(1);
        setTrendingHasMore(trendingRes.response.data.length >= PAGE_LIMIT);
      }

      if (fashionRes.success && fashionRes.response?.data) {
        setFashionProducts(fashionRes.response.data);
        setFashionPage(1);
        setFashionHasMore(fashionRes.response.data.length >= PAGE_LIMIT);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-scroll banner every 2 seconds with infinite loop
  useEffect(() => {
    if (banners.length <= 1) return;

    const autoScrollInterval = setInterval(() => {
      setCurrentBanner((prev) => {
        const nextIndex = (prev + 1) % banners.length;
        bannerScrollRef.current?.scrollTo({
          x: nextIndex * (BANNER_WIDTH + 12),
          animated: true,
        });
        return nextIndex;
      });
    }, 2000);

    return () => clearInterval(autoScrollInterval);
  }, [banners.length]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  // Load more trending products
  const loadMoreTrending = useCallback(async () => {
    if (trendingLoadingMore || !trendingHasMore) return;

    setTrendingLoadingMore(true);
    try {
      const nextPage = trendingPage + 1;
      const res = await productsApi.getTrending(PAGE_LIMIT, nextPage);
      if (res.success && res.response?.data) {
        setTrendingProducts(prev => [...prev, ...res.response!.data]);
        setTrendingPage(nextPage);
        setTrendingHasMore(res.response.data.length >= PAGE_LIMIT);
      }
    } catch (error) {
      console.error('Error loading more trending:', error);
    } finally {
      setTrendingLoadingMore(false);
    }
  }, [trendingPage, trendingHasMore, trendingLoadingMore]);

  // Load more fashion picks
  const loadMoreFashion = useCallback(async () => {
    if (fashionLoadingMore || !fashionHasMore) return;

    setFashionLoadingMore(true);
    try {
      const nextPage = fashionPage + 1;
      const res = await productsApi.getFashionPicks(PAGE_LIMIT, nextPage);
      if (res.success && res.response?.data) {
        setFashionProducts(prev => [...prev, ...res.response!.data]);
        setFashionPage(nextPage);
        setFashionHasMore(res.response.data.length >= PAGE_LIMIT);
      }
    } catch (error) {
      console.error('Error loading more fashion:', error);
    } finally {
      setFashionLoadingMore(false);
    }
  }, [fashionPage, fashionHasMore, fashionLoadingMore]);

  // Handle horizontal scroll end for trending
  const handleTrendingScrollEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isCloseToEnd = contentOffset.x + layoutMeasurement.width >= contentSize.width - 100;
    if (isCloseToEnd && trendingHasMore && !trendingLoadingMore) {
      loadMoreTrending();
    }
  }, [trendingHasMore, trendingLoadingMore, loadMoreTrending]);

  // Handle horizontal scroll end for fashion
  const handleFashionScrollEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isCloseToEnd = contentOffset.x + layoutMeasurement.width >= contentSize.width - 100;
    if (isCloseToEnd && fashionHasMore && !fashionLoadingMore) {
      loadMoreFashion();
    }
  }, [fashionHasMore, fashionLoadingMore, loadMoreFashion]);

  const handleBannerScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / BANNER_WIDTH);
    setCurrentBanner(index);
  };


  const handleBannerPress = (banner: Banner) => {
    if (banner.linkType === 'category') {
      router.push({ pathname: '/category/[id]', params: { id: banner.linkValue } });
    } else if (banner.linkType === 'product') {
      router.push({ pathname: '/event/[id]', params: { id: banner.linkValue } });
    } else if (banner.linkType === 'search') {
      router.push({ pathname: '/search', params: { category: banner.linkValue } });
    }
  };

  const handleCategoryPress = (category: Category) => {
    router.push({ pathname: '/category/[id]', params: { id: category._id } });
  };

  const handleMainScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const currentScrollY = contentOffset.y;
    const scrollDiff = currentScrollY - lastScrollY.current;

    // Scrolling down - hide search bar
    if (scrollDiff > 0 && currentScrollY > SCROLL_THRESHOLD && isSearchBarVisible.current) {
      isSearchBarVisible.current = false;
      Animated.timing(searchBarAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
    // Scrolling up - show search bar
    else if (scrollDiff < -10 && !isSearchBarVisible.current) {
      isSearchBarVisible.current = true;
      Animated.timing(searchBarAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }

    lastScrollY.current = currentScrollY;

    // Infinite scroll for fashion picks - trigger when near bottom
    const isCloseToBottom = currentScrollY + layoutMeasurement.height >= contentSize.height - 200;
    if (isCloseToBottom && fashionHasMore && !fashionLoadingMore) {
      loadMoreFashion();
    }
  };

  const styles = createStyles(colors, isDark);

  if (loading) {
    return (
      <View style={styles.container}>
        <TopBar showSearchBar={true} searchBarAnimation={searchBarAnimation} />
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <HomeScreenSkeleton />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar showSearchBar={true} searchBarAnimation={searchBarAnimation} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleMainScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
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
          snapToInterval={BANNER_WIDTH + 12}
          decelerationRate="fast"
        >
          {banners.map((banner, index) => (
            <Pressable key={banner._id} onPress={() => handleBannerPress(banner)}>
              <LinearGradient
                colors={isDark ? ['#1E3A2F', banner.gradient[1]] as const : [banner.gradient[0], banner.gradient[1]] as const}
                style={[styles.banner, index === banners.length - 1 && { marginRight: 0 }]}
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
                    <View style={styles.shopNowButton}>
                      <Text style={styles.shopNowText}>Shop Now</Text>
                      <ArrowRight size={14} color={colors.primary} />
                    </View>
                  </View>
                  <View style={styles.bannerImageContainer}>
                    {banner.image.startsWith('http') || banner.image.startsWith('data:image') ? (
                      <CachedImage uri={banner.image} style={styles.bannerImageReal} />
                    ) : (
                      <Text style={styles.bannerImage}>{banner.image}</Text>
                    )}
                  </View>
                </View>
              </LinearGradient>
            </Pressable>
          ))}
        </ScrollView>

        {/* Banner Dots */}
        <View style={styles.bannerDots}>
          {banners.map((_, index) => (
            <Pressable key={index} onPress={() => {
              bannerScrollRef.current?.scrollTo({ x: index * (BANNER_WIDTH + 12), animated: true });
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
          <Pressable style={styles.viewAllButton} onPress={() => router.push('/(tabs)/categories')}>
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
            <Pressable key={category._id} style={styles.categoryCard} onPress={() => handleCategoryPress(category)}>
              <View style={[styles.categoryIconContainer, { backgroundColor: category.color || '#E0E7FF' }]}>
                <CachedImage uri={getImageUrl(category.image)} style={styles.categoryImage} />
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Trending Products with Infinite Scroll */}
        {trendingProducts.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Flame size={18} color="#EF4444" />
                <Text style={styles.sectionTitle}>Trending Now</Text>
              </View>
              <Pressable style={styles.viewAllButton} onPress={() => router.push('/search')}>
                <Text style={styles.viewAllText}>View All</Text>
                <ArrowRight size={14} color={colors.primary} />
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productsContainer}
              onMomentumScrollEnd={handleTrendingScrollEnd}
              scrollEventThrottle={16}
            >
              {trendingProducts.map((product) => (
                <View key={product._id} style={styles.productCardContainer}>
                  <EventCard
                    event={product}
                    isFavorite={isFavorite(product._id)}
                    onToggleFavorite={() => toggleFavorite(product._id)}
                  />
                </View>
              ))}
              {trendingLoadingMore && (
                <View style={styles.loadingMoreContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              )}
            </ScrollView>
          </>
        )}

        {/* Fashion Products - 2 per row with vertical scroll */}
        {fashionProducts.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Zap size={18} color="#8B5CF6" />
                <Text style={styles.sectionTitle}>Fashion Picks</Text>
              </View>
              <Pressable style={styles.viewAllButton} onPress={() => router.push({ pathname: '/search', params: { category: 'Fashion' } })}>
                <Text style={styles.viewAllText}>View All</Text>
                <ArrowRight size={14} color={colors.primary} />
              </Pressable>
            </View>

            <View style={styles.fashionGridContainer}>
              {fashionProducts.map((product) => (
                <View key={product._id} style={styles.fashionGridItem}>
                  <EventCard
                    event={product}
                    isFavorite={isFavorite(product._id)}
                    onToggleFavorite={() => toggleFavorite(product._id)}
                  />
                </View>
              ))}
            </View>
            {fashionLoadingMore && (
              <View style={styles.fashionLoadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            )}
          </>
        )}
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
    color: '#1A1A1A',
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
    overflow: 'hidden',
  },
  bannerImage: {
    fontSize: 42,
  },
  bannerImageReal: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  categoryImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  categoryName: {
    fontSize: 12,
    color: colors.foreground,
    textAlign: 'center',
    fontWeight: '600',
  },
  productsContainer: {
    gap: 10,
    paddingRight: 10,
  },
  productCardContainer: {
    width: CARD_WIDTH,
  },
  loadingMoreContainer: {
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  gridProductCard: {
    width: CARD_WIDTH,
  },
  fashionGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  fashionGridItem: {
    width: (width - 32) / 2,
    marginBottom: 12,
  },
  fashionLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginBottom: 20,
  },
});
