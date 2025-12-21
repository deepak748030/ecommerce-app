import { useState } from 'react';
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
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bike, Car, CircleDot } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { API_BASE_URL } from '../../lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const vehicleTypes = [
    { id: 'bicycle', label: 'Bicycle', icon: Bike },
    { id: 'bike', label: 'Bike', icon: Bike },
    { id: 'scooter', label: 'Scooter', icon: Bike },
    { id: 'car', label: 'Car', icon: Car },
];

export default function VehicleSetupScreen() {
    const { colors } = useTheme();
    const params = useLocalSearchParams();
    const partnerId = params.partnerId as string;

    const [name, setName] = useState('');
    const [vehicleType, setVehicleType] = useState('bike');
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [vehicleModel, setVehicleModel] = useState('');
    const [vehicleColor, setVehicleColor] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
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
            const response = await fetch(`${API_BASE_URL}/delivery-partner/auth/complete-profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    partnerId,
                    name: name.trim(),
                    vehicleType,
                    vehicleNumber: vehicleNumber.trim().toUpperCase(),
                    vehicleModel: vehicleModel.trim(),
                    vehicleColor: vehicleColor.trim(),
                }),
            });

            const data = await response.json();

            if (data.success) {
                await AsyncStorage.setItem('partnerData', JSON.stringify(data.response.partner));
                router.replace('/(tabs)' as any);
            } else {
                setError(data.message || 'Failed to save details');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
            >
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: colors.foreground }]}>Complete Your Profile</Text>
                        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                            Add your details to start delivering
                        </Text>
                    </View>

                    <View style={styles.form}>
                        <Text style={[styles.label, { color: colors.foreground }]}>Full Name</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                            placeholder="Enter your full name"
                            placeholderTextColor={colors.mutedForeground}
                            value={name}
                            onChangeText={setName}
                        />

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
                                                backgroundColor: isSelected ? colors.primary + '15' : colors.card,
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
                            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                            placeholder="e.g., MH12AB1234"
                            placeholderTextColor={colors.mutedForeground}
                            value={vehicleNumber}
                            onChangeText={(text) => setVehicleNumber(text.toUpperCase())}
                            autoCapitalize="characters"
                        />

                        <Text style={[styles.label, { color: colors.foreground }]}>Vehicle Model (Optional)</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                            placeholder="e.g., Honda Activa"
                            placeholderTextColor={colors.mutedForeground}
                            value={vehicleModel}
                            onChangeText={setVehicleModel}
                        />

                        <Text style={[styles.label, { color: colors.foreground }]}>Vehicle Color (Optional)</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                            placeholder="e.g., Black"
                            placeholderTextColor={colors.mutedForeground}
                            value={vehicleColor}
                            onChangeText={setVehicleColor}
                        />

                        {error ? <Text style={styles.error}>{error}</Text> : null}

                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: colors.primary }]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Start Delivering</Text>
                            )}
                        </TouchableOpacity>
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
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 16,
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
    error: {
        color: '#ef4444',
        fontSize: 13,
        marginTop: 16,
        textAlign: 'center',
    },
    button: {
        height: 52,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
