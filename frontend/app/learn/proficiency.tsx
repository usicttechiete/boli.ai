import { useApi } from '@/hooks/use-api';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const SAFFRON = '#E8813C';
const PERIWINKLE = '#8B8FD4';
const OFF_WHITE = '#F7F3EE';
const CREAM = '#FFFAF4';
const DARK = '#1C1218';
const MID = '#6B5F72';

const LEVELS = [
    { id: 'beginner', label: 'Beginner', emoji: '🌱', desc: 'Starting from scratch' },
    { id: 'intermediate', label: 'Intermediate', emoji: '🌿', desc: 'Know some basics' },
    { id: 'advanced', label: 'Advanced', emoji: '🌳', desc: 'Want to master it' },
];

export default function ProficiencySelectionScreen() {
    const { language, sourceLanguage } = useLocalSearchParams<{ language: string; sourceLanguage?: string }>();
    const targetLanguage = language || 'English';
    const sourceLang = sourceLanguage || 'english'; // Default to english
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { apiCall } = useApi();

    const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Debug log
    useEffect(() => {
        console.log('Proficiency screen params:', { language, sourceLanguage, sourceLang });
    }, [language, sourceLanguage, sourceLang]);

    const handleContinue = async () => {
        if (!selectedLevel) return;

        setIsLoading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            // Start learning progress
            const result = await apiCall('/api/learning/start', {
                method: 'POST',
                body: JSON.stringify({
                    language: targetLanguage.toLowerCase(),
                    sourceLanguage: sourceLang.toLowerCase(),
                }),
            });

            if (result.success) {
                router.push({
                    pathname: '/learn/practice',
                    params: { 
                        language: targetLanguage, 
                        level: selectedLevel,
                        sourceLanguage: sourceLang,
                    },
                });
            } else {
                alert(result.error?.message || 'Failed to start learning');
            }
        } catch (error) {
            console.error('Start learning error:', error);
            alert('Failed to start learning. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.root}>
            <View style={styles.bgOrb} />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.scroll,
                    { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 110 },
                ]}
            >
                <Animated.View entering={FadeInDown.delay(60).duration(500)} style={styles.backRow}>
                    <Pressable style={styles.backBtn} onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={22} color={DARK} />
                    </Pressable>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(200).duration(650)} style={styles.header}>
                    <Text style={styles.title}>What's your level?</Text>
                    <Text style={styles.subtitle}>
                        Choose your current proficiency in {targetLanguage}
                    </Text>
                </Animated.View>

                <View style={styles.levelList}>
                    {LEVELS.map((level, i) => (
                        <Animated.View
                            key={level.id}
                            entering={FadeIn.delay(300 + i * 100).duration(500)}
                        >
                            <Pressable
                                style={[
                                    styles.levelCard,
                                    selectedLevel === level.id && styles.levelCardSelected,
                                ]}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setSelectedLevel(level.id);
                                }}
                            >
                                <View style={styles.levelEmoji}>
                                    <Text style={styles.levelEmojiText}>{level.emoji}</Text>
                                </View>
                                <View style={styles.levelText}>
                                    <Text style={styles.levelLabel}>{level.label}</Text>
                                    <Text style={styles.levelDesc}>{level.desc}</Text>
                                </View>
                                <View
                                    style={[
                                        styles.radio,
                                        selectedLevel === level.id && styles.radioSelected,
                                    ]}
                                >
                                    {selectedLevel === level.id && <View style={styles.radioDot} />}
                                </View>
                            </Pressable>
                        </Animated.View>
                    ))}
                </View>
            </ScrollView>

            <Animated.View
                entering={FadeIn.delay(500).duration(500)}
                style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}
            >
                <Pressable
                    style={[
                        styles.continueBtn,
                        { backgroundColor: selectedLevel ? SAFFRON : 'rgba(28,18,24,0.12)' },
                    ]}
                    disabled={!selectedLevel || isLoading}
                    onPress={handleContinue}
                >
                    <Text
                        style={[
                            styles.continueBtnText,
                            { color: selectedLevel ? CREAM : MID },
                        ]}
                    >
                        {isLoading ? 'Starting...' : 'Start Learning →'}
                    </Text>
                </Pressable>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: OFF_WHITE },
    bgOrb: {
        position: 'absolute',
        top: -width * 0.35,
        left: -width * 0.15,
        width: width * 1.1,
        height: width * 0.9,
        borderRadius: width * 0.55,
        backgroundColor: PERIWINKLE,
        opacity: 0.09,
    },
    scroll: { paddingHorizontal: 20 },
    backRow: { marginBottom: 4 },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(28,18,24,0.06)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: { paddingTop: 16, paddingBottom: 32, gap: 8 },
    title: { fontSize: 36, fontWeight: '800', color: DARK, letterSpacing: -1.5 },
    subtitle: { fontSize: 16, color: MID, lineHeight: 22 },
    levelList: { gap: 12 },
    levelCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
        gap: 16,
        borderWidth: 2,
        borderColor: 'rgba(28,18,24,0.08)',
    },
    levelCardSelected: {
        borderColor: SAFFRON,
        backgroundColor: '#FFF0E4',
    },
    levelEmoji: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(232,129,60,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    levelEmojiText: { fontSize: 28 },
    levelText: { flex: 1, gap: 4 },
    levelLabel: { fontSize: 18, fontWeight: '700', color: DARK },
    levelDesc: { fontSize: 14, color: MID },
    radio: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'rgba(28,18,24,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioSelected: { borderColor: SAFFRON },
    radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: SAFFRON },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: CREAM,
        paddingHorizontal: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(28,18,24,0.08)',
    },
    continueBtn: {
        borderRadius: 18,
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    continueBtnText: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
});
