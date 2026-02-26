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
    FadeInUp
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const SAFFRON = '#E8813C';
const PERIWINKLE = '#8B8FD4';
const OFF_WHITE = '#F7F3EE';
const CREAM = '#FFFAF4';
const DARK = '#1C1218';
const MID = '#6B5F72';
const TAMIL_ORANGE = '#FF9933';

const MOCK_WORDS = [
    { tamil: 'வணக்கம்', phonetics: 'Vaṇakkam', english: 'Hello', sub: 'The most common greeting.' },
    { tamil: 'நன்றி', phonetics: 'Naṉṟi', english: 'Thank you', sub: 'To show gratitude.' },
    { tamil: 'ஆம்', phonetics: 'Ām', english: 'Yes', sub: 'Simple affirmative.' },
    { tamil: 'இல்லை', phonetics: 'Illai', english: 'No', sub: 'Simple negative.' },
    { tamil: 'எப்படி இருக்கிறீர்கள்?', phonetics: 'Eppaṭi irukkiṟīrkaḷ?', english: 'How are you?', sub: 'A friendly inquiry.' },
];

export default function LearnPracticeScreen() {
    const { language } = useLocalSearchParams<{ language: string }>();
    const targetLanguage = language || 'English';
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isRevealed, setIsRevealed] = useState(false);

    const currentWord = MOCK_WORDS[currentIndex];
    const progress = (currentIndex / MOCK_WORDS.length) * 100;

    const handleNext = () => {
        if (!isRevealed) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsRevealed(true);
        } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            if (currentIndex < MOCK_WORDS.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setIsRevealed(false);
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                router.push('/');
            }
        }
    };

    return (
        <View style={styles.root}>
            {/* Soft decorative background */}
            <View style={styles.bgOrb} />

            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <View style={styles.headerTop}>
                    <Pressable style={styles.backBtn} onPress={() => router.back()}>
                        <Ionicons name="close" size={24} color={DARK} />
                    </Pressable>
                    <View style={styles.progressTrack}>
                        <Animated.View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: SAFFRON }]} />
                    </View>
                    <Text style={styles.counter}>{currentIndex + 1}/{MOCK_WORDS.length}</Text>
                </View>
                <Text style={styles.headerTitle}>Learning {targetLanguage} from Tamil</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <Animated.View key={currentIndex} entering={FadeInUp.duration(600)} style={styles.cardContainer}>
                    <View style={styles.card}>
                        {/* Source Language (Tamil) */}
                        <View style={styles.sourceSection}>
                            <Text style={styles.sourceLabel}>TAMIL</Text>
                            <Text style={styles.tamilWord}>{currentWord.tamil}</Text>
                            <Text style={styles.phonetics}>{currentWord.phonetics}</Text>
                        </View>

                        <View style={styles.divider} />

                        {/* Target Language (English) */}
                        <View style={styles.targetSection}>
                            <Text style={styles.targetLabel}>{targetLanguage.toUpperCase()}</Text>
                            {isRevealed ? (
                                <Animated.View entering={FadeIn.duration(400)}>
                                    <Text style={[styles.englishWord, { color: SAFFRON }]}>{currentWord.english}</Text>
                                    <Text style={styles.wordSub}>{currentWord.sub}</Text>
                                </Animated.View>
                            ) : (
                                <View style={styles.hiddenBox}>
                                    <Ionicons name="help-circle" size={32} color="rgba(28,18,24,0.15)" />
                                    <Text style={styles.hiddenText}>Tap to reveal translation</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </Animated.View>
            </ScrollView>

            {/* Footer action */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                <Pressable
                    style={[styles.actionBtn, { backgroundColor: isRevealed ? DARK : SAFFRON }]}
                    onPress={handleNext}
                >
                    <Text style={styles.actionBtnText}>
                        {isRevealed ? (currentIndex === MOCK_WORDS.length - 1 ? 'Finish Lesson' : 'Next Word →') : 'Reveal Translation'}
                    </Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: OFF_WHITE },
    bgOrb: {
        position: 'absolute', bottom: -width * 0.3, left: -width * 0.2,
        width: width * 1.0, height: width * 0.8, borderRadius: width * 0.5,
        backgroundColor: PERIWINKLE, opacity: 0.06,
    },

    header: { paddingHorizontal: 20, paddingBottom: 16, backgroundColor: CREAM, borderBottomWidth: 1, borderBottomColor: 'rgba(28,18,24,0.06)' },
    headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(28,18,24,0.06)', alignItems: 'center', justifyContent: 'center' },
    progressTrack: { flex: 1, height: 8, backgroundColor: 'rgba(28,18,24,0.08)', borderRadius: 4, overflow: 'hidden' },
    progressBar: { height: '100%' },
    counter: { fontSize: 13, fontWeight: '700', color: MID, width: 35, textAlign: 'right' },
    headerTitle: { fontSize: 16, fontWeight: '700', color: MID, letterSpacing: -0.3 },

    scroll: { padding: 20, flexGrow: 1, justifyContent: 'center' },
    cardContainer: { width: '100%', alignItems: 'center' },
    card: {
        width: '100%', backgroundColor: '#FFF', borderRadius: 32, padding: 32,
        borderWidth: 1, borderColor: 'rgba(139,143,212,0.12)',
        boxShadow: '0 12px 32px rgba(28,18,24,0.08)',
    },

    sourceSection: { alignItems: 'center', gap: 8 },
    sourceLabel: { fontSize: 11, fontWeight: '800', color: MID, letterSpacing: 1 },
    tamilWord: { fontSize: 42, fontWeight: '800', color: DARK, textAlign: 'center' },
    phonetics: { fontSize: 18, color: SAFFRON, fontWeight: '600', opacity: 0.8 },

    divider: { height: 1.5, backgroundColor: 'rgba(28,18,24,0.06)', marginVertical: 32, width: '60%', alignSelf: 'center' },

    targetSection: { alignItems: 'center', minHeight: 100, justifyContent: 'center' },
    targetLabel: { fontSize: 11, fontWeight: '800', color: MID, letterSpacing: 1, marginBottom: 12 },
    englishWord: { fontSize: 36, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
    wordSub: { fontSize: 14, color: MID, textAlign: 'center', fontStyle: 'italic' },

    hiddenBox: { alignItems: 'center', gap: 8 },
    hiddenText: { fontSize: 14, color: MID, fontWeight: '500', opacity: 0.5 },

    footer: { paddingHorizontal: 20, paddingTop: 16, backgroundColor: CREAM, borderTopWidth: 1, borderTopColor: 'rgba(28,18,24,0.08)' },
    actionBtn: { borderRadius: 18, paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
    actionBtnText: { fontSize: 18, fontWeight: '800', color: CREAM, letterSpacing: -0.3 },
});
