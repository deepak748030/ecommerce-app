import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, HelpCircle, MessageCircle, Phone, Mail, ChevronDown, ChevronUp, FileText, Shield, ExternalLink } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { router } from 'expo-router';

const faqs = [
    {
        question: 'How do I accept a delivery order?',
        answer: 'When a new order is available, you will receive a notification. Go to the Orders tab and tap "Accept" on the order card. Make sure your KYC is verified to accept orders.',
    },
    {
        question: 'How do I complete a delivery?',
        answer: 'After picking up the order, navigate to the customer location. When you arrive, tap "Mark as Delivered" and enter the OTP provided by the customer to complete the delivery.',
    },
    {
        question: 'When do I receive my earnings?',
        answer: 'Earnings are calculated after each completed delivery. You can view your earnings in the Earnings tab. Withdrawals are processed weekly to your registered bank account.',
    },
    {
        question: 'What if the customer is not available?',
        answer: 'Try calling the customer using the call button. If unreachable, wait for 10 minutes and then contact support for further instructions.',
    },
    {
        question: 'How do I update my vehicle details?',
        answer: 'Vehicle details can only be updated by contacting support. This is to ensure all documents remain verified and accurate.',
    },
    {
        question: 'What documents are required for KYC?',
        answer: 'You need to submit Aadhaar Card, PAN Card, Driving License, and a live selfie. All documents must be clear and valid.',
    },
];

export default function HelpSupportScreen() {
    const { colors } = useTheme();
    const styles = createStyles(colors);
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

    const handleCall = () => {
        Linking.openURL('tel:+911234567890');
    };

    const handleEmail = () => {
        Linking.openURL('mailto:support@bhojandelivery.com');
    };

    const handleWhatsApp = () => {
        Linking.openURL('https://wa.me/911234567890');
    };

    const toggleFaq = (index: number) => {
        setExpandedFaq(expandedFaq === index ? null : index);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={20} color={colors.foreground} />
                </Pressable>
                <Text style={styles.headerTitle}>Help & Support</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Contact Options */}
                <Text style={styles.sectionTitle}>Contact Us</Text>
                <View style={styles.contactCard}>
                    <Pressable style={styles.contactItem} onPress={handleCall}>
                        <View style={[styles.contactIcon, { backgroundColor: '#22c55e20' }]}>
                            <Phone size={20} color="#22c55e" />
                        </View>
                        <View style={styles.contactInfo}>
                            <Text style={styles.contactLabel}>Call Support</Text>
                            <Text style={styles.contactValue}>+91 123 456 7890</Text>
                        </View>
                        <ExternalLink size={16} color={colors.mutedForeground} />
                    </Pressable>
                    <View style={styles.divider} />
                    <Pressable style={styles.contactItem} onPress={handleWhatsApp}>
                        <View style={[styles.contactIcon, { backgroundColor: '#25D36620' }]}>
                            <MessageCircle size={20} color="#25D366" />
                        </View>
                        <View style={styles.contactInfo}>
                            <Text style={styles.contactLabel}>WhatsApp</Text>
                            <Text style={styles.contactValue}>Chat with us</Text>
                        </View>
                        <ExternalLink size={16} color={colors.mutedForeground} />
                    </Pressable>
                    <View style={styles.divider} />
                    <Pressable style={styles.contactItem} onPress={handleEmail}>
                        <View style={[styles.contactIcon, { backgroundColor: colors.primary + '20' }]}>
                            <Mail size={20} color={colors.primary} />
                        </View>
                        <View style={styles.contactInfo}>
                            <Text style={styles.contactLabel}>Email Support</Text>
                            <Text style={styles.contactValue}>support@bhojandelivery.com</Text>
                        </View>
                        <ExternalLink size={16} color={colors.mutedForeground} />
                    </Pressable>
                </View>

                {/* FAQ Section */}
                <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
                <View style={styles.faqCard}>
                    {faqs.map((faq, index) => (
                        <View key={index}>
                            <Pressable style={styles.faqItem} onPress={() => toggleFaq(index)}>
                                <View style={styles.faqQuestion}>
                                    <HelpCircle size={18} color={colors.primary} />
                                    <Text style={styles.faqQuestionText}>{faq.question}</Text>
                                </View>
                                {expandedFaq === index ? (
                                    <ChevronUp size={18} color={colors.mutedForeground} />
                                ) : (
                                    <ChevronDown size={18} color={colors.mutedForeground} />
                                )}
                            </Pressable>
                            {expandedFaq === index && (
                                <View style={styles.faqAnswer}>
                                    <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                                </View>
                            )}
                            {index < faqs.length - 1 && <View style={styles.divider} />}
                        </View>
                    ))}
                </View>

                {/* Legal Links */}
                <Text style={styles.sectionTitle}>Legal</Text>
                <View style={styles.legalCard}>
                    <Pressable style={styles.legalItem} onPress={() => router.push('/terms-of-service' as any)}>
                        <FileText size={18} color={colors.foreground} />
                        <Text style={styles.legalText}>Terms of Service</Text>
                        <ExternalLink size={16} color={colors.mutedForeground} />
                    </Pressable>
                    <View style={styles.divider} />
                    <Pressable style={styles.legalItem} onPress={() => router.push('/privacy-policy' as any)}>
                        <Shield size={18} color={colors.foreground} />
                        <Text style={styles.legalText}>Privacy Policy</Text>
                        <ExternalLink size={16} color={colors.mutedForeground} />
                    </Pressable>
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
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.foreground,
        marginBottom: 12,
        marginTop: 8,
    },
    contactCard: {
        backgroundColor: colors.card,
        borderRadius: 12,
        marginBottom: 16,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
    },
    contactIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    contactInfo: {
        flex: 1,
    },
    contactLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.foreground,
    },
    contactValue: {
        fontSize: 12,
        color: colors.mutedForeground,
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginHorizontal: 16,
    },
    faqCard: {
        backgroundColor: colors.card,
        borderRadius: 12,
        marginBottom: 16,
    },
    faqItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    faqQuestion: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    faqQuestionText: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.foreground,
        flex: 1,
    },
    faqAnswer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 0,
    },
    faqAnswerText: {
        fontSize: 13,
        color: colors.mutedForeground,
        lineHeight: 20,
        marginLeft: 28,
    },
    legalCard: {
        backgroundColor: colors.card,
        borderRadius: 12,
        marginBottom: 16,
    },
    legalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
    },
    legalText: {
        fontSize: 14,
        color: colors.foreground,
        flex: 1,
    },
});
