import { useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    ScrollView,
    Image,
    Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bike, Car, CircleDot, Camera, Upload, FileText, User, CreditCard, IdCard, X, Check } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { deliveryPartnerAuthApi } from '../../lib/api';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';

const vehicleTypes = [
    { id: 'bicycle', label: 'Bicycle', icon: Bike },
    { id: 'bike', label: 'Bike', icon: Bike },
    { id: 'scooter', label: 'Scooter', icon: Bike },
    { id: 'car', label: 'Car', icon: Car },
];

interface DocumentState {
    aadhaar: string | null;
    pan: string | null;
    license: string | null;
    selfie: string | null;
}

export default function VehicleSetupScreen() {
    const { colors } = useTheme();
    const params = useLocalSearchParams();
    const partnerId = params.partnerId as string;

    const [name, setName] = useState('');
    const [vehicleType, setVehicleType] = useState('bike');
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [vehicleModel, setVehicleModel] = useState('');
    const [vehicleColor, setVehicleColor] = useState('');
    const [documents, setDocuments] = useState<DocumentState>({
        aadhaar: null,
        pan: null,
        license: null,
        selfie: null,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showCamera, setShowCamera] = useState(false);
    const [cameraType, setCameraType] = useState<'selfie' | 'document'>('selfie');
    const [currentDocType, setCurrentDocType] = useState<keyof DocumentState>('aadhaar');
    const cameraRef = useRef<CameraView>(null);
    const [permission, requestPermission] = useCameraPermissions();

    const pickImage = async (docType: keyof DocumentState) => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: docType === 'selfie' ? [1, 1] : [4, 3],
                quality: 0.7,
                base64: true,
            });

            if (!result.canceled && result.assets[0].base64) {
                const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
                setDocuments(prev => ({ ...prev, [docType]: base64Image }));
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const openCamera = async (docType: keyof DocumentState) => {
        if (!permission?.granted) {
            const result = await requestPermission();
            if (!result.granted) {
                Alert.alert('Permission Required', 'Camera permission is needed to take photos');
                return;
            }
        }
        setCurrentDocType(docType);
        setCameraType(docType === 'selfie' ? 'selfie' : 'document');
        setShowCamera(true);
    };

    const takePicture = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync({
                    base64: true,
                    quality: 0.7,
                });
                if (photo?.base64) {
                    const base64Image = `data:image/jpeg;base64,${photo.base64}`;
                    setDocuments(prev => ({ ...prev, [currentDocType]: base64Image }));
                }
                setShowCamera(false);
            } catch (err) {
                Alert.alert('Error', 'Failed to take picture');
            }
        }
    };

    const removeDocument = (docType: keyof DocumentState) => {
        setDocuments(prev => ({ ...prev, [docType]: null }));
    };

    const handleSubmit = async () => {
        if (!name.trim()) {
            setError('Please enter your name');
            return;
        }
        if (!vehicleNumber.trim()) {
            setError('Please enter vehicle number');
            return;
        }
        if (!documents.aadhaar) {
            setError('Please upload Aadhaar card');
            return;
        }
        if (!documents.pan) {
            setError('Please upload PAN card');
            return;
        }
        if (!documents.license) {
            setError('Please upload Driving License');
            return;
        }
        if (!documents.selfie) {
            setError('Please take a selfie');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await deliveryPartnerAuthApi.completeProfile({
                partnerId,
                name: name.trim(),
                vehicleType,
                vehicleNumber: vehicleNumber.trim().toUpperCase(),
                vehicleModel: vehicleModel.trim(),
                vehicleColor: vehicleColor.trim(),
                aadhaarImage: documents.aadhaar,
                panImage: documents.pan,
                licenseImage: documents.license,
                selfieImage: documents.selfie,
            });

            if (result.success) {
                router.replace('/(tabs)' as any);
            } else {
                setError(result.message || 'Failed to save details');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const documentFields = [
        { key: 'aadhaar' as const, label: 'Aadhaar Card', icon: IdCard, description: 'Upload front side' },
        { key: 'pan' as const, label: 'PAN Card', icon: CreditCard, description: 'Upload front side' },
        { key: 'license' as const, label: 'Driving License', icon: FileText, description: 'Upload front side' },
        { key: 'selfie' as const, label: 'Live Selfie', icon: User, description: 'Take a clear photo', cameraOnly: true },
    ];

    if (showCamera) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: '#000' }]}>
                <View style={styles.cameraContainer}>
                    <CameraView
                        ref={cameraRef}
                        style={styles.camera}
                        facing={cameraType === 'selfie' ? 'front' : 'back'}
                    >
                        <View style={styles.cameraOverlay}>
                            <TouchableOpacity
                                style={styles.closeCameraBtn}
                                onPress={() => setShowCamera(false)}
                            >
                                <X size={24} color="#fff" />
                            </TouchableOpacity>
                            <Text style={styles.cameraHint}>
                                {cameraType === 'selfie'
                                    ? 'Position your face in the center'
                                    : 'Hold document steady and capture'}
                            </Text>
                        </View>
                    </CameraView>
                    <View style={styles.cameraControls}>
                        <TouchableOpacity style={styles.captureBtn} onPress={takePicture}>
                            <View style={styles.captureBtnInner} />
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.flex}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: colors.foreground }]}>Complete Your Profile</Text>
                        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                            Add your details and documents to start delivering
                        </Text>
                    </View>

                    <View style={styles.form}>
                        {/* Personal Details Section */}
                        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Personal Details</Text>

                            <Text style={[styles.label, { color: colors.foreground }]}>Full Name</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                                placeholder="Enter your full name"
                                placeholderTextColor={colors.mutedForeground}
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        {/* Vehicle Details Section */}
                        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Vehicle Details</Text>

                            <Text style={[styles.label, { color: colors.foreground }]}>Vehicle Type</Text>
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
                                                    backgroundColor: isSelected ? colors.primary + '15' : colors.background,
                                                    borderColor: isSelected ? colors.primary : colors.border,
                                                },
                                            ]}
                                            onPress={() => setVehicleType(vehicle.id)}
                                        >
                                            <Icon size={24} color={isSelected ? colors.primary : colors.mutedForeground} />
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
                                                    <CircleDot size={12} color="#fff" />
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <Text style={[styles.label, { color: colors.foreground }]}>Vehicle Number</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                                placeholder="e.g., MH12AB1234"
                                placeholderTextColor={colors.mutedForeground}
                                value={vehicleNumber}
                                onChangeText={(text) => setVehicleNumber(text.toUpperCase())}
                                autoCapitalize="characters"
                            />

                            <Text style={[styles.label, { color: colors.foreground }]}>Vehicle Model (Optional)</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                                placeholder="e.g., Honda Activa"
                                placeholderTextColor={colors.mutedForeground}
                                value={vehicleModel}
                                onChangeText={setVehicleModel}
                            />

                            <Text style={[styles.label, { color: colors.foreground }]}>Vehicle Color (Optional)</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                                placeholder="e.g., Black"
                                placeholderTextColor={colors.mutedForeground}
                                value={vehicleColor}
                                onChangeText={setVehicleColor}
                            />
                        </View>

                        {/* KYC Documents Section */}
                        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>KYC Documents</Text>
                            <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}>
                                Upload clear images of your documents for verification
                            </Text>

                            {documentFields.map((doc) => {
                                const Icon = doc.icon;
                                const hasImage = documents[doc.key];

                                return (
                                    <View key={doc.key} style={styles.documentItem}>
                                        <View style={styles.documentHeader}>
                                            <View style={styles.documentInfo}>
                                                <Icon size={20} color={hasImage ? colors.primary : colors.mutedForeground} />
                                                <View>
                                                    <Text style={[styles.documentLabel, { color: colors.foreground }]}>{doc.label}</Text>
                                                    <Text style={[styles.documentDesc, { color: colors.mutedForeground }]}>{doc.description}</Text>
                                                </View>
                                            </View>
                                            {hasImage && (
                                                <View style={[styles.uploadedBadge, { backgroundColor: colors.primary + '20' }]}>
                                                    <Check size={14} color={colors.primary} />
                                                    <Text style={[styles.uploadedText, { color: colors.primary }]}>Uploaded</Text>
                                                </View>
                                            )}
                                        </View>

                                        {hasImage ? (
                                            <View style={styles.previewContainer}>
                                                <Image source={{ uri: documents[doc.key]! }} style={styles.previewImage} />
                                                <TouchableOpacity
                                                    style={[styles.removeBtn, { backgroundColor: colors.destructive }]}
                                                    onPress={() => removeDocument(doc.key)}
                                                >
                                                    <X size={16} color="#fff" />
                                                </TouchableOpacity>
                                            </View>
                                        ) : (
                                            <View style={styles.uploadActions}>
                                                <TouchableOpacity
                                                    style={[styles.uploadBtn, { backgroundColor: colors.primary }]}
                                                    onPress={() => openCamera(doc.key)}
                                                >
                                                    <Camera size={18} color="#fff" />
                                                    <Text style={styles.uploadBtnText}>
                                                        {doc.cameraOnly ? 'Take Selfie' : 'Camera'}
                                                    </Text>
                                                </TouchableOpacity>
                                                {!doc.cameraOnly && (
                                                    <TouchableOpacity
                                                        style={[styles.uploadBtn, { backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border }]}
                                                        onPress={() => pickImage(doc.key)}
                                                    >
                                                        <Upload size={18} color={colors.foreground} />
                                                        <Text style={[styles.uploadBtnText, { color: colors.foreground }]}>Gallery</Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        )}
                                    </View>
                                );
                            })}
                        </View>

                        {error ? <Text style={styles.error}>{error}</Text> : null}

                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: colors.primary }]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Submit for Verification</Text>
                            )}
                        </TouchableOpacity>

                        <Text style={[styles.note, { color: colors.mutedForeground }]}>
                            Your documents will be reviewed by our team. You'll be notified once approved.
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    flex: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 6,
    },
    header: {
        paddingVertical: 24,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
    },
    subtitle: {
        fontSize: 14,
        marginTop: 4,
    },
    form: {
        paddingBottom: 40,
        gap: 16,
    },
    sectionCard: {
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 13,
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        height: 52,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 14,
        fontSize: 16,
    },
    vehicleGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 4,
    },
    vehicleCard: {
        flex: 1,
        minWidth: '45%',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1.5,
        alignItems: 'center',
        position: 'relative',
    },
    vehicleLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginTop: 6,
    },
    checkmark: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    documentItem: {
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    documentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    documentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    documentLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    documentDesc: {
        fontSize: 12,
        marginTop: 2,
    },
    uploadedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    uploadedText: {
        fontSize: 12,
        fontWeight: '600',
    },
    uploadActions: {
        flexDirection: 'row',
        gap: 10,
    },
    uploadBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 10,
    },
    uploadBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    previewContainer: {
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
    },
    previewImage: {
        width: '100%',
        height: 160,
        borderRadius: 12,
        resizeMode: 'cover',
    },
    removeBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    error: {
        color: '#ef4444',
        fontSize: 13,
        marginTop: 8,
        textAlign: 'center',
    },
    button: {
        height: 52,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    note: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 18,
    },
    // Camera styles
    cameraContainer: {
        flex: 1,
    },
    camera: {
        flex: 1,
    },
    cameraOverlay: {
        flex: 1,
        padding: 20,
    },
    closeCameraBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cameraHint: {
        position: 'absolute',
        bottom: 100,
        left: 0,
        right: 0,
        textAlign: 'center',
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    cameraControls: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    captureBtn: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(255,255,255,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    captureBtnInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#fff',
    },
});