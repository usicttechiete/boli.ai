import { AccuracyRing } from '@/components/charts/AccuracyRing';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
const SAFFRON_LIGHT = '#FFF0E4';
const PERIWINKLE = '#8B8FD4';
const PERIWINKLE_LIGHT = '#EEEEF9';
const GREEN = '#3DC47B';
const GREEN_LIGHT = '#E6F9EF';
const OFF_WHITE = '#F7F3EE';
const CREAM = '#FFFAF4';
const DARK = '#1C1218';
const MID = '#6B5F72';

// Mock language lookup
const LANG_META: Record<string, { symbol: string; orbColor: string; orbLight: string }> = {
    english: { symbol: 'A', orbColor: PERIWINKLE, orbLight: PERIWINKLE_LIGHT },
    hindi: { symbol: 'नमस्ते', orbColor: SAFFRON, orbLight: SAFFRON_LIGHT },
    default: { symbol: '🗣️', orbColor: PERIWINKLE, orbLight: PERIWINKLE_LIGHT },
};

function getLangMeta(lang: string) {
    return LANG_META[lang.toLowerCase()] ?? LANG_META['default'];
}

// ── Ornamental header flourish ────────────────────────────────────────────
function CelebrationOrb({ symbol, orbColor, orbLight }: {
    symbol: string; orbColor: string; orbLight: string;
}) {
    return (
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            {/* Outer glow rings */}
            {[100, 84, 70].map((s, i) => (
                <View key={i} style={{
                    position: 'absolute', width: s, height: s, borderRadius: s / 2,
                    borderWidth: 1, borderColor: orbColor + (i === 0 ? '18' : i === 1 ? '28' : '40'),
                }} />
            ))}
            <View style={{
                width: 70, height: 70, borderRadius: 35,
                backgroundColor: orbLight, borderWidth: 2.5, borderColor: orbColor + '60',
                alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 6px 24px ${orbColor}30`,
            }}>
                <Text style={{ fontSize: symbol.length > 2 ? 14 : 28, fontWeight: '800', color: orbColor, textAlign: 'center' }}>
                    {symbol}
                </Text>
            </View>
        </View>
    );
}

// ── Metric card ────────────────────────────────────────────────────────────
function MetricCard({ label, value, unit, badge, badgeColor, badgeBg, icon, accentColor, accentBg }: {
    label: string; value: string | number; unit?: string; badge?: string;
    badgeColor?: string; badgeBg?: string; icon: string;
    accentColor: string; accentBg: string;
}) {
    return (
        <View style={[mcStyles.card, { backgroundColor: '#FFF', borderColor: accentColor + '20' }]}>
            <View style={[mcStyles.iconBox, { backgroundColor: accentBg }]}>
                <Text style={mcStyles.iconText}>{icon}</Text>
            </View>
            <Text style={mcStyles.label}>{label}</Text>
            <Text style={mcStyles.value}>
                {value}
                {unit && <Text style={mcStyles.unit}> {unit}</Text>}
            </Text>
            {badge && (
                <View style={[mcStyles.badge, { backgroundColor: badgeBg }]}>
                    <Text style={[mcStyles.badgeText, { color: badgeColor }]}>{badge}</Text>
                </View>
            )}
        </View>
    );
}
const mcStyles = StyleSheet.create({
    card: {
        flex: 1, borderRadius: 20, padding: 16,
        borderWidth: 1.5, gap: 4,
        boxShadow: '0 4px 16px rgba(28,18,24,0.06)',
    },
    iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    iconText: { fontSize: 20 },
    label: { fontSize: 11, fontWeight: '700', color: MID, letterSpacing: 0.4, textTransform: 'uppercase' },
    value: { fontSize: 22, fontWeight: '800', color: DARK, letterSpacing: -0.5 },
    unit: { fontSize: 13, fontWeight: '600', color: MID },
    badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginTop: 2 },
    badgeText: { fontSize: 11, fontWeight: '700' },
});

export default function AnalysisScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams();
    const language = (params.language as string) || 'English';
    const meta = getLangMeta(language);

    const fluencyScore = parseInt((params.fluency_score as string) || '0', 10);
    const paceWpm = parseInt((params.pace_wpm as string) || '0', 10);
    const dialect = (params.dialect_inferred as string) || 'Undetermined Influence';
    const accentFeedback = (params.accent_feedback as string) || 'Clear, neutral tone. Good job reading the text naturally.';

    const getFluencyText = (score: number) => {
        if (score >= 90) return 'Highly Fluent';
        if (score >= 75) return 'Fluent';
        if (score >= 60) return 'Intermediate';
        return 'Needs Practice';
    };
    const fluencyText = getFluencyText(fluencyScore);
    const getPaceStatus = (wpm: number) => {
        if (wpm < 100) return 'A bit slow';
        if (wpm > 150) return 'Slightly fast';
        return 'Perfect pace';
    };
    const paceStatus = getPaceStatus(paceWpm);

    return (
        <View style={styles.root}>
            {/* Background orb */}
            <View style={[styles.bgOrb, { backgroundColor: meta.orbColor, opacity: 0.1 }]} />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.scroll,
                    { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 110 },
                ]}
            >
                {/* ── Celebration header ── */}
                <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.celebHeader}>
                    <CelebrationOrb symbol={meta.symbol} orbColor={meta.orbColor} orbLight={meta.orbLight} />
                    <View style={styles.sparkleRow}>
                        {['✨', '🎉', '✨'].map((s, i) => (
                            <Text key={i} style={styles.sparkle}>{s}</Text>
                        ))}
                    </View>
                    <Text style={styles.celebTitle}>Analysis Complete!</Text>
                    <Text style={styles.celebSub}>
                        Your {language} proficiency profile has been saved.
                    </Text>
                </Animated.View>

                {/* ── Ornamental divider ── */}
                <Animated.View entering={FadeIn.delay(250).duration(500)} style={styles.ornRow}>
                    <View style={styles.ornLine} />
                    <Text style={[styles.ornDiamond, { color: meta.orbColor }]}>◆</Text>
                    <View style={styles.ornLine} />
                </Animated.View>

                {/* ── Fluency score – full width ── */}
                <Animated.View entering={FadeInUp.delay(300).duration(600).springify()} style={styles.fluencyCard}>
                    <View style={styles.fluencyLeft}>
                        <Text style={styles.flLabel}>OVERALL FLUENCY</Text>
                        <Text style={[styles.flStatus, { color: meta.orbColor }]}>{fluencyText}</Text>
                        <Text style={styles.flDesc}>
                            Your speaking flows naturally with great accuracy.
                        </Text>
                        <View style={[styles.flBadge, { backgroundColor: GREEN_LIGHT }]}>
                            <Text style={[styles.flBadgeText, { color: GREEN }]}>Profile saved ✓</Text>
                        </View>
                    </View>
                    <AccuracyRing score={fluencyScore} tintColor={meta.orbColor} size={110} />
                </Animated.View>

                {/* ── Metric grid ── */}
                <Animated.View entering={FadeInUp.delay(420).duration(600)} style={styles.metricRow}>
                    <MetricCard
                        label="Pace" value={paceWpm} unit="WPM"
                        badge={paceStatus} badgeColor={GREEN} badgeBg={GREEN_LIGHT}
                        icon="💨" accentColor="#3DC47B" accentBg={GREEN_LIGHT}
                    />
                    <MetricCard
                        label="Dialect" value={dialect}
                        icon="🗺️" accentColor={PERIWINKLE} accentBg={PERIWINKLE_LIGHT}
                    />
                </Animated.View>

                {/* ── Accent feedback ── */}
                <Animated.View entering={FadeInUp.delay(540).duration(600)} style={styles.feedbackCard}>
                    <View style={styles.feedbackHeader}>
                        <Text style={styles.feedbackIcon}>💬</Text>
                        <Text style={styles.feedbackTitle}>Accent Feedback</Text>
                    </View>
                    <View style={styles.feedbackQuote}>
                        <Text style={styles.quoteMark}>"</Text>
                        <Text style={styles.feedbackText}>{accentFeedback}</Text>
                    </View>
                </Animated.View>
            </ScrollView>

            {/* ── Sticky footer ── */}
            <Animated.View
                entering={FadeIn.delay(600).duration(500)}
                style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}
            >
                <Pressable
                    style={styles.retestBtn}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push(`/test/${language.toLowerCase()}` as any);
                    }}
                >
                    <Text style={styles.retestText}>↺ Retest</Text>
                </Pressable>
                <Pressable
                    style={[styles.doneBtn, { backgroundColor: meta.orbColor }]}
                    onPress={() => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        router.push('/');
                    }}
                >
                    <Text style={styles.doneBtnText}>Done ✓</Text>
                </Pressable>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: OFF_WHITE },
    bgOrb: {
        position: 'absolute', top: -width * 0.4, right: -width * 0.3,
        width: width * 1.0, height: width * 1.0, borderRadius: width * 0.5,
    },

    scroll: { paddingHorizontal: 20 },

    // Celebration
    celebHeader: { alignItems: 'center', gap: 10, marginBottom: 20, paddingTop: 8 },
    sparkleRow: { flexDirection: 'row', gap: 8 },
    sparkle: { fontSize: 20 },
    celebTitle: {
        fontSize: 32, fontWeight: '800', color: DARK,
        letterSpacing: -1.5, textAlign: 'center',
    },
    celebSub: { fontSize: 15, color: MID, textAlign: 'center', lineHeight: 22 },

    ornRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
    ornLine: { flex: 1, height: 1, backgroundColor: 'rgba(232,129,60,0.2)' },
    ornDiamond: { fontSize: 12, opacity: 0.7 },

    // Fluency card
    fluencyCard: {
        backgroundColor: '#FFF',
        borderRadius: 24, padding: 20,
        flexDirection: 'row', alignItems: 'center',
        gap: 16, marginBottom: 14,
        borderWidth: 1, borderColor: 'rgba(28,18,24,0.07)',
        boxShadow: '0 6px 24px rgba(28,18,24,0.07)',
    },
    fluencyLeft: { flex: 1, gap: 6 },
    flLabel: { fontSize: 11, fontWeight: '700', color: MID, letterSpacing: 0.4, textTransform: 'uppercase' },
    flStatus: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
    flDesc: { fontSize: 13, color: MID, lineHeight: 18 },
    flBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
    flBadgeText: { fontSize: 12, fontWeight: '700' },

    // Metrics
    metricRow: { flexDirection: 'row', gap: 14, marginBottom: 14 },

    // Feedback
    feedbackCard: {
        backgroundColor: '#FFF',
        borderRadius: 24, padding: 20,
        borderWidth: 1, borderColor: 'rgba(28,18,24,0.07)',
        boxShadow: '0 4px 16px rgba(28,18,24,0.05)',
        gap: 10,
    },
    feedbackHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    feedbackIcon: { fontSize: 22 },
    feedbackTitle: { fontSize: 17, fontWeight: '700', color: DARK },
    feedbackQuote: {
        backgroundColor: OFF_WHITE, borderRadius: 16, padding: 16, gap: 4,
        borderLeftWidth: 3, borderLeftColor: SAFFRON + '60',
    },
    quoteMark: { fontSize: 32, color: SAFFRON, opacity: 0.4, marginTop: -8, lineHeight: 32 },
    feedbackText: { fontSize: 15, color: MID, lineHeight: 24, fontStyle: 'italic' },

    // Footer
    footer: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#FFFAF4',
        flexDirection: 'row', gap: 12,
        paddingHorizontal: 20, paddingTop: 16,
        borderTopWidth: 1, borderTopColor: 'rgba(28,18,24,0.08)',
    },
    retestBtn: {
        flex: 1, paddingVertical: 16, borderRadius: 16,
        backgroundColor: 'rgba(28,18,24,0.07)',
        alignItems: 'center', justifyContent: 'center',
    },
    retestText: { fontSize: 16, fontWeight: '700', color: DARK },
    doneBtn: {
        flex: 2, paddingVertical: 16, borderRadius: 16,
        alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(232,129,60,0.3)',
    },
    doneBtnText: { fontSize: 16, fontWeight: '800', color: CREAM },
});
