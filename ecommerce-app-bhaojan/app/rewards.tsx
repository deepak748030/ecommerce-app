import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Gift, Star, Trophy, Zap } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

const mockRewards = [
    { id: '1', title: '₹100 Off on next order', points: 500, icon: '🎁' },
    { id: '2', title: 'Free Delivery', points: 300, icon: '🚚' },
    { id: '3', title: '10% Cashback', points: 800, icon: '💰' },
    { id: '4', title: 'Premium Member Badge', points: 2000, icon: '👑' },
];

const mockHistory = [
    { id: '1', title: 'Order Completed', points: '+50', date: 'Dec 15, 2024', type: 'earned' },
    { id: '2', title: 'Referral Bonus', points: '+200', date: 'Dec 12, 2024', type: 'earned' },
    { id: '3', title: 'Redeemed ₹50 Off', points: '-250', date: 'Dec 10, 2024', type: 'spent' },
];

export default function RewardsScreen() {
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();

    const styles = createStyles(colors);

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                    <ArrowLeft size={22} color={colors.foreground} />
                </Pressable>
                <Text style={styles.headerTitle}>Rewards & Points</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Points Card */}
                <View style={styles.pointsCard}>
                    <View style={styles.pointsIcon}>
                        <Trophy size={32} color={colors.warning} />
                    </View>
                    <Text style={styles.pointsLabel}>Your Points</Text>
                    <Text style={styles.pointsValue}>2,450</Text>
                    <View style={styles.tierBadge}>
                        <Star size={14} color={colors.warning} fill={colors.warning} />
                        <Text style={styles.tierText}>Gold Member</Text>
                    </View>
                </View>

                {/* Available Rewards */}
                <Text style={styles.sectionTitle}>Available Rewards</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rewardsScroll}>
                    {mockRewards.map((reward) => (
                        <View key={reward.id} style={styles.rewardCard}>
                            <Text style={styles.rewardIcon}>{reward.icon}</Text>
                            <Text style={styles.rewardTitle}>{reward.title}</Text>
                            <View style={styles.rewardPoints}>
                                <Zap size={12} color={colors.primary} />
                                <Text style={styles.rewardPointsText}>{reward.points} pts</Text>
                            </View>
                            <Pressable style={styles.redeemButton}>
                                <Text style={styles.redeemText}>Redeem</Text>
                            </Pressable>
                        </View>
                    ))}
                </ScrollView>

                {/* Points History */}
                <Text style={styles.sectionTitle}>Points History</Text>
                {mockHistory.map((item) => (
                    <View key={item.id} style={styles.historyItem}>
                        <View style={[styles.historyIcon, { backgroundColor: item.type === 'earned' ? colors.success + '20' : colors.destructive + '20' }]}>
                            <Gift size={18} color={item.type === 'earned' ? colors.success : colors.destructive} />
                        </View>
                        <View style={styles.historyInfo}>
                            <Text style={styles.historyTitle}>{item.title}</Text>
                            <Text style={styles.historyDate}>{item.date}</Text>
                        </View>
                        <Text style={[styles.historyPoints, { color: item.type === 'earned' ? colors.success : colors.destructive }]}>
                            {item.points}
                        </Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingHorizontal: 6,
        paddingVertical: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.foreground,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 6,
        paddingVertical: 12,
        paddingBottom: 40,
    },
    pointsCard: {
        backgroundColor: colors.primary,
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        marginBottom: 20,
    },
    pointsIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.white + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    pointsLabel: {
        fontSize: 14,
        color: colors.white,
        opacity: 0.9,
    },
    pointsValue: {
        fontSize: 40,
        fontWeight: '800',
        color: colors.white,
        marginVertical: 4,
    },
    tierBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white + '20',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 6,
    },
    tierText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.white,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.foreground,
        marginBottom: 12,
    },
    rewardsScroll: {
        marginBottom: 20,
        marginHorizontal: -6,
        paddingHorizontal: 6,
    },
    rewardCard: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 14,
        width: 140,
        marginRight: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    rewardIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    rewardTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.foreground,
        textAlign: 'center',
        marginBottom: 6,
    },
    rewardPoints: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 10,
    },
    rewardPointsText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.primary,
    },
    redeemButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 6,
    },
    redeemText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.white,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 10,
        padding: 12,
        marginBottom: 6,
        borderWidth: 1,
        borderColor: colors.border,
    },
    historyIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    historyInfo: {
        flex: 1,
    },
    historyTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.foreground,
    },
    historyDate: {
        fontSize: 12,
        color: colors.mutedForeground,
    },
    historyPoints: {
        fontSize: 16,
        fontWeight: '800',
    },
});