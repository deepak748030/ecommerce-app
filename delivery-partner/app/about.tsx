import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Package, Star, Users, Zap } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { router } from 'expo-router';

export default function AboutScreen() {
    const { colors } = useTheme();
    const styles = createStyles(colors);

    const features = [
        { icon: Zap, title: 'Fast Deliveries', description: 'Quick and efficient delivery service' },
        { icon: Star, title: 'Quality Service', description: 'Professional and reliable partners' },
        { icon: Users, title: 'Growing Network', description: '10,000+ delivery partners' },
        { icon: Package, title: 'Safe Handling', description: 'Secure package management' },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={20} color={colors.foreground} />
                </Pressable>
                <Text style={styles.headerTitle}>About</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Logo & Name */}
                <View style={styles.logoContainer}>
                    <View style={styles.logoCircle}>
                        <Package size={40} color={colors.primary} />
                    </View>
                    <Text style={styles.appName}>SwiftDrop Partner</Text>
                    <Text style={styles.tagline}>Deliver with confidence</Text>
                </View>

                {/* Version Info */}
                <View style={styles.versionCard}>
                    <View style={styles.versionRow}>
                        <Text style={styles.versionLabel}>App Version</Text>
                        <Text style={styles.versionValue}>1.0.0</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.versionRow}>
                        <Text style={styles.versionLabel}>Build Number</Text>
                        <Text style={styles.versionValue}>100</Text>
                    </View>
                </View>

                {/* Features */}
                <Text style={styles.sectionTitle}>What We Offer</Text>
                <View style={styles.featuresGrid}>
                    {features.map((feature, index) => (
                        <View key={index} style={styles.featureCard}>
                            <View style={styles.featureIcon}>
                                <feature.icon size={24} color={colors.primary} />
                            </View>
                            <Text style={styles.featureTitle}>{feature.title}</Text>
                            <Text style={styles.featureDesc}>{feature.description}</Text>
                        </View>
                    ))}
                </View>

                {/* Company Info */}
                <View style={styles.companyCard}>
                    <Text style={styles.companyName}>SwiftDrop Technologies Pvt Ltd</Text>
                    <Text style={styles.companyInfo}>
                        SwiftDrop is a leading delivery platform connecting customers with reliable delivery partners. Our mission is to make deliveries fast, safe, and convenient for everyone.
                    </Text>
                </View>

                {/* Links */}
                <View style={styles.linksCard}>
                    <Pressable style={styles.linkItem} onPress={() => Linking.openURL('https://swiftdrop.com')}>
                        <Text style={styles.linkText}>Visit Website</Text>
                    </Pressable>
                    <View style={styles.divider} />
                    <Pressable style={styles.linkItem} onPress={() => Linking.openURL('https://swiftdrop.com/careers')}>
                        <Text style={styles.linkText}>Careers</Text>
                    </Pressable>
                    <View style={styles.divider} />
                    <Pressable style={styles.linkItem} onPress={() => Linking.openURL('https://swiftdrop.com/blog')}>
                        <Text style={styles.linkText}>Blog</Text>
                    </Pressable>
                </View>

                <Text style={styles.copyright}>© 2025 SwiftDrop Technologies. All rights reserved.</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
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
    logoContainer: {
        alignItems: 'center',
        marginBottom: 24,
        paddingTop: 20,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    appName: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.foreground,
        marginBottom: 4,
    },
    tagline: {
        fontSize: 14,
        color: colors.mutedForeground,
    },
    versionCard: {
        backgroundColor: colors.card,
        borderRadius: 12,
        marginBottom: 20,
    },
    versionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
    },
    versionLabel: {
        fontSize: 14,
        color: colors.mutedForeground,
    },
    versionValue: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.foreground,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.foreground,
        marginBottom: 12,
    },
    featuresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 20,
    },
    featureCard: {
        width: '48%',
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    featureIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    featureTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.foreground,
        marginBottom: 4,
        textAlign: 'center',
    },
    featureDesc: {
        fontSize: 12,
        color: colors.mutedForeground,
        textAlign: 'center',
    },
    companyCard: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    companyName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.foreground,
        marginBottom: 8,
    },
    companyInfo: {
        fontSize: 13,
        color: colors.mutedForeground,
        lineHeight: 20,
    },
    linksCard: {
        backgroundColor: colors.card,
        borderRadius: 12,
        marginBottom: 20,
    },
    linkItem: {
        padding: 16,
    },
    linkText: {
        fontSize: 14,
        color: colors.primary,
        fontWeight: '500',
    },
    copyright: {
        fontSize: 12,
        color: colors.mutedForeground,
        textAlign: 'center',
        marginBottom: 20,
    },
});
