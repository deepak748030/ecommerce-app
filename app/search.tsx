import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Modal, RefreshControl, Dimensions } from 'react-native';
import { Search, ListFilter, X, TrendingUp, TrendingDown, ArrowLeft } from 'lucide-react-native';
import { getFavorites, toggleFavorite, Event, allProducts, mockCategories } from '@/lib/mockData';
import EventCard from '@/components/EventCard';
import { useDebounce } from '@/hooks/useDebounce';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 20) / 2;

export default function SearchScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [minRating, setMinRating] = useState('all');
  const [priceSort, setPriceSort] = useState<'none' | 'low_to_high' | 'high_to_low'>('none');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const locations = ['all', 'Mumbai', 'Bangalore', 'Delhi', 'Goa', 'Pune'];
  const ratings = [
    { value: 'all', label: 'All Ratings' },
    { value: '4', label: '4+ Stars' },
    { value: '4.5', label: '4.5+ Stars' },
    { value: '4.8', label: '4.8+ Stars' },
  ];

  // Set initial category from params
  useEffect(() => {
    if (params.category) {
      setSelectedCategory(params.category);
    }
  }, [params.category]);

  // Load favorites
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const favs = await getFavorites();
        setFavorites(favs);
      } catch (error) {
        setFavorites([]);
      }
    };
    loadFavorites();
  }, []);

  // Filter and sort events using mock data
  const filteredEvents = useMemo(() => {
    let results = [...allProducts];

    // Search filter
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      results = results.filter(event =>
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.category.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      results = results.filter(event =>
        event.category.toLowerCase() === selectedCategory.toLowerCase() ||
        event.category.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }

    // Location filter
    if (selectedLocation !== 'all') {
      results = results.filter(event =>
        event.location.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }

    // Price filter
    results = results.filter(event =>
      event.price >= priceRange[0] && event.price <= priceRange[1]
    );

    // Rating filter
    if (minRating !== 'all') {
      const minRatingValue = parseFloat(minRating);
      results = results.filter(event => event.rating >= minRatingValue);
    }

    // Price sort
    if (priceSort === 'low_to_high') {
      results.sort((a, b) => a.price - b.price);
    } else if (priceSort === 'high_to_low') {
      results.sort((a, b) => b.price - a.price);
    }

    return results;
  }, [debouncedSearchQuery, selectedCategory, selectedLocation, priceRange, minRating, priceSort]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const favs = await getFavorites();
    setFavorites(favs);
    setRefreshing(false);
  }, []);

  const handleToggleFavorite = async (eventId: string) => {
    try {
      await toggleFavorite(eventId);
      const updatedFavorites = await getFavorites();
      setFavorites(updatedFavorites);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedLocation('all');
    setPriceRange([0, 100000]);
    setMinRating('all');
    setPriceSort('none');
  };

  const styles = createStyles(colors);

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
          <Pressable style={styles.filterButton} onPress={() => setShowFilters(true)}>
            <ListFilter size={18} color={colors.foreground} strokeWidth={2} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
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
            {filteredEvents.length} results found
          </Text>

          {/* Results Grid */}
          {filteredEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No products found matching your filters</Text>
              <Pressable onPress={clearFilters}>
                <Text style={styles.clearFiltersLink}>Clear all filters</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.eventsGrid}>
              {filteredEvents.map((event) => (
                <View key={event.id} style={styles.eventCardContainer}>
                  <EventCard
                    event={event}
                    isFavorite={favorites.includes(event.id)}
                    onToggleFavorite={() => handleToggleFavorite(event.id)}
                  />
                </View>
              ))}
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
                  {mockCategories.map((category) => (
                    <Pressable
                      key={category.id}
                      style={[
                        styles.filterOption,
                        selectedCategory === category.id && styles.selectedFilterOption
                      ]}
                      onPress={() => setSelectedCategory(category.id)}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        selectedCategory === category.id && styles.selectedFilterOptionText
                      ]}>
                        {category.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Location Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Location</Text>
                <View style={styles.filterOptions}>
                  {locations.map((location) => (
                    <Pressable
                      key={location}
                      style={[
                        styles.filterOption,
                        selectedLocation === location && styles.selectedFilterOption
                      ]}
                      onPress={() => setSelectedLocation(location)}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        selectedLocation === location && styles.selectedFilterOptionText
                      ]}>
                        {location === 'all' ? 'All Locations' : location}
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
              <Pressable style={styles.applyButton} onPress={() => setShowFilters(false)}>
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
  },
  selectedFilterOptionText: {
    color: colors.white,
    fontWeight: '600',
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
    fontSize: 13,
    color: colors.mutedForeground,
  },
  filterActions: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
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
