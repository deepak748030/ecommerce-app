import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, MapPin, Home, Briefcase, Plus, Edit2, Trash2 } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

const mockAddresses = [
    {
        id: '1',
        type: 'Home',
        name: 'John Doe',
        address: '123, Park Street, Andheri West',
        city: 'Mumbai',
        pincode: '400058',
        phone: '+91 9876543210',
        isDefault: true,
    },
    {
        id: '2',
        type: 'Office',
        name: 'John Doe',
        address: '456, Tech Park, Powai',
        city: 'Mumbai',
        pincode: '400076',
        phone: '+91 9876543210',
        isDefault: false,
    },
];

export default function SavedAddressesScreen() {
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();

    const styles = createStyles(colors);

    const getAddressIcon = (type: string) => {
        switch (type) {
            case 'Home': return Home;
            case 'Office': return Briefcase;
            default: return MapPin;
        }
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                    <ArrowLeft size={22} color={colors.foreground} />
                </Pressable>
                <Text style={styles.headerTitle}>Saved Addresses</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Add New Address */}
                <Pressable style={styles.addButton}>
                    <Plus size={20} color={colors.primary} />
                    <Text style={styles.addButtonText}>Add New Address</Text>
                </Pressable>

                {mockAddresses.map((address) => {
                    const IconComponent = getAddressIcon(address.type);
                    return (
                        <View key={address.id} style={styles.addressCard}>
                            <View style={styles.addressHeader}>
                                <View style={styles.addressTypeContainer}>
                                    <View style={styles.addressIcon}>
                                        <IconComponent size={18} color={colors.primary} />
                                    </View>
                                    <Text style={styles.addressType}>{address.type}</Text>
                                    {address.isDefault && (
                                        <View style={styles.defaultBadge}>
                                            <Text style={styles.defaultText}>Default</Text>
                                        </View>
                                    )}
                                </View>
                                <View style={styles.addressActions}>
                                    <Pressable style={styles.actionButton}>
                                        <Edit2 size={16} color={colors.primary} />
                                    </Pressable>
                                    <Pressable style={styles.actionButton}>
                                        <Trash2 size={16} color={colors.destructive} />
                                    </Pressable>
                                </View>
                            </View>
                            <View style={styles.addressBody}>
                                <Text style={styles.addressName}>{address.name}</Text>
                                <Text style={styles.addressText}>{address.address}</Text>
                                <Text style={styles.addressText}>{address.city} - {address.pincode}</Text>
                                <Text style={styles.addressPhone}>{address.phone}</Text>
                            </View>
                        </View>
                    );
                })}

                {mockAddresses.length === 0 && (
                    <View style={styles.emptyState}>
                        <MapPin size={60} color={colors.mutedForeground} />
                        <Text style={styles.emptyTitle}>No addresses saved</Text>
                        <Text style={styles.emptySubtitle}>Add an address to get started</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingHorizontal: 6,
        paddingVertical: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    backButton: {
        padding: 4,
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
        paddingVertical: 12,
        paddingBottom: 40,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.primary,
        borderStyle: 'dashed',
        gap: 8,
    },
    addButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.primary,
    },
    addressCard: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    addressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    addressTypeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    addressIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addressType: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.foreground,
    },
    defaultBadge: {
        backgroundColor: colors.primary,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    defaultText: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.white,
    },
    addressActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        padding: 6,
    },
    addressBody: {
        gap: 2,
    },
    addressName: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.foreground,
        marginBottom: 2,
    },
    addressText: {
        fontSize: 13,
        color: colors.mutedForeground,
    },
    addressPhone: {
        fontSize: 13,
        color: colors.mutedForeground,
        marginTop: 4,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.foreground,
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: colors.mutedForeground,
        marginTop: 4,
    },
});