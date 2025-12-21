import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Modal, RefreshControl, Dimensions, ActivityIndicator, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Search, ListFilter, X, TrendingUp, TrendingDown, ArrowLeft } from 'lucide-react-native';
import EventCard from '@/components/EventCard';
import { useDebounce } from '@/hooks/useDebounce';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { productsApi, categoriesApi, Product, Category } from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SearchScreenSkeleton } from '@/components/Skeleton';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 20) / 2;
const FAVORITES_KEY = 'favorites';
const PAGE_SIZE = 10;

export default function SearchScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Applied filter states (used for API calls)
  const [appliedCategory, setAppliedCategory] = useState('all');
  const [appliedPriceRange, setAppliedPriceRange] = useState([0, 100000]);
  const [appliedMinRating, setAppliedMinRating] = useState('all');
  const [appliedPriceSort, setAppliedPriceSort] = useState<'none' | 'low_to_high' | 'high_to_low'>('none');

  // Temp filter states (used in modal)
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [minRating, setMinRating] = useState('all');
  const [priceSort, setPriceSort] = useState<'none' | 'low_to_high' | 'high_to_low'>('none');

  const [favorites, setFavorites] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // API data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const ratings = [
    { value: 'all', label: 'All Ratings' },
    { value: '4', label: '4+ Stars' },
    { value: '4.5', label: '4.5+ Stars' },
    { value: '4.8', label: '4.8+ Stars' },
  ];

  // Fetch data from API with filters
  const fetchData = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      // Build filter params for API using applied states
      const filterParams: {
        limit: number;
        page?: number;
        search?: string;
        category?: string;
        minPrice?: number;
        maxPrice?: number;
        minRating?: number;
        sort?: 'price_low_to_high' | 'price_high_to_low' | 'rating';
      } = { limit: PAGE_SIZE, page: pageNum };

      if (debouncedSearchQuery.trim()) {
        filterParams.search = debouncedSearchQuery.trim();
      }

      if (appliedCategory !== 'all') {
        filterParams.category = appliedCategory;
      }

      if (appliedPriceRange[0] > 0) {
        filterParams.minPrice = appliedPriceRange[0];
      }

      if (appliedPriceRange[1] < 100000) {
        filterParams.maxPrice = appliedPriceRange[1];
      }

      if (appliedMinRating !== 'all') {
        filterParams.minRating = parseFloat(appliedMinRating);
      }

      if (appliedPriceSort === 'low_to_high') {
        filterParams.sort = 'price_low_to_high';
      } else if (appliedPriceSort === 'high_to_low') {
        filterParams.sort = 'price_high_to_low';
      }

      const [productsRes, categoriesRes] = await Promise.all([
        productsApi.getAll(filterParams),
        pageNum === 1 ? categoriesApi.getAll() : Promise.resolve(null),
      ]);

      if (productsRes.success && productsRes.response?.data) {
        const newProducts = productsRes.response.data;
        if (append) {
          setProducts(prev => [...prev, ...newProducts]);
        } else {
          setProducts(newProducts);
        }
        setHasMore(newProducts.length === PAGE_SIZE);
      }

      if (categoriesRes?.success && categoriesRes.response?.data) {
        setCategories(categoriesRes.response.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [debouncedSearchQuery, appliedCategory, appliedPriceRange, appliedMinRating, appliedPriceSort]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchData(nextPage, true);
    }
  }, [loadingMore, hasMore, loading, page, fetchData]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 200;
    if (isCloseToBottom) {
      loadMore();
    }
  }, [loadMore]);

  useEffect(() => {
    setPage(1);
    fetchData(1, false);
  }, [debouncedSearchQuery, appliedCategory, appliedPriceRange, appliedMinRating, appliedPriceSort]);

  // Set initial category from params
  useEffect(() => {
    if (params.category) {
      setSelectedCategory(params.category);
      setAppliedCategory(params.category);
    }
  }, [params.category]);

  // Load favorites
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const stored = await AsyncStorage.getItem(FAVORITES_KEY);
        if (stored) {
          setFavorites(JSON.parse(stored));
        }
      } catch (error) {
        setFavorites([]);
      }
    };
    loadFavorites();
  }, []);

  // Products are now filtered server-side, so we just use them directly
  const filteredProducts = products;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    await fetchData(1, false);
  }, [fetchData]);

  const handleToggleFavorite = async (productId: string) => {
    try {
      let updatedFavorites: string[];
      if (favorites.includes(productId)) {
        updatedFavorites = favorites.filter(id => id !== productId);
      } else {
        updatedFavorites = [...favorites, productId];
      }
      setFavorites(updatedFavorites);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const openFilters = () => {
    // Sync temp states with applied states when opening modal
    setSelectedCategory(appliedCategory);
    setPriceRange(appliedPriceRange);
    setMinRating(appliedMinRating);
    setPriceSort(appliedPriceSort);
    setShowFilters(true);
  };

  const applyFilters = () => {
    // Apply temp states to applied states
    setAppliedCategory(selectedCategory);
    setAppliedPriceRange(priceRange);
    setAppliedMinRating(minRating);
    setAppliedPriceSort(priceSort);
    setShowFilters(false);
  };

  const clearFilters = () => {
    // Clear temp states
    setSelectedCategory('all');
    setPriceRange([0, 100000]);
    setMinRating('all');
    setPriceSort('none');
  };

  const clearAllFilters = () => {
    // Clear both temp and applied states
    setSelectedCategory('all');
    setPriceRange([0, 100000]);
    setMinRating('all');
    setPriceSort('none');
    setAppliedCategory('all');
    setAppliedPriceRange([0, 100000]);
    setAppliedMinRating('all');
    setAppliedPriceSort('none');
  };

  const styles = createStyles(colors);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <View style={styles.searchRow}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={22} color={colors.foreground} />
            </Pressable>
            <View style={styles.searchContainer}>
              <Search size={18} color={colors.mutedForeground} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search products..."
                placeholderTextColor={colors.mutedForeground}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <Pressable style={styles.filterButton} onPress={openFilters}>
              <ListFilter size={18} color={colors.foreground} strokeWidth={2} />
            </Pressable>
          </View>
        </View>
        <SearchScreenSkeleton />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Search */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.searchRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={22} color={colors.foreground} />
          </Pressable>
          <View style={styles.searchContainer}>
            <Search size={18} color={colors.mutedForeground} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              placeholderTextColor={colors.mutedForeground}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <X size={18} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>
          <Pressable style={styles.filterButton} onPress={openFilters}>
            <ListFilter size={18} color={colors.foreground} strokeWidth={2} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={400}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.content}>
          {/* Results Count */}
          <Text style={styles.resultsCount}>
            {filteredProducts.length} results found
          </Text>

          {/* Results Grid */}
          {filteredProducts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No products found matching your filters</Text>
              <Pressable onPress={clearAllFilters}>
                <Text style={styles.clearFiltersLink}>Clear all filters</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.eventsGrid}>
              {filteredProducts.map((product) => (
                <View key={product._id} style={styles.eventCardContainer}>
                  <EventCard
                    event={product}
                    isFavorite={favorites.includes(product._id)}
                    onToggleFavorite={() => handleToggleFavorite(product._id)}
                  />
                </View>
              ))}
              {loadingMore && (
                <View style={styles.loadingMoreContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.filterOverlay}>
          <Pressable style={styles.filterBackdrop} onPress={() => setShowFilters(false)} />
          <View style={styles.filterModal}>
            {/* Handle bar */}
            <View style={styles.handleBar} />

            {/* Header */}
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filters</Text>
              <Pressable onPress={() => setShowFilters(false)}>
                <X size={22} color={colors.foreground} />
              </Pressable>
            </View>

            <ScrollView style={styles.filterContent} showsVerticalScrollIndicator={false}>
              {/* Category Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Category</Text>
                <View style={styles.filterOptions}>
                  <Pressable
                    style={[
                      styles.filterOption,
                      selectedCategory === 'all' && styles.selectedFilterOption
                    ]}
                    onPress={() => setSelectedCategory('all')}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      selectedCategory === 'all' && styles.selectedFilterOptionText
                    ]}>
                      All Products
                    </Text>
                  </Pressable>
                  {categories.map((category) => (
                    <Pressable
                      key={category._id}
                      style={[
                        styles.filterOption,
                        selectedCategory === category.name && styles.selectedFilterOption
                      ]}
                      onPress={() => setSelectedCategory(category.name)}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        selectedCategory === category.name && styles.selectedFilterOptionText
                      ]}>
                        {category.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Price Range */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>
                  Price Range: ₹{priceRange[0].toLocaleString()} - ₹{priceRange[1].toLocaleString()}
                </Text>
                <View style={styles.priceInputs}>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Min"
                    placeholderTextColor={colors.mutedForeground}
                    value={priceRange[0].toString()}
                    onChangeText={(text) => setPriceRange([parseInt(text) || 0, priceRange[1]])}
                    keyboardType="numeric"
                  />
                  <Text style={styles.priceSeparator}>to</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Max"
                    placeholderTextColor={colors.mutedForeground}
                    value={priceRange[1].toString()}
                    onChangeText={(text) => setPriceRange([priceRange[0], parseInt(text) || 100000])}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Rating Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Minimum Rating</Text>
                <View style={styles.filterOptions}>
                  {ratings.map((rating) => (
                    <Pressable
                      key={rating.value}
                      style={[
                        styles.filterOption,
                        minRating === rating.value && styles.selectedFilterOption
                      ]}
                      onPress={() => setMinRating(rating.value)}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        minRating === rating.value && styles.selectedFilterOptionText
                      ]}>
                        {rating.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Price Sort */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Sort by Price</Text>
                <View style={styles.filterOptions}>
                  <Pressable
                    style={[styles.filterOption, priceSort === 'none' && styles.selectedFilterOption]}
                    onPress={() => setPriceSort('none')}
                  >
                    <Text style={[styles.filterOptionText, priceSort === 'none' && styles.selectedFilterOptionText]}>
                      Default
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.filterOption, priceSort === 'low_to_high' && styles.selectedFilterOption]}
                    onPress={() => setPriceSort('low_to_high')}
                  >
                    <TrendingUp size={14} color={priceSort === 'low_to_high' ? colors.white : colors.foreground} />
                    <Text style={[styles.filterOptionText, priceSort === 'low_to_high' && styles.selectedFilterOptionText]}>
                      Low to High
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.filterOption, priceSort === 'high_to_low' && styles.selectedFilterOption]}
                    onPress={() => setPriceSort('high_to_low')}
                  >
                    <TrendingDown size={14} color={priceSort === 'high_to_low' ? colors.white : colors.foreground} />
                    <Text style={[styles.filterOptionText, priceSort === 'high_to_low' && styles.selectedFilterOptionText]}>
                      High to Low
                    </Text>
                  </Pressable>
                </View>
              </View>
            </ScrollView>

            {/* Filter Actions */}
            <View style={styles.filterActions}>
              <Pressable style={styles.clearButton} onPress={clearFilters}>
                <Text style={styles.clearButtonText}>Clear All</Text>
              </Pressable>
              <Pressable style={styles.applyButton} onPress={applyFilters}>
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.mutedForeground,
  },
  loadingMoreContainer: {
    width: '100%',
    paddingVertical: 16,
    alignItems: 'center',
  },
  header: {
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.foreground,
  },
  filterButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 4,
    paddingTop: 12,
    paddingBottom: 100,
  },
  resultsCount: {
    fontSize: 13,
    color: colors.mutedForeground,
    marginBottom: 12,
    marginLeft: 4,
  },
  eventsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  eventCardContainer: {
    width: CARD_WIDTH,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginBottom: 12,
    textAlign: 'center',
  },
  clearFiltersLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  filterOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  filterBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  filterModal: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.foreground,
  },
  filterContent: {
    paddingHorizontal: 16,
  },
  filterSection: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 10,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedFilterOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterOptionText: {
    fontSize: 13,
    color: colors.foreground,
    fontWeight: '500',
  },
  selectedFilterOptionText: {
    color: colors.white,
  },
  priceInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  priceInput: {
    flex: 1,
    backgroundColor: colors.secondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.foreground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  priceSeparator: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
  filterActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: colors.secondary,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
});