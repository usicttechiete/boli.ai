import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React from 'react';
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
    FadeInUp,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const SAFFRON = '#E8813C';
const PERIWINKLE = '#8B8FD4';
const OFF_WHITE = '#F7F3EE';
const CREAM = '#FFFAF4';
const DARK = '#1C1218';
const MID = '#6B5F72';

// ── Language data with circle symbols ────────────────────────────────────
const LANGUAGES = [
    { id: 'en', name: 'English', symbol: 'A', native: 'English', orbColor: '#8B8FD4', orbLight: '#EEEEF9' },
    { id: 'hi', name: 'Hindi', symbol: 'नमस्ते', native: 'हिन्दी', orbColor: '#E8813C', orbLight: '#FFF0E4' },
    { id: 'bn', name: 'Bengali', symbol: 'আ', native: 'বাংলা', orbColor: '#5BB8C4', orbLight: '#E8F7F8' },
    { id: 'mr', name: 'Marathi', symbol: 'म', native: 'मराठी', orbColor: '#C45BB8', orbLight: '#F8E8F7' },
    { id: 'te', name: 'Telugu', symbol: 'తె', native: 'తెలుగు', orbColor: '#5BC45B', orbLight: '#E8F8E8' },
    { id: 'ta', name: 'Tamil', symbol: 'த', native: 'தமிழ்', orbColor: '#C4855B', orbLight: '#F8EDE8' },
    { id: 'gu', name: 'Gujarati', symbol: 'ગ', native: 'ગુજરાતી', orbColor: '#7B5BC4', orbLight: '#EEE8F8' },
    { id: 'kn', name: 'Kannada', symbol: 'ಕ', native: 'ಕನ್ನಡ', orbColor: '#C47B5B', orbLight: '#F8F0E8' },
    { id: 'or', name: 'Odia', symbol: 'ଓ', native: 'ଓଡ଼ିଆ', orbColor: '#5B8BC4', orbLight: '#E8EFF8' },
    { id: 'ml', name: 'Malayalam', symbol: 'ആ', native: 'മലയാളം', orbColor: '#C45B8B', orbLight: '#F8E8EF' },
    { id: 'pa', name: 'Punjabi', symbol: 'ਸਤਿ', native: 'ਪੰਜਾਬੀ', orbColor: '#8BC45B', orbLight: '#EFF8E8' },
];

// ── Symbol circle ─────────────────────────────────────────────────────────
function SymbolOrb({ symbol, orbColor, orbLight, size = 64 }: {
    symbol: string; orbColor: string; orbLight: string; size?: number;
}) {
    const isLong = symbol.length > 2;
    return (
        <View style={{
            width: size, height: size, borderRadius: size / 2,
            backgroundColor: orbLight, borderWidth: 2, borderColor: orbColor + '50',
            alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 4px 14px ${orbColor}28`,
        }}>
            {/* Concentric ring */}
            <View style={{
                position: 'absolute', width: size - 10, height: size - 10,
                borderRadius: (size - 10) / 2, borderWidth: 1, borderColor: orbColor + '28',
            }} />
            <Text style={{
                fontSize: isLong ? size * 0.2 : size * 0.38,
                fontWeight: '800', color: orbColor,
                textAlign: 'center', letterSpacing: isLong ? -0.5 : 0,
            }}>
                {symbol}
            </Text>
        </View>
    );
}

export default function SelectLanguageScreen() {
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.root}>
            {/* Periwinkle top orb */}
            <View style={styles.topOrb} />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }]}
            >
                {/* Back button */}
                <Animated.View entering={FadeInDown.delay(60).duration(500)} style={styles.backRow}>
                    <Pressable style={styles.backBtn} onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={22} color={DARK} />
                    </Pressable>
                </Animated.View>

                {/* Prompt block */}
                <Animated.View entering={FadeInDown.delay(150).duration(650)} style={styles.promptBlock}>
                    {/* Decorative rings */}
                    <View style={styles.decorRings}>
                        {[80, 60, 40].map((s, i) => (
                            <View key={i} style={{
                                position: 'absolute', width: s, height: s,
                                borderRadius: s / 2, borderWidth: 1,
                                borderColor: 'rgba(139,143,212,0.3)',
                            }} />
                        ))}
                        <Text style={styles.decorEmoji}>🗣️</Text>
                    </View>
                    <Text style={styles.promptTitle}>Which language{'\n'}do you know?</Text>
                    <Text style={styles.promptSub}>
                        Select a language you are fluent in.{'\n'}
                        We'll test your pronunciation and set your baseline.
                    </Text>
                </Animated.View>

                {/* Ornamental line */}
                <Animated.View entering={FadeIn.delay(300).duration(500)} style={styles.ornRow}>
                    <View style={styles.ornLine} />
                    <Text style={styles.ornDiamond}>◇</Text>
                    <View style={styles.ornLine} />
                </Animated.View>

                {/* Language grid */}
                <View style={styles.grid}>
                    {LANGUAGES.map((lang, i) => (
                        <Animated.View
                            key={lang.id}
                            entering={FadeInUp.delay(350 + i * 50).duration(450)}
                            style={styles.cardWrap}
                        >
                            <Pressable
                                style={[styles.card, { backgroundColor: lang.orbLight, borderColor: lang.orbColor + '35' }]}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    router.push(`/test/${lang.name.toLowerCase()}` as any);
                                }}
                            >
                                <SymbolOrb
                                    symbol={lang.symbol}
                                    orbColor={lang.orbColor}
                                    orbLight={CREAM}
                                    size={62}
                                />
                                <Text style={[styles.nativeName, { color: lang.orbColor }]} numberOfLines={1}>
                                    {lang.native}
                                </Text>
                                <Text style={styles.englishName} numberOfLines={1}>{lang.name}</Text>
                            </Pressable>
                        </Animated.View>
                    ))}
                </View>

                {/* Footer note */}
                <Animated.View entering={FadeIn.delay(900).duration(500)} style={styles.footer}>
                    <Text style={styles.footerText}>
                        Powered by Sarvam AI · 11 Indian languages
                    </Text>
                </Animated.View>
            </ScrollView>
        </View>
    );
}

const CARD_W = (width - 40 - 14) / 2;

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: OFF_WHITE },

    topOrb: {
        position: 'absolute',
        top: -width * 0.3,
        right: -width * 0.2,
        width: width * 0.8,
        height: width * 0.8,
        borderRadius: width * 0.4,
        backgroundColor: PERIWINKLE,
        opacity: 0.12,
    },

    backRow: { marginBottom: 8 },
    backBtn: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: 'rgba(28,18,24,0.06)',
        alignItems: 'center', justifyContent: 'center',
    },

    scroll: { paddingHorizontal: 20 },

    promptBlock: {
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 24,
        gap: 12,
    },
    decorRings: {
        width: 80, height: 80,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 4,
    },
    decorEmoji: { fontSize: 32 },
    promptTitle: {
        fontSize: 34,
        fontWeight: '800',
        color: DARK,
        letterSpacing: -1.5,
        textAlign: 'center',
        lineHeight: 40,
    },
    promptSub: {
        fontSize: 14,
        color: MID,
        textAlign: 'center',
        lineHeight: 20,
    },

    ornRow: {
        flexDirection: 'row', alignItems: 'center',
        marginBottom: 20, gap: 10,
    },
    ornLine: { flex: 1, height: 1, backgroundColor: 'rgba(232,129,60,0.22)' },
    ornDiamond: { fontSize: 14, color: SAFFRON, opacity: 0.7 },

    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 14,
    },
    cardWrap: { width: CARD_W },
    card: {
        borderRadius: 22,
        padding: 18,
        alignItems: 'center',
        borderWidth: 1.5,
        gap: 8,
        boxShadow: '0 4px 16px rgba(28,18,24,0.06)',
    },
    nativeName: {
        fontSize: 15,
        fontWeight: '800',
        textAlign: 'center',
    },
    englishName: {
        fontSize: 13,
        color: MID,
        fontWeight: '600',
        textAlign: 'center',
    },

    footer: { alignItems: 'center', marginTop: 28 },
    footerText: {
        fontSize: 12,
        color: 'rgba(107,95,114,0.55)',
        letterSpacing: 0.3,
        textAlign: 'center',
    },
});
