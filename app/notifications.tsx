import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import TopBar from '@/components/TopBar';

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <TopBar showSearchBar={false} showBackButton={true} title="Notifications" />

      <View style={styles.content}>
        <Bell size={64} color={colors.mutedForeground} />
        <Text style={styles.title}>Notifications Coming Soon</Text>
        <Text style={styles.subtitle}>Notifications feature is not yet available on the server.</Text>
      </View>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.foreground,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginTop: 8,
  },
});
