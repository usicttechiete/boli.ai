import { useAuth } from '@/contexts/AuthContext';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
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
  FadeInRight,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// ── Language definitions ───────────────────────────────────────────────────
const ACTIVE_LANGUAGES = [
  {
    id: '1',
    name: 'English',
    code: 'en',
    symbol: 'A',
    subSymbol: 'Aa',
    orbColor: '#8B8FD4',
    orbLight: '#EEEEF9',
    description: 'Global lingua franca',
  },
  {
    id: '2',
    name: 'Hindi',
    code: 'hi',
    symbol: 'नमस्ते',
    subSymbol: 'हिन्दी',
    orbColor: '#E8813C',
    orbLight: '#FFF0E4',
    description: 'भारत की राष्ट्रभाषा',
  },
];

const COMING_SOON = [
  { id: '3', name: 'Tamil', symbol: 'த', native: 'தமிழ்' },
  { id: '4', name: 'Telugu', symbol: 'తె', native: 'తెలుగు' },
  { id: '5', name: 'Punjabi', symbol: 'ਪੰ', native: 'ਪੰਜਾਬੀ' },
  { id: '6', name: 'Gujarati', symbol: 'ઊ', native: 'ગુજરાતી' },
  { id: '7', name: 'Marathi', symbol: 'म', native: 'मराठी' },
  { id: '8', name: 'Kannada', symbol: 'ಕ', native: 'ಕನ್ನಡ' },
];

const MOCK_KNOWN_LANGUAGES = [
  { id: '1', name: 'English', symbol: 'A', fluency: 'Intermediate', score: 68, orbColor: '#8B8FD4', orbLight: '#EEEEF9' },
  { id: '2', name: 'Hindi', symbol: 'नमस्ते', fluency: 'Advanced', score: 92, orbColor: '#E8813C', orbLight: '#FFF0E4' },
];

// ── Design tokens ─────────────────────────────────────────────────────────
const SAFFRON = '#E8813C';
const SAFFRON_LIGHT = '#F5A65B';
const PERIWINKLE = '#8B8FD4';
const OFF_WHITE = '#F7F3EE';
const CREAM = '#FFFAF4';
const DARK = '#1C1218';
const MID = '#6B5F72';

// ── Decorative ornament ────────────────────────────────────────────────────
function OrnamentDivider() {
  return (
    <View style={ornStyle.row}>
      <View style={ornStyle.line} />
      <View style={ornStyle.diamondWrap}>
        <View style={ornStyle.diamond} />
      </View>
      <View style={ornStyle.line} />
    </View>
  );
}
const ornStyle = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(232,129,60,0.2)' },
  diamondWrap: { marginHorizontal: 8 },
  diamond: {
    width: 6,
    height: 6,
    backgroundColor: SAFFRON,
    transform: [{ rotate: '45deg' }],
    opacity: 0.6,
  },
});

// ── Language symbol circle ─────────────────────────────────────────────────
function SymbolOrb({
  symbol,
  orbColor,
  orbLight,
  size = 72,
}: {
  symbol: string;
  orbColor: string;
  orbLight: string;
  size?: number;
}) {
  const isLong = symbol.length > 2;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: orbLight,
        borderWidth: 2,
        borderColor: orbColor + '55',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 4px 16px ${orbColor}30`,
      }}
    >
      {/* Inner ring */}
      <View
        style={{
          position: 'absolute',
          width: size - 10,
          height: size - 10,
          borderRadius: (size - 10) / 2,
          borderWidth: 1,
          borderColor: orbColor + '30',
        }}
      />
      <Text
        style={{
          fontSize: isLong ? size * 0.22 : size * 0.38,
          fontWeight: '800',
          color: orbColor,
          textAlign: 'center',
          letterSpacing: isLong ? -0.5 : 0,
        }}
      >
        {symbol}
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [knownLanguages] = useState(MOCK_KNOWN_LANGUAGES);
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Friend';

  return (
    <View style={styles.root}>
      {/* ── Saffron orb – top background ── */}
      <View style={styles.topOrb} />
      <View style={styles.topOrbMid} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
        ]}
      >
        {/* ─────────────────── HEADER ─────────────────── */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
          <View>
            <Text style={styles.greetingSub}>Namaste 🙏</Text>
            <Text style={styles.greetingTitle}>Hello, {firstName}</Text>
          </View>
          <Pressable
            style={styles.profileBtn}
            onPress={() => router.push('/(tabs)/account' as any)}
          >
            <Text style={styles.profileInitial}>
              {firstName.charAt(0).toUpperCase()}
            </Text>
          </Pressable>
        </Animated.View>

        {/* ─────────────────── KNOWN LANGUAGES ─────────────────── */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Known Languages</Text>
            <Pressable
              style={styles.addPill}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/test' as any);
              }}
            >
              <Text style={styles.addPillText}>+ Add</Text>
            </Pressable>
          </View>

          <OrnamentDivider />

          {knownLanguages.length === 0 ? (
            <Animated.View entering={FadeIn.delay(300).duration(500)} style={styles.emptyCard}>
              <View style={styles.emptyOrbWrap}>
                <SymbolOrb symbol="?" orbColor={PERIWINKLE} orbLight="#EEEEF9" size={64} />
              </View>
              <Text style={styles.emptyTitle}>No baseline yet</Text>
              <Text style={styles.emptyDesc}>
                Test a language to establish your fluency baseline!
              </Text>
              <Pressable
                style={styles.emptyBtn}
                onPress={() => router.push('/test' as any)}
              >
                <Text style={styles.emptyBtnText}>Test a Language →</Text>
              </Pressable>
            </Animated.View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.knownList}
            >
              {knownLanguages.map((lang, i) => (
                <Animated.View
                  key={lang.id}
                  entering={FadeInRight.delay(300 + i * 100).duration(500)}
                >
                  <Pressable
                    style={styles.knownCard}
                    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                  >
                    {/* Orb */}
                    <SymbolOrb
                      symbol={lang.symbol}
                      orbColor={lang.orbColor}
                      orbLight={lang.orbLight}
                      size={68}
                    />
                    <Text style={styles.knownLangName}>{lang.name}</Text>
                    <Text style={styles.knownFluency}>{lang.fluency}</Text>

                    {/* Score badge */}
                    <View style={[styles.scoreBadge, { backgroundColor: lang.orbLight }]}>
                      <Text style={[styles.scoreNum, { color: lang.orbColor }]}>{lang.score}</Text>
                      <Text style={[styles.scoreLabel, { color: lang.orbColor + 'AA' }]}>/100</Text>
                    </View>
                  </Pressable>
                </Animated.View>
              ))}

              {/* Add language card */}
              <Animated.View entering={FadeInRight.delay(500).duration(500)}>
                <Pressable
                  style={styles.addLangCard}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/test' as any);
                  }}
                >
                  <View style={styles.addOrbCircle}>
                    <Text style={styles.addOrbPlus}>+</Text>
                  </View>
                  <Text style={styles.addLangLabel}>Add{'\n'}Language</Text>
                </Pressable>
              </Animated.View>
            </ScrollView>
          )}
        </Animated.View>

        {/* ─────────────────── LEARN SECTION ─────────────────── */}
        <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Learn a Language</Text>
          </View>
          <OrnamentDivider />

          {/* Active — 2 column grid */}
          <View style={styles.learnGrid}>
            {ACTIVE_LANGUAGES.map((lang, i) => (
              <Animated.View
                key={lang.id}
                entering={FadeInDown.delay(500 + i * 80).duration(500)}
                style={styles.learnCardWrap}
              >
                <Pressable
                  style={[styles.learnCard, { backgroundColor: lang.orbLight, borderColor: lang.orbColor + '35' }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push(`/learn/${lang.name.toLowerCase()}` as any);
                  }}
                >
                  {/* Large symbol orb */}
                  <SymbolOrb
                    symbol={lang.symbol}
                    orbColor={lang.orbColor}
                    orbLight={CREAM}
                    size={80}
                  />

                  {/* Bottom subscript in native script */}
                  <Text style={[styles.learnNative, { color: lang.orbColor }]}>{lang.subSymbol}</Text>
                  <Text style={styles.learnName}>{lang.name}</Text>
                  <Text style={styles.learnDesc}>{lang.description}</Text>

                  <View style={[styles.learnCTA, { backgroundColor: lang.orbColor }]}>
                    <Text style={styles.learnCTAText}>Start →</Text>
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </View>

          {/* Coming soon — 3-column compact row */}
          <Text style={styles.comingSoonLabel}>Coming Soon</Text>
          <View style={styles.comingSoonGrid}>
            {COMING_SOON.map((lang, i) => (
              <Animated.View
                key={lang.id}
                entering={FadeIn.delay(700 + i * 60).duration(400)}
                style={styles.comingSoonCard}
              >
                {/* Mini orb */}
                <View style={styles.miniOrb}>
                  <Text style={styles.miniOrbText}>{lang.symbol}</Text>
                </View>
                <Text style={styles.comingSoonName}>{lang.name}</Text>
                <Text style={styles.comingSoonNative}>{lang.native}</Text>
                <View style={styles.soonBadge}>
                  <Text style={styles.soonBadgeText}>Soon</Text>
                </View>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* ─────────────────── FOOTER TAGLINE ─────────────────── */}
        <Animated.View entering={FadeIn.delay(900).duration(600)} style={styles.footerTagline}>
          <Text style={styles.footerText}>Powered by Sarvam AI · Built for India 🇮🇳</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: OFF_WHITE,
  },

  // ── Background orbs ────────────────────────────────────────────────────────
  topOrb: {
    position: 'absolute',
    top: -width * 0.35,
    left: -width * 0.1,
    width: width * 1.2,
    height: width * 0.9,
    borderRadius: width * 0.6,
    backgroundColor: SAFFRON_LIGHT,
    opacity: 0.18,
  },
  topOrbMid: {
    position: 'absolute',
    top: -width * 0.2,
    left: width * 0.1,
    width: width * 0.9,
    height: width * 0.65,
    borderRadius: width * 0.5,
    backgroundColor: SAFFRON,
    opacity: 0.12,
  },

  scrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greetingSub: {
    fontSize: 13,
    color: MID,
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  greetingTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: DARK,
    letterSpacing: -1,
  },
  profileBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: DARK,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(28,18,24,0.18)',
  },
  profileInitial: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFAF4',
  },

  // ── Section ────────────────────────────────────────────────────────────────
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: DARK,
    letterSpacing: -0.5,
  },
  addPill: {
    backgroundColor: DARK,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  addPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFAF4',
  },

  // ── Empty state ────────────────────────────────────────────────────────────
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(139,143,212,0.15)',
    boxShadow: '0 4px 20px rgba(28,18,24,0.06)',
  },
  emptyOrbWrap: {
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK,
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 14,
    color: MID,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },
  emptyBtn: {
    backgroundColor: SAFFRON,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 11,
    boxShadow: '0 4px 12px rgba(232,129,60,0.3)',
  },
  emptyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFAF4',
  },

  // ── Known languages ────────────────────────────────────────────────────────
  knownList: {
    paddingTop: 14,
    paddingBottom: 4,
    gap: 14,
  },
  knownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    alignItems: 'center',
    width: 150,
    boxShadow: '0 4px 18px rgba(28,18,24,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(28,18,24,0.06)',
    gap: 8,
  },
  knownLangName: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK,
    letterSpacing: -0.3,
  },
  knownFluency: {
    fontSize: 12,
    color: MID,
    fontWeight: '500',
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 1,
    marginTop: 2,
  },
  scoreNum: {
    fontSize: 16,
    fontWeight: '800',
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '600',
  },

  addLangCard: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 22,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    width: 130,
    borderWidth: 1.5,
    borderColor: 'rgba(232,129,60,0.3)',
    borderStyle: 'dashed',
    gap: 10,
  },
  addOrbCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(232,129,60,0.1)',
    borderWidth: 1.5,
    borderColor: SAFFRON + '50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addOrbPlus: {
    fontSize: 30,
    color: SAFFRON,
    fontWeight: '300',
  },
  addLangLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: SAFFRON,
    textAlign: 'center',
    lineHeight: 18,
  },

  // ── Learn section ─────────────────────────────────────────────────────────
  learnGrid: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 14,
  },
  learnCardWrap: {
    flex: 1,
  },
  learnCard: {
    borderRadius: 24,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1.5,
    gap: 8,
    boxShadow: '0 4px 18px rgba(28,18,24,0.06)',
  },
  learnNative: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginTop: 4,
  },
  learnName: {
    fontSize: 20,
    fontWeight: '800',
    color: DARK,
    letterSpacing: -0.5,
  },
  learnDesc: {
    fontSize: 11,
    color: MID,
    textAlign: 'center',
  },
  learnCTA: {
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 9,
    marginTop: 4,
  },
  learnCTAText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFAF4',
    letterSpacing: 0.2,
  },

  // ── Coming soon ────────────────────────────────────────────────────────────
  comingSoonLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: MID,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: 20,
    marginBottom: 10,
  },
  comingSoonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  comingSoonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    width: (width - 40 - 30) / 3,
    borderWidth: 1,
    borderColor: 'rgba(28,18,24,0.07)',
    gap: 5,
  },
  miniOrb: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(107,95,114,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniOrbText: {
    fontSize: 18,
    fontWeight: '700',
    color: MID,
  },
  comingSoonName: {
    fontSize: 12,
    fontWeight: '700',
    color: DARK,
    textAlign: 'center',
  },
  comingSoonNative: {
    fontSize: 10,
    color: MID,
    textAlign: 'center',
  },
  soonBadge: {
    backgroundColor: 'rgba(107,95,114,0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  soonBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: MID,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footerTagline: {
    alignItems: 'center',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(107,95,114,0.55)',
    letterSpacing: 0.3,
  },
});
