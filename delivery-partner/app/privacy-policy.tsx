import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { router } from 'expo-router';

export default function PrivacyPolicyScreen() {
    const { colors } = useTheme();
    const styles = createStyles(colors);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={20} color={colors.foreground} />
                </Pressable>
                <Text style={styles.headerTitle}>Privacy Policy</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.lastUpdated}>Last updated: January 2025</Text>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>1. Information We Collect</Text>
                    <Text style={styles.sectionText}>
                        We collect the following types of information:{'\n'}
                        • Personal Information: Name, phone number, email address{'\n'}
                        • Identity Documents: Aadhaar, PAN, Driving License for KYC{'\n'}
                        • Vehicle Information: Registration number, type, photos{'\n'}
                        • Location Data: Real-time GPS location during deliveries{'\n'}
                        • Device Information: Device ID, operating system, app version
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
                    <Text style={styles.sectionText}>
                        Your information is used to:{'\n'}
                        • Verify your identity and eligibility as a delivery partner{'\n'}
                        • Assign and manage delivery orders{'\n'}
                        • Track deliveries and provide real-time updates to customers{'\n'}
                        • Process payments and earnings{'\n'}
                        • Improve our services and user experience{'\n'}
                        • Communicate important updates and notifications
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>3. Data Sharing</Text>
                    <Text style={styles.sectionText}>
                        We may share your information with:{'\n'}
                        • Customers: Your name and phone number for delivery coordination{'\n'}
                        • Payment Partners: For processing your earnings{'\n'}
                        • Law Enforcement: When required by law or legal process{'\n'}
                        We do not sell your personal information to third parties.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>4. Data Security</Text>
                    <Text style={styles.sectionText}>
                        We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes encryption, secure servers, and access controls.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>5. Location Data</Text>
                    <Text style={styles.sectionText}>
                        We collect location data only when you are online and available for deliveries. You can control location sharing through your device settings. Location data is used to:{'\n'}
                        • Assign nearby delivery orders{'\n'}
                        • Provide navigation assistance{'\n'}
                        • Share delivery status with customers
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>6. Data Retention</Text>
                    <Text style={styles.sectionText}>
                        We retain your personal information for as long as your account is active or as needed to provide you services. You can request deletion of your account and associated data by contacting support.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>7. Your Rights</Text>
                    <Text style={styles.sectionText}>
                        You have the right to:{'\n'}
                        • Access your personal information{'\n'}
                        • Correct inaccurate information{'\n'}
                        • Request deletion of your data{'\n'}
                        • Opt-out of marketing communications{'\n'}
                        • Withdraw consent for data processing
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>8. Contact Us</Text>
                    <Text style={styles.sectionText}>
                        For privacy-related inquiries, please contact:{'\n'}
                        Email: privacy@swiftdrop.com{'\n'}
                        Phone: +91 123 456 7890{'\n'}
                        Address: SwiftDrop Technologies Pvt Ltd
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
