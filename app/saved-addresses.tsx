import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, MapPin, Home, Briefcase, Plus, Edit2, Trash2, X, Check } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

interface Address {
    id: string;
    type: string;
    name: string;
    address: string;
    city: string;
    pincode: string;
    phone: string;
    isDefault: boolean;
}

const initialAddresses: Address[] = [
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
    const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
    const [showModal, setShowModal] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [formData, setFormData] = useState({
        type: 'Home',
        name: '',
        address: '',
        city: '',
        pincode: '',
        phone: '',
    });

    const styles = createStyles(colors);

    const getAddressIcon = (type: string) => {
        switch (type) {
            case 'Home': return Home;
            case 'Office': return Briefcase;
            default: return MapPin;
        }
    };

    const handleAddNew = () => {
        setEditingAddress(null);
        setFormData({ type: 'Home', name: '', address: '', city: '', pincode: '', phone: '' });
        setShowModal(true);
    };

    const handleEdit = (address: Address) => {
        setEditingAddress(address);
        setFormData({
            type: address.type,
            name: address.name,
            address: address.address,
            city: address.city,
            pincode: address.pincode,
            phone: address.phone,
        });
        setShowModal(true);
    };

    const handleDelete = (id: string) => {
        setAddresses(prev => prev.filter(addr => addr.id !== id));
    };

    const handleSetDefault = (id: string) => {
        setAddresses(prev => prev.map(addr => ({
            ...addr,
            isDefault: addr.id === id,
        })));
    };

    const handleSave = () => {
        if (!formData.name || !formData.address || !formData.city || !formData.pincode || !formData.phone) {
            return;
        }

        if (editingAddress) {
            setAddresses(prev => prev.map(addr =>
                addr.id === editingAddress.id
                    ? { ...addr, ...formData }
                    : addr
            ));
        } else {
            const newAddress: Address = {
                id: Date.now().toString(),
                ...formData,
                isDefault: addresses.length === 0,
            };
            setAddresses(prev => [...prev, newAddress]);
        }
        setShowModal(false);
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
                <Pressable style={styles.addButton} onPress={handleAddNew}>
                    <Plus size={20} color={colors.primary} />
                    <Text style={styles.addButtonText}>Add New Address</Text>
                </Pressable>

                {addresses.map((address) => {
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
                                    <Pressable style={styles.actionButton} onPress={() => handleEdit(address)}>
                                        <Edit2 size={16} color={colors.primary} />
                                    </Pressable>
                                    <Pressable style={styles.actionButton} onPress={() => handleDelete(address.id)}>
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
                            {!address.isDefault && (
                                <Pressable style={styles.setDefaultButton} onPress={() => handleSetDefault(address.id)}>
                                    <Text style={styles.setDefaultText}>Set as Default</Text>
                                </Pressable>
                            )}
                        </View>
                    );
                })}

                {addresses.length === 0 && (
                    <View style={styles.emptyState}>
                        <MapPin size={60} color={colors.mutedForeground} />
                        <Text style={styles.emptyTitle}>No addresses saved</Text>
                        <Text style={styles.emptySubtitle}>Add an address to get started</Text>
                    </View>
                )}
            </ScrollView>

            {/* Add/Edit Modal */}
            <Modal visible={showModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editingAddress ? 'Edit Address' : 'Add New Address'}
                            </Text>
                            <Pressable onPress={() => setShowModal(false)}>
                                <X size={24} color={colors.foreground} />
                            </Pressable>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            {/* Address Type */}
                            <Text style={styles.inputLabel}>Address Type</Text>
                            <View style={styles.typeButtons}>
                                {['Home', 'Office', 'Other'].map((type) => (
                                    <Pressable
                                        key={type}
                                        style={[
                                            styles.typeButton,
                                            formData.type === type && styles.typeButtonActive,
                                        ]}
                                        onPress={() => setFormData(prev => ({ ...prev, type }))}
                                    >
                                        <Text style={[
                                            styles.typeButtonText,
                                            formData.type === type && styles.typeButtonTextActive,
                                        ]}>{type}</Text>
                                    </Pressable>
                                ))}
                            </View>

                            <Text style={styles.inputLabel}>Full Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter full name"
                                placeholderTextColor={colors.mutedForeground}
                                value={formData.name}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                            />

                            <Text style={styles.inputLabel}>Address</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Enter full address"
                                placeholderTextColor={colors.mutedForeground}
                                value={formData.address}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
                                multiline
                                numberOfLines={3}
                            />

                            <Text style={styles.inputLabel}>City</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter city"
                                placeholderTextColor={colors.mutedForeground}
                                value={formData.city}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
                            />

                            <Text style={styles.inputLabel}>Pincode</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter pincode"
                                placeholderTextColor={colors.mutedForeground}
                                value={formData.pincode}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, pincode: text }))}
                                keyboardType="numeric"
                            />

                            <Text style={styles.inputLabel}>Phone Number</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter phone number"
                                placeholderTextColor={colors.mutedForeground}
                                value={formData.phone}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                                keyboardType="phone-pad"
                            />
                        </ScrollView>

                        <Pressable style={styles.saveButton} onPress={handleSave}>
                            <Check size={20} color={colors.white} />
                            <Text style={styles.saveButtonText}>Save Address</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
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
    setDefaultButton: {
        marginTop: 10,
        paddingVertical: 8,
        alignItems: 'center',
        backgroundColor: colors.secondary,
        borderRadius: 8,
    },
    setDefaultText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.primary,
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.foreground,
    },
    modalBody: {
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.foreground,
        marginBottom: 6,
    },
    input: {
        backgroundColor: colors.card,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 14,
        color: colors.foreground,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 14,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    typeButtons: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 14,
    },
    typeButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    typeButtonActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    typeButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.foreground,
    },
    typeButtonTextActive: {
        color: colors.white,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        margin: 16,
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    saveButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.white,
    },
});