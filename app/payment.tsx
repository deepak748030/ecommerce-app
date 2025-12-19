import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, TextInput, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Smartphone, Wallet, CreditCard, CheckCircle } from 'lucide-react-native';
import { SuccessModal } from '@/components/SuccessModal';
import { useTheme } from '@/hooks/useTheme';
import { useCart } from '@/hooks/useCart';
import { useAddress } from '@/hooks/useAddress';
import { ordersApi, getToken } from '@/lib/api';

export default function PaymentScreen() {
  const { paymentMethod: initialPaymentMethod, promoCode } = useLocalSearchParams();
  const { colors } = useTheme();
  const { cartItems, total, getCartForOrder, clearCart, loading: cartLoading } = useCart();
  const { selectedAddress, loading: addressLoading } = useAddress();

  const [paymentMethod, setPaymentMethod] = useState(initialPaymentMethod as string || 'upi');
  const [upiId, setUpiId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const styles = createStyles(colors);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getToken();
      if (!token) {
        Alert.alert('Login Required', 'Please login to continue');
        router.replace('/auth/phone');
      }
    };
    checkAuth();
  }, []);

  if (cartLoading || addressLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.mutedForeground }]}>Your cart is empty</Text>
          <Pressable style={[styles.goBackButton, { backgroundColor: colors.primary }]} onPress={() => router.replace('/(tabs)')}>
            <Text style={[styles.goBackButtonText, { color: colors.primaryForeground }]}>Shop Now</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!selectedAddress) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.mutedForeground }]}>No delivery address selected</Text>
          <Pressable style={[styles.goBackButton, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
            <Text style={[styles.goBackButtonText, { color: colors.primaryForeground }]}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const handlePayment = async () => {
    if (paymentMethod === 'upi' && !upiId) {
      Alert.alert('UPI ID Required', 'Please enter your UPI ID to continue');
      return;
    }

    setIsProcessing(true);

    try {
      const cartForOrder = await getCartForOrder();

      if (cartForOrder.length === 0) {
        Alert.alert('Error', 'Your cart is empty');
        setIsProcessing(false);
        return;
      }

      const orderData = {
        items: cartForOrder.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        shippingAddress: {
          name: selectedAddress.name,
          phone: selectedAddress.phone,
          address: selectedAddress.address,
          city: selectedAddress.city,
          state: selectedAddress.state,
          pincode: selectedAddress.pincode,
        },
        paymentMethod: paymentMethod,
        promoCode: promoCode as string || undefined,
      };

      const result = await ordersApi.create(orderData);

      if (result.success && result.response) {
        setOrderId(result.response._id);
        await clearCart();
        setShowSuccess(true);
      } else {
        Alert.alert('Order Failed', result.message || 'Failed to place order. Please try again.');
      }
    } catch (error) {
      console.error('Order creation error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    if (orderId) {
      router.replace(`/order/${orderId}` as any);
    } else {
      router.replace('/(tabs)');
    }
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
          {/* Order Summary */}
          <View style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.orderSummaryHeader}>
              <Text style={[styles.orderSummaryTitle, { color: colors.foreground }]}>Order Summary</Text>
              <Text style={[styles.orderSummaryCount, { color: colors.mutedForeground }]}>{cartItems.length} items</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.itemsPreview}>
              {cartItems.slice(0, 4).map((item, index) => (
                <Image
                  key={item.productId}
                  source={{ uri: item.image }}
                  style={[styles.previewImage, index > 0 && styles.previewImageOverlap]}
                />
              ))}
              {cartItems.length > 4 && (
                <View style={[styles.moreItems, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.moreItemsText, { color: colors.foreground }]}>+{cartItems.length - 4}</Text>
                </View>
              )}
            </ScrollView>
            <Text style={[styles.productPrice, { color: colors.primary }]}>₹{total.toLocaleString()}</Text>
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

          {/* Delivery Address */}
          <View style={[styles.addressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.addressLabel, { color: colors.mutedForeground }]}>Delivering to</Text>
            <Text style={[styles.addressName, { color: colors.foreground }]}>{selectedAddress.name}</Text>
            <Text style={[styles.addressText, { color: colors.mutedForeground }]}>
              {selectedAddress.address}, {selectedAddress.city} - {selectedAddress.pincode}
            </Text>
          </View>

          {/* Price Summary */}
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Amount to Pay</Text>
              <Text style={[styles.totalValue, { color: colors.foreground }]}>₹{total.toLocaleString()}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <SafeAreaView edges={['bottom']} style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <View style={styles.bottomContent}>
          <View style={styles.bottomPrice}>
            <Text style={[styles.bottomLabel, { color: colors.mutedForeground }]}>Total</Text>
            <Text style={[styles.bottomTotal, { color: colors.foreground }]}>₹{total.toLocaleString()}</Text>
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
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
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
  },
  orderSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderSummaryTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  orderSummaryCount: {
    fontSize: 12,
  },
  itemsPreview: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  previewImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  previewImageOverlap: {
    marginLeft: -10,
  },
  moreItems: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginLeft: -10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreItemsText: {
    fontSize: 12,
    fontWeight: '700',
  },
  productPrice: {
    fontSize: 18,
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
  addressCard: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  addressLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  addressName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  addressText: {
    fontSize: 12,
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
  },
  summaryLabel: {
    fontSize: 13,
  },
  totalValue: {
    fontSize: 18,
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
