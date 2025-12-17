import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { router } from 'expo-router';
import { User, Package, MapPin, Bell, HelpCircle, Settings, LogOut, ChevronRight, Sun, Moon, Gift, Shield } from 'lucide-react-native';

const mockUser = {
  name: 'John Doe',
  phone: '+91 9876543210',
  email: 'john.doe@email.com',
  orders: 12,
  points: 2450,
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();

  const styles = createStyles(colors, isDark);

  const handleMenuPress = (route: string) => {
    router.push(route as any);
  };

  const menuSections = [
    {
      title: 'Orders & Addresses',
      items: [
        { id: '1', icon: Package, label: 'My Orders', badge: '3 Active', route: '/my-orders' },
        { id: '2', icon: MapPin, label: 'Saved Addresses', badge: '2', route: '/saved-addresses' },
      ],
    },
    {
      title: 'Account',
      items: [
        { id: '4', icon: Gift, label: 'Rewards & Points', badge: `${mockUser.points} pts`, route: '/rewards' },
        { id: '5', icon: Bell, label: 'Notifications', badge: '', route: '/notifications' },
        { id: '6', icon: Shield, label: 'Privacy & Security', badge: '', route: '/privacy-policy' },
      ],
    },
    {
      title: 'Support',
      items: [
        { id: '7', icon: HelpCircle, label: 'Help Center', badge: '', route: '/help-support' },
        { id: '8', icon: Settings, label: 'App Settings', badge: '', route: '/app-settings' },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <User size={36} color={colors.white} strokeWidth={2} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{mockUser.name}</Text>
              <Text style={styles.userEmail}>{mockUser.email}</Text>
              <Text style={styles.userPhone}>{mockUser.phone}</Text>
            </View>
            <Pressable style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit</Text>
            </Pressable>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{mockUser.orders}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{mockUser.points}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>Gold</Text>
              <Text style={styles.statLabel}>Tier</Text>
            </View>
          </View>
        </View>

        {/* Theme Toggle */}
        <Pressable style={styles.themeToggle} onPress={toggleTheme}>
          <View style={styles.themeIconContainer}>
            {isDark ? <Moon size={22} color={colors.primary} /> : <Sun size={22} color={colors.primary} />}
          </View>
          <View style={styles.themeInfo}>
            <Text style={styles.themeLabel}>Appearance</Text>
            <Text style={styles.themeValue}>{isDark ? 'Dark Mode' : 'Light Mode'}</Text>
          </View>
          <View style={styles.toggleContainer}>
            <View style={[styles.toggleTrack, isDark && styles.toggleTrackActive]}>
              <View style={[styles.toggleThumb, isDark && styles.toggleThumbActive]} />
            </View>
          </View>
        </Pressable>

        {/* Menu Sections */}
        {menuSections.map((section) => (
          <View key={section.title} style={styles.menuSection}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <Pressable
                    key={item.id}
                    style={[
                      styles.menuItem,
                      index < section.items.length - 1 && styles.menuItemBorder,
                    ]}
                    onPress={() => handleMenuPress(item.route)}
                  >
                    <View style={styles.menuIconContainer}>
                      <IconComponent size={20} color={colors.primary} strokeWidth={2} />
                    </View>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    {item.badge ? (
                      <View style={styles.menuBadge}>
                        <Text style={styles.menuBadgeText}>{item.badge}</Text>
                      </View>
                    ) : null}
                    <ChevronRight size={18} color={colors.mutedForeground} />
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <Pressable style={styles.logoutButton}>
          <LogOut size={20} color={colors.destructive} strokeWidth={2} />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>

        {/* App Version */}
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 6,
    paddingBottom: 6,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.foreground,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 6,
    paddingTop: 12,
    paddingBottom: 100,
  },
  profileCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: 14,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.foreground,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: colors.mutedForeground,
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  editButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 14,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: colors.mutedForeground,
    fontWeight: '600',
  },
  themeToggle: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  themeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  themeInfo: {
    flex: 1,
  },
  themeLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 2,
  },
  themeValue: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  toggleContainer: {
    padding: 4,
  },
  toggleTrack: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleTrackActive: {
    backgroundColor: colors.primary,
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.white,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  menuSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.mutedForeground,
    marginBottom: 10,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  menuBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  menuBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)',
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.2)',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.destructive,
  },
  versionText: {
    fontSize: 12,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginTop: 20,
  },
});
