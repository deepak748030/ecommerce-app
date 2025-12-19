import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface ConfirmationModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmDestructive?: boolean;
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
}: ConfirmationModalProps) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark, confirmDestructive);

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.modalBody}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
          </View>
          <View style={styles.buttonContainer}>
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </Pressable>
            <Pressable style={styles.confirmButton} onPress={onConfirm}>
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
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
    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modal: {
    backgroundColor: colors.card,
    borderRadius: 20,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalBody: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 10,
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
    paddingBottom: 20,
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
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
