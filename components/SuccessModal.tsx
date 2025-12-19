// components/SuccessModal.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { CircleCheck as CheckCircle2, AlertCircle, X } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

interface SuccessModalProps {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  autoClose?: boolean;
  duration?: number;
}

export function SuccessModal({ isVisible, onClose, title, message, autoClose = true, duration = 1000 }: SuccessModalProps) {
  const { colors } = useTheme();
  const isError = title.toLowerCase().includes('error');

  useEffect(() => {
    if (isVisible && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, autoClose, duration, onClose]);

  const styles = createStyles(colors);

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <X size={24} color={colors.foreground} />
            </Pressable>
            <Text style={styles.headerTitle}>Notification</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={[styles.iconContainer, isError ? styles.errorIcon : styles.successIcon]}>
              {isError ? (
                <AlertCircle size={48} color={colors.destructive} />
              ) : (
                <CheckCircle2 size={48} color={colors.success} />
              )}
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
          </View>

          {/* Button */}
          <View style={styles.buttonContainer}>
            <Pressable style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>Got it</Text>
            </Pressable>
          </View>
        </View>
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
  modal: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  placeholder: {
    width: 32,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successIcon: {
    backgroundColor: colors.success + '20',
  },
  errorIcon: {
    backgroundColor: colors.destructive + '20',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
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
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryForeground,
  },
});
