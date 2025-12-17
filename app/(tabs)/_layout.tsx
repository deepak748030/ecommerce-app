import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { House, LayoutGrid, ShoppingBag, Heart, CircleUserRound } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 65 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 10,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'HOME',
          tabBarIcon: ({ color, focused }) => (
            <House size={24} color={color} strokeWidth={focused ? 2.5 : 1.8} fill={focused ? color : 'transparent'} />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'CATEGORIES',
          tabBarIcon: ({ color, focused }) => (
            <LayoutGrid size={24} color={color} strokeWidth={focused ? 2.5 : 1.8} fill={focused ? color : 'transparent'} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'CART',
          tabBarIcon: ({ color, focused }) => (
            <ShoppingBag size={24} color={color} strokeWidth={focused ? 2.5 : 1.8} fill={focused ? color : 'transparent'} />
          ),
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: 'WISHLIST',
          tabBarIcon: ({ color, focused }) => (
            <Heart size={24} color={color} strokeWidth={focused ? 2.5 : 1.8} fill={focused ? color : 'transparent'} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'PROFILE',
          tabBarIcon: ({ color, focused }) => (
            <CircleUserRound size={24} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />
    </Tabs>
  );
}
