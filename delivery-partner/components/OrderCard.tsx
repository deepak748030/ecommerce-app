// import React from 'react';
// import { View, Text, StyleSheet, Pressable } from 'react-native';
// import { MapPin, Package, Phone, Navigation } from 'lucide-react-native';
// import { useTheme } from '@/hooks/useTheme';
// import { DeliveryOrder } from '@/lib/partnerMockData';

// interface OrderCardProps {
//     order: DeliveryOrder;
//     onAccept?: () => void;
//     onPickup?: () => void;
//     onDeliver?: () => void;
// }

// export default function OrderCard({ order, onAccept, onPickup, onDeliver }: OrderCardProps) {
//     const { colors } = useTheme();

//     const getStatusColor = () => {
//         switch (order.status) {
//             case 'pending':
//                 return colors.warning;
//             case 'picked':
//                 return colors.primary;
//             case 'delivering':
//                 return '#8B5CF6';
//             case 'delivered':
//                 return colors.success;
//             default:
//                 return colors.mutedForeground;
//         }
//     };

//     const getStatusText = () => {
//         switch (order.status) {
//             case 'pending':
//                 return 'New Order';
//             case 'picked':
//                 return 'Picked Up';
//             case 'delivering':
//                 return 'On The Way';
//             case 'delivered':
//                 return 'Delivered';
//             default:
//                 return order.status;
//         }
//     };

//     return (
//         <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
//             <View style={styles.header}>
//                 <View>
//                     <Text style={[styles.orderNumber, { color: colors.foreground }]}>{order.orderNumber}</Text>
//                     <Text style={[styles.time, { color: colors.mutedForeground }]}>{order.createdAt}</Text>
//                 </View>
//                 <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
//                     <Text style={[styles.statusText, { color: getStatusColor() }]}>{getStatusText()}</Text>
//                 </View>
//             </View>

//             <View style={styles.divider} />

//             <View style={styles.addressSection}>
//                 <View style={styles.addressRow}>
//                     <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
//                         <Package size={14} color={colors.primary} />
//                     </View>
//                     <View style={styles.addressContent}>
//                         <Text style={[styles.addressLabel, { color: colors.mutedForeground }]}>Pickup</Text>
//                         <Text style={[styles.addressText, { color: colors.foreground }]} numberOfLines={1}>
//                             {order.pickupAddress}
//                         </Text>
//                     </View>
//                 </View>

//                 <View style={styles.addressRow}>
//                     <View style={[styles.iconCircle, { backgroundColor: colors.destructive + '20' }]}>
//                         <MapPin size={14} color={colors.destructive} />
//                     </View>
//                     <View style={styles.addressContent}>
//                         <Text style={[styles.addressLabel, { color: colors.mutedForeground }]}>Delivery</Text>
//                         <Text style={[styles.addressText, { color: colors.foreground }]} numberOfLines={1}>
//                             {order.deliveryAddress}
//                         </Text>
//                     </View>
//                 </View>
//             </View>

//             <View style={styles.footer}>
//                 <View style={styles.footerInfo}>
//                     <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
//                         {order.items} items • {order.distance}
//                     </Text>
//                     <Text style={[styles.amount, { color: colors.primary }]}>₹{order.amount}</Text>
//                 </View>

//                 {order.status === 'pending' && onAccept && (
//                     <Pressable style={[styles.actionButton, { backgroundColor: colors.primary }]} onPress={onAccept}>
//                         <Text style={styles.actionButtonText}>Accept</Text>
//                     </Pressable>
//                 )}

//                 {order.status === 'picked' && onDeliver && (
//                     <View style={styles.actionRow}>
//                         <Pressable style={[styles.smallButton, { backgroundColor: colors.secondary }]}>
//                             <Phone size={16} color={colors.foreground} />
//                         </Pressable>
//                         <Pressable style={[styles.smallButton, { backgroundColor: colors.secondary }]}>
//                             <Navigation size={16} color={colors.foreground} />
//                         </Pressable>
//                         <Pressable style={[styles.actionButton, { backgroundColor: colors.primary }]} onPress={onDeliver}>
//                             <Text style={styles.actionButtonText}>Deliver</Text>
//                         </Pressable>
//                     </View>
//                 )}

//                 {order.status === 'pending' && onPickup && (
//                     <View style={styles.actionRow}>
//                         <Pressable style={[styles.smallButton, { backgroundColor: colors.secondary }]}>
//                             <Navigation size={16} color={colors.foreground} />
//                         </Pressable>
//                         <Pressable style={[styles.actionButton, { backgroundColor: colors.primary }]} onPress={onPickup}>
//                             <Text style={styles.actionButtonText}>Picked Up</Text>
//                         </Pressable>
//                     </View>
//                 )}
//             </View>
//         </View>
//     );
// }

// const styles = StyleSheet.create({
//     card: {
//         borderRadius: 14,
//         padding: 14,
//         marginBottom: 12,
//         borderWidth: 1,
//     },
//     header: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'flex-start',
//     },
//     orderNumber: {
//         fontSize: 14,
//         fontWeight: '700',
//     },
//     time: {
//         fontSize: 11,
//         marginTop: 2,
//     },
//     statusBadge: {
//         paddingHorizontal: 10,
//         paddingVertical: 4,
//         borderRadius: 12,
//     },
//     statusText: {
//         fontSize: 11,
//         fontWeight: '700',
//     },
//     divider: {
//         height: 1,
//         backgroundColor: '#E5E7EB20',
//         marginVertical: 12,
//     },
//     addressSection: {
//         gap: 10,
//     },
//     addressRow: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 10,
//     },
//     iconCircle: {
//         width: 28,
//         height: 28,
//         borderRadius: 14,
//         alignItems: 'center',
//         justifyContent: 'center',
//     },
//     addressContent: {
//         flex: 1,
//     },
//     addressLabel: {
//         fontSize: 10,
//         fontWeight: '600',
//     },
//     addressText: {
//         fontSize: 12,
//         fontWeight: '500',
//         marginTop: 1,
//     },
//     footer: {
//         marginTop: 12,
//     },
//     footerInfo: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         marginBottom: 10,
//     },
//     infoText: {
//         fontSize: 12,
//     },
//     amount: {
//         fontSize: 16,
//         fontWeight: '800',
//     },
//     actionButton: {
//         paddingVertical: 10,
//         paddingHorizontal: 20,
//         borderRadius: 10,
//         alignItems: 'center',
//     },
//     actionButtonText: {
//         color: '#FFFFFF',
//         fontSize: 13,
//         fontWeight: '700',
//     },
//     actionRow: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 8,
//     },
//     smallButton: {
//         width: 40,
//         height: 40,
//         borderRadius: 10,
//         alignItems: 'center',
//         justifyContent: 'center',
//     },
// });
