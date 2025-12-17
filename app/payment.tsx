import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Smartphone, Wallet, CreditCard, CheckCircle } from 'lucide-react-native';
import { allProducts, Event } from '@/lib/mockData';
import { SuccessModal } from '@/components/SuccessModal';
import { useTheme } from '@/hooks/useTheme';

export default function PaymentScreen() {
  const { eventId, price } = useLocalSearchParams();
  const { colors } = useTheme();
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [product, setProduct] = useState<Event | null>(null);

  const bookingPrice = parseInt(price as string) || 0;

  useEffect(() => {
    const foundProduct = allProducts.find(e => e.id === eventId);
    setProduct(foundProduct || null);
  }, [eventId]);

  const styles = createStyles(colors);

  if (!product) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.mutedForeground }]}>Product not found</Text>
          <Pressable style={[styles.goBackButton, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
            <Text style={[styles.goBackButtonText, { color: colors.primaryForeground }]}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const handlePayment = () => {
    if (paymentMethod === 'upi' && !upiId) return;

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setShowSuccess(true);
    }, 1500);
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    router.replace('/(tabs)');
  };

  const paymentMethods = [
    { id: 'upi', title: 'UPI', subtitle: 'GPay, PhonePe, Paytm', icon: Smartphone },
    { id: 'wallet', title: 'Wallet', subtitle: 'Digital wallets', icon: Wallet },
    { id: 'card', title: 'Card', subtitle: 'Credit/Debit card', icon: CreditCard },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Payment</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Product Summary */}
          <View style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Image source={{ uri: product.image }} style={styles.productImage} />
            <View style={styles.productInfo}>
              <Text style={[styles.productTitle, { color: colors.foreground }]} numberOfLines={2}>{product.title}</Text>
              <Text style={[styles.productCategory, { color: colors.mutedForeground }]}>{product.category}</Text>
              <Text style={[styles.productPrice, { color: colors.primary }]}>₹{bookingPrice.toLocaleString()}</Text>
            </View>
          </View>

          {/* Payment Methods */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Payment Method</Text>
          <View style={styles.paymentMethods}>
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              const isSelected = paymentMethod === method.id;
              return (
                <Pressable
                  key={method.id}
                  style={[
                    styles.paymentOption,
                    { backgroundColor: colors.card, borderColor: isSelected ? colors.primary : colors.border }
                  ]}
                  onPress={() => setPaymentMethod(method.id)}
                >
                  <View style={[styles.radioOuter, { borderColor: isSelected ? colors.primary : colors.border }]}>
                    {isSelected && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                  </View>
                  <View style={[styles.paymentIcon, { backgroundColor: colors.secondary }]}>
                    <Icon size={18} color={colors.primary} />
                  </View>
                  <View style={styles.paymentText}>
                    <Text style={[styles.paymentTitle, { color: colors.foreground }]}>{method.title}</Text>
                    <Text style={[styles.paymentSubtitle, { color: colors.mutedForeground }]}>{method.subtitle}</Text>
                  </View>
                  {isSelected && <CheckCircle size={18} color={colors.primary} />}
                </Pressable>
              );
            })}
          </View>

          {/* UPI Input */}
          {paymentMethod === 'upi' && (
            <View style={[styles.inputCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>Enter UPI ID</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                placeholder="yourname@upi"
                placeholderTextColor={colors.mutedForeground}
                value={upiId}
                onChangeText={setUpiId}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          )}

          {/* Price Summary */}
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Item Total</Text>
              <Text style={[styles.summaryValue, { color: colors.foreground }]}>₹{bookingPrice.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Delivery</Text>
              <Text style={[styles.summaryValue, { color: colors.success }]}>FREE</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryRow}>
              <Text style={[styles.totalLabel, { color: colors.foreground }]}>Amount to Pay</Text>
              <Text style={[styles.totalValue, { color: colors.foreground }]}>₹{bookingPrice.toLocaleString()}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <SafeAreaView edges={['bottom']} style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <View style={styles.bottomContent}>
          <View style={styles.bottomPrice}>
            <Text style={[styles.bottomLabel, { color: colors.mutedForeground }]}>Total</Text>
            <Text style={[styles.bottomTotal, { color: colors.foreground }]}>₹{bookingPrice.toLocaleString()}</Text>
          </View>
          <Pressable
            style={[
              styles.payButton,
              { backgroundColor: colors.primary },
              (isProcessing || (paymentMethod === 'upi' && !upiId)) && styles.disabledButton
            ]}
            onPress={handlePayment}
            disabled={isProcessing || (paymentMethod === 'upi' && !upiId)}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.payButtonText, { color: colors.primaryForeground }]}>Pay Now</Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>

      <SuccessModal
        isVisible={showSuccess}
        onClose={handleSuccessClose}
        title="Order Placed!"
        message="Your order has been placed successfully. You will receive a confirmation shortly."
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    marginBottom: 12,
  },
  goBackButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  goBackButtonText: {
    fontWeight: '600',
    fontSize: 13,
  },
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingVertical: 12,
    paddingHorizontal: 6,
    paddingBottom: 100,
  },
  productCard: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
  },
  productTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  productCategory: {
    fontSize: 11,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  paymentMethods: {
    gap: 8,
    marginBottom: 12,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  paymentIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentText: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  paymentSubtitle: {
    fontSize: 11,
  },
  inputCard: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  summaryCard: {
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  bottomBar: {
    borderTopWidth: 1,
  },
  bottomContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingVertical: 12,
  },
  bottomPrice: {},
  bottomLabel: {
    fontSize: 10,
    marginBottom: 2,
  },
  bottomTotal: {
    fontSize: 16,
    fontWeight: '800',
  },
  payButton: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  payButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
