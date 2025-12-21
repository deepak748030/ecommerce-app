import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, Moon, Shield, HelpCircle, FileText, Mail } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { router } from 'expo-router';

export default function SettingsScreen() {
    const { colors, isDark, toggleTheme } = useTheme();
    const styles = createStyles(colors, isDark);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={20} color={colors.foreground} />
                </Pressable>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Appearance */}
                <Text style={styles.sectionTitle}>Appearance</Text>
                <View style={styles.card}>
                    <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <Moon size={18} color={colors.foreground} />
                            <Text style={styles.settingLabel}>Dark Mode</Text>
                        </View>
                        <Switch
                            value={isDark}
                            onValueChange={toggleTheme}
                            trackColor={{ false: colors.muted, true: colors.primary }}
                            thumbColor={colors.white}
                        />
                    </View>
                </View>

                {/* Notifications */}
                <Text style={styles.sectionTitle}>Notifications</Text>
                <View style={styles.card}>
                    <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <Bell size={18} color={colors.foreground} />
                            <Text style={styles.settingLabel}>Push Notifications</Text>
                        </View>
                        <Switch
                            value={true}
                            trackColor={{ false: colors.muted, true: colors.primary }}
                            thumbColor={colors.white}
                        />
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <Bell size={18} color={colors.foreground} />
                            <Text style={styles.settingLabel}>Order Sounds</Text>
                        </View>
                        <Switch
                            value={true}
                            trackColor={{ false: colors.muted, true: colors.primary }}
                            thumbColor={colors.white}
                        />
                    </View>
                </View>

                {/* Support */}
                <Text style={styles.sectionTitle}>Support</Text>
                <View style={styles.card}>
                    <Pressable style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <HelpCircle size={18} color={colors.foreground} />
                            <Text style={styles.settingLabel}>Help Center</Text>
                        </View>
                    </Pressable>
                    <View style={styles.divider} />
                    <Pressable style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <Mail size={18} color={colors.foreground} />
                            <Text style={styles.settingLabel}>Contact Support</Text>
                        </View>
                    </Pressable>
                </View>

                {/* Legal */}
                <Text style={styles.sectionTitle}>Legal</Text>
                <View style={styles.card}>
                    <Pressable style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <FileText size={18} color={colors.foreground} />
                            <Text style={styles.settingLabel}>Terms of Service</Text>
                        </View>
                    </Pressable>
                    <View style={styles.divider} />
                    <Pressable style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <Shield size={18} color={colors.foreground} />
                            <Text style={styles.settingLabel}>Privacy Policy</Text>
                        </View>
                    </Pressable>
                </View>

                <Text style={styles.versionText}>SwiftDrop Partner v1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 12,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.card,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.foreground,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 6,
        paddingBottom: 100,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.mutedForeground,
        marginBottom: 8,
        marginTop: 16,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    card: {
        backgroundColor: colors.card,
        borderRadius: 12,
        overflow: 'hidden',
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 14,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    settingLabel: {
        fontSize: 14,
        color: colors.foreground,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginHorizontal: 14,
    },
    versionText: {
        textAlign: 'center',
        fontSize: 12,
        color: colors.mutedForeground,
        marginTop: 30,
    },
});
