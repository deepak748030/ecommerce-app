import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react-native';

type ModalType = 'success' | 'error' | 'info' | 'warning';

interface ActionButton {
    text: string;
    onPress: () => void;
    primary?: boolean;
    destructive?: boolean;
}

interface ActionModalProps {
    isVisible: boolean;
    onClose: () => void;
    type?: ModalType;
    title: string;
    message: string;
    buttons?: ActionButton[];
}

export function ActionModal({
    isVisible,
    onClose,
    type = 'info',
    title,
    message,
    buttons = [{ text: 'OK', onPress: () => { }, primary: true }],
}: ActionModalProps) {
    const { colors, isDark } = useTheme();
    const styles = createStyles(colors, isDark);

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle size={28} color={colors.success} />;
            case 'error':
                return <AlertCircle size={28} color={colors.destructive} />;
            case 'warning':
                return <AlertTriangle size={28} color={colors.warning} />;
            case 'info':
            default:
                return <Info size={28} color={colors.primary} />;
        }
    };

    const getIconBgColor = () => {
        switch (type) {
            case 'success':
                return colors.success + '15';
            case 'error':
                return colors.destructive + '15';
            case 'warning':
                return colors.warning + '15';
            case 'info':
            default:
                return colors.primary + '15';
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
                <View style={styles.modal}>
                    {/* Handle bar */}
                    <View style={styles.handleBar} />

                    {/* Icon */}
                    <View style={[styles.iconContainer, { backgroundColor: getIconBgColor() }]}>
                        {getIcon()}
                    </View>

                    {/* Content */}
                    <View style={styles.modalBody}>
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.message}>{message}</Text>
                    </View>

                    {/* Buttons */}
                    <View style={styles.buttonContainer}>
                        {buttons.map((button, index) => (
                            <Pressable
                                key={index}
                                style={[
                                    styles.button,
                                    button.primary ? styles.primaryButton : styles.secondaryButton,
                                    button.destructive && styles.destructiveButton,
                                ]}
                                onPress={() => {
                                    button.onPress();
                                    onClose();
                                }}
                            >
                                <Text
                                    style={[
                                        styles.buttonText,
                                        button.primary ? styles.primaryButtonText : styles.secondaryButtonText,
                                        button.destructive && styles.destructiveButtonText,
                                    ]}
                                >
                                    {button.text}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
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
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: 16,
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
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    primaryButton: {
        backgroundColor: colors.primary,
    },
    secondaryButton: {
        backgroundColor: colors.secondary,
        borderWidth: 1,
        borderColor: colors.border,
    },
    destructiveButton: {
        backgroundColor: colors.destructive,
    },
    buttonText: {
        fontSize: 15,
        fontWeight: '600',
    },
    primaryButtonText: {
        color: '#FFFFFF',
    },
    secondaryButtonText: {
        color: colors.foreground,
    },
    destructiveButtonText: {
        color: '#FFFFFF',
    },
});
