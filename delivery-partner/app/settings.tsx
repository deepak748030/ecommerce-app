import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, Moon, Shield, HelpCircle, FileText, Mail, Trash2, Globe, Lock, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { router } from 'expo-router';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { ActionModal } from '../components/ActionModal';
import { deliveryPartnerAuthApi } from '../lib/api';

export default function SettingsScreen() {
    const { colors, isDark, toggleTheme } = useTheme();
    const styles = createStyles(colors, isDark);
    const [pushEnabled, setPushEnabled] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [infoModalData, setInfoModalData] = useState({ title: '', message: '', type: 'info' as 'info' | 'success' | 'error' });

    const handleDeleteAccount = async () => {
        setDeleting(true);
        try {
            setInfoModalData({ title: 'Account Deletion', message: 'Your account deletion request has been submitted. It will be processed within 7 days.', type: 'info' });
            setShowInfoModal(true);
            setShowDeleteModal(false);
            await deliveryPartnerAuthApi.logout();
        } catch (error) {
            setInfoModalData({ title: 'Error', message: 'Failed to delete account. Please try again.', type: 'error' });
            setShowInfoModal(true);
        } finally {
            setDeleting(false);
        }
    };

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
                            <View style={[styles.iconContainer, { backgroundColor: colors.secondary }]}>
                                <Moon size={18} color={colors.primary} />
                            </View>
                            <View>
                                <Text style={styles.settingLabel}>Dark Mode</Text>
                                <Text style={styles.settingDesc}>Switch between light and dark theme</Text>
                            </View>
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
                            <View style={[styles.iconContainer, { backgroundColor: '#22c55e20' }]}>
                                <Bell size={18} color="#22c55e" />
                            </View>
                            <View>
                                <Text style={styles.settingLabel}>Push Notifications</Text>
                                <Text style={styles.settingDesc}>Receive order and delivery updates</Text>
                            </View>
                        </View>
                        <Switch
                            value={pushEnabled}
                            onValueChange={setPushEnabled}
                            trackColor={{ false: colors.muted, true: colors.primary }}
                            thumbColor={colors.white}
                        />
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: '#f59e0b20' }]}>
                                <Bell size={18} color="#f59e0b" />
                            </View>
                            <View>
                                <Text style={styles.settingLabel}>Order Sounds</Text>
                                <Text style={styles.settingDesc}>Play sound for new orders</Text>
                            </View>
                        </View>
                        <Switch
                            value={soundEnabled}
                            onValueChange={setSoundEnabled}
                            trackColor={{ false: colors.muted, true: colors.primary }}
                            thumbColor={colors.white}
                        />
                    </View>
                </View>

                {/* Privacy & Security */}
                <Text style={styles.sectionTitle}>Privacy & Security</Text>
                <View style={styles.card}>
                    <Pressable style={styles.settingRow} onPress={() => router.push('/privacy-policy' as any)}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: colors.secondary }]}>
                                <Shield size={18} color={colors.primary} />
                            </View>
                            <View>
                                <Text style={styles.settingLabel}>Privacy Policy</Text>
                                <Text style={styles.settingDesc}>How we handle your data</Text>
                            </View>
                        </View>
                        <ChevronRight size={18} color={colors.mutedForeground} />
                    </Pressable>
                    <View style={styles.divider} />
                    <Pressable style={styles.settingRow} onPress={() => router.push('/terms-of-service' as any)}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: colors.secondary }]}>
                                <FileText size={18} color={colors.primary} />
                            </View>
                            <View>
                                <Text style={styles.settingLabel}>Terms of Service</Text>
                                <Text style={styles.settingDesc}>Our terms and conditions</Text>
                            </View>
                        </View>
                        <ChevronRight size={18} color={colors.mutedForeground} />
                    </Pressable>
                </View>

                {/* App Info */}
                <Text style={styles.sectionTitle}>App Info</Text>
                <View style={styles.card}>
                    <Pressable style={styles.settingRow} onPress={() => router.push('/about' as any)}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: colors.secondary }]}>
                                <Globe size={18} color={colors.primary} />
                            </View>
                            <View>
                                <Text style={styles.settingLabel}>About भ ओ जन Delivery</Text>
                                <Text style={styles.settingDesc}>Version 1.0.0</Text>
                            </View>
                        </View>
                        <ChevronRight size={18} color={colors.mutedForeground} />
                    </Pressable>
                </View>

                {/* Danger Zone */}
                <Text style={styles.sectionTitle}>Account</Text>
                <View style={styles.card}>
                    <Pressable style={styles.settingRow} onPress={() => setShowDeleteModal(true)}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: '#ef444420' }]}>
                                <Trash2 size={18} color="#ef4444" />
                            </View>
                            <View>
                                <Text style={[styles.settingLabel, { color: '#ef4444' }]}>Delete Account</Text>
                                <Text style={styles.settingDesc}>Permanently delete your account</Text>
                            </View>
                        </View>
                        <ChevronRight size={18} color={colors.mutedForeground} />
                    </Pressable>
                </View>

                <Text style={styles.footerText}>भ ओ जन Delivery Partner v1.0.0</Text>
            </ScrollView>

            <ConfirmationModal
                isVisible={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteAccount}
                title="Delete Account"
                message="Are you sure you want to delete your account? This action cannot be undone. All your data including earnings history will be permanently deleted."
                confirmText="Delete Account"
                cancelText="Cancel"
                confirmDestructive={true}
            />

            {/* Info Modal */}
            <ActionModal
                isVisible={showInfoModal}
                onClose={() => {
                    setShowInfoModal(false);
                    if (infoModalData.title === 'Account Deletion') {
                        router.replace('/auth/phone');
                    }
                }}
                type={infoModalData.type}
                title={infoModalData.title}
                message={infoModalData.message}
                buttons={[{ text: 'OK', onPress: () => { }, primary: true }]}
            />
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
        marginBottom: 10,
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
        flex: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.foreground,
    },
    settingDesc: {
        fontSize: 12,
        color: colors.mutedForeground,
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginHorizontal: 14,
    },
    footerText: {
        textAlign: 'center',
        fontSize: 12,
        color: colors.mutedForeground,
        marginTop: 30,
    },
});
