import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Pressable,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { X, Truck, Clock, IndianRupee } from 'lucide-react-native';

interface Props {
    visible: boolean;
    orderNumber: string;
    onClose: () => void;
    onConfirm: (deliveryPayment: number, deliveryTimeMinutes: number) => void;
    loading?: boolean;
}

const TIME_OPTIONS = [
    { label: '15 min', value: 15 },
    { label: '30 min', value: 30 },
    { label: '45 min', value: 45 },
    { label: '1 hour', value: 60 },
    { label: '1.5 hours', value: 90 },
    { label: '2 hours', value: 120 },
];

export function ShippingModal({ visible, orderNumber, onClose, onConfirm, loading }: Props) {
    const { colors } = useTheme();
    const styles = createStyles(colors);

    const [deliveryPayment, setDeliveryPayment] = useState('');
    const [selectedTime, setSelectedTime] = useState<number | null>(30);
    const [customTime, setCustomTime] = useState('');
    const [useCustomTime, setUseCustomTime] = useState(false);
    const [error, setError] = useState('');

    const handleConfirm = () => {
        const payment = parseFloat(deliveryPayment);
        if (isNaN(payment) || payment <= 0) {
            setError('Please enter a valid payment amount');
            return;
        }

        let finalTime: number;
        if (useCustomTime) {
            const customTimeValue = parseInt(customTime);
            if (isNaN(customTimeValue) || customTimeValue <= 0) {
                setError('Please enter a valid delivery time');
                return;
            }
            finalTime = customTimeValue;
        } else {
            if (!selectedTime) {
                setError('Please select a delivery time');
                return;
            }
            finalTime = selectedTime;
        }

        setError('');
        onConfirm(payment, finalTime);
    };

    const handleClose = () => {
        setDeliveryPayment('');
        setSelectedTime(30);
        setCustomTime('');
        setUseCustomTime(false);
        setError('');
        onClose();
    };

    const handleTimeOptionPress = (value: number) => {
        setSelectedTime(value);
        setUseCustomTime(false);
        setCustomTime('');
    };

    const handleCustomTimeChange = (text: string) => {
        setCustomTime(text.replace(/[^0-9]/g, ''));
        setUseCustomTime(true);
        setSelectedTime(null);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <View style={styles.container}>
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={styles.headerIcon}>
                                <Truck size={24} color={colors.primary} />
                            </View>
                            <View style={styles.headerText}>
                                <Text style={styles.title}>Ship Order</Text>
                                <Text style={styles.subtitle}>#{orderNumber}</Text>
                            </View>
                            <Pressable onPress={handleClose} style={styles.closeBtn}>
                                <X size={20} color={colors.mutedForeground} />
                            </Pressable>
                        </View>

                        {/* Content */}
                        <View style={styles.content}>
                            {/* Payment Input */}
                            <View style={styles.inputSection}>
                                <View style={styles.labelRow}>
                                    <IndianRupee size={16} color={colors.primary} />
                                    <Text style={styles.label}>Delivery Boy Payment</Text>
                                </View>
                                <View style={styles.inputWrapper}>
                                    <Text style={styles.currencyPrefix}>₹</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter amount"
                                        placeholderTextColor={colors.mutedForeground}
                                        keyboardType="numeric"
                                        value={deliveryPayment}
                                        onChangeText={(text) => {
                                            setDeliveryPayment(text.replace(/[^0-9.]/g, ''));
                                            setError('');
                                        }}
                                    />
                                </View>
                                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                            </View>

                            {/* Time Selection */}
                            <View style={styles.inputSection}>
                                <View style={styles.labelRow}>
                                    <Clock size={16} color={colors.primary} />
                                    <Text style={styles.label}>Estimated Delivery Time</Text>
                                </View>
                                <View style={styles.timeGrid}>
                                    {TIME_OPTIONS.map((option) => (
                                        <Pressable
                                            key={option.value}
                                            style={[
                                                styles.timeOption,
                                                selectedTime === option.value && !useCustomTime && styles.timeOptionSelected,
                                            ]}
                                            onPress={() => handleTimeOptionPress(option.value)}
                                        >
                                            <Text
                                                style={[
                                                    styles.timeOptionText,
                                                    selectedTime === option.value && !useCustomTime && styles.timeOptionTextSelected,
                                                ]}
                                            >
                                                {option.label}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>

                                {/* Custom Time Input */}
                                <View style={styles.customTimeSection}>
                                    <Text style={styles.orText}>OR</Text>
                                    <View style={[styles.inputWrapper, useCustomTime && styles.inputWrapperActive]}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter custom time"
                                            placeholderTextColor={colors.mutedForeground}
                                            keyboardType="numeric"
                                            value={customTime}
                                            onChangeText={handleCustomTimeChange}
                                        />
                                        <Text style={styles.timeSuffix}>min</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Actions */}
                        <View style={styles.actions}>
                            <Pressable
                                style={styles.cancelBtn}
                                onPress={handleClose}
                                disabled={loading}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.confirmBtn, loading && styles.disabledBtn]}
                                onPress={handleConfirm}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.confirmBtnText}>Confirm & Ship</Text>
                                )}
                            </Pressable>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    keyboardView: {
        width: '100%',
    },
    container: {
        backgroundColor: colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 34,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerText: {
        flex: 1,
        marginLeft: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.foreground,
    },
    subtitle: {
        fontSize: 14,
        color: colors.mutedForeground,
        marginTop: 2,
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
        padding: 20,
        gap: 20,
    },
    inputSection: {
        gap: 10,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.foreground,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 16,
    },
    currencyPrefix: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.foreground,
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        color: colors.foreground,
        paddingVertical: 14,
    },
    errorText: {
        fontSize: 12,
        color: colors.destructive,
        marginTop: -4,
    },
    timeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    timeOption: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
    },
    timeOptionSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    timeOptionText: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.foreground,
    },
    timeOptionTextSelected: {
        color: '#fff',
    },
    customTimeSection: {
        marginTop: 12,
        alignItems: 'center',
        gap: 10,
    },
    orText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.mutedForeground,
    },
    inputWrapperActive: {
        borderColor: colors.primary,
        borderWidth: 2,
    },
    timeSuffix: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.mutedForeground,
        marginLeft: 8,
    },
    actions: {
        flexDirection: 'row',
        padding: 20,
        paddingTop: 0,
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: colors.muted,
        alignItems: 'center',
    },
    cancelBtnText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.foreground,
    },
    confirmBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: colors.primary,
        alignItems: 'center',
    },
    confirmBtnText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    disabledBtn: {
        opacity: 0.7,
    },
});
