import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Dimensions } from 'react-native';
import { AlertTriangle, X, FileText, ArrowRight } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { router } from 'expo-router';

interface KycPendingModalProps {
    visible: boolean;
    onClose: () => void;
    kycStatus: 'pending' | 'under_review' | 'rejected' | null;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function KycPendingModal({ visible, onClose, kycStatus }: KycPendingModalProps) {
    const { colors, isDark } = useTheme();
    const styles = createStyles(colors, isDark);

    const getStatusInfo = () => {
        switch (kycStatus) {
            case 'pending':
                return {
                    title: 'Complete Your KYC',
                    description: 'You need to complete your KYC verification before you can accept orders. Please submit your documents to get verified.',
                    buttonText: 'Complete KYC',
                    icon: <FileText size={32} color={colors.warning} />,
                };
            case 'under_review':
                return {
                    title: 'KYC Under Review',
                    description: 'Your KYC documents are currently being reviewed by our team. This usually takes 24-48 hours. You will be able to accept orders once verified.',
                    buttonText: 'View Documents',
                    icon: <AlertTriangle size={32} color={colors.warning} />,
                };
            case 'rejected':
                return {
                    title: 'KYC Rejected',
                    description: 'Your KYC verification was rejected. Please review the feedback and resubmit your documents to continue accepting orders.',
                    buttonText: 'Resubmit Documents',
                    icon: <AlertTriangle size={32} color={colors.destructive} />,
                };
            default:
                return {
                    title: 'KYC Required',
                    description: 'Please complete your KYC verification to start accepting orders.',
                    buttonText: 'Complete KYC',
                    icon: <FileText size={32} color={colors.warning} />,
                };
        }
    };

    const statusInfo = getStatusInfo();

    const handleButtonPress = () => {
        onClose();
        router.push('/documents' as any);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Pressable style={styles.overlayBackground} onPress={onClose} />
                <View style={styles.modalContainer}>
                    <View style={styles.handle} />

                    <Pressable style={styles.closeBtn} onPress={onClose}>
                        <X size={20} color={colors.mutedForeground} />
                    </Pressable>

                    <View style={styles.iconContainer}>
                        {statusInfo.icon}
                    </View>

                    <Text style={styles.title}>{statusInfo.title}</Text>
                    <Text style={styles.description}>{statusInfo.description}</Text>

                    <View style={styles.infoBox}>
                        <AlertTriangle size={16} color={colors.warning} />
                        <Text style={styles.infoText}>
                            You cannot accept delivery orders until your KYC is verified.
                        </Text>
                    </View>

                    <Pressable style={styles.primaryBtn} onPress={handleButtonPress}>
                        <Text style={styles.primaryBtnText}>{statusInfo.buttonText}</Text>
                        <ArrowRight size={18} color={colors.white} />
                    </Pressable>

                    <Pressable style={styles.secondaryBtn} onPress={onClose}>
                        <Text style={styles.secondaryBtnText}>Close</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    overlayBackground: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContainer: {
        backgroundColor: colors.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 34,
        maxHeight: SCREEN_HEIGHT * 0.7,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: colors.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 16,
    },
    closeBtn: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.muted,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    iconContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: colors.warning + '15',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginTop: 8,
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.foreground,
        textAlign: 'center',
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        color: colors.mutedForeground,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: colors.warning + '15',
        padding: 12,
        borderRadius: 10,
        marginBottom: 20,
    },
    infoText: {
        flex: 1,
        fontSize: 12,
        color: colors.warning,
        fontWeight: '500',
    },
    primaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: colors.primary,
        paddingVertical: 14,
        borderRadius: 12,
        marginBottom: 10,
    },
    primaryBtnText: {
        color: colors.white,
        fontSize: 15,
        fontWeight: '700',
    },
    secondaryBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
    },
    secondaryBtnText: {
        color: colors.mutedForeground,
        fontSize: 14,
        fontWeight: '600',
    },
});
