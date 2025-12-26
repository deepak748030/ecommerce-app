import { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import * as Notifications from 'expo-notifications';
import { addNotificationFromPush } from '@/lib/mockData';
import { initializeTheme } from '@/lib/themeStore';

export default function RootLayout() {
  useFrameworkReady();

  // Initialize push notifications with deep linking support
  usePushNotifications();

  // Initialize theme from storage on app start
  useEffect(() => {
    initializeTheme();
  }, []);

  // Request notification permission on app start and listen for incoming notifications
  useEffect(() => {
    // Listen for incoming notifications and save them
    const notificationSubscription = Notifications.addNotificationReceivedListener(notification => {
      const title = notification.request.content.title || 'New Notification';
      const body = notification.request.content.body || '';
      addNotificationFromPush(title, body);
    });

    return () => {
      notificationSubscription.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="auth/phone" />
          <Stack.Screen name="auth/otp" />
          <Stack.Screen name="auth/profile-setup" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="event/[id]" />
          <Stack.Screen name="order/[id]" />
          <Stack.Screen name="category/[id]" />
          <Stack.Screen name="search" />
          <Stack.Screen name="checkout" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="transactions" />
          <Stack.Screen name="help-support" />
          <Stack.Screen name="privacy-policy" />
          <Stack.Screen name="my-orders" />
          <Stack.Screen name="saved-addresses" />
          <Stack.Screen name="rewards" />
          <Stack.Screen name="app-settings" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </>
    </SafeAreaProvider>
  );
}