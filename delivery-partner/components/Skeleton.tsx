import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle, DimensionValue } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface SkeletonProps {
    width?: DimensionValue;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    width = '100%',
    height = 14,
    borderRadius = 4,
    style
}) => {
    const { colors } = useTheme();
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [opacity]);

    return (
        <Animated.View
            style={[
                {
                    width: width as DimensionValue,
                    height,
                    borderRadius,
                    backgroundColor: colors.muted,
                },
                { opacity },
                style,
            ]}
        />
    );
};

// Home Screen Skeleton
export const HomeScreenSkeleton: React.FC = () => {
    const { colors } = useTheme();
    const styles = createStyles(colors);

    return (
        <View style={styles.container}>
            {/* Status Card Skeleton */}
            <View style={styles.statusCard}>
                <View style={styles.statusLeft}>
                    <Skeleton width={10} height={10} borderRadius={5} />
                    <Skeleton width={100} height={16} />
                </View>
                <Skeleton width={50} height={30} borderRadius={15} />
            </View>

            {/* Stats Row Skeleton */}
            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <Skeleton width={24} height={24} borderRadius={12} />
                    <Skeleton width={60} height={20} />
                    <Skeleton width={80} height={12} />
                </View>
                <View style={styles.statCard}>
                    <Skeleton width={24} height={24} borderRadius={12} />
                    <Skeleton width={60} height={20} />
                    <Skeleton width={80} height={12} />
                </View>
            </View>

            {/* Section Title */}
            <View style={styles.sectionHeader}>
                <Skeleton width={120} height={18} />
                <Skeleton width={24} height={24} borderRadius={12} />
            </View>

            {/* Delivery Cards Skeleton */}
            {[1, 2, 3].map((i) => (
                <View key={i} style={styles.deliveryCard}>
                    <View style={styles.deliveryHeader}>
                        <Skeleton width={80} height={16} />
                        <Skeleton width={60} height={24} borderRadius={6} />
                    </View>
                    <View style={styles.addressRow}>
                        <Skeleton width={14} height={14} borderRadius={7} />
                        <Skeleton width="85%" height={14} />
                    </View>
                    <View style={styles.addressRow}>
                        <Skeleton width={14} height={14} borderRadius={7} />
                        <Skeleton width="75%" height={14} />
                    </View>
                    <View style={styles.deliveryFooter}>
                        <Skeleton width={80} height={12} />
                        <Skeleton width={60} height={18} />
                    </View>
                </View>
            ))}
        </View>
    );
};

// Profile Screen Skeleton
export const ProfileScreenSkeleton: React.FC = () => {
    const { colors } = useTheme();
    const styles = createStyles(colors);

    return (
        <View style={styles.container}>
            {/* Profile Card Skeleton */}
            <View style={styles.profileCard}>
                <Skeleton width={56} height={56} borderRadius={28} />
                <View style={styles.profileInfo}>
                    <Skeleton width={120} height={18} />
                    <Skeleton width={100} height={14} style={{ marginTop: 6 }} />
                </View>
                <Skeleton width={40} height={40} borderRadius={20} />
            </View>

            {/* Stats Row Skeleton */}
            <View style={styles.profileStatsRow}>
                <View style={styles.profileStatItem}>
                    <Skeleton width={36} height={36} borderRadius={18} />
                    <Skeleton width={30} height={16} style={{ marginTop: 6 }} />
                    <Skeleton width={40} height={10} style={{ marginTop: 4 }} />
                </View>
                <View style={styles.profileStatDivider} />
                <View style={styles.profileStatItem}>
                    <Skeleton width={36} height={36} borderRadius={18} />
                    <Skeleton width={30} height={16} style={{ marginTop: 6 }} />
                    <Skeleton width={50} height={10} style={{ marginTop: 4 }} />
                </View>
                <View style={styles.profileStatDivider} />
                <View style={styles.profileStatItem}>
                    <Skeleton width={36} height={36} borderRadius={18} />
                    <Skeleton width={40} height={16} style={{ marginTop: 6 }} />
                    <Skeleton width={40} height={10} style={{ marginTop: 4 }} />
                </View>
            </View>

            {/* Info Card Skeleton */}
            <View style={styles.infoCard}>
                <Skeleton width={140} height={16} style={{ marginBottom: 12 }} />
                <View style={styles.infoRow}>
                    <Skeleton width={100} height={14} />
                    <Skeleton width={80} height={14} />
                </View>
                <View style={styles.infoRow}>
                    <Skeleton width={80} height={14} />
                    <Skeleton width={60} height={14} />
                </View>
            </View>

            {/* Menu Card Skeleton */}
            <View style={styles.menuCard}>
                {[1, 2, 3, 4].map((i) => (
                    <View key={i} style={styles.menuItem}>
                        <View style={styles.menuLeft}>
                            <Skeleton width={20} height={20} borderRadius={4} />
                            <Skeleton width={100} height={16} />
                        </View>
                        <Skeleton width={16} height={16} borderRadius={8} />
                    </View>
                ))}
            </View>
        </View>
    );
};

// Delivery Detail Screen Skeleton
export const DeliveryDetailSkeleton: React.FC = () => {
    const { colors } = useTheme();
    const styles = createStyles(colors);

    return (
        <View style={styles.container}>
            {/* Order Info Card */}
            <View style={styles.detailCard}>
                <View style={styles.cardHeader}>
                    <Skeleton width={100} height={20} />
                    <Skeleton width={80} height={24} />
                </View>
                <View style={styles.statusRowSkeleton}>
                    <Skeleton width={100} height={28} borderRadius={8} />
                    <Skeleton width={120} height={14} />
                </View>
            </View>

            {/* Vendor Card */}
            <View style={styles.detailCard}>
                <View style={styles.sectionHeaderSkeleton}>
                    <Skeleton width={16} height={16} borderRadius={8} />
                    <Skeleton width={120} height={16} />
                </View>
                <View style={styles.contactRowSkeleton}>
                    <View style={{ flex: 1 }}>
                        <Skeleton width={60} height={16} />
                        <Skeleton width="90%" height={14} style={{ marginTop: 6 }} />
                    </View>
                    <Skeleton width={40} height={40} borderRadius={20} />
                </View>
            </View>

            {/* Customer Card */}
            <View style={styles.detailCard}>
                <View style={styles.sectionHeaderSkeleton}>
                    <Skeleton width={16} height={16} borderRadius={8} />
                    <Skeleton width={130} height={16} />
                </View>
                <View style={styles.contactRowSkeleton}>
                    <View style={{ flex: 1 }}>
                        <Skeleton width={100} height={16} />
                        <Skeleton width="85%" height={14} style={{ marginTop: 6 }} />
                    </View>
                    <Skeleton width={40} height={40} borderRadius={20} />
                </View>
            </View>

            {/* Items Card */}
            <View style={styles.detailCard}>
                <Skeleton width={80} height={16} style={{ marginBottom: 12 }} />
                {[1, 2].map((i) => (
                    <View key={i} style={styles.itemRowSkeleton}>
                        <Skeleton width={50} height={50} borderRadius={8} />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <Skeleton width="80%" height={16} />
                            <View style={styles.itemMetaSkeleton}>
                                <Skeleton width={50} height={12} />
                                <Skeleton width={50} height={14} />
                            </View>
                        </View>
                    </View>
                ))}
            </View>

            {/* Payment Card */}
            <View style={styles.detailCard}>
                <View style={styles.sectionHeaderSkeleton}>
                    <Skeleton width={16} height={16} borderRadius={8} />
                    <Skeleton width={80} height={16} />
                </View>
                {[1, 2, 3].map((i) => (
                    <View key={i} style={styles.paymentRowSkeleton}>
                        <Skeleton width={100} height={14} />
                        <Skeleton width={60} height={14} />
                    </View>
                ))}
            </View>
        </View>
    );
};

// Order Card Skeleton (for lists)
export const OrderCardSkeleton: React.FC = () => {
    const { colors } = useTheme();
    const styles = createStyles(colors);

    return (
        <View style={styles.orderCardSkeleton}>
            <View style={styles.deliveryHeader}>
                <Skeleton width={80} height={16} />
                <Skeleton width={60} height={18} />
            </View>
            <View style={styles.addressSection}>
                <View style={styles.addressRowSkeleton}>
                    <Skeleton width={8} height={8} borderRadius={4} />
                    <Skeleton width="85%" height={14} />
                </View>
                <View style={styles.addressLineSkeleton} />
                <View style={styles.addressRowSkeleton}>
                    <Skeleton width={8} height={8} borderRadius={4} />
                    <Skeleton width="75%" height={14} />
                </View>
            </View>
            <View style={styles.orderFooterSkeleton}>
                <Skeleton width={80} height={12} />
                <Skeleton width={50} height={14} />
            </View>
        </View>
    );
};

// Earnings Card Skeleton
export const EarningsCardSkeleton: React.FC = () => {
    const { colors } = useTheme();
    const styles = createStyles(colors);

    return (
        <View style={styles.earningsCardSkeleton}>
            <View style={styles.earningsLeft}>
                <Skeleton width={120} height={16} />
                <Skeleton width={100} height={12} style={{ marginTop: 6 }} />
            </View>
            <View style={styles.earningsRight}>
                <Skeleton width={70} height={18} />
            </View>
        </View>
    );
};

const createStyles = (colors: any) => StyleSheet.create({
    container: {
        paddingHorizontal: 6,
    },
    // Home Screen Styles
    statusCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.card,
        padding: 14,
        borderRadius: 12,
        marginBottom: 14,
    },
    statusLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 18,
    },
    statCard: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        gap: 6,
        backgroundColor: colors.card,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        marginTop: 4,
    },
    deliveryCard: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
    },
    deliveryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    deliveryFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    // Profile Screen Styles
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 14,
        marginBottom: 14,
    },
    profileInfo: {
        flex: 1,
        marginLeft: 12,
    },
    profileStatsRow: {
        flexDirection: 'row',
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 14,
        marginBottom: 14,
    },
    profileStatItem: {
        flex: 1,
        alignItems: 'center',
    },
    profileStatDivider: {
        width: 1,
        backgroundColor: colors.border,
    },
    infoCard: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 14,
        marginBottom: 14,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    menuCard: {
        backgroundColor: colors.card,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 14,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    // Delivery Detail Styles
    detailCard: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    statusRowSkeleton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    sectionHeaderSkeleton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    contactRowSkeleton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemRowSkeleton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    itemMetaSkeleton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 6,
    },
    paymentRowSkeleton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    // Order Card Skeleton
    orderCardSkeleton: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
    },
    addressSection: {
        marginBottom: 12,
    },
    addressRowSkeleton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    addressLineSkeleton: {
        width: 1,
        height: 16,
        backgroundColor: colors.border,
        marginLeft: 3.5,
        marginVertical: 4,
    },
    orderFooterSkeleton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    // Earnings Card Skeleton
    earningsCardSkeleton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
    },
    earningsLeft: {},
    earningsRight: {
        alignItems: 'flex-end',
    },
});

export default Skeleton;