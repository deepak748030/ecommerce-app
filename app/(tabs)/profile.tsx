import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { router, useFocusEffect } from 'expo-router';
import { Package, MapPin, Bell, HelpCircle, Settings, LogOut, ChevronRight, Sun, Moon, Shield, Receipt, Pencil, Camera, Store } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { EditProfileModal } from '@/components/EditProfileModal';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { ActionModal } from '@/components/ActionModal';
import { authApi, getStoredUser, getToken, AuthUser } from '@/lib/api';
import { useRequireAuth } from '@/hooks/useAuth';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();
  const { isLoading: authLoading } = useRequireAuth();

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoModalData, setInfoModalData] = useState({ title: '', message: '', type: 'info' as 'info' | 'success' | 'error' });

  const styles = createStyles(colors, isDark);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const token = await getToken();

      if (!token) {
        router.replace('/auth/phone');
        return;
      }

      // Try to get from API first
      const result = await authApi.getMe();
      if (result.success && result.response) {
        setUser(result.response);
      } else {
        // Fallback to stored user
        const storedUser = await getStoredUser();
        if (storedUser) {
          setUser(storedUser);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      const storedUser = await getStoredUser();
      if (storedUser) {
        setUser(storedUser);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const handleMenuPress = (route: string) => {
    router.push(route as any);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setInfoModalData({ title: 'Permission Denied', message: 'Sorry, we need camera roll permissions to change your profile picture!', type: 'error' });
      setShowInfoModal(true);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;

      try {
        const updateResult = await authApi.updateProfile({ avatar: base64Image });
        if (updateResult.success && updateResult.response) {
          setUser(updateResult.response);
          setInfoModalData({ title: 'Success', message: 'Profile picture updated!', type: 'success' });
          setShowInfoModal(true);
        } else {
          setInfoModalData({ title: 'Error', message: updateResult.message || 'Failed to update profile picture', type: 'error' });
          setShowInfoModal(true);
        }
      } catch (error) {
        setInfoModalData({ title: 'Error', message: 'Failed to update profile picture', type: 'error' });
        setShowInfoModal(true);
      }
    }
  };

  const handleProfileSave = () => {
    loadUserData();
    setIsEditModalVisible(false);
  };

  const handleLogout = async () => {
    setIsLogoutModalVisible(false);
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    router.replace('/auth/phone');
  };

  const menuSections = [
    {
      title: 'Vendor',
      items: [
        { id: '0', icon: Store, label: 'Vendor Dashboard', badge: '', route: '/vendor' },
      ],
    },
    {
      title: 'Orders & Addresses',
      items: [
        { id: '1', icon: Package, label: 'My Orders', badge: '', route: '/my-orders' },
        { id: '2', icon: MapPin, label: 'Saved Addresses', badge: '', route: '/saved-addresses' },
        { id: '3', icon: Receipt, label: 'Transactions', badge: '', route: '/transactions' },
      ],
    },
    {
      title: 'Account',
      items: [
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

  if (authLoading || isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  const userName = user?.name || 'User';
  const userEmail = user?.email || 'No email set';
  const userPhone = user?.phone || '';
  const userAvatar = user?.avatar || null;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 0 }]}>
        {/* <Text style={styles.title}>Profile</Text> */}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <Pressable style={styles.avatarContainer} onPress={pickImage}>
              {userAvatar ? (
                <Image source={{ uri: userAvatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>{userName.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View style={styles.cameraIconContainer}>
                <Camera size={14} color={colors.white} strokeWidth={2.5} />
              </View>
            </Pressable>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userName}</Text>
              <Text style={styles.userEmail}>{userEmail}</Text>
              <Text style={styles.userPhone}>{userPhone}</Text>
            </View>
            <Pressable style={styles.editButton} onPress={() => setIsEditModalVisible(true)}>
              <Pencil size={18} color={colors.primary} strokeWidth={2} />
            </Pressable>
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
        <Pressable style={styles.logoutButton} onPress={() => setIsLogoutModalVisible(true)}>
          <LogOut size={20} color={colors.destructive} strokeWidth={2} />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>

        {/* App Version */}
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isVisible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        onSave={handleProfileSave}
      />

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        isVisible={isLogoutModalVisible}
        onClose={() => setIsLogoutModalVisible(false)}
        onConfirm={handleLogout}
        title="Logout"
        message="Are you sure you want to logout? You will need to login again to access your account."
        confirmText="Yes, Logout"
        cancelText="Cancel"
        confirmDestructive={true}
      />

      {/* Info Modal */}
      <ActionModal
        isVisible={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        type={infoModalData.type}
        title={infoModalData.title}
        message={infoModalData.message}
        buttons={[{ text: 'OK', onPress: () => { }, primary: true }]}
      />
    </View>
  );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
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
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
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
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.white,
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.card,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
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
