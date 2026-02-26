import { useApi } from '@/hooks/use-api';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const SAFFRON = '#E8813C';
const PERIWINKLE = '#8B8FD4';
const PERIWINKLE_LIGHT = '#EEEEF9';
const OFF_WHITE = '#F7F3EE';
const CREAM = '#FFFAF4';
const DARK = '#1C1218';
const MID = '#6B5F72';

interface KnownLanguage {
    id: string;
    language: string;
    fluency_score: number;
}

// Target language → symbol mapping
const LANGUAGE_META: Record<string, { symbol: string; native: string; orbColor: string; orbLight: string }> = {
    english: { symbol: 'A', native: 'English', orbColor: PERIWINKLE, orbLight: PERIWINKLE_LIGHT },
    hindi: { symbol: 'नमस्ते', native: 'हिन्दी', orbColor: SAFFRON, orbLight: '#FFF0E4' },
    tamil: { symbol: 'த', native: 'தமிழ்', orbColor: '#C4855B', orbLight: '#F8EDE8' },
    punjabi: { symbol: 'ਸਤਿ', native: 'ਪੰਜਾਬੀ', orbColor: '#8BC45B', orbLight: '#EFF8E8' },
    gujarati: { symbol: 'ગ', native: 'ગુજરાતી', orbColor: '#7B5BC4', orbLight: '#EEE8F8' },
    telugu: { symbol: 'తె', native: 'తెలుగు', orbColor: '#5BC45B', orbLight: '#E8F8E8' },
    marathi: { symbol: 'म', native: 'मराठी', orbColor: '#C45BB8', orbLight: '#F8E8F7' },
    kannada: { symbol: 'ಕ', native: 'ಕನ್ನಡ', orbColor: '#C47B5B', orbLight: '#F8F0E8' },
};

function getLanguageMeta(lang: string) {
    return LANGUAGE_META[lang.toLowerCase()] ?? { symbol: '🌐', native: lang, orbColor: PERIWINKLE, orbLight: PERIWINKLE_LIGHT };
}

function getFluencyLabel(score: number) {
    if (score >= 90) return 'Fluent';
    if (score >= 75) return 'Advanced';
    if (score >= 60) return 'Intermediate';
    return 'Beginner';
}

