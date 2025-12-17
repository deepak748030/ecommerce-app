import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Bell, MapPin, SlidersHorizontal } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { router } from 'expo-router';

export default function TopBar() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const handleSearchPress = () => {
    router.push('/search');
  };

  return (
    <View style={[
      styles.container,
      {
        paddingTop: insets.top + 4,
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }
    ]}>
      {/* Location & Brand */}
      <View style={styles.topRow}>
        <View style={styles.leftSection}>
          <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
            <Text style={styles.logoEmoji}>🍽️</Text>
          </View>
          <View>
            <Text style={[styles.appName, { color: colors.foreground }]}>The Art Of Bhaojan</Text>
            <Pressable style={styles.locationRow}>
              <MapPin size={12} color={colors.primary} />
              <Text style={[styles.location, { color: colors.mutedForeground }]}>Mumbai, India</Text>
            </Pressable>
          </View>
        </View>

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

      {/* Search Bar */}
      <View style={styles.searchRow}>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 6,
    paddingBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
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