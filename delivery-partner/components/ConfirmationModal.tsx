import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ActivityIndicator } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { LogOut, AlertTriangle } from 'lucide-react-native';

interface ConfirmationModalProps {
    isVisible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmDestructive?: boolean;
    isLoading?: boolean;
}

export function ConfirmationModal({
    isVisible,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Yes',
    cancelText = 'Cancel',
    confirmDestructive = true,
    isLoading = false,
}: ConfirmationModalProps) {
    const { colors, isDark } = useTheme();
    const styles = createStyles(colors, isDark, confirmDestructive);

    const handleConfirm = () => {
        if (!isLoading) {
            onConfirm();
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            onClose();
        }
    };

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <Pressable style={styles.backdrop} onPress={handleClose} />
                <View style={styles.modal}>
                    {/* Handle bar */}
                    <View style={styles.handleBar} />

                    {/* Icon */}
                    <View style={[styles.iconContainer, confirmDestructive && styles.iconContainerDestructive]}>
                        {confirmDestructive ? (
                            <LogOut size={28} color={colors.destructive} />
                        ) : (
                            <AlertTriangle size={28} color={colors.primary} />
                        )}
                    </View>

                    {/* Content */}
                    <View style={styles.modalBody}>
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.message}>{message}</Text>
                    </View>

                    {/* Buttons */}
                    <View style={styles.buttonContainer}>
                        <Pressable
                            style={[styles.cancelButton, isLoading && styles.disabledButton]}
                            onPress={handleClose}
                            disabled={isLoading}
                        >
                            <Text style={[styles.cancelButtonText, isLoading && styles.disabledText]}>{cancelText}</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.confirmButton, isLoading && styles.confirmButtonLoading]}
                            onPress={handleConfirm}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.confirmButtonText}>{confirmText}</Text>
                            )}
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const createStyles = (colors: any, isDark: boolean, confirmDestructive: boolean) => StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
    },
    modal: {
        backgroundColor: colors.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 32,
        borderWidth: 1,
        borderBottomWidth: 0,
        borderColor: colors.border,
    },
    handleBar: {
        width: 40,
        height: 4,
        backgroundColor: colors.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 20,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: 16,
    },
    iconContainerDestructive: {
        backgroundColor: colors.destructive + '15',
    },
    modalBody: {
        paddingHorizontal: 24,
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.foreground,
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        color: colors.mutedForeground,
        textAlign: 'center',
        lineHeight: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: colors.secondary,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    cancelButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.foreground,
    },
    confirmButton: {
        flex: 1,
        backgroundColor: confirmDestructive ? colors.destructive : colors.primary,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
    },
    confirmButtonLoading: {
        opacity: 0.8,
    },
    confirmButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    disabledButton: {
        opacity: 0.5,
    },
    disabledText: {
        opacity: 0.7,
    },
});