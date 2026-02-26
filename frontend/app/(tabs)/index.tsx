import { useAuth } from '@/contexts/AuthContext';
import { useApi } from '@/hooks/use-api';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown
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
  {
    id: '3',
    name: 'Tamil',
    code: 'ta',
    symbol: 'த',
    subSymbol: 'தமிழ்',
    orbColor: '#C4855B',
    orbLight: '#F8EDE8',
    description: 'Classical language',
  },
  {
    id: '4',
    name: 'Punjabi',
    code: 'pa',
    symbol: 'ਸਤਿ',
    subSymbol: 'ਪੰਜਾਬੀ',
    orbColor: '#8BC45B',
    orbLight: '#EFF8E8',
    description: 'Language of Punjab',
  },
  {
    id: '5',
    name: 'Gujarati',
    code: 'gu',
    symbol: 'ગ',
    subSymbol: 'ગુજરાતી',
    orbColor: '#7B5BC4',
    orbLight: '#EEE8F8',
    description: 'Language of Gujarat',
  },
  {
    id: '6',
    name: 'Marathi',
    code: 'mr',
    symbol: 'म',
    subSymbol: 'मराठी',
    orbColor: '#C45BB8',
    orbLight: '#F8E8F7',
    description: 'Language of Maharashtra',
  },
  {
    id: '7',
    name: 'Telugu',
    code: 'te',
    symbol: 'తె',
    subSymbol: 'తెలుగు',
    orbColor: '#5BC45B',
    orbLight: '#E8F8E8',
    description: 'Language of Andhra & Telangana',
  },
];

const COMING_SOON = [
  { id: '8', name: 'Kannada', symbol: 'ಕ', native: 'ಕನ್ನಡ' },
  { id: '9', name: 'Bengali', symbol: 'বা', native: 'বাংলা' },
  { id: '10', name: 'Malayalam', symbol: 'മ', native: 'മലയാളം' },
];

const MOCK_KNOWN_LANGUAGES = [
  { id: '1', name: 'Hindi', symbol: 'नमस्ते', fluency: 'Advanced', score: 92, orbColor: '#E8813C', orbLight: '#FFF0E4' },
  { id: '2', name: 'Tamil', symbol: 'த', fluency: 'Fluent', score: 85, orbColor: '#C4855B', orbLight: '#F8EDE8' },
];

interface KnownLanguage {
  id: string;
  language: string;
  fluency_score: number;
  created_at: string;
}

interface LearningProgress {
  id: string;
  language: string;
  words: number;
  sentences: number;
  level: number;
  last_active_at: string;
}

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
  const { apiCall } = useApi();
  const insets = useSafeAreaInsets();
  const [knownLanguages, setKnownLanguages] = useState<KnownLanguage[]>([]);
  const [learningProgress, setLearningProgress] = useState<LearningProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Friend';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Fetch known languages
      const knownResult = await apiCall<KnownLanguage[]>('/api/test/known-languages', {
        method: 'GET',
      });

      if (knownResult.success && knownResult.data) {
        setKnownLanguages(knownResult.data);
      }

      // Fetch all learning progress
      // For now, we'll check each active language
      const progressPromises = ACTIVE_LANGUAGES.map(lang =>
        apiCall<LearningProgress>(`/api/learning/progress/${lang.name.toLowerCase()}`, {
          method: 'GET',
        })
      );

      const progressResults = await Promise.all(progressPromises);
      const validProgress = progressResults
        .filter(r => r.success && r.data)
        .map(r => r.data!);
      
      setLearningProgress(validProgress);
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const getLanguageMeta = (langName: string) => {
    const lang = ACTIVE_LANGUAGES.find(l => l.name.toLowerCase() === langName.toLowerCase());
    return lang || { symbol: '🌐', orbColor: PERIWINKLE, orbLight: '#EEEEF9' };
  };

  const getFluencyLabel = (score: number) => {
    if (score >= 90) return 'Fluent';
    if (score >= 75) return 'Advanced';
    if (score >= 60) return 'Intermediate';
    return 'Beginner';
  };

  if (isLoading) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={SAFFRON} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* ── Saffron orb – top background ── */}
      <View style={styles.topOrb} />
      <View style={styles.topOrbMid} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={SAFFRON} />
        }
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
            <View style={styles.knownGrid}>
              {knownLanguages.map((lang, i) => {
                const meta = getLanguageMeta(lang.language);
                return (
                  <Animated.View
                    key={lang.id}
                    entering={FadeInDown.delay(300 + i * 80).duration(500)}
                    style={styles.knownCardWrap}
                  >
                    <Pressable
                      style={styles.knownCard}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push({
                          pathname: '/test/analysis',
                          params: {
                            language: lang.language,
                            pace_wpm: '124',
                            fluency_score: String(lang.fluency_score),
                            dialect_inferred: 'Standard regional influence',
                            accent_feedback: 'Consistently clear articulation.',
                          },
                        });
                      }}
                    >
                      <SymbolOrb
                        symbol={meta.symbol}
                        orbColor={meta.orbColor}
                        orbLight={meta.orbLight}
                        size={64}
                      />
                      <Text style={styles.knownLangName}>
                        {lang.language.charAt(0).toUpperCase() + lang.language.slice(1)}
                      </Text>
                      <Text style={styles.knownFluency}>
                        {getFluencyLabel(lang.fluency_score)}
                      </Text>
                    </Pressable>
                  </Animated.View>
                );
              })}

              {/* Add language card */}
              <Animated.View
                entering={FadeInDown.delay(300 + knownLanguages.length * 80).duration(500)}
                style={styles.knownCardWrap}
              >
                <Pressable
                  style={styles.addKnownCard}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/test' as any);
                  }}
                >
                  <View style={styles.addKnownOrb}>
                    <Text style={styles.addKnownPlus}>+</Text>
                  </View>
                  <Text style={styles.addKnownText}>Add Your</Text>
                  <Text style={styles.addKnownText}>Language</Text>
                </Pressable>
              </Animated.View>
            </View>
          )}
        </Animated.View>

        {/* ─────────────────── LEARN SECTION ─────────────────── */}
        <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Learn a Language</Text>
          </View>
          <OrnamentDivider />

          {/* Active languages - Filtered to exclude known ones */}
          <View style={styles.learnGrid}>
            {ACTIVE_LANGUAGES.filter(
              lang => !knownLanguages.some(kl => kl.language.toLowerCase() === lang.name.toLowerCase())
            ).map((lang, i) => {
              const progress = learningProgress.find(p => p.language === lang.name.toLowerCase());
              const isContinue = !!progress;

              return (
                <Animated.View
                  key={lang.id}
                  entering={FadeInDown.delay(500 + i * 80).duration(500)}
                  style={styles.learnCardWrap}
                >
                  <Pressable
                    style={styles.learnCard}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      if (isContinue) {
                        router.push({
                          pathname: '/learn/practice',
                          params: { language: lang.name },
                        });
                      } else {
                        router.push(`/learn/${lang.name.toLowerCase()}` as any);
                      }
                    }}
                  >
                    {/* Symbol orb */}
                    <SymbolOrb
                      symbol={lang.symbol}
                      orbColor={lang.orbColor}
                      orbLight={lang.orbLight}
                      size={56}
                    />
                    <Text style={[styles.learnNative, { color: lang.orbColor }]}>{lang.subSymbol}</Text>
                    <Text style={styles.learnName}>{lang.name}</Text>
                    {isContinue && progress && (
                      <View style={styles.progressInfo}>
                        <Text style={styles.progressText}>Level {progress.level}</Text>
                        <Text style={styles.progressSubtext}>{progress.words} words</Text>
                      </View>
                    )}
                    <View style={[styles.startBadge, { backgroundColor: isContinue ? '#4CAF50' : lang.orbColor }]}>
                      <Text style={styles.startBadgeText}>{isContinue ? 'Continue' : 'Start'}</Text>
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
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
  knownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 14,
  },
  knownCardWrap: {
    width: (width - 40 - 32) / 3,
  },
  knownCard: {
    alignItems: 'center',
    gap: 8,
  },
  knownLangName: {
    fontSize: 14,
    fontWeight: '700',
    color: DARK,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  knownFluency: {
    fontSize: 12,
    color: MID,
    fontWeight: '500',
    textAlign: 'center',
  },

  addKnownCard: {
    alignItems: 'center',
    gap: 6,
  },
  addKnownOrb: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(232,129,60,0.12)',
    borderWidth: 2,
    borderColor: SAFFRON + '40',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addKnownPlus: {
    fontSize: 28,
    color: SAFFRON,
    fontWeight: '300',
  },
  addKnownText: {
    fontSize: 12,
    fontWeight: '600',
    color: SAFFRON,
    textAlign: 'center',
    lineHeight: 16,
  },

  // ── Learn section ─────────────────────────────────────────────────────────
  learnGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  learnCardWrap: {
    width: (width - 40 - 30) / 3,
  },
  learnCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(28,18,24,0.07)',
    gap: 6,
    boxShadow: '0 2px 12px rgba(28,18,24,0.04)',
  },
  learnNative: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginTop: 2,
  },
  learnName: {
    fontSize: 13,
    fontWeight: '700',
    color: DARK,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  startBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 2,
  },
  startBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFAF4',
    letterSpacing: 0.2,
  },

  progressInfo: {
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
    color: DARK,
  },
  progressSubtext: {
    fontSize: 10,
    color: MID,
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
