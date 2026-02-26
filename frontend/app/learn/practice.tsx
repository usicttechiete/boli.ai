import { useApi } from '@/hooks/use-api';
import { Ionicons } from '@expo/vector-icons';
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, {
    FadeIn,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
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

interface Word {
    target: string;
    source: string;
    phonetics: string;
    sub: string;
}

interface AnalysisResult {
    accuracy: number;
    feedback: string;
    passed: boolean;
}

export default function LearnPracticeScreen() {
    const { language, level, sourceLanguage } = useLocalSearchParams<{ 
        language: string; 
        level?: string;
        sourceLanguage?: string;
    }>();
    const targetLanguage = language || 'English';
    const sourceLang = sourceLanguage || 'english'; // Default to english instead of hindi
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { apiCall } = useApi();

    const [words, setWords] = useState<Word[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isRevealed, setIsRevealed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [wordsPracticed, setWordsPracticed] = useState(0);
    const [sentencesPracticed, setSentencesPracticed] = useState(0);
    const [isRecordingState, setIsRecordingState] = useState(false);

    const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
    const pulseScale = useSharedValue(1);

    const currentWord = words[currentIndex];
    const progress = words.length > 0 ? ((currentIndex + 1) / words.length) * 100 : 0;
    const isSentence = (currentIndex + 1) % 5 === 0 && currentIndex > 0;

    // Debug log to check source language
    useEffect(() => {
        console.log('Practice screen params:', { language, sourceLanguage, sourceLang });
    }, [language, sourceLanguage, sourceLang]);

    useEffect(() => {
        loadWords();
        setupAudio();
    }, []);

    const setupAudio = async () => {
        try {
            const { granted } = await requestRecordingPermissionsAsync();
            if (!granted) {
                console.warn('Microphone permission not granted');
                return;
            }
            await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        } catch (error) {
            console.error('Audio setup error:', error);
        }
    };

    const loadWords = async () => {
        setIsLoading(true);
        try {
            const result = await apiCall<Word[]>(
                `/api/learning/words?language=${targetLanguage.toLowerCase()}&sourceLanguage=${sourceLang.toLowerCase()}&count=8`,
                { method: 'GET' }
            );

            if (result.success && result.data) {
                setWords(result.data);
            } else {
                Alert.alert('Error', 'Failed to load words');
                // Fallback to dummy data
                setWords([
                    { target: 'Hello', source: 'नमस्ते', phonetics: 'Namaste', sub: 'Common greeting' },
                    { target: 'Thank you', source: 'धन्यवाद', phonetics: 'Dhanyavaad', sub: 'Show gratitude' },
                    { target: 'Yes', source: 'हाँ', phonetics: 'Haan', sub: 'Affirmative' },
                    { target: 'No', source: 'नहीं', phonetics: 'Nahin', sub: 'Negative' },
                    { target: 'Water', source: 'पानी', phonetics: 'Paani', sub: 'Essential liquid' },
                ]);
            }
        } catch (error) {
            console.error('Load words error:', error);
            // Fallback to dummy data
            setWords([
                { target: 'Hello', source: 'नमस्ते', phonetics: 'Namaste', sub: 'Common greeting' },
                { target: 'Thank you', source: 'धन्यवाद', phonetics: 'Dhanyavaad', sub: 'Show gratitude' },
                { target: 'Yes', source: 'हाँ', phonetics: 'Haan', sub: 'Affirmative' },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const startRecording = async () => {
        try {
            const { granted } = await requestRecordingPermissionsAsync();
            if (!granted) {
                Alert.alert('Permission Denied', 'Microphone access is required to record.');
                return;
            }
            
            await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
            await audioRecorder.prepareToRecordAsync();
            audioRecorder.record();
            setIsRecordingState(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            // Start pulse animation
            pulseScale.value = withRepeat(
                withSequence(
                    withTiming(1.2, { duration: 500 }),
                    withTiming(1, { duration: 500 })
                ),
                -1,
                false
            );
        } catch (error) {
            console.error('Start recording error:', error);
            Alert.alert('Error', 'Failed to start recording. Please try again.');
            setIsRecordingState(false);
            pulseScale.value = withTiming(1);
        }
    };

    const stopRecording = async () => {
        if (!isRecordingState) return;

        try {
            await audioRecorder.stop();
            const uri = audioRecorder.uri;
            setIsRecordingState(false);
            pulseScale.value = withTiming(1);

            if (uri) {
                await analyzeRecording(uri);
            }
        } catch (error) {
            console.error('Stop recording error:', error);
            Alert.alert('Error', 'Failed to stop recording');
            setIsRecordingState(false);
            pulseScale.value = withTiming(1);
        }
    };

    const analyzeRecording = async (uri: string) => {
        setIsAnalyzing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        try {
            const formData = new FormData();
            formData.append('audio', {
                uri,
                type: 'audio/m4a',
                name: 'practice.m4a',
            } as any);
            formData.append('language', targetLanguage.toLowerCase());
            formData.append('expectedText', currentWord.target);
            formData.append('type', isSentence ? 'sentence' : 'word');

            const result = await apiCall<AnalysisResult>('/api/learning/analyze-practice', {
                method: 'POST',
                body: formData,
            });

            if (result.success && result.data) {
                setAnalysisResult(result.data);
                Haptics.notificationAsync(
                    result.data.passed
                        ? Haptics.NotificationFeedbackType.Success
                        : Haptics.NotificationFeedbackType.Warning
                );
            } else {
                Alert.alert('Error', 'Failed to analyze recording');
            }
        } catch (error) {
            console.error('Analyze recording error:', error);
            Alert.alert('Error', 'Failed to analyze your pronunciation');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleNext = async () => {
        if (!isRevealed) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsRevealed(true);
        } else if (analysisResult) {
            // Move to next word
            if (isSentence) {
                setSentencesPracticed(prev => prev + 1);
            } else {
                setWordsPracticed(prev => prev + 1);
            }

            if (currentIndex < words.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setIsRevealed(false);
                setAnalysisResult(null);
            } else {
                // Finished all words
                await updateProgress();
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                router.push('/');
            }
        }
    };

    const updateProgress = async () => {
        try {
            await apiCall('/api/learning/practice', {
                method: 'POST',
                body: JSON.stringify({
                    language: targetLanguage.toLowerCase(),
                    sourceLanguage: sourceLang.toLowerCase(),
                    wordsPracticed,
                    sentencesPracticed,
                }),
            });
        } catch (error) {
            console.error('Update progress error:', error);
        }
    };

    const recordButtonStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }],
    }));

    if (isLoading) {
        return (
            <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={SAFFRON} />
                <Text style={styles.loadingText}>Loading practice...</Text>
            </View>
        );
    }

    if (!currentWord) {
        return (
            <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={styles.errorText}>No practice content available</Text>
            </View>
        );
    }

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
                    <Text style={styles.counter}>{currentIndex + 1}/{words.length}</Text>
                </View>
                <Text style={styles.headerTitle}>Learning {targetLanguage} from {sourceLang.charAt(0).toUpperCase() + sourceLang.slice(1)}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <Animated.View key={currentIndex} entering={FadeInUp.duration(600)} style={styles.cardContainer}>
                    <View style={styles.card}>
                        {/* Target Language (L2 - Learning) - SHOWN FIRST */}
                        <View style={styles.sourceSection}>
                            <Text style={styles.sourceLabel}>{targetLanguage.toUpperCase()} (LEARNING)</Text>
                            <Text style={styles.sourceWord}>{currentWord.target}</Text>
                            <Text style={styles.phonetics}>{currentWord.phonetics}</Text>
                        </View>

                        <View style={styles.divider} />

                        {/* Source Language (L1 - Known) - TRANSLATION BELOW */}
                        <View style={styles.targetSection}>
                            <Text style={styles.targetLabel}>{sourceLang.toUpperCase()} (YOUR LANGUAGE)</Text>
                            {isRevealed ? (
                                <Animated.View entering={FadeIn.duration(400)}>
                                    <Text style={[styles.targetWord, { color: SAFFRON }]}>{currentWord.source}</Text>
                                    <Text style={styles.wordSub}>{currentWord.sub}</Text>
                                </Animated.View>
                            ) : (
                                <View style={styles.hiddenBox}>
                                    <Ionicons name="help-circle" size={32} color="rgba(28,18,24,0.15)" />
                                    <Text style={styles.hiddenText}>Tap to reveal meaning</Text>
                                </View>
                            )}
                        </View>

                        {/* Recording Section */}
                        {isRevealed && !analysisResult && (
                            <Animated.View entering={FadeIn.delay(200).duration(400)} style={styles.recordSection}>
                                <Text style={styles.recordPrompt}>Now practice saying it:</Text>
                                <Animated.View style={recordButtonStyle}>
                                    <Pressable
                                        style={[
                                            styles.recordBtn,
                                            isRecordingState && styles.recordBtnActive,
                                        ]}
                                        onPress={isRecordingState ? stopRecording : startRecording}
                                        disabled={isAnalyzing}
                                    >
                                        <Ionicons
                                            name={isRecordingState ? 'stop' : 'mic'}
                                            size={32}
                                            color={isRecordingState ? '#FFF' : SAFFRON}
                                        />
                                    </Pressable>
                                </Animated.View>
                                <Text style={styles.recordHint}>
                                    {isRecordingState ? 'Tap to stop' : 'Tap to record'}
                                </Text>
                            </Animated.View>
                        )}

                        {/* Analysis Result */}
                        {analysisResult && (
                            <Animated.View entering={FadeIn.duration(400)} style={styles.analysisSection}>
                                <View style={[
                                    styles.accuracyBadge,
                                    { backgroundColor: analysisResult.passed ? '#4CAF50' : '#FF9800' }
                                ]}>
                                    <Text style={styles.accuracyText}>{analysisResult.accuracy}% Accurate</Text>
                                </View>
                                <Text style={styles.feedbackText}>{analysisResult.feedback}</Text>
                            </Animated.View>
                        )}
                    </View>
                </Animated.View>

                {/* Stats */}
                <Animated.View entering={FadeIn.delay(400).duration(500)} style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{wordsPracticed}</Text>
                        <Text style={styles.statLabel}>Words</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{sentencesPracticed}</Text>
                        <Text style={styles.statLabel}>Sentences</Text>
                    </View>
                </Animated.View>
            </ScrollView>

            {/* Footer action */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                {isAnalyzing ? (
                    <View style={styles.analyzingBox}>
                        <ActivityIndicator size="small" color={SAFFRON} />
                        <Text style={styles.analyzingText}>Analyzing...</Text>
                    </View>
                ) : (
                    <Pressable
                        style={[
                            styles.actionBtn,
                            { backgroundColor: isRevealed && analysisResult ? DARK : SAFFRON },
                        ]}
                        onPress={handleNext}
                        disabled={isRevealed && !analysisResult}
                    >
                        <Text style={styles.actionBtnText}>
                            {!isRevealed
                                ? 'Reveal Translation'
                                : analysisResult
                                ? currentIndex === words.length - 1
                                    ? 'Finish Lesson'
                                    : 'Next Word →'
                                : 'Record to continue'}
                        </Text>
                    </Pressable>
                )}
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
    sourceWord: { fontSize: 42, fontWeight: '800', color: DARK, textAlign: 'center' },
    phonetics: { fontSize: 18, color: SAFFRON, fontWeight: '600', opacity: 0.8 },

    divider: { height: 1.5, backgroundColor: 'rgba(28,18,24,0.06)', marginVertical: 32, width: '60%', alignSelf: 'center' },

    targetSection: { alignItems: 'center', minHeight: 100, justifyContent: 'center' },
    targetLabel: { fontSize: 11, fontWeight: '800', color: MID, letterSpacing: 1, marginBottom: 12 },
    targetWord: { fontSize: 36, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
    wordSub: { fontSize: 14, color: MID, textAlign: 'center', fontStyle: 'italic' },

    hiddenBox: { alignItems: 'center', gap: 8 },
    hiddenText: { fontSize: 14, color: MID, fontWeight: '500', opacity: 0.5 },

    recordSection: { alignItems: 'center', gap: 12, marginTop: 24, paddingTop: 24, borderTopWidth: 1, borderTopColor: 'rgba(28,18,24,0.06)' },
    recordPrompt: { fontSize: 16, fontWeight: '700', color: DARK },
    recordBtn: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFF0E4',
        borderWidth: 3,
        borderColor: SAFFRON,
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(232,129,60,0.3)',
    },
    recordBtnActive: {
        backgroundColor: '#FF4444',
        borderColor: '#FF4444',
    },
    recordHint: { fontSize: 13, color: MID, fontWeight: '500' },

    analysisSection: { alignItems: 'center', gap: 12, marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(28,18,24,0.06)' },
    accuracyBadge: { borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10 },
    accuracyText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
    feedbackText: { fontSize: 14, color: MID, textAlign: 'center', lineHeight: 20 },

    statsRow: { flexDirection: 'row', gap: 12, marginTop: 20, justifyContent: 'center' },
    statBox: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, alignItems: 'center', minWidth: 100, borderWidth: 1, borderColor: 'rgba(28,18,24,0.08)' },
    statValue: { fontSize: 24, fontWeight: '800', color: SAFFRON },
    statLabel: { fontSize: 12, color: MID, fontWeight: '600', marginTop: 4 },

    footer: { paddingHorizontal: 20, paddingTop: 16, backgroundColor: CREAM, borderTopWidth: 1, borderTopColor: 'rgba(28,18,24,0.08)' },
    actionBtn: { borderRadius: 18, paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
    actionBtnText: { fontSize: 18, fontWeight: '800', color: CREAM, letterSpacing: -0.3 },

    analyzingBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 18 },
    analyzingText: { fontSize: 16, fontWeight: '700', color: SAFFRON },

    loadingText: { fontSize: 16, color: MID, marginTop: 12 },
    errorText: { fontSize: 16, color: MID },
});
