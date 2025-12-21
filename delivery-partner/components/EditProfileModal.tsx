import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Modal,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    ScrollView,
    Pressable,
    Image,
    Alert,
} from 'react-native';
import { X, Bike, Car, Check, Camera, ImageIcon } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { deliveryPartnerAuthApi, PartnerData, setPartnerData } from '../lib/api';
import * as ImagePicker from 'expo-image-picker';

interface EditProfileModalProps {
    isVisible: boolean;
    onClose: () => void;
    partnerData: PartnerData | null;
    onSuccess: (updatedData: PartnerData) => void;
}

const vehicleTypes = [
    { id: 'bicycle', label: 'Bicycle', icon: Bike },
    { id: 'bike', label: 'Bike', icon: Bike },
    { id: 'scooter', label: 'Scooter', icon: Bike },
    { id: 'car', label: 'Car', icon: Car },
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
    isVisible,
    onClose,
    partnerData,
    onSuccess,
}) => {
    const { colors } = useTheme();
    const styles = createStyles(colors);

    const [name, setName] = useState('');
    const [avatar, setAvatar] = useState<string | null>(null);
    const [vehicleType, setVehicleType] = useState('bike');
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [vehicleModel, setVehicleModel] = useState('');
    const [vehicleColor, setVehicleColor] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (partnerData) {
            setName(partnerData.name || '');
            setAvatar(partnerData.avatar || null);
            setVehicleType(partnerData.vehicle?.type || partnerData.vehicleType || 'bike');
            setVehicleNumber(partnerData.vehicle?.number || partnerData.vehicleNumber || '');
            setVehicleModel(partnerData.vehicle?.model || '');
            setVehicleColor(partnerData.vehicle?.color || '');
        }
    }, [partnerData]);

    const pickImage = async (useCamera: boolean) => {
        try {
            let result;

            if (useCamera) {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission Required', 'Camera permission is needed to take photos');
                    return;
                }
                result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.7,
                    base64: true,
                });
            } else {
                result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.7,
                    base64: true,
                });
            }

            if (!result.canceled && result.assets[0].base64) {
                const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
                setAvatar(base64Image);
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const showImageOptions = () => {
        Alert.alert(
            'Update Profile Photo',
            'Choose an option',
            [
                { text: 'Take Photo', onPress: () => pickImage(true) },
                { text: 'Choose from Gallery', onPress: () => pickImage(false) },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    const handleSave = async () => {
        if (loading) return;

        if (!name.trim()) {
            setError('Please enter your name');
            return;
        }
        if (!vehicleNumber.trim()) {
            setError('Please enter vehicle number');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await deliveryPartnerAuthApi.updateProfile({
                name: name.trim(),
                avatar: avatar || undefined,
                vehicleType,
                vehicleNumber: vehicleNumber.trim().toUpperCase(),
                vehicleModel: vehicleModel.trim(),
                vehicleColor: vehicleColor.trim(),
            });

            if (result.success && result.response) {
                await setPartnerData(result.response);
                onSuccess(result.response);
                onClose();
            } else {
                setError(result.message || 'Failed to update profile');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Pressable style={styles.backdrop} onPress={onClose} />
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.modalContainer}
                >
                    <View style={styles.modal}>
                        <View style={styles.header}>
                            <Text style={styles.title}>Edit Profile</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <X size={22} color={colors.foreground} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                            {/* Profile Image */}
                            <View style={styles.avatarSection}>
                                <TouchableOpacity style={styles.avatarContainer} onPress={showImageOptions}>
                                    {avatar ? (
                                        <Image source={{ uri: avatar }} style={styles.avatarImage} />
                                    ) : (
                                        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.secondary }]}>
                                            <Camera size={28} color={colors.mutedForeground} />
                                        </View>
                                    )}
                                    <View style={[styles.editAvatarBtn, { backgroundColor: colors.primary }]}>
                                        <Camera size={14} color="#fff" />
                                    </View>
                                </TouchableOpacity>
                                <Text style={[styles.avatarHint, { color: colors.mutedForeground }]}>
                                    Tap to change photo
                                </Text>
                            </View>

                            <Text style={styles.label}>Full Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your full name"
                                placeholderTextColor={colors.mutedForeground}
                                value={name}
                                onChangeText={setName}
                            />

                            <Text style={styles.label}>Vehicle Type</Text>
                            <View style={styles.vehicleGrid}>
                                {vehicleTypes.map((vehicle) => {
                                    const Icon = vehicle.icon;
                                    const isSelected = vehicleType === vehicle.id;
                                    return (
                                        <TouchableOpacity
                                            key={vehicle.id}
                                            style={[
                                                styles.vehicleCard,
                                                {
                                                    backgroundColor: isSelected ? colors.primary + '15' : colors.card,
                                                    borderColor: isSelected ? colors.primary : colors.border,
                                                },
                                            ]}
                                            onPress={() => setVehicleType(vehicle.id)}
                                        >
                                            <Icon size={20} color={isSelected ? colors.primary : colors.mutedForeground} />
                                            <Text
                                                style={[
                                                    styles.vehicleLabel,
                                                    { color: isSelected ? colors.primary : colors.foreground },
                                                ]}
                                            >
                                                {vehicle.label}
                                            </Text>
                                            {isSelected && (
                                                <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
                                                    <Check size={10} color="#fff" />
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <Text style={styles.label}>Vehicle Number</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., MH12AB1234"
                                placeholderTextColor={colors.mutedForeground}
                                value={vehicleNumber}
                                onChangeText={(text) => setVehicleNumber(text.toUpperCase())}
                                autoCapitalize="characters"
                            />

                            <Text style={styles.label}>Vehicle Model (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., Honda Activa"
                                placeholderTextColor={colors.mutedForeground}
                                value={vehicleModel}
                                onChangeText={setVehicleModel}
                            />

                            <Text style={styles.label}>Vehicle Color (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., Black"
                                placeholderTextColor={colors.mutedForeground}
                                value={vehicleColor}
                                onChangeText={setVehicleColor}
                            />

                            {error ? <Text style={styles.error}>{error}</Text> : null}
                        </ScrollView>

                        <TouchableOpacity
                            style={[styles.saveBtn, { opacity: loading ? 0.7 : 1 }]}
                            onPress={handleSave}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.saveBtnText}>Save Changes</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

const createStyles = (colors: any) =>
    StyleSheet.create({
        overlay: {
            flex: 1,
            justifyContent: 'flex-end',
        },
        backdrop: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(0,0,0,0.5)',
        },
        modalContainer: {
            maxHeight: '90%',
        },
        modal: {
            backgroundColor: colors.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingBottom: 30,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        title: {
            fontSize: 18,
            fontWeight: '700',
            color: colors.foreground,
        },
        closeBtn: {
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.muted,
            alignItems: 'center',
            justifyContent: 'center',
        },
        content: {
            paddingHorizontal: 16,
            paddingTop: 16,
            maxHeight: 450,
        },
        avatarSection: {
            alignItems: 'center',
            marginBottom: 16,
        },
        avatarContainer: {
            position: 'relative',
        },
        avatarImage: {
            width: 100,
            height: 100,
            borderRadius: 50,
        },
        avatarPlaceholder: {
            width: 100,
            height: 100,
            borderRadius: 50,
            alignItems: 'center',
            justifyContent: 'center',
        },
        editAvatarBtn: {
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 32,
            height: 32,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 3,
            borderColor: colors.background,
        },
        avatarHint: {
            fontSize: 12,
            marginTop: 8,
        },
        label: {
            fontSize: 13,
            fontWeight: '600',
            color: colors.foreground,
            marginBottom: 8,
            marginTop: 12,
        },
        input: {
            height: 48,
            borderWidth: 1,
            borderRadius: 10,
            paddingHorizontal: 14,
            fontSize: 15,
            backgroundColor: colors.card,
            borderColor: colors.border,
            color: colors.foreground,
        },
        vehicleGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
        },
        vehicleCard: {
            width: '23%',
            padding: 10,
            borderRadius: 10,
            borderWidth: 1.5,
            alignItems: 'center',
            position: 'relative',
        },
        vehicleLabel: {
            fontSize: 10,
            fontWeight: '600',
            marginTop: 4,
        },
        checkmark: {
            position: 'absolute',
            top: 4,
            right: 4,
            width: 16,
            height: 16,
            borderRadius: 8,
            justifyContent: 'center',
            alignItems: 'center',
        },
        error: {
            color: '#ef4444',
            fontSize: 13,
            marginTop: 12,
            textAlign: 'center',
        },
        saveBtn: {
            backgroundColor: colors.primary,
            height: 50,
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
            marginHorizontal: 16,
            marginTop: 16,
        },
        saveBtnText: {
            color: '#fff',
            fontSize: 16,
            fontWeight: '600',
        },
    });