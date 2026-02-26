import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native';

const SARVAM_LANGUAGES = [
    { id: 'en', name: 'English', native: 'English' },
    { id: 'hi', name: 'Hindi', native: 'हिन्दी' },
    { id: 'bn', name: 'Bengali', native: 'বাংলা' },
    { id: 'mr', name: 'Marathi', native: 'मराठी' },
    { id: 'te', name: 'Telugu', native: 'తెలుగు' },
    { id: 'ta', name: 'Tamil', native: 'தமிழ்' },
    { id: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
    { id: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
    { id: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ' },
    { id: 'ml', name: 'Malayalam', native: 'മലയാളം' },
    { id: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
];

export default function SelectLanguageScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const theme = Colors[isDark ? 'dark' : 'light'];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header Area */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={theme.text} />
                </TouchableOpacity>
                <ThemedText type="subtitle" style={styles.headerTitle}>
                    Select Language
                </ThemedText>
                <View style={styles.headerRight} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.promptContainer}>
                    <View style={[styles.iconBadge, { backgroundColor: theme.tint + '15' }]}>
                        <Ionicons name="language-outline" size={32} color={theme.tint} />
                    </View>
                    <ThemedText style={styles.promptTitle}>What language do you know?</ThemedText>
                    <ThemedText style={styles.promptDesc}>
                        Select a language you are fluent in. We will use it to test your pronunciation and establish a baseline.
                    </ThemedText>
                </View>

                <View style={styles.gridContainer}>
                    {SARVAM_LANGUAGES.map((lang) => (
                        <TouchableOpacity
                            key={lang.id}
                            style={[
                                styles.languageCard,
                                {
                                    backgroundColor: isDark ? '#1a202c' : '#ffffff',
                                    borderColor: isDark ? '#2d3748' : '#e2e8f0',
                                }
                            ]}
                            onPress={() => router.push(`/test/${lang.name.toLowerCase()}` as any)}
                        >
                            <ThemedText style={[styles.nativeName, { color: theme.tint }]}>
                                {lang.native}
                            </ThemedText>
                            <ThemedText style={styles.englishName}>
                                {lang.name}
                            </ThemedText>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
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
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    headerRight: {
        width: 44,
    },
    content: {
        padding: 24,
        paddingBottom: 40,
    },
    promptContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconBadge: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    promptTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    promptDesc: {
        fontSize: 15,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 16,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 16,
    },
    languageCard: {
        width: '47%',
        paddingVertical: 20,
        paddingHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    nativeName: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    englishName: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
    },
});
