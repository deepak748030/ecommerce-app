import React from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Bell, SlidersHorizontal, ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { router } from 'expo-router';

interface TopBarProps {
  showSearchBar?: boolean;
  searchBarAnimation?: Animated.Value;
  showBackButton?: boolean;
  title?: string;
}

export default function TopBar({
  showSearchBar = true,
  searchBarAnimation,
  showBackButton = false,
  title
}: TopBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const handleSearchPress = () => {
    router.push('/search');
  };

  const handleBack = () => {
    router.back();
  };

  // Calculate animated height for search bar section
  const searchBarHeight = searchBarAnimation
    ? searchBarAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 58],
      extrapolate: 'clamp',
    })
    : showSearchBar ? 58 : 0;

  const searchBarOpacity = searchBarAnimation
    ? searchBarAnimation.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0, 1],
      extrapolate: 'clamp',
    })
    : showSearchBar ? 1 : 0;

  // Animate container bottom padding
  const containerPaddingBottom = searchBarAnimation
    ? searchBarAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [6, 12],
      extrapolate: 'clamp',
    })
    : showSearchBar ? 12 : 6;

  return (
    <Animated.View style={[
      styles.container,
      {
        paddingTop: insets.top + 4,
        paddingBottom: containerPaddingBottom,
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }
    ]}>
      {/* Location & Brand */}
      <View style={styles.topRow}>
        {showBackButton ? (
          <View style={styles.leftSection}>
            <Pressable
              style={[styles.backButton, { backgroundColor: colors.secondary }]}
              onPress={handleBack}
            >
              <ChevronLeft size={24} color={colors.foreground} />
            </Pressable>
            {title && (
              <Text style={[styles.pageTitle, { color: colors.foreground }]}>{title}</Text>
            )}
          </View>
        ) : (
          <View style={styles.leftSection}>
            <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
              <Text style={styles.logoEmoji}>🍽️</Text>
            </View>
            <View>
              <Text style={[styles.appName, { color: colors.foreground }]}>The Art Of  </Text>
              <Pressable style={styles.locationRow}>
                <Text style={[styles.location, { color: colors.mutedForeground }]}>भ ओ जन</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.rightSection}>
          <Pressable
            style={[styles.iconButton, { backgroundColor: colors.secondary }]}
            onPress={() => router.push('/notifications')}
          >
            <Bell size={20} color={colors.foreground} strokeWidth={2} />
            <View style={styles.notificationDot} />
          </Pressable>
        </View>
      </View>

      {/* Animated Search Bar */}
      {showSearchBar && (
        <Animated.View
          style={[
            styles.searchRow,
            {
              height: searchBarHeight,
              opacity: searchBarOpacity,
              overflow: 'hidden',
            }
          ]}
        >
          <Pressable
            style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleSearchPress}
          >
            <Search size={18} color={colors.mutedForeground} />
            <Text style={[styles.searchPlaceholder, { color: colors.mutedForeground }]}>
              Search products, brands...
            </Text>
          </Pressable>
          <Pressable
            style={[styles.filterButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleSearchPress}
          >
            <SlidersHorizontal size={20} color={colors.foreground} />
          </Pressable>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 6,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  logoContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: {
    fontSize: 22,
  },
  appName: {
    fontSize: 16,
    fontWeight: '800',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  location: {
    fontSize: 11,
    fontWeight: '600',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  searchPlaceholder: {
    fontSize: 14,
    flex: 1,
  },
  filterButton: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
