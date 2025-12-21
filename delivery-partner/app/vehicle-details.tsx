import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bike, Car, Truck, Hash, Calendar, Fuel, Settings2 } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { router } from 'expo-router';
import { deliveryPartnerAuthApi, getPartnerData, PartnerData } from '../lib/api';
import { useFocusEffect } from '@react-navigation/native';

export default function VehicleDetailsScreen() {
    const { colors } = useTheme();
    const styles = createStyles(colors);
    const [partnerData, setPartnerData] = useState<PartnerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const localData = await getPartnerData();
            if (localData) setPartnerData(localData);

            const result = await deliveryPartnerAuthApi.getMe();
            if (result.success && result.response) {
                setPartnerData(result.response);
            }
        } catch (error) {
            console.log('Error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const getVehicleIcon = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'car': return Car;
            case 'truck': return Truck;
            default: return Bike;
        }
    };

    const vehicleType = partnerData?.vehicle?.type || partnerData?.vehicleType || 'Bike';
    const vehicleNumber = partnerData?.vehicle?.number || partnerData?.vehicleNumber || 'N/A';
    const VehicleIcon = getVehicleIcon(vehicleType);

    const vehicleDetails = [
        { icon: Hash, label: 'Registration Number', value: vehicleNumber },
        { icon: Settings2, label: 'Vehicle Type', value: vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1) },
        { icon: Calendar, label: 'Model', value: partnerData?.vehicle?.model || 'Standard' },
        { icon: Fuel, label: 'Color', value: partnerData?.vehicle?.color || 'Black' },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={20} color={colors.foreground} />
                </Pressable>
                <Text style={styles.headerTitle}>Vehicle Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => loadData(true)}
                        tintColor={colors.primary}
                    />
                }
            >
                {/* Vehicle Icon Card */}
                <View style={styles.vehicleCard}>
                    <View style={styles.vehicleIconContainer}>
                        <VehicleIcon size={48} color={colors.primary} />
                    </View>
                    <Text style={styles.vehicleType}>{vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1)}</Text>
                    <Text style={styles.vehicleNumber}>{vehicleNumber}</Text>
                </View>

                {/* Details Card */}
                <View style={styles.detailsCard}>
                    <Text style={styles.sectionTitle}>Vehicle Information</Text>
                    {vehicleDetails.map((item, index) => (
                        <View key={index} style={[styles.detailRow, index === vehicleDetails.length - 1 && { borderBottomWidth: 0 }]}>
                            <View style={styles.detailLeft}>
                                <View style={styles.iconContainer}>
                                    <item.icon size={18} color={colors.primary} />
                                </View>
                                <Text style={styles.detailLabel}>{item.label}</Text>
                            </View>
                            <Text style={styles.detailValue}>{item.value}</Text>
                        </View>
                    ))}
                </View>

                {/* Note */}
                <View style={styles.noteCard}>
                    <Text style={styles.noteTitle}>Need to update vehicle details?</Text>
                    <Text style={styles.noteText}>Contact support to update your vehicle information. Changes may require document re-verification.</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
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
    vehicleCard: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 16,
    },
    vehicleIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    vehicleType: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.foreground,
        marginBottom: 4,
    },
    vehicleNumber: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.primary,
    },
    detailsCard: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.foreground,
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    detailLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailLabel: {
        fontSize: 14,
        color: colors.mutedForeground,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.foreground,
    },
    noteCard: {
        backgroundColor: colors.secondary,
        borderRadius: 12,
        padding: 16,
    },
    noteTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.foreground,
        marginBottom: 6,
    },
    noteText: {
        fontSize: 12,
        color: colors.mutedForeground,
        lineHeight: 18,
    },
});
