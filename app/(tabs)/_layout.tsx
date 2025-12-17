import React, { useEffect, useRef } from 'react';
import { Tabs } from 'expo-router';
import { View, Animated, StyleSheet } from 'react-native';
import { Home, Grid3X3, ShoppingCart, Heart, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';

interface AnimatedTabIconProps {
  Icon: any;
  focused: boolean;
  color: string;
  primaryColor: string;
  secondaryColor: string;
}

const AnimatedTabIcon = ({ Icon, focused, color, primaryColor, secondaryColor }: AnimatedTabIconProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (focused) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.2,
          friction: 3,
          tension: 200,
          useNativeDriver: true,
        }),
        Animated.spring(translateAnim, {
          toValue: -4,
          friction: 3,
          tension: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 3,
          tension: 200,
          useNativeDriver: true,
        }),
        Animated.spring(translateAnim, {
          toValue: 0,
          friction: 3,
          tension: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [focused]);

  return (
    <Animated.View
      style={[
        styles.iconContainer,
        {
          transform: [{ scale: scaleAnim }, { translateY: translateAnim }],
          backgroundColor: focused ? secondaryColor : 'transparent',
        },
      ]}
    >
      <Icon
        size={focused ? 24 : 22}
        color={color}
        strokeWidth={focused ? 2.8 : 2}
        fill={focused ? primaryColor : 'transparent'}
      />
    </Animated.View>
  );
};

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 0,
          height: 75 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 10,
          elevation: 20,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
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
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              Icon={Home}
              focused={focused}
              color={color}
              primaryColor={colors.primary}
              secondaryColor={colors.secondary}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              Icon={Grid3X3}
              focused={focused}
              color={color}
              primaryColor={colors.primary}
              secondaryColor={colors.secondary}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              Icon={ShoppingCart}
              focused={focused}
              color={color}
              primaryColor={colors.primary}
              secondaryColor={colors.secondary}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: 'Wishlist',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              Icon={Heart}
              focused={focused}
              color={color}
              primaryColor={colors.primary}
              secondaryColor={colors.secondary}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              Icon={User}
              focused={focused}
              color={color}
              primaryColor={colors.primary}
              secondaryColor={colors.secondary}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
