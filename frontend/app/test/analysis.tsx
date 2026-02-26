import { AccuracyRing } from '@/components/charts/AccuracyRing';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AnalysisScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const theme = Colors[isDark ? 'dark' : 'light'];
    const params = useLocalSearchParams();

    // In real implementation, this would come from global state or API
    const language = (params.language as string) || 'English';

    // Mock data for UI
    const mockData = {
        fluencyScore: 85,
        fluencyText: 'Highly fluent',
        paceWpm: 120,
        paceStatus: 'Perfect pace',
        dialect: 'North Indian Influence',
        accentFeedback: 'Clear pronunciation, strong enunciation on consonants. Excellent natural flow with minimal pauses.'
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* 1. Header Area / Celebration */}
                <View style={styles.header}>
                    <View style={[styles.iconBadge, { backgroundColor: theme.tint + '1a' }]}>
                        <Ionicons name="sparkles" size={40} color={theme.tint} />
                    </View>
                    <ThemedText type="title" style={styles.title}>Analysis Complete!</ThemedText>
                    <ThemedText style={styles.subtitle}>
                        We've saved your proficiency profile for {language}.
                    </ThemedText>
                </View>

                {/* 2. Score Cards (Grid Layout) */}
                <View style={styles.cardsContainer}>
                    {/* Main Score Card - Full Width */}
                    <View style={[styles.card, styles.fullWidthCard, { backgroundColor: isDark ? '#1a202c' : '#ffffff', borderColor: isDark ? '#2d3748' : '#e2e8f0' }]}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="speedometer-outline" size={22} color={theme.tint} />
                            <ThemedText style={styles.cardTitle}>Overall Fluency</ThemedText>
                        </View>
                        <View style={styles.scoreContent}>
                            <AccuracyRing score={mockData.fluencyScore} tintColor={theme.tint} size={110} />
                            <View style={styles.scoreTextContainer}>
                                <ThemedText style={[styles.scoreStatus, { color: theme.tint }]}>{mockData.fluencyText}</ThemedText>
                                <ThemedText style={styles.scoreDesc}>Your speaking flows naturally with great accuracy.</ThemedText>
                            </View>
                        </View>
                    </View>

                    {/* Grid Layout for Other Metrics */}
                    <View style={styles.gridContainer}>
                        {/* Pace Card */}
                        <View style={[styles.card, styles.gridCard, { backgroundColor: isDark ? '#1a202c' : '#ffffff', borderColor: isDark ? '#2d3748' : '#e2e8f0' }]}>
                            <View style={[styles.metricIconBox, { backgroundColor: '#3b82f61a' }]}>
                                <Ionicons name="pulse-outline" size={24} color="#3b82f6" />
                            </View>
                            <ThemedText style={styles.metricValue}>{mockData.paceWpm} <ThemedText style={styles.unitText}>WPM</ThemedText></ThemedText>
                            <ThemedText style={styles.metricLabel}>Pace</ThemedText>
                            <View style={[styles.badge, { backgroundColor: isDark ? '#14532d' : '#dcfce7' }]}>
                                <ThemedText style={[styles.badgeText, { color: isDark ? '#4ade80' : '#166534' }]}>{mockData.paceStatus}</ThemedText>
                            </View>
                        </View>

                        {/* Dialect Card */}
                        <View style={[styles.card, styles.gridCard, { backgroundColor: isDark ? '#1a202c' : '#ffffff', borderColor: isDark ? '#2d3748' : '#e2e8f0' }]}>
                            <View style={[styles.metricIconBox, { backgroundColor: '#8b5cf61a' }]}>
                                <Ionicons name="map-outline" size={24} color="#8b5cf6" />
                            </View>
                            <ThemedText style={styles.metricValueDialect} numberOfLines={2}>{mockData.dialect}</ThemedText>
                            <ThemedText style={styles.metricLabel}>Dialect Inferred</ThemedText>
                        </View>
                    </View>

                    {/* Accent Feedback Card - Full Width */}
                    <View style={[styles.card, styles.fullWidthCard, { backgroundColor: isDark ? '#1a202c' : '#ffffff', borderColor: isDark ? '#2d3748' : '#e2e8f0' }]}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="chatbubbles-outline" size={22} color="#f59e0b" />
                            <ThemedText style={styles.cardTitle}>Accent Feedback</ThemedText>
                        </View>
                        <View style={[styles.feedbackBox, { backgroundColor: isDark ? '#2d3748' : '#f8fafc' }]}>
                            <Ionicons name="document-text" size={24} color={isDark ? '#4a5568' : '#cbd5e0'} style={styles.quoteIcon} />
                            <ThemedText style={[styles.feedbackText, { color: isDark ? '#cbd5e0' : '#4a5568' }]}>{mockData.accentFeedback}</ThemedText>
                        </View>
                    </View>
                </View>

                {/* Spacing for footer */}
                <View style={{ height: 80 }} />
            </ScrollView>

            {/* 3. Action Buttons */}
            <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: isDark ? '#2d3748' : '#e2e8f0' }]}>
                <TouchableOpacity
                    style={[styles.secondaryButton, { borderColor: isDark ? '#4a5568' : '#cbd5e0' }]}
                    onPress={() => router.push(`/test/${language.toLowerCase()}` as any)}
                >
                    <Ionicons name="refresh-outline" size={20} color={isDark ? '#e2e8f0' : '#4a5568'} />
                    <ThemedText style={[styles.secondaryButtonText, { color: isDark ? '#e2e8f0' : '#4a5568' }]}>Retest</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: theme.tint }]}
                    onPress={() => router.push('/')}
                >
                    <ThemedText style={styles.primaryButtonText}>Done</ThemedText>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingVertical: 24,
        paddingHorizontal: 20,
        paddingBottom: 40,
    },

    // Header Area
    header: {
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 10,
    },
    iconBadge: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: '#718096',
        textAlign: 'center',
        paddingHorizontal: 20,
        lineHeight: 22,
    },

    // Cards Container
    cardsContainer: {
        gap: 16,
    },
    card: {
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
    },
    fullWidthCard: {
        width: '100%',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },

    // Scoring Card inside
    scoreContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    scoreTextContainer: {
        flex: 1,
    },
    scoreStatus: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 6,
    },
    scoreDesc: {
        fontSize: 13,
        color: '#718096',
        lineHeight: 20,
    },

    // Grid System
    gridContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 16,
    },
    gridCard: {
        flex: 1,
        alignItems: 'flex-start',
    },
    metricIconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    metricValue: {
        fontSize: 26,
        fontWeight: '800',
        marginBottom: 4,
    },
    unitText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#718096',
    },
    metricValueDialect: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 6,
        minHeight: 46, // Aligns with the other card somewhat
    },
    metricLabel: {
        fontSize: 14,
        color: '#718096',
        marginBottom: 12,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: 'bold',
    },

    // Feedback Box
    feedbackBox: {
        padding: 16,
        borderRadius: 16,
        position: 'relative',
    },
    quoteIcon: {
        position: 'absolute',
        top: -10,
        left: 12,
        opacity: 0.5,
    },
    feedbackText: {
        fontSize: 15,
        lineHeight: 24,
        paddingTop: 8,
        fontStyle: 'italic',
    },

    // Footer Actions
    footer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        gap: 16,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    secondaryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 1,
        gap: 8,
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    primaryButton: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        gap: 8,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
});
