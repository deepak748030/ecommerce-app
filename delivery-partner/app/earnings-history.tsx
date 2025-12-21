import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { mockEarningsHistory } from '../lib/mockData';
import { router } from 'expo-router';

export default function EarningsHistoryScreen() {
    const { colors, isDark } = useTheme();
    const styles = createStyles(colors, isDark);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={20} color={colors.foreground} />
                </Pressable>
                <Text style={styles.headerTitle}>Earnings History</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {mockEarningsHistory.map((item, index) => (
                    <View key={index} style={styles.historyCard}>
                        <View style={styles.historyLeft}>
                            <Text style={styles.historyDate}>{item.date}</Text>
                            <Text style={styles.historyDeliveries}>{item.deliveries} deliveries completed</Text>
                        </View>
                        <View style={styles.historyRight}>
                            <Text style={styles.historyAmount}>₹{item.amount}</Text>
                            {item.tips > 0 && (
                                <Text style={styles.historyTips}>+₹{item.tips} tips</Text>
                            )}
                        </View>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 12,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.card,
        alignItems: 'center',
        justifyContent: 'center',
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
        paddingBottom: 100,
    },
    historyCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
    },
    historyLeft: {},
    historyDate: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.foreground,
    },
    historyDeliveries: {
        fontSize: 12,
        color: colors.mutedForeground,
        marginTop: 4,
    },
    historyRight: {
        alignItems: 'flex-end',
    },
    historyAmount: {
        fontSize: 17,
        fontWeight: '800',
        color: colors.foreground,
    },
    historyTips: {
        fontSize: 12,
        color: colors.success,
        marginTop: 2,
    },
});
