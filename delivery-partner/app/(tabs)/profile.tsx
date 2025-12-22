import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Star, Package, ChevronRight, Settings, HelpCircle, FileText, LogOut, Moon, Sun, Bike, Pencil, Shield, AlertCircle, CheckCircle, Clock, Camera, Info } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { router } from 'expo-router';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { EditProfileModal } from '../../components/EditProfileModal';
import { deliveryPartnerAuthApi, getPartnerData, PartnerData, setPartnerData, clearAllPartnerData } from '../../lib/api';
import { ProfileScreenSkeleton } from '../../components/Skeleton';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
    const { colors, isDark, toggleTheme } = useTheme();
    const styles = createStyles(colors, isDark);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [partnerData, setPartnerDataState] = useState<PartnerData | null>(null);
    const [logoutLoading, setLogoutLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadPartnerData = useCallback(async (isRefresh: boolean = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const localData = await getPartnerData();
            if (localData) {
                setPartnerDataState(localData);
            }

            const result = await deliveryPartnerAuthApi.getMe();
            if (result.success && result.response) {
                setPartnerDataState(result.response);
            }
        } catch (error) {
            console.log('Error fetching partner data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadPartnerData(false);
        }, [loadPartnerData])
    );

    const handleRefresh = useCallback(() => {
        loadPartnerData(true);
    }, [loadPartnerData]);

    const handleProfileUpdate = (updatedData: PartnerData) => {
        setPartnerDataState(updatedData);
    };

    const handleLogout = async () => {
        setLogoutLoading(true);
        try {
            // First clear all local data
            await clearAllPartnerData();
            // Then call server logout
            await deliveryPartnerAuthApi.logout();
            setShowLogoutModal(false);
            // Navigate to login screen with replace to clear navigation stack
            router.replace('/auth/phone');
        } catch (error) {
            console.log('Logout error:', error);
            // Even if server logout fails, we've cleared local data, so redirect anyway
            router.replace('/auth/phone');
        } finally {
            setLogoutLoading(false);
        }
    };

    const handleAvatarChange = async () => {
        Alert.alert(
            'Update Profile Photo',
            'Choose an option',
            [
                {
                    text: 'Take Photo',
                    onPress: async () => {
                        const { status } = await ImagePicker.requestCameraPermissionsAsync();
                        if (status !== 'granted') {
                            Alert.alert('Permission Required', 'Camera permission is needed');
                            return;
                        }
                        const result = await ImagePicker.launchCameraAsync({
                            mediaTypes: ['images'],
                            allowsEditing: true,
                            aspect: [1, 1],
                            quality: 0.7,
                            base64: true,
                        });
                        if (!result.canceled && result.assets[0].base64) {
                            const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
                            updateAvatar(base64Image);
                        }
                    }
                },
                {
                    text: 'Choose from Gallery',
                    onPress: async () => {
                        const result = await ImagePicker.launchImageLibraryAsync({
                            mediaTypes: ['images'],
                            allowsEditing: true,
                            aspect: [1, 1],
                            quality: 0.7,
                            base64: true,
                        });
                        if (!result.canceled && result.assets[0].base64) {
                            const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
                            updateAvatar(base64Image);
                        }
                    }
                },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    const updateAvatar = async (avatar: string) => {
        try {
            const result = await deliveryPartnerAuthApi.updateProfile({ avatar });
            if (result.success && result.response) {
                setPartnerDataState(result.response);
                await setPartnerData(result.response);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to update profile photo');
        }
    };

    const getKycStatusInfo = () => {
        const status = partnerData?.kycStatus || 'pending';
        switch (status) {
            case 'approved':
                return { icon: CheckCircle, color: '#22c55e', label: 'Verified', bgColor: '#22c55e20' };
            case 'submitted':
                return { icon: Clock, color: '#f59e0b', label: 'Under Review', bgColor: '#f59e0b20' };
            case 'rejected':
                return { icon: AlertCircle, color: '#ef4444', label: 'Rejected', bgColor: '#ef444420' };
            default:
                return { icon: Shield, color: colors.mutedForeground, label: 'Pending', bgColor: colors.muted };
        }
    };

    const kycInfo = getKycStatusInfo();
    const KycIcon = kycInfo.icon;

    const menuItems = [
        { icon: Bike, label: 'Vehicle Details', route: '/vehicle-details' },
        { icon: FileText, label: 'Documents', route: '/documents' },
        { icon: HelpCircle, label: 'Help & Support', route: '/help-support' },
        { icon: Info, label: 'About', route: '/about' },
        { icon: Settings, label: 'Settings', route: '/settings' },
    ];

    const displayName = partnerData?.name || 'Partner';
    const displayPhone = partnerData?.phone || '';
    const displayVehicleType = partnerData?.vehicle?.type || partnerData?.vehicleType || 'Bike';
    const displayVehicleNumber = partnerData?.vehicle?.number || partnerData?.vehicleNumber || '';
    const avatarUrl = partnerData?.avatar;

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <Text style={styles.title}>My Profile</Text>
                    <Pressable onPress={toggleTheme} style={styles.themeBtn}>
                        {isDark ? <Sun size={18} color={colors.foreground} /> : <Moon size={18} color={colors.foreground} />}
                    </Pressable>
                </View>
                <ProfileScreenSkeleton />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>My Profile</Text>
                <Pressable onPress={toggleTheme} style={styles.themeBtn}>
                    {isDark ? <Sun size={18} color={colors.foreground} /> : <Moon size={18} color={colors.foreground} />}
                </Pressable>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
            >
                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <Pressable style={styles.avatarContainer} onPress={handleAvatarChange}>
                        {avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                        ) : (
                            <User size={32} color={colors.primary} />
                        )}
                        <View style={styles.cameraIcon}>
                            <Camera size={12} color={colors.white} />
                        </View>
                    </Pressable>
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{displayName}</Text>
                        <Text style={styles.profilePhone}>{displayPhone}</Text>
                        <View style={[styles.kycBadge, { backgroundColor: kycInfo.bgColor }]}>
                            <KycIcon size={12} color={kycInfo.color} />
                            <Text style={[styles.kycBadgeText, { color: kycInfo.color }]}>{kycInfo.label}</Text>
                        </View>
                    </View>
                    <Pressable style={styles.editBtn} onPress={() => setShowEditModal(true)}>
                        <Pencil size={16} color={colors.white} />
                    </Pressable>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <View style={[styles.statIcon, { backgroundColor: colors.statCard1 }]}>
                            <Star size={16} color={colors.primary} />
                        </View>
                        <Text style={styles.statValue}>{partnerData?.stats?.rating || '0.0'}</Text>
                        <Text style={styles.statLabel}>Rating</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <View style={[styles.statIcon, { backgroundColor: colors.statCard2 }]}>
                            <Package size={16} color={colors.primary} />
                        </View>
                        <Text style={styles.statValue}>{partnerData?.stats?.totalDeliveries || 0}</Text>
                        <Text style={styles.statLabel}>Deliveries</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <View style={[styles.statIcon, { backgroundColor: colors.secondary }]}>
                            <Bike size={16} color={colors.primary} />
                        </View>
                        <Text style={styles.statValue}>{displayVehicleType}</Text>
                        <Text style={styles.statLabel}>Vehicle</Text>
                    </View>
                </View>

                {/* Menu Items */}
                <View style={styles.menuCard}>
                    {menuItems.map((item, index) => (
                        <Pressable
                            key={index}
                            style={[styles.menuItem, index === menuItems.length - 1 && { borderBottomWidth: 0 }]}
                            onPress={() => router.push(item.route as any)}
                        >
                            <View style={styles.menuLeft}>
                                <View style={styles.menuIconContainer}>
                                    <item.icon size={18} color={colors.primary} />
                                </View>
                                <Text style={styles.menuLabel}>{item.label}</Text>
                            </View>
                            <ChevronRight size={18} color={colors.mutedForeground} />
                        </Pressable>
                    ))}
                </View>

                {/* Logout */}
                <Pressable style={styles.logoutBtn} onPress={() => setShowLogoutModal(true)}>
                    <LogOut size={18} color={colors.destructive} />
                    <Text style={styles.logoutText}>Logout</Text>
                </Pressable>

                <Text style={styles.versionText}>SwiftDrop Partner v1.0.0</Text>
            </ScrollView>

            <ConfirmationModal
                isVisible={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={handleLogout}
                title="Logout"
                message="Are you sure you want to logout from your account?"
                confirmText="Yes, Logout"
                cancelText="Cancel"
                confirmDestructive={true}
                isLoading={logoutLoading}
            />

            <EditProfileModal
                isVisible={showEditModal}
                onClose={() => setShowEditModal(false)}
                partnerData={partnerData}
                onSuccess={handleProfileUpdate}
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
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.foreground,
    },
    themeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.card,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 6,
        paddingBottom: 100,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    avatarContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    avatarImage: {
        width: 64,
        height: 64,
        borderRadius: 32,
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: colors.card,
    },
    profileInfo: {
        flex: 1,
        marginLeft: 14,
    },
    profileName: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.foreground,
    },
    profilePhone: {
        fontSize: 13,
        color: colors.mutedForeground,
        marginTop: 2,
    },
    kycBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginTop: 6,
    },
    kycBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    editBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        gap: 6,
    },
    statIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statDivider: {
        width: 1,
        backgroundColor: colors.border,
    },
    statValue: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.foreground,
    },
    statLabel: {
        fontSize: 10,
        color: colors.mutedForeground,
    },
    menuCard: {
        backgroundColor: colors.card,
        borderRadius: 12,
        marginBottom: 16,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    menuIconContainer: {
        width: 40,
        height: 25,
        borderRadius: 20,
        backgroundColor: colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: colors.foreground,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: colors.card,
        borderRadius: 12,
        paddingVertical: 16,
    },
    logoutText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.destructive,
    },
    versionText: {
        textAlign: 'center',
        fontSize: 12,
        color: colors.mutedForeground,
        marginTop: 20,
    },
});