// ── Large decorative symbol orb ────────────────────────────────────────────
function TargetOrb({ symbol, orbColor, orbLight, size = 80 }: {
    symbol: string; orbColor: string; orbLight: string; size?: number;
}) {
    const isLong = symbol.length > 2;
    return (
        <View style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}>
            {[size + 24, size + 10].map((s, i) => (
                <View key={i} style={{
                    position: 'absolute', width: s, height: s, borderRadius: s / 2,
                    borderWidth: 1, borderColor: orbColor + (i === 0 ? '18' : '30'),
                }} />
            ))}
            <View style={{
                width: size, height: size, borderRadius: size / 2,
                backgroundColor: orbLight, borderWidth: 2.5, borderColor: orbColor + '55',
                alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 6px 20px ${orbColor}30`,
            }}>
                <Text style={{ fontSize: isLong ? size * 0.18 : size * 0.36, fontWeight: '800', color: orbColor, textAlign: 'center' }}>
                    {symbol}
                </Text>
            </View>
        </View>
    );
}

// ── Source language row card ────────────────────────────────────────────────
function SourceCard({ lang, selected, onPress }: {
    lang: { id: string; language: string; fluency_score: number; symbol: string; orbColor: string; orbLight: string; fluency: string };
    selected: boolean;
    onPress: () => void;
}) {
    const isLong = lang.symbol.length > 2;
    return (
        <Pressable
            style={[
                scStyles.card,
                {
                    backgroundColor: selected ? lang.orbLight : '#FFF',
                    borderColor: selected ? lang.orbColor + '80' : 'rgba(28,18,24,0.08)',
                    borderWidth: selected ? 2 : 1,
                },
            ]}
            onPress={onPress}
        >
            {/* Symbol orb */}
            <View style={[scStyles.orb, { backgroundColor: selected ? CREAM : lang.orbLight, borderColor: lang.orbColor + '50' }]}>
                <Text style={{ fontSize: isLong ? 13 : 22, fontWeight: '800', color: lang.orbColor, textAlign: 'center' }}>
                    {lang.symbol}
                </Text>
            </View>

            <View style={scStyles.textWrap}>
                <Text style={scStyles.name}>{lang.language.charAt(0).toUpperCase() + lang.language.slice(1)}</Text>
                <Text style={scStyles.fluency}>{lang.fluency}</Text>
            </View>

            {/* Radio indicator */}
            <View style={[scStyles.radio, { borderColor: selected ? lang.orbColor : 'rgba(28,18,24,0.2)' }]}>
                {selected && (
                    <View style={[scStyles.radioDot, { backgroundColor: lang.orbColor }]} />
                )}
            </View>
        </Pressable>
    );
}
const scStyles = StyleSheet.create({
    card: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 20, padding: 16, gap: 14,
        boxShadow: '0 4px 14px rgba(28,18,24,0.06)',
    },
    orb: {
        width: 56, height: 56, borderRadius: 28,
        borderWidth: 2, alignItems: 'center', justifyContent: 'center',
    },
    textWrap: { flex: 1, gap: 3 },
    name: { fontSize: 17, fontWeight: '700', color: DARK },
    fluency: { fontSize: 13, color: MID, fontWeight: '500' },
    radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    radioDot: { width: 10, height: 10, borderRadius: 5 },
});

export default function LearnSourceSelectionScreen() {
    const { language } = useLocalSearchParams<{ language: string }>();
    const targetLanguage = language || 'English';
    const meta = getLanguageMeta(targetLanguage);

    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { apiCall } = useApi();
    
    const [knownLanguages, setKnownLanguages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        loadKnownLanguages();
    }, []);

    const loadKnownLanguages = async () => {
        try {
            const result = await apiCall<KnownLanguage[]>('/api/test/known-languages', {
                method: 'GET',
            });

            if (result.success && result.data) {
                // Map to include metadata
                const mapped = result.data.map(lang => {
                    const langMeta = getLanguageMeta(lang.language);
                    return {
                        ...lang,
                        symbol: langMeta.symbol,
                        orbColor: langMeta.orbColor,
                        orbLight: langMeta.orbLight,
                        fluency: getFluencyLabel(lang.fluency_score),
                    };
                });
                setKnownLanguages(mapped);
            }
        } catch (error) {
            console.error('Load known languages error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const selectedLang = knownLanguages.find(l => l.id === selectedId);

    // Debug log
    useEffect(() => {
        if (selectedLang) {
            console.log('Selected source language:', selectedLang.language);
        }
    }, [selectedLang]);

    if (isLoading) {
        return (
            <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={meta.orbColor} />
            </View>
        );
    }

    return (
        <View style={styles.root}>
            {/* Background orb */}
            <View style={[styles.bgOrb, { backgroundColor: meta.orbColor }]} />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 110 }]}
            >
                {/* Back button row */}
                <Animated.View entering={FadeInDown.delay(60).duration(500)} style={styles.backRow}>
                    <Pressable style={styles.backBtn} onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={22} color={DARK} />
                    </Pressable>
                </Animated.View>

                {/* ── Target language orb ── */}
                <Animated.View entering={FadeInDown.delay(200).duration(650)} style={styles.targetBlock}>
                    <TargetOrb symbol={meta.symbol} orbColor={meta.orbColor} orbLight={meta.orbLight} size={80} />
                    <Text style={styles.targetLabel}>LEARNING</Text>
                    <Text style={styles.targetName}>{targetLanguage}</Text>
                    <Text style={[styles.targetNative, { color: meta.orbColor }]}>{meta.native}</Text>
                </Animated.View>

                {/* Ornamental divider */}
                <Animated.View entering={FadeIn.delay(300).duration(500)} style={styles.ornRow}>
                    <View style={styles.ornLine} />
                    <Text style={[styles.ornGlyph, { color: meta.orbColor }]}>◆</Text>
                    <View style={styles.ornLine} />
                </Animated.View>

                {/* ── Prompt ── */}
                <Animated.View entering={FadeInDown.delay(350).duration(600)} style={styles.promptBlock}>
                    <Text style={styles.promptTitle}>
                        Choose your{'\n'}teaching language
                    </Text>
                    <Text style={styles.promptSub}>
                        We'll teach {targetLanguage} using the language you know best.
                    </Text>
                </Animated.View>

                {/* ── Source list ── */}
                <View style={styles.sourceList}>
                    {knownLanguages.length === 0 ? (
                        <Animated.View entering={FadeIn.delay(400).duration(500)} style={styles.emptyCard}>
                            <Text style={styles.emptyEmoji}>⚠️</Text>
                            <Text style={styles.emptyTitle}>No baseline language</Text>
                            <Text style={styles.emptyDesc}>
                                You must test a language first to establish your baseline.
                            </Text>
                            <Pressable style={styles.emptyBtn} onPress={() => router.push('/')}>
                                <Text style={styles.emptyBtnText}>Go to Home →</Text>
                            </Pressable>
                        </Animated.View>
                    ) : (
                        knownLanguages.map((lang, i) => (
                            <Animated.View key={lang.id} entering={FadeInUp.delay(400 + i * 80).duration(500)}>
                                <SourceCard
                                    lang={lang}
                                    selected={selectedId === lang.id}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setSelectedId(lang.id);
                                    }}
                                />
                            </Animated.View>
                        ))
                    )}
                </View>

                {/* Tagline */}
                <Animated.View entering={FadeIn.delay(700).duration(500)} style={styles.taglineWrap}>
                    <Text style={styles.tagline}>Powered by Sarvam AI · Designed for India 🇮🇳</Text>
                </Animated.View>
            </ScrollView>

            {/* ── Continue button ── */}
            {knownLanguages.length > 0 && (
                <Animated.View
                    entering={FadeIn.delay(500).duration(500)}
                    style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}
                >
                    <Pressable
                        style={[
                            styles.continueBtn,
                            { backgroundColor: selectedId ? (selectedLang?.orbColor ?? meta.orbColor) : 'rgba(28,18,24,0.12)' },
                            selectedId && { boxShadow: `0 6px 20px ${selectedLang?.orbColor ?? meta.orbColor}35` },
                        ]}
                        disabled={!selectedId}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            router.push({
                                pathname: '/learn/proficiency',
                                params: { 
                                    language: targetLanguage,
                                    sourceLanguage: selectedLang?.language || 'hindi',
                                },
                            });
                        }}
                    >
                        <Text style={[styles.continueBtnText, { color: selectedId ? CREAM : MID }]}>
                            Continue →
                        </Text>
                    </Pressable>
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: OFF_WHITE },

    bgOrb: {
        position: 'absolute', top: -width * 0.35, left: -width * 0.15,
        width: width * 1.1, height: width * 0.9, borderRadius: width * 0.55, opacity: 0.09,
    },

    backRow: { marginBottom: 4 },
    backBtn: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: 'rgba(28,18,24,0.06)',
        alignItems: 'center', justifyContent: 'center',
    },

    scroll: { paddingHorizontal: 20 },

    // Target block
    targetBlock: { alignItems: 'center', paddingTop: 16, paddingBottom: 16, gap: 8 },
    targetLabel: { fontSize: 11, fontWeight: '700', color: MID, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 4 },
    targetName: { fontSize: 36, fontWeight: '800', color: DARK, letterSpacing: -1.5 },
    targetNative: { fontSize: 16, fontWeight: '700' },

    ornRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
    ornLine: { flex: 1, height: 1, backgroundColor: 'rgba(232,129,60,0.2)' },
    ornGlyph: { fontSize: 12, opacity: 0.7 },

    // Prompt
    promptBlock: { marginBottom: 24, gap: 8 },
    promptTitle: { fontSize: 30, fontWeight: '800', color: DARK, letterSpacing: -1, lineHeight: 36 },
    promptSub: { fontSize: 14, color: MID, lineHeight: 20 },

    // Source list
    sourceList: { gap: 12, marginBottom: 24 },

    // Empty
    emptyCard: {
        backgroundColor: '#FFF', borderRadius: 24, padding: 28,
        alignItems: 'center', gap: 10,
        borderWidth: 1, borderColor: 'rgba(28,18,24,0.08)',
    },
    emptyEmoji: { fontSize: 36 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: DARK },
    emptyDesc: { fontSize: 14, color: MID, textAlign: 'center', lineHeight: 20 },
    emptyBtn: {
        backgroundColor: SAFFRON, borderRadius: 14,
        paddingHorizontal: 20, paddingVertical: 11, marginTop: 4,
    },
    emptyBtnText: { fontSize: 14, fontWeight: '700', color: CREAM },

    taglineWrap: { alignItems: 'center', marginTop: 8 },
    tagline: { fontSize: 12, color: 'rgba(107,95,114,0.5)', textAlign: 'center', letterSpacing: 0.3 },

    // Footer
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
