import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Bell, Package, Tag, Info, Check, CheckCheck, Trash2 } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { notificationsApi, AppNotification, getToken } from '@/lib/api';
import TopBar from '@/components/TopBar';
import { router } from 'expo-router';

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const token = await getToken();
      setIsLoggedIn(!!token);

      if (!token) {
        setLoading(false);
        return;
      }

      const result = await notificationsApi.getAll();
      if (result.success && result.response) {
        setNotifications(result.response.notifications);
        setUnreadCount(result.response.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const result = await notificationsApi.markAsRead(id);
      if (result.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const result = await notificationsApi.markAllAsRead();
      if (result.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const result = await notificationsApi.delete(id);
      if (result.success) {
        const notification = notifications.find((n) => n._id === id);
        setNotifications((prev) => prev.filter((n) => n._id !== id));
        if (notification && !notification.read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleDeleteAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to delete all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await notificationsApi.deleteAll();
              if (result.success) {
                setNotifications([]);
                setUnreadCount(0);
              }
            } catch (error) {
              console.error('Error deleting all notifications:', error);
            }
          },
        },
      ]
    );
  };

  const handleNotificationPress = (notification: AppNotification) => {
    if (!notification.read) {
      handleMarkAsRead(notification._id);
    }

    // Navigate based on notification type
    if (notification.type === 'order' && notification.data?.orderId) {
      router.push(`/order/${notification.data.orderId}`);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return Package;
      case 'promo':
        return Tag;
      case 'booking':
        return Bell;
      default:
        return Info;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order':
        return colors.primary;
      case 'promo':
        return '#FF6B35';
      case 'booking':
        return '#22C55E';
      default:
        return colors.mutedForeground;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderNotification = ({ item }: { item: AppNotification }) => {
    const IconComponent = getNotificationIcon(item.type);
    const iconColor = getNotificationColor(item.type);

    return (
      <Pressable
        style={[styles.notificationItem, !item.read && styles.unreadItem]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
          <IconComponent size={20} color={iconColor} />
        </View>
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={[styles.notificationTitle, !item.read && styles.unreadTitle]}>
              {item.title}
            </Text>
            {!item.read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={styles.notificationTime}>{formatDate(item.createdAt)}</Text>
        </View>
        <Pressable style={styles.deleteButton} onPress={() => handleDelete(item._id)}>
          <Trash2 size={16} color={colors.mutedForeground} />
        </Pressable>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <TopBar showSearchBar={false} showBackButton={true} title="Notifications" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <TopBar showSearchBar={false} showBackButton={true} title="Notifications" />
        <View style={styles.emptyContainer}>
          <Bell size={64} color={colors.mutedForeground} />
          <Text style={styles.emptyTitle}>Login Required</Text>
          <Text style={styles.emptySubtitle}>
            Please login to view your notifications
          </Text>
          <Pressable
            style={styles.loginButton}
            onPress={() => router.push('/auth/phone')}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar showSearchBar={false} showBackButton={true} title="Notifications" />

      {notifications.length > 0 && (
        <View style={styles.headerActions}>
          <Text style={styles.unreadText}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All read'}
          </Text>
          <View style={styles.actionButtons}>
            {unreadCount > 0 && (
              <Pressable style={styles.actionButton} onPress={handleMarkAllAsRead}>
                <CheckCheck size={16} color={colors.primary} />
                <Text style={styles.actionButtonText}>Mark all read</Text>
              </Pressable>
            )}
            <Pressable style={styles.actionButton} onPress={handleDeleteAll}>
              <Trash2 size={16} color={colors.destructive} />
              <Text style={[styles.actionButtonText, { color: colors.destructive }]}>
                Clear all
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Bell size={64} color={colors.mutedForeground} />
          <Text style={styles.emptyTitle}>No Notifications</Text>
          <Text style={styles.emptySubtitle}>
            You're all caught up! Check back later for updates.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.foreground,
      marginTop: 16,
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.mutedForeground,
      textAlign: 'center',
      marginTop: 8,
    },
    loginButton: {
      marginTop: 24,
      backgroundColor: colors.primary,
      paddingHorizontal: 32,
      paddingVertical: 12,
      borderRadius: 8,
    },
    loginButtonText: {
      color: colors.white,
      fontSize: 16,
      fontWeight: '600',
    },
    headerActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    unreadText: {
      fontSize: 14,
      color: colors.mutedForeground,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 16,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    actionButtonText: {
      fontSize: 13,
      color: colors.primary,
      fontWeight: '500',
    },
    listContent: {
      paddingVertical: 8,
    },
    notificationItem: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: colors.background,
    },
    unreadItem: {
      backgroundColor: colors.primary + '08',
    },
    iconContainer: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    notificationContent: {
      flex: 1,
    },
    notificationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    notificationTitle: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.foreground,
    },
    unreadTitle: {
      fontWeight: '700',
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    notificationMessage: {
      fontSize: 13,
      color: colors.mutedForeground,
      marginTop: 4,
      lineHeight: 18,
    },
    notificationTime: {
      fontSize: 12,
      color: colors.mutedForeground,
      marginTop: 6,
    },
    deleteButton: {
      padding: 8,
      justifyContent: 'center',
    },
    separator: {
      height: 1,
      backgroundColor: colors.border,
      marginLeft: 72,
    },
  });
