import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { router } from 'expo-router';

export default function TermsOfServiceScreen() {
    const { colors } = useTheme();
    const styles = createStyles(colors);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={20} color={colors.foreground} />
                </Pressable>
                <Text style={styles.headerTitle}>Terms of Service</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.lastUpdated}>Last updated: January 2025</Text>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
                    <Text style={styles.sectionText}>
                        By accessing and using the SwiftDrop Partner application, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by these terms, please do not use this service.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>2. Partner Eligibility</Text>
                    <Text style={styles.sectionText}>
                        To become a delivery partner, you must:{'\n'}
                        • Be at least 18 years of age{'\n'}
                        • Have a valid government-issued ID{'\n'}
                        • Possess a valid driving license{'\n'}
                        • Own or have access to a registered vehicle{'\n'}
                        • Complete the KYC verification process
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>3. Delivery Services</Text>
                    <Text style={styles.sectionText}>
                        As a delivery partner, you agree to:{'\n'}
                        • Deliver orders in a timely and professional manner{'\n'}
                        • Handle all packages with care{'\n'}
                        • Follow all traffic laws and regulations{'\n'}
                        • Maintain accurate delivery status updates{'\n'}
                        • Verify customer identity through OTP when required
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>4. Earnings and Payments</Text>
                    <Text style={styles.sectionText}>
                        • Earnings are calculated based on completed deliveries{'\n'}
                        • Payment rates may vary based on distance, time, and demand{'\n'}
                        • Earnings are processed and paid on a weekly basis{'\n'}
                        • Any disputes must be raised within 7 days of the delivery
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>5. Account Termination</Text>
                    <Text style={styles.sectionText}>
                        SwiftDrop reserves the right to suspend or terminate your account for:{'\n'}
                        • Violation of these terms of service{'\n'}
                        • Fraudulent or illegal activities{'\n'}
                        • Consistent poor delivery performance{'\n'}
                        • Customer complaints or safety concerns
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>6. Limitation of Liability</Text>
                    <Text style={styles.sectionText}>
                        SwiftDrop shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service. Our total liability shall not exceed the amount of earnings in your account.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>7. Changes to Terms</Text>
                    <Text style={styles.sectionText}>
                        We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Your continued use of the service after changes constitutes acceptance of the new terms.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>8. Contact Information</Text>
                    <Text style={styles.sectionText}>
                        For any questions regarding these terms, please contact us at:{'\n'}
                        Email: legal@swiftdrop.com{'\n'}
                        Phone: +91 123 456 7890
                    </Text>
                </View>
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
    lastUpdated: {
        fontSize: 12,
        color: colors.mutedForeground,
        marginBottom: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.foreground,
        marginBottom: 10,
    },
    sectionText: {
        fontSize: 14,
        color: colors.mutedForeground,
        lineHeight: 22,
    },
});
