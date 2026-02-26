import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const SAFFRON = '#E8813C';
const PERIWINKLE = '#8B8FD4';
const OFF_WHITE = '#F7F3EE';
const CREAM = '#FFFAF4';
const DARK = '#1C1218';
const MID = '#6B5F72';

type ProficiencyLevel = 'nothing' | 'basics' | 'intermediate';

const LEVELS: { id: ProficiencyLevel; title: string; sub: string; icon: string; color: string }[] = [
    {
        id: 'nothing',
        title: 'Nothing',
        sub: "I'm a complete beginner. Start from zero.",
        icon: '🌱',
        color: '#3DC47B',
    },
    {
        id: 'basics',
        title: 'Basics',
        sub: 'I know some words and common phrases.',
        icon: '🧱',
        color: SAFFRON,
    },
    {
        id: 'intermediate',
        title: 'Intermediate',
        sub: 'I can hold simple conversations.',
        icon: '🏗️',
        color: PERIWINKLE,
    },
];

export default function ProficiencySelectionScreen() {
    const { language } = useLocalSearchParams<{ language: string }>();
    const targetLanguage = language || 'English';
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [selectedLevel, setSelectedLevel] = useState<ProficiencyLevel | null>(null);

    return (
        <View style={styles.root}>
            {/* Soft background decoration */}
            <View style={styles.bgOrb} />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 110 }]}
            >
                {/* Back button */}
                <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.backRow}>
                    <Pressable style={styles.backBtn} onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={22} color={DARK} />
                    </Pressable>
                </Animated.View>

                {/* Header */}
                <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.headerBlock}>
                    <Text style={styles.title}>How much {targetLanguage} do you know?</Text>
                    <Text style={styles.subtitle}>
                        We'll tailor your lessons based on your current level.
                    </Text>
                </Animated.View>

                {/* Level Cards */}
                <View style={styles.list}>
                    {LEVELS.map((level, i) => (
                        <Animated.View key={level.id} entering={FadeInDown.delay(300 + i * 100).duration(500)}>
                            <Pressable
                                style={[
                                    styles.levelCard,
                                    selectedLevel === level.id && {
                                        borderColor: level.color,
                                        backgroundColor: level.color + '08',
                                        borderWidth: 2,
                                    },
                                ]}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setSelectedLevel(level.id);
                                }}
                            >
                                <View style={[styles.iconBox, { backgroundColor: level.color + '15' }]}>
                                    <Text style={styles.iconText}>{level.icon}</Text>
                                </View>
                                <View style={styles.textWrap}>
                                    <View style={styles.labelRow}>
                                        <Text style={styles.levelTitle}>{level.title}</Text>
                                        {selectedLevel === level.id && (
                                            <Ionicons name="checkmark-circle" size={20} color={level.color} />
                                        )}
                                    </View>
                                    <Text style={styles.levelSub}>{level.sub}</Text>
                                </View>
                            </Pressable>
                        </Animated.View>
                    ))}
                </View>

                {/* Footer Tagline */}
                <Animated.View entering={FadeIn.delay(700).duration(500)} style={styles.footerTagline}>
                    <Text style={styles.footerText}>Ready to start your journey? 🚀</Text>
                </Animated.View>
            </ScrollView>

            {/* Continue Button */}
            <Animated.View
                entering={FadeIn.delay(400).duration(500)}
                style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}
            >
                <Pressable
                    style={[
                        styles.continueBtn,
                        { backgroundColor: selectedLevel ? DARK : 'rgba(28,18,24,0.12)' },
                    ]}
                    disabled={!selectedLevel}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        router.push({
                            pathname: '/learn/practice',
                            params: { language: targetLanguage },
                        });
                    }}
                >
                    <Text style={[styles.continueBtnText, { color: selectedLevel ? CREAM : MID }]}>
                        Finish & Start Learning →
                    </Text>
                </Pressable>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: OFF_WHITE },
    bgOrb: {
        position: 'absolute', top: -width * 0.2, right: -width * 0.2,
        width: width * 0.8, height: width * 0.8, borderRadius: width * 0.4,
        backgroundColor: SAFFRON, opacity: 0.05,
    },
    scroll: { paddingHorizontal: 20 },
    backRow: { marginBottom: 16 },
    backBtn: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: 'rgba(28,18,24,0.06)',
        alignItems: 'center', justifyContent: 'center',
    },
    headerBlock: { marginBottom: 32 },
    title: { fontSize: 32, fontWeight: '800', color: DARK, letterSpacing: -1.2, lineHeight: 38 },
    subtitle: { fontSize: 16, color: MID, marginTop: 8, lineHeight: 22 },
    list: { gap: 16 },
    levelCard: {
        flexDirection: 'row', alignItems: 'center',
        padding: 20, borderRadius: 24, backgroundColor: '#FFF',
        borderWidth: 1, borderColor: 'rgba(28,18,24,0.08)',
        gap: 16, boxShadow: '0 4px 12px rgba(28,18,24,0.05)',
    },
    iconBox: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    iconText: { fontSize: 24 },
    textWrap: { flex: 1, gap: 2 },
    labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    levelTitle: { fontSize: 18, fontWeight: '700', color: DARK },
    levelSub: { fontSize: 13, color: MID, lineHeight: 18 },
    footerTagline: { alignItems: 'center', marginTop: 32 },
    footerText: { fontSize: 14, color: MID, fontStyle: 'italic', opacity: 0.7 },
    footer: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#FFFAF4',
        paddingHorizontal: 20, paddingTop: 16,
        borderTopWidth: 1, borderTopColor: 'rgba(28,18,24,0.08)',
    },
    continueBtn: {
        borderRadius: 18, paddingVertical: 18,
        alignItems: 'center', justifyContent: 'center',
    },
    continueBtnText: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
});
