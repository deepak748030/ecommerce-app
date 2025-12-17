import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Search, SlidersHorizontal } from 'lucide-react-native';
import { colors } from '@/lib/colors';

interface SearchBarProps {
  placeholder?: string;
  onPress: () => void;
  onFilterPress?: () => void;
  showFilter?: boolean;
}

export function SearchBar({ placeholder = 'Search...', onPress, onFilterPress, showFilter = true }: SearchBarProps) {
  return (
    <View style={styles.wrapper}>
      <Pressable style={styles.container} onPress={onPress}>
        <Search size={18} color={colors.mutedForeground} style={styles.icon} />
        <Text style={styles.placeholder}>{placeholder}</Text>
      </Pressable>
      {showFilter && (
        <Pressable style={styles.filterButton} onPress={onFilterPress || onPress}>
          <SlidersHorizontal size={20} color={colors.foreground} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: {
    marginRight: 10,
  },
  placeholder: {
    flex: 1,
    color: colors.mutedForeground,
    fontSize: 14,
  },
  filterButton: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
