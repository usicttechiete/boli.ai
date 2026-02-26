import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Mock data for known languages
const MOCK_KNOWN_LANGUAGES = [
    { id: '1', name: 'English', fluency: 'Intermediate', flag: '🇬🇧' },
    { id: '2', name: 'Hindi', fluency: 'Native', flag: '🇮🇳' },
];

export default function LearnSourceSelectionScreen() {
    const { language } = useLocalSearchParams<{ language: string }>();
    // Default to a placeholder if route param is missing
    const targetLanguage = language || 'French';

    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const theme = Colors[isDark ? 'dark' : 'light'];

    // Toggle this to [] to see the empty state
    const [knownLanguages] = useState(MOCK_KNOWN_LANGUAGES);
    const [selectedLanguageId, setSelectedLanguageId] = useState<string | null>(null);

    const handleBack = () => {
        router.back();
    };

    const handleSelectLanguage = (id: string) => {
        setSelectedLanguageId(id);
    };

    const handleGoHome = () => {
        router.push('/');
    };

    const renderEmptyState = () => (
        <View style={[styles.emptyStateContainer, { backgroundColor: isDark ? '#2d3748' : '#f7fafc', borderColor: isDark ? '#4a5568' : '#e2e8f0' }]}>
            <View style={[styles.alertIconBadge, { backgroundColor: '#fee2e2' }]}>
                <Ionicons name="alert-circle" size={32} color="#ef4444" />
            </View>
            <ThemedText style={styles.emptyStateTitle}>No baseline language</ThemedText>
            <ThemedText style={styles.emptyStateDesc}>
                You must establish a baseline language first! We need to know what languages you already speak.
            </ThemedText>
            <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: theme.tint }]}
                onPress={handleGoHome}
            >
                <ThemedText style={styles.primaryButtonText}>Go to Home to Add a Language</ThemedText>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
            {/* 1. Header Area */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                    <Ionicons name="arrow-back" size={24} color={theme.icon} />
                </TouchableOpacity>
                <ThemedText style={styles.headerTitle}>Learn {targetLanguage}</ThemedText>
                <View style={{ width: 40 }} /> {/* Spacer for alignment */}
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* 2. Prompt Area */}
                <View style={styles.promptContainer}>
                    <View style={[styles.iconWrapper, { backgroundColor: theme.tint + '15' }]}>
                        <Ionicons name="git-network-outline" size={36} color={theme.tint} />
                    </View>
                    <ThemedText style={styles.promptTitle}>
                        Which language would you like to use as your base to learn {targetLanguage}?
                    </ThemedText>
                    <ThemedText style={styles.promptSubtitle}>
                        We tailor your course based on your native language structure.
                    </ThemedText>
                </View>

                {/* 3. Source Selection List */}
                <View style={styles.listContainer}>
                    {knownLanguages.length === 0 ? (
                        renderEmptyState()
                    ) : (
                        knownLanguages.map((lang) => {
                            const isSelected = selectedLanguageId === lang.id;
                            return (
                                <TouchableOpacity
                                    key={lang.id}
                                    style={[
                                        styles.languageCard,
                                        {
                                            backgroundColor: isDark ? '#1a202c' : '#ffffff',
                                            borderColor: isSelected ? theme.tint : (isDark ? '#2d3748' : '#e2e8f0'),
                                        },
                                        isSelected && { borderWidth: 2, padding: 15 } // Adjust padding to avoid layout jump
                                    ]}
                                    onPress={() => handleSelectLanguage(lang.id)}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.cardContent}>
                                        <View style={[styles.langIconBadge, { backgroundColor: isDark ? '#2d3748' : '#f8fafc' }]}>
                                            <ThemedText style={styles.flagText}>{lang.flag}</ThemedText>
                                        </View>
                                        <View style={styles.textContainer}>
                                            <ThemedText type="defaultSemiBold" style={styles.languageName}>
                                                {lang.name}
                                            </ThemedText>
                                            <ThemedText style={styles.fluencyText}>
                                                {lang.fluency}
                                            </ThemedText>
                                        </View>
                                    </View>
                                    <View style={[
                                        styles.radioCircle,
                                        { borderColor: isSelected ? theme.tint : (isDark ? '#4a5568' : '#cbd5e0') },
                                        isSelected && { backgroundColor: theme.tint }
                                    ]}>
                                        {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>
            </ScrollView>

            {/* 4. Continue Action */}
            {knownLanguages.length > 0 && (
                <View style={[styles.footer, { borderTopColor: isDark ? '#2d3748' : '#e2e8f0', backgroundColor: theme.background }]}>
                    <TouchableOpacity
                        style={[
                            styles.continueButton,
                            { backgroundColor: selectedLanguageId ? theme.tint : (isDark ? '#4a5568' : '#cbd5e0') }
                        ]}
                        disabled={!selectedLanguageId}
                        onPress={() => router.push('/')}
                    >
                        <ThemedText style={styles.continueButtonText}>Continue</ThemedText>
                        <Ionicons name="arrow-forward" size={20} color={selectedLanguageId ? '#fff' : (isDark ? '#a0aec0' : '#f8fafc')} />
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 40,
    },
    promptContainer: {
        alignItems: 'center',
        marginBottom: 40,
        marginTop: 10,
    },
    iconWrapper: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    promptTitle: {
        fontSize: 26,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 12,
        lineHeight: 34,
    },
    promptSubtitle: {
        fontSize: 16,
        color: '#718096',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 16,
    },
    listContainer: {
        gap: 16,
    },
    languageCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    langIconBadge: {
        width: 52,
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    flagText: {
        fontSize: 28,
    },
    textContainer: {
        flex: 1,
    },
    languageName: {
        fontSize: 18,
        marginBottom: 4,
    },
    fluencyText: {
        fontSize: 14,
        color: '#718096',
    },
    radioCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 16,
    },
    emptyStateContainer: {
        padding: 28,
        borderRadius: 24,
        borderWidth: 1,
        borderStyle: 'dashed',
        alignItems: 'center',
    },
    alertIconBadge: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyStateTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    emptyStateDesc: {
        fontSize: 15,
        color: '#718096',
        textAlign: 'center',
        marginBottom: 28,
        lineHeight: 22,
    },
    primaryButton: {
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 16,
        width: '100%',
        alignItems: 'center',
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        paddingBottom: 32, // Accommodate safe area at bottom if needed
    },
    continueButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 100, // Pill shape
        gap: 8,
    },
    continueButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
