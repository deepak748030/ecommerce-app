import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, FileText, CreditCard, Car, Camera, CheckCircle, Clock, AlertCircle, Shield } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { router } from 'expo-router';
import { deliveryPartnerAuthApi, getPartnerData, PartnerData } from '../lib/api';
import { useFocusEffect } from '@react-navigation/native';

export default function DocumentsScreen() {
    const { colors } = useTheme();
    const styles = createStyles(colors);
    const [partnerData, setPartnerData] = useState<PartnerData | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);

            const localData = await getPartnerData();
            if (localData) setPartnerData(localData);

            const result = await deliveryPartnerAuthApi.getMe();
            if (result.success && result.response) {
                setPartnerData(result.response);
            }
        } catch (error) {
            console.log('Error:', error);
        } finally {
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const getKycStatusInfo = () => {
        const status = partnerData?.kycStatus || 'pending';
        switch (status) {
            case 'approved':
                return { icon: CheckCircle, color: '#22c55e', label: 'Verified', bgColor: '#22c55e20', message: 'All documents verified successfully!' };
            case 'submitted':
                return { icon: Clock, color: '#f59e0b', label: 'Under Review', bgColor: '#f59e0b20', message: 'Your documents are being reviewed. This usually takes 24-48 hours.' };
            case 'rejected':
                return { icon: AlertCircle, color: '#ef4444', label: 'Rejected', bgColor: '#ef444420', message: partnerData?.kycRejectionReason || 'Some documents were rejected. Please re-upload.' };
            default:
                return { icon: Shield, color: colors.mutedForeground, label: 'Pending', bgColor: colors.muted, message: 'Please submit all required documents to start delivering.' };
        }
    };

    const kycInfo = getKycStatusInfo();
    const KycIcon = kycInfo.icon;

    const documents = [
        {
            icon: CreditCard,
            label: 'Aadhaar Card',
            description: 'Government issued identity card',
            uploaded: partnerData?.documents?.aadhaar || false
        },
        {
            icon: FileText,
            label: 'PAN Card',
            description: 'Permanent Account Number card',
            uploaded: partnerData?.documents?.pan || false
        },
        {
            icon: Car,
            label: 'Driving License',
            description: 'Valid driving license',
            uploaded: partnerData?.documents?.license || false
        },
        {
            icon: Camera,
            label: 'Live Selfie',
            description: 'Real-time photo for verification',
            uploaded: partnerData?.documents?.selfie || false
        },
    ];

    const uploadedCount = documents.filter(d => d.uploaded).length;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={20} color={colors.foreground} />
                </Pressable>
                <Text style={styles.headerTitle}>Documents</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => loadData(true)}
                        tintColor={colors.primary}
                    />
                }
            >
                {/* KYC Status Card */}
                <View style={[styles.statusCard, { backgroundColor: kycInfo.bgColor }]}>
                    <View style={styles.statusHeader}>
                        <KycIcon size={24} color={kycInfo.color} />
                        <Text style={[styles.statusLabel, { color: kycInfo.color }]}>{kycInfo.label}</Text>
                    </View>
                    <Text style={styles.statusMessage}>{kycInfo.message}</Text>
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${(uploadedCount / 4) * 100}%`, backgroundColor: kycInfo.color }]} />
                        </View>
                        <Text style={styles.progressText}>{uploadedCount}/4 documents</Text>
                    </View>
                </View>

                {/* Documents List */}
                <Text style={styles.sectionTitle}>Required Documents</Text>
                <View style={styles.documentsCard}>
                    {documents.map((doc, index) => (
                        <View key={index} style={[styles.documentRow, index === documents.length - 1 && { borderBottomWidth: 0 }]}>
                            <View style={styles.documentLeft}>
                                <View style={[styles.docIconContainer, doc.uploaded && { backgroundColor: '#22c55e20' }]}>
                                    <doc.icon size={20} color={doc.uploaded ? '#22c55e' : colors.mutedForeground} />
                                </View>
                                <View style={styles.documentInfo}>
                                    <Text style={styles.documentLabel}>{doc.label}</Text>
                                    <Text style={styles.documentDesc}>{doc.description}</Text>
                                </View>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: doc.uploaded ? '#22c55e20' : colors.muted }]}>
                                {doc.uploaded ? (
                                    <CheckCircle size={16} color="#22c55e" />
                                ) : (
                                    <Clock size={16} color={colors.mutedForeground} />
                                )}
                                <Text style={[styles.statusBadgeText, { color: doc.uploaded ? '#22c55e' : colors.mutedForeground }]}>
                                    {doc.uploaded ? 'Uploaded' : 'Pending'}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Info Note */}
                <View style={styles.noteCard}>
                    <Text style={styles.noteTitle}>Important Information</Text>
                    <Text style={styles.noteText}>• All documents must be clear and readable</Text>
                    <Text style={styles.noteText}>• Documents should be valid and not expired</Text>
                    <Text style={styles.noteText}>• Verification typically takes 24-48 hours</Text>
                    <Text style={styles.noteText}>• Contact support if verification takes longer</Text>
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
    statusCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
    },
    statusHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    statusLabel: {
        fontSize: 18,
        fontWeight: '700',
    },
    statusMessage: {
        fontSize: 14,
        color: colors.foreground,
        lineHeight: 20,
        marginBottom: 16,
    },
    progressContainer: {
        gap: 8,
    },
    progressBar: {
        height: 8,
        backgroundColor: colors.background,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 12,
        color: colors.mutedForeground,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.foreground,
        marginBottom: 12,
    },
    documentsCard: {
        backgroundColor: colors.card,
        borderRadius: 12,
        marginBottom: 16,
    },
    documentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    documentLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    docIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.muted,
        alignItems: 'center',
        justifyContent: 'center',
    },
    documentInfo: {
        flex: 1,
    },
    documentLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.foreground,
        marginBottom: 2,
    },
    documentDesc: {
        fontSize: 12,
        color: colors.mutedForeground,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: '500',
    },
    noteCard: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 16,
    },
    noteTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.foreground,
        marginBottom: 10,
    },
    noteText: {
        fontSize: 12,
        color: colors.mutedForeground,
        lineHeight: 20,
    },
});
