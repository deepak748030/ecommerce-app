import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { X, Wallet, Smartphone, Building2, CreditCard } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { ActionModal } from '@/components/ActionModal';

type PaymentMethod = 'upi' | 'bank_transfer' | 'paytm' | 'phonepe' | 'googlepay';

interface WithdrawModalProps {
    visible: boolean;
    onClose: () => void;
    availableBalance: number;
    onSubmit: (data: WithdrawData) => Promise<{ success: boolean; message?: string }>;
}

export interface WithdrawData {
    amount: number;
    paymentMethod: PaymentMethod;
    upiId?: string;
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    mobileNumber?: string;
}

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: typeof Wallet }[] = [
    { id: 'upi', label: 'UPI', icon: Smartphone },
    { id: 'bank_transfer', label: 'Bank Transfer', icon: Building2 },
    { id: 'paytm', label: 'Paytm', icon: CreditCard },
    { id: 'phonepe', label: 'PhonePe', icon: CreditCard },
    { id: 'googlepay', label: 'Google Pay', icon: CreditCard },
];

export function WithdrawModal({ visible, onClose, availableBalance, onSubmit }: WithdrawModalProps) {
    const { colors } = useTheme();
    const styles = createStyles(colors);

    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
    const [upiId, setUpiId] = useState('');
    const [accountHolderName, setAccountHolderName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [ifscCode, setIfscCode] = useState('');
    const [bankName, setBankName] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [infoModalData, setInfoModalData] = useState({ title: '', message: '', type: 'info' as 'info' | 'success' | 'error' });

    const resetForm = () => {
        setAmount('');
        setPaymentMethod('upi');
        setUpiId('');
        setAccountHolderName('');
        setAccountNumber('');
        setIfscCode('');
        setBankName('');
        setMobileNumber('');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const validateForm = (): string | null => {
        const parsedAmount = parseFloat(amount);

        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return 'Please enter a valid amount';
        }
        if (parsedAmount < 100) {
            return 'Minimum withdrawal amount is ₹100';
        }
        if (parsedAmount > availableBalance) {
            return 'Insufficient balance';
        }

        if (paymentMethod === 'upi') {
            if (!upiId.trim()) return 'Please enter UPI ID';
            if (!upiId.includes('@')) return 'Please enter a valid UPI ID (e.g., name@upi)';
        }

        if (paymentMethod === 'bank_transfer') {
            if (!accountHolderName.trim()) return 'Please enter account holder name';
            if (!accountNumber.trim()) return 'Please enter account number';
            if (!ifscCode.trim()) return 'Please enter IFSC code';
            if (ifscCode.length !== 11) return 'IFSC code should be 11 characters';
        }

        if (['paytm', 'phonepe', 'googlepay'].includes(paymentMethod)) {
            if (!mobileNumber.trim()) return 'Please enter mobile number';
            if (mobileNumber.length !== 10) return 'Please enter a valid 10-digit mobile number';
        }

        return null;
    };

    const handleSubmit = async () => {
        const error = validateForm();
        if (error) {
            setInfoModalData({ title: 'Error', message: error, type: 'error' });
            setShowInfoModal(true);
            return;
        }

        setSubmitting(true);
        try {
            const data: WithdrawData = {
                amount: parseFloat(amount),
                paymentMethod,
                ...(paymentMethod === 'upi' && { upiId: upiId.trim() }),
                ...(paymentMethod === 'bank_transfer' && {
                    accountHolderName: accountHolderName.trim(),
                    accountNumber: accountNumber.trim(),
                    ifscCode: ifscCode.trim().toUpperCase(),
                    bankName: bankName.trim(),
                }),
                ...(['paytm', 'phonepe', 'googlepay'].includes(paymentMethod) && {
                    mobileNumber: mobileNumber.trim(),
                }),
            };

            const result = await onSubmit(data);
            if (result.success) {
                setInfoModalData({ title: 'Success', message: `Withdrawal request of ₹${data.amount} submitted successfully!`, type: 'success' });
                setShowInfoModal(true);
            } else {
                setInfoModalData({ title: 'Error', message: result.message || 'Failed to process withdrawal', type: 'error' });
                setShowInfoModal(true);
            }
        } catch (error) {
            setInfoModalData({ title: 'Error', message: 'Something went wrong. Please try again.', type: 'error' });
            setShowInfoModal(true);
        } finally {
            setSubmitting(false);
        }
    };

    const renderPaymentFields = () => {
        switch (paymentMethod) {
            case 'upi':
                return (
                    <View>
                        <Text style={styles.inputLabel}>UPI ID</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="yourname@upi"
                            placeholderTextColor={colors.mutedForeground}
                            value={upiId}
                            onChangeText={setUpiId}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>
                );

            case 'bank_transfer':
                return (
                    <View>
                        <Text style={styles.inputLabel}>Account Holder Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Full name as per bank account"
                            placeholderTextColor={colors.mutedForeground}
                            value={accountHolderName}
                            onChangeText={setAccountHolderName}
                            autoCapitalize="words"
                        />

                        <Text style={styles.inputLabel}>Account Number</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter account number"
                            placeholderTextColor={colors.mutedForeground}
                            value={accountNumber}
                            onChangeText={setAccountNumber}
                            keyboardType="numeric"
                        />

                        <Text style={styles.inputLabel}>IFSC Code</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., SBIN0001234"
                            placeholderTextColor={colors.mutedForeground}
                            value={ifscCode}
                            onChangeText={setIfscCode}
                            autoCapitalize="characters"
                            maxLength={11}
                        />

                        <Text style={styles.inputLabel}>Bank Name (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., State Bank of India"
                            placeholderTextColor={colors.mutedForeground}
                            value={bankName}
                            onChangeText={setBankName}
                        />
                    </View>
                );

            case 'paytm':
            case 'phonepe':
            case 'googlepay':
                return (
                    <View>
                        <Text style={styles.inputLabel}>Mobile Number</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="10-digit mobile number"
                            placeholderTextColor={colors.mutedForeground}
                            value={mobileNumber}
                            onChangeText={setMobileNumber}
                            keyboardType="phone-pad"
                            maxLength={10}
                        />
                    </View>
                );

            default:
                return null;
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.overlay}
            >
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <Wallet size={20} color={colors.primary} />
                            <Text style={styles.title}>Withdraw Funds</Text>
                        </View>
                        <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                            <X size={24} color={colors.mutedForeground} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContent}>
                        {/* Available Balance */}
                        <View style={styles.balanceCard}>
                            <Text style={styles.balanceLabel}>Available Balance</Text>
                            <Text style={styles.balanceValue}>₹{availableBalance.toLocaleString('en-IN')}</Text>
                        </View>

                        {/* Amount Input */}
                        <Text style={styles.inputLabel}>Withdrawal Amount</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter amount (min ₹100)"
                            placeholderTextColor={colors.mutedForeground}
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="numeric"
                        />

                        {/* Payment Method Selection */}
                        <Text style={styles.inputLabel}>Payment Method</Text>
                        <View style={styles.methodsContainer}>
                            {PAYMENT_METHODS.map((method) => {
                                const Icon = method.icon;
                                const isSelected = paymentMethod === method.id;
                                return (
                                    <TouchableOpacity
                                        key={method.id}
                                        style={[
                                            styles.methodCard,
                                            isSelected && styles.methodCardSelected,
                                        ]}
                                        onPress={() => setPaymentMethod(method.id)}
                                    >
                                        <Icon
                                            size={18}
                                            color={isSelected ? colors.primary : colors.mutedForeground}
                                        />
                                        <Text
                                            style={[
                                                styles.methodLabel,
                                                isSelected && styles.methodLabelSelected,
                                            ]}
                                        >
                                            {method.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Payment Method Fields */}
                        {renderPaymentFields()}

                        {/* Info Text */}
                        <Text style={styles.infoText}>
                            Withdrawal requests are processed within 24-48 hours. Minimum withdrawal amount is ₹100.
                        </Text>
                    </ScrollView>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                        onPress={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color={colors.primaryForeground} />
                        ) : (
                            <Text style={styles.submitBtnText}>Request Withdrawal</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* Info Modal */}
            <ActionModal
                isVisible={showInfoModal}
                onClose={() => {
                    setShowInfoModal(false);
                    if (infoModalData.type === 'success') {
                        handleClose();
                    }
                }}
                type={infoModalData.type}
                title={infoModalData.title}
                message={infoModalData.message}
                buttons={[{ text: 'OK', onPress: () => { }, primary: true }]}
            />
        </Modal>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: colors.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.foreground,
    },
    closeBtn: {
        padding: 4,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    balanceCard: {
        backgroundColor: colors.primary + '15',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        alignItems: 'center',
    },
    balanceLabel: {
        fontSize: 12,
        color: colors.mutedForeground,
        marginBottom: 4,
    },
    balanceValue: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.primary,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.foreground,
        marginBottom: 8,
    },
    input: {
        backgroundColor: colors.muted,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: colors.foreground,
        marginBottom: 16,
    },
    methodsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20,
    },
    methodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: colors.muted,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 6,
    },
    methodCardSelected: {
        backgroundColor: colors.primary + '15',
        borderColor: colors.primary,
    },
    methodLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.mutedForeground,
    },
    methodLabelSelected: {
        color: colors.primary,
    },
    infoText: {
        fontSize: 12,
        color: colors.mutedForeground,
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 20,
        lineHeight: 18,
    },
    submitBtn: {
        backgroundColor: colors.primary,
        marginHorizontal: 20,
        marginBottom: 30,
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
    },
    submitBtnDisabled: {
        opacity: 0.7,
    },
    submitBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.primaryForeground,
    },
});