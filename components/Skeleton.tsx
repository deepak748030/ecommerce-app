import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface SkeletonProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) {
    const { colors } = useTheme();
    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(animatedValue, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [animatedValue]);

    const opacity = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <Animated.View
            style={[
                {
                    width: width as any,
                    height,
                    borderRadius,
                    backgroundColor: colors.muted,
                    opacity,
                },
                style,
            ]}
        />
    );
}

// Product Card Skeleton
export function ProductCardSkeleton() {
    const { colors } = useTheme();
    return (
        <View style={[skeletonStyles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Skeleton width="100%" height={140} borderRadius={12} />
            <View style={skeletonStyles.productInfo}>
                <Skeleton width="80%" height={14} />
                <Skeleton width="50%" height={12} style={{ marginTop: 8 }} />
                <Skeleton width="40%" height={16} style={{ marginTop: 8 }} />
            </View>
        </View>
    );
}

// Order Card Skeleton
export function OrderCardSkeleton() {
    const { colors } = useTheme();
    return (
        <View style={[skeletonStyles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Skeleton width={60} height={60} borderRadius={8} />
            <View style={skeletonStyles.orderInfo}>
                <Skeleton width="60%" height={14} />
                <Skeleton width="40%" height={12} style={{ marginTop: 6 }} />
                <Skeleton width="50%" height={12} style={{ marginTop: 6 }} />
            </View>
            <View style={skeletonStyles.orderRight}>
                <Skeleton width={60} height={20} borderRadius={6} />
            </View>
        </View>
    );
}

// Category Card Skeleton
export function CategoryCardSkeleton() {
    const { colors } = useTheme();
    return (
        <View style={[skeletonStyles.categoryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Skeleton width={52} height={52} borderRadius={14} />
            <View style={skeletonStyles.categoryInfo}>
                <Skeleton width="70%" height={14} />
                <Skeleton width="40%" height={12} style={{ marginTop: 6 }} />
            </View>
            <Skeleton width={18} height={18} borderRadius={4} />
        </View>
    );
}

// Banner Skeleton
export function BannerSkeleton() {
    return (
        <Skeleton width="100%" height={150} borderRadius={16} />
    );
}

// Notification Skeleton
export function NotificationSkeleton() {
    const { colors } = useTheme();
    return (
        <View style={[skeletonStyles.notificationItem, { backgroundColor: colors.background }]}>
            <Skeleton width={44} height={44} borderRadius={12} />
            <View style={skeletonStyles.notificationContent}>
                <Skeleton width="60%" height={14} />
                <Skeleton width="90%" height={12} style={{ marginTop: 6 }} />
                <Skeleton width="30%" height={10} style={{ marginTop: 6 }} />
            </View>
        </View>
    );
}

// Transaction Skeleton
export function TransactionSkeleton() {
    const { colors } = useTheme();
    return (
        <View style={[skeletonStyles.transactionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={skeletonStyles.transactionInfo}>
                <Skeleton width="70%" height={14} />
                <Skeleton width="50%" height={10} style={{ marginTop: 6 }} />
                <Skeleton width="40%" height={10} style={{ marginTop: 4 }} />
            </View>
            <View style={skeletonStyles.transactionAmount}>
                <Skeleton width={60} height={16} />
                <Skeleton width={40} height={10} style={{ marginTop: 4 }} />
            </View>
        </View>
    );
}

// Cart Item Skeleton
export function CartItemSkeleton() {
    const { colors } = useTheme();
    return (
        <View style={[skeletonStyles.cartItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Skeleton width={70} height={70} borderRadius={8} />
            <View style={skeletonStyles.cartInfo}>
                <Skeleton width="80%" height={14} />
                <Skeleton width="30%" height={10} style={{ marginTop: 6 }} />
                <Skeleton width="40%" height={16} style={{ marginTop: 6 }} />
            </View>
            <View style={skeletonStyles.cartActions}>
                <Skeleton width={32} height={32} borderRadius={16} />
                <Skeleton width={80} height={32} borderRadius={10} />
            </View>
        </View>
    );
}

// Home Screen Skeleton
export function HomeScreenSkeleton() {
    return (
        <View style={skeletonStyles.homeContainer}>
            {/* Banner */}
            <BannerSkeleton />

            {/* Dots */}
            <View style={skeletonStyles.dots}>
                <Skeleton width={8} height={8} borderRadius={4} />
                <Skeleton width={24} height={8} borderRadius={4} />
                <Skeleton width={8} height={8} borderRadius={4} />
            </View>

            {/* Section Header */}
            <View style={skeletonStyles.sectionHeader}>
                <Skeleton width={150} height={18} />
                <Skeleton width={60} height={14} />
            </View>

            {/* Categories */}
            <View style={skeletonStyles.categoriesRow}>
                {[1, 2, 3, 4, 5].map((i) => (
                    <View key={i} style={skeletonStyles.categoryCircle}>
                        <Skeleton width={60} height={60} borderRadius={30} />
                        <Skeleton width={50} height={10} style={{ marginTop: 6 }} />
                    </View>
                ))}
            </View>

            {/* Section Header */}
            <View style={skeletonStyles.sectionHeader}>
                <Skeleton width={120} height={18} />
                <Skeleton width={60} height={14} />
            </View>

            {/* Products */}
            <View style={skeletonStyles.productsRow}>
                <ProductCardSkeleton />
                <ProductCardSkeleton />
            </View>
        </View>
    );
}

// Vendor Analytics Skeleton
export function VendorAnalyticsSkeleton() {
    const { colors } = useTheme();
    return (
        <View style={skeletonStyles.analyticsContainer}>
            <View style={skeletonStyles.statsGrid}>
                {[1, 2, 3, 4].map((i) => (
                    <View key={i} style={[skeletonStyles.statCard, { backgroundColor: colors.muted + '30' }]}>
                        <Skeleton width={40} height={40} borderRadius={20} />
                        <Skeleton width={60} height={20} style={{ marginTop: 10 }} />
                        <Skeleton width={80} height={12} style={{ marginTop: 6 }} />
                    </View>
                ))}
            </View>
            <View style={[skeletonStyles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Skeleton width={100} height={16} style={{ marginBottom: 12 }} />
                <View style={skeletonStyles.statusRow}>
                    {[1, 2, 3].map((i) => (
                        <View key={i} style={skeletonStyles.statusItem}>
                            <Skeleton width={10} height={10} borderRadius={5} />
                            <Skeleton width={30} height={18} style={{ marginTop: 6 }} />
                            <Skeleton width={50} height={10} style={{ marginTop: 4 }} />
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
}

const skeletonStyles = StyleSheet.create({
    productCard: {
        width: '48%',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        marginBottom: 10,
    },
    productInfo: {
        padding: 10,
    },
    orderCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 8,
    },
    orderInfo: {
        flex: 1,
        marginLeft: 12,
    },
    orderRight: {
        alignItems: 'flex-end',
    },
    categoryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 3,
        borderWidth: 1,
        marginBottom: 1,
    },
    categoryInfo: {
        flex: 1,
        marginLeft: 14,
    },
    notificationItem: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    notificationContent: {
        flex: 1,
        marginLeft: 12,
    },
    transactionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 8,
    },
    transactionInfo: {
        flex: 1,
    },
    transactionAmount: {
        alignItems: 'flex-end',
    },
    cartItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
        marginBottom: 8,
    },
    cartInfo: {
        flex: 1,
        marginLeft: 12,
    },
    cartActions: {
        alignItems: 'flex-end',
        gap: 10,
    },
    homeContainer: {
        padding: 6,
    },
    dots: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
        marginVertical: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 12,
    },
    categoriesRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    categoryCircle: {
        alignItems: 'center',
    },
    productsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    analyticsContainer: {
        padding: 6,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 16,
    },
    statCard: {
        width: '48%',
        padding: 14,
        borderRadius: 14,
        alignItems: 'center',
    },
    sectionCard: {
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statusItem: {
        alignItems: 'center',
    },
    wishlistContainer: {
        padding: 6,
    },
    wishlistGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    searchContainer: {
        padding: 6,
    },
    vendorProductCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 10,
    },
    vendorProductInfo: {
        flex: 1,
        marginLeft: 10,
    },
    vendorProductActions: {
        gap: 6,
    },
    vendorOrderCard: {
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 10,
    },
    vendorOrderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    vendorOrderItems: {
        gap: 6,
        marginVertical: 8,
    },
    vendorOrderItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    productDetailsContainer: {
        flex: 1,
    },
    productDetailsContent: {
        padding: 16,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
    },
    quantitySection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        marginTop: 16,
    },
    checkoutContainer: {
        padding: 6,
    },
    checkoutSection: {
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    checkoutItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    profileContainer: {
        padding: 6,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
        borderRadius: 18,
        borderWidth: 1,
        marginBottom: 16,
    },
    menuCard: {
        borderRadius: 14,
        borderWidth: 1,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
    },
    addressContainer: {
        padding: 6,
    },
    addressCard: {
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 8,
    },
    orderDetailsContainer: {
        padding: 6,
    },
    orderDetailsCard: {
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 10,
    },
    orderDetailsItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    orderDetailsTimelineItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    settingsContainer: {
        padding: 6,
    },
    settingsCard: {
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
    },
    settingsItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
    },
    helpSupportContainer: {
        padding: 6,
    },
    helpHeroSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    helpContactCard: {
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    helpFaqContainer: {
        borderRadius: 8,
        borderWidth: 1,
        overflow: 'hidden',
    },
    helpFaqItem: {
        padding: 14,
        borderBottomWidth: 1,
    },
    privacyPolicyCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
        flexDirection: 'row',
    },
});

// Help Support Skeleton
export function HelpSupportSkeleton() {
    const { colors } = useTheme();
    return (
        <View style={skeletonStyles.helpSupportContainer}>
            {/* Hero Section */}
            <View style={skeletonStyles.helpHeroSection}>
                <Skeleton width={64} height={64} borderRadius={32} />
                <Skeleton width={150} height={20} style={{ marginTop: 16 }} />
                <Skeleton width="90%" height={40} style={{ marginTop: 8 }} />
            </View>

            {/* Contact Section */}
            <Skeleton width={100} height={16} style={{ marginBottom: 12 }} />
            {[1, 2, 3].map((i) => (
                <View key={i} style={[skeletonStyles.helpContactCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Skeleton width={40} height={40} borderRadius={20} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Skeleton width="50%" height={14} />
                        <Skeleton width="70%" height={12} style={{ marginTop: 4 }} />
                    </View>
                    <Skeleton width={18} height={18} />
                </View>
            ))}

            {/* FAQ Section */}
            <Skeleton width={180} height={16} style={{ marginTop: 20, marginBottom: 12 }} />
            <View style={[skeletonStyles.helpFaqContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {[1, 2, 3, 4].map((i) => (
                    <View key={i} style={[skeletonStyles.helpFaqItem, { borderBottomColor: colors.border }]}>
                        <Skeleton width="80%" height={14} />
                    </View>
                ))}
            </View>
        </View>
    );
}

// Privacy Policy Skeleton
export function PrivacyPolicySkeleton() {
    const { colors } = useTheme();
    return (
        <View style={skeletonStyles.helpSupportContainer}>
            {/* Hero Section */}
            <View style={skeletonStyles.helpHeroSection}>
                <Skeleton width={64} height={64} borderRadius={32} />
                <Skeleton width={180} height={20} style={{ marginTop: 16 }} />
                <Skeleton width="95%" height={50} style={{ marginTop: 8 }} />
            </View>

            {/* Policy Cards */}
            {[1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={[skeletonStyles.privacyPolicyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Skeleton width={40} height={40} borderRadius={20} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Skeleton width="60%" height={14} />
                        <Skeleton width="100%" height={50} style={{ marginTop: 6 }} />
                    </View>
                </View>
            ))}
        </View>
    );
}

// Wishlist Skeleton
export function WishlistSkeleton() {
    return (
        <View style={skeletonStyles.wishlistContainer}>
            <View style={skeletonStyles.wishlistGrid}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <ProductCardSkeleton key={i} />
                ))}
            </View>
        </View>
    );
}

// Search Screen Skeleton
export function SearchScreenSkeleton() {
    return (
        <View style={skeletonStyles.searchContainer}>
            <Skeleton width={100} height={14} style={{ marginBottom: 12 }} />
            <View style={skeletonStyles.wishlistGrid}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <ProductCardSkeleton key={i} />
                ))}
            </View>
        </View>
    );
}

// Vendor Product Skeleton
export function VendorProductSkeleton() {
    const { colors } = useTheme();
    return (
        <View style={[skeletonStyles.vendorProductCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Skeleton width={70} height={70} borderRadius={8} />
            <View style={skeletonStyles.vendorProductInfo}>
                <Skeleton width="80%" height={13} />
                <Skeleton width="40%" height={15} style={{ marginTop: 6 }} />
                <Skeleton width="30%" height={10} style={{ marginTop: 6 }} />
            </View>
            <View style={skeletonStyles.vendorProductActions}>
                <Skeleton width={32} height={32} borderRadius={16} />
                <Skeleton width={32} height={32} borderRadius={16} />
            </View>
        </View>
    );
}

// Vendor Order Skeleton
export function VendorOrderSkeleton() {
    const { colors } = useTheme();
    return (
        <View style={[skeletonStyles.vendorOrderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={skeletonStyles.vendorOrderHeader}>
                <Skeleton width={80} height={14} />
                <Skeleton width={60} height={20} borderRadius={6} />
            </View>
            <Skeleton width="50%" height={13} />
            <Skeleton width="30%" height={11} style={{ marginTop: 4 }} />
            <View style={skeletonStyles.vendorOrderItems}>
                {[1, 2].map((i) => (
                    <View key={i} style={skeletonStyles.vendorOrderItemRow}>
                        <Skeleton width={36} height={36} borderRadius={6} />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                            <Skeleton width="60%" height={12} />
                            <Skeleton width="40%" height={11} style={{ marginTop: 4 }} />
                        </View>
                    </View>
                ))}
            </View>
            <View style={skeletonStyles.vendorOrderHeader}>
                <Skeleton width={60} height={11} />
                <Skeleton width={50} height={15} />
            </View>
        </View>
    );
}

// Product Details Skeleton
export function ProductDetailsSkeleton() {
    const { colors } = useTheme();
    return (
        <View style={skeletonStyles.productDetailsContainer}>
            <Skeleton width="100%" height={260} borderRadius={0} />
            <View style={skeletonStyles.productDetailsContent}>
                <Skeleton width={80} height={24} borderRadius={12} />
                <Skeleton width="90%" height={22} style={{ marginTop: 12 }} />
                <View style={skeletonStyles.priceRow}>
                    <Skeleton width={100} height={28} />
                    <Skeleton width={60} height={18} style={{ marginLeft: 10 }} />
                    <Skeleton width={50} height={22} borderRadius={4} style={{ marginLeft: 10 }} />
                </View>
                <View style={[skeletonStyles.quantitySection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Skeleton width={60} height={14} />
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <Skeleton width={36} height={36} borderRadius={8} />
                        <Skeleton width={40} height={36} />
                        <Skeleton width={36} height={36} borderRadius={8} />
                    </View>
                </View>
                <Skeleton width={100} height={18} style={{ marginTop: 20 }} />
                <Skeleton width="100%" height={60} style={{ marginTop: 8 }} />
                <Skeleton width={80} height={18} style={{ marginTop: 20 }} />
                {[1, 2, 3].map((i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                        <Skeleton width={8} height={8} borderRadius={4} />
                        <Skeleton width="80%" height={14} style={{ marginLeft: 10 }} />
                    </View>
                ))}
            </View>
        </View>
    );
}

// Checkout Skeleton
export function CheckoutSkeleton() {
    const { colors } = useTheme();
    return (
        <View style={skeletonStyles.checkoutContainer}>
            <View style={[skeletonStyles.checkoutSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Skeleton width={80} height={16} style={{ marginBottom: 12 }} />
                {[1, 2].map((i) => (
                    <View key={i} style={skeletonStyles.checkoutItemRow}>
                        <Skeleton width={50} height={50} borderRadius={8} />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <Skeleton width="80%" height={14} />
                            <Skeleton width="40%" height={12} style={{ marginTop: 4 }} />
                        </View>
                        <Skeleton width={50} height={16} />
                    </View>
                ))}
            </View>
            <View style={[skeletonStyles.checkoutSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Skeleton width={120} height={16} style={{ marginBottom: 12 }} />
                <Skeleton width="100%" height={80} borderRadius={10} />
            </View>
            <View style={[skeletonStyles.checkoutSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Skeleton width={100} height={16} style={{ marginBottom: 12 }} />
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} width="100%" height={50} borderRadius={10} style={{ marginBottom: 8 }} />
                ))}
            </View>
        </View>
    );
}

// Profile Skeleton
export function ProfileSkeleton() {
    const { colors } = useTheme();
    return (
        <View style={skeletonStyles.profileContainer}>
            <View style={[skeletonStyles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Skeleton width={70} height={70} borderRadius={35} />
                <View style={{ flex: 1, marginLeft: 14 }}>
                    <Skeleton width="60%" height={18} />
                    <Skeleton width="80%" height={13} style={{ marginTop: 6 }} />
                    <Skeleton width="50%" height={12} style={{ marginTop: 4 }} />
                </View>
                <Skeleton width={40} height={40} borderRadius={20} />
            </View>
            <Skeleton width="100%" height={70} borderRadius={14} style={{ marginBottom: 20 }} />
            {[1, 2, 3].map((section) => (
                <View key={section} style={{ marginBottom: 20 }}>
                    <Skeleton width={100} height={13} style={{ marginBottom: 10 }} />
                    <View style={[skeletonStyles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        {[1, 2, 3].map((i) => (
                            <View key={i} style={skeletonStyles.menuItem}>
                                <Skeleton width={40} height={40} borderRadius={10} />
                                <Skeleton width="60%" height={14} style={{ marginLeft: 12 }} />
                                <Skeleton width={18} height={18} style={{ marginLeft: 'auto' }} />
                            </View>
                        ))}
                    </View>
                </View>
            ))}
        </View>
    );
}

// Address Skeleton
export function AddressSkeleton() {
    const { colors } = useTheme();
    return (
        <View style={skeletonStyles.addressContainer}>
            <Skeleton width="100%" height={50} borderRadius={12} style={{ marginBottom: 12 }} />
            {[1, 2, 3].map((i) => (
                <View key={i} style={[skeletonStyles.addressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Skeleton width={32} height={32} borderRadius={8} />
                            <Skeleton width={60} height={14} />
                        </View>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <Skeleton width={28} height={28} borderRadius={6} />
                            <Skeleton width={28} height={28} borderRadius={6} />
                        </View>
                    </View>
                    <Skeleton width="50%" height={14} />
                    <Skeleton width="90%" height={13} style={{ marginTop: 4 }} />
                    <Skeleton width="70%" height={13} style={{ marginTop: 2 }} />
                    <Skeleton width="40%" height={13} style={{ marginTop: 4 }} />
                </View>
            ))}
        </View>
    );
}

// Order Details Skeleton
export function OrderDetailsSkeleton() {
    const { colors } = useTheme();
    return (
        <View style={skeletonStyles.orderDetailsContainer}>
            {/* Order Summary Card */}
            <View style={[skeletonStyles.orderDetailsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                        <Skeleton width={120} height={16} />
                        <Skeleton width={150} height={12} style={{ marginTop: 6 }} />
                    </View>
                    <Skeleton width={80} height={26} borderRadius={6} />
                </View>
            </View>

            {/* Items Card */}
            <View style={[skeletonStyles.orderDetailsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Skeleton width={80} height={16} style={{ marginBottom: 12 }} />
                {[1, 2].map((i) => (
                    <View key={i} style={skeletonStyles.orderDetailsItemRow}>
                        <Skeleton width={60} height={60} borderRadius={8} />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Skeleton width="80%" height={14} />
                            <Skeleton width="30%" height={12} style={{ marginTop: 6 }} />
                        </View>
                        <Skeleton width={60} height={16} />
                    </View>
                ))}
            </View>

            {/* Timeline Card */}
            <View style={[skeletonStyles.orderDetailsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Skeleton width={100} height={16} style={{ marginBottom: 12 }} />
                {[1, 2, 3, 4].map((i) => (
                    <View key={i} style={skeletonStyles.orderDetailsTimelineItem}>
                        <Skeleton width={24} height={24} borderRadius={12} />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Skeleton width="50%" height={14} />
                            <Skeleton width="40%" height={11} style={{ marginTop: 4 }} />
                        </View>
                    </View>
                ))}
            </View>

            {/* Address Card */}
            <View style={[skeletonStyles.orderDetailsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Skeleton width={18} height={18} borderRadius={4} />
                    <Skeleton width={120} height={16} style={{ marginLeft: 8 }} />
                </View>
                <Skeleton width="60%" height={14} />
                <Skeleton width="80%" height={13} style={{ marginTop: 4 }} />
                <Skeleton width="70%" height={13} style={{ marginTop: 2 }} />
                <Skeleton width="40%" height={13} style={{ marginTop: 4 }} />
            </View>
        </View>
    );
}

// App Settings Skeleton
export function AppSettingsSkeleton() {
    const { colors } = useTheme();
    return (
        <View style={skeletonStyles.settingsContainer}>
            {[1, 2, 3].map((section) => (
                <View key={section} style={{ marginBottom: 20 }}>
                    <Skeleton width={100} height={13} style={{ marginBottom: 8, marginLeft: 4 }} />
                    <View style={[skeletonStyles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        {[1, 2, 3].slice(0, section === 3 ? 1 : 3).map((i) => (
                            <View key={i} style={skeletonStyles.settingsItem}>
                                <Skeleton width={36} height={36} borderRadius={8} />
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Skeleton width="50%" height={14} />
                                    <Skeleton width="70%" height={12} style={{ marginTop: 4 }} />
                                </View>
                                <Skeleton width={50} height={28} borderRadius={14} />
                            </View>
                        ))}
                    </View>
                </View>
            ))}
        </View>
    );
}
