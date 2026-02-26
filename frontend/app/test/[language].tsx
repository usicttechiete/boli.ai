import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { createAudioPlayer, RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
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
    FadeInDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

const SAFFRON = '#E8813C';
const PERIWINKLE = '#8B8FD4';
const OFF_WHITE = '#F7F3EE';
const CREAM = '#FFFAF4';
const DARK = '#1C1218';
const MID = '#6B5F72';

type RecordingState = 'idle' | 'recording' | 'review' | 'processing';

const SAMPLE_PARAGRAPHS: Record<string, string> = {
    english: "The quick brown fox jumps over the lazy dog. This simple sentence contains every letter of the English alphabet. Speaking clearly and at a moderate pace helps others understand you better.",
    hindi: "सभी मनुष्यों को गौरव और अधिकारों के विषय में जन्मजात स्वतन्त्रता और समानता प्राप्त है। उन्हें बुद्धि और अन्तरात्मा की देन प्राप्त है और परस्पर भाईचारे के भाव से बर्ताव करना चाहिए।",
    bengali: "সমস্ত মানুষের মর্যাদা এবং অধিকারের ক্ষেত্রে জন্মগত স্বাধীনতা এবং সমতা রয়েছে। তাদের বুদ্ধি এবং বিবেক আছে এবং একে অপরের সাথে ভ্রাতৃত্বের মনোভাব নিয়ে আচরণ করা উচিত।",
    marathi: "सर्व माणसांना जन्मजातच स्वातंत्र्य आणि पद व अधिकाराच्या बाबतीत समानता प्राप्त झालेली आहे. त्यांना विवेक आणि सदसद्विवेकबुद्धीची देणगी मिळालेली आहे आणि त्यांनी एकमेकांशी बंधुत्वाच्या भावनेने वागले पाहिजे.",
    telugu: "ప్రతి మనిషికి పుట్టుకతోనే స్వేచ్ఛ, హక్కులు మరియు సమానత్వం ఉంటాయి. వారికి వివేకం మరియు అంతరాత్మ ఉంటాయి కాబట్టి వారు ఒకరితో ఒకరు సోదరభావంతో మెలగాలి.",
    tamil: "எல்லா மனிதர்களும் சுதந்திரமாகவே பிறக்கின்றனர்; அத்துடன், அனைவருக்கும் சமமான மதிப்பும் உரிமைகளும் உண்டு. பகுத்தறிவும், மனசாட்சியும் உள்ள அவர்கள், ஒருவருக்கொருவர் சகோதர உணர்வுடன் நடந்துகொள்ள வேண்டும்.",
    gujarati: "બધા મનુષ્યો જન્મથી સ્વતંત્ર છે અને ગૌરવ તથા અધિકારો સમાન છે. તેમને વિચાર કરવાની અને પોતાની રીતે કાર્ય કરવાની સ્વતંત્રતા છે, પરંતુ તેઓએ એકબીજા પ્રત્યે ભાઈચારાની ભાવના રાખવી જોઈએ.",
    kannada: "ಎಲ್ಲಾ ಮಾನವರು ಸ್ವತಂತ್ರರಾಗಿಯೇ ಜನಿಸಿದ್ದಾರೆ. ಅವರಿಗೆ ಘನತೆ ಮತ್ತು ಹಕ್ಕುಗಳಲ್ಲಿ ಸಮಾನತೆ ಇದೆ. ಅವರಲ್ಲಿ ವಿವೇಚನೆ ಮತ್ತು ಅಂತಃಕರಣ ಇರುವದರಿಂದ, ಅವರು ಒಬ್ಬರಿಗೊಬ್ಬರು ಸಹೋದರತೆಯ ಭಾವನೆಯಿಂದ ವರ್ತಿಸಬೇಕು.",
    odia: "ସବୁ ମନୁଷ୍ୟ ଜନ୍ମଗତ ଭାବରେ ସ୍ୱାଧୀନ ଏବଂ ସମ୍ମାନ ତଥା ଅଧିକାରରେ ସମାନ। ସେମାନଙ୍କର ବିଚାର ଶକ୍ତି ଏବଂ ବିବେକ ଅଛି ଏବଂ ସେମାନେ ପରସ୍ପର ପ୍ରତି ଭ୍ରାତୃଭାବରେ ବ୍ୟବହାର କରିବା ଉଚିତ୍।",
    malayalam: "എല്ലാ മനുഷ്യരും സ്വതന്ത്രരായാണ് ജനിക്കുന്നത്. അവർക്ക് തുല്യമായ അവകാശങ്ങളും അന്തസ്സുമുണ്ട്. അവർക്ക് ബുദ്ധിയും മനസ്സാക്ഷിയും ഉണ്ട്, അതിനാൽ അവർ പരസ്പരം സഹോദരങ്ങളെപ്പോലെ പെരുമാറണം.",
    punjabi: "ਸਾਰੇ ਇਨਸਾਨ ਜਨਮ ਤੋਂ ਹੀ ਆਜ਼ਾਦ ਹਨ ਅਤੇ ਉਨ੍ਹਾਂ ਨੂੰ ਬਰਾਬਰ ਦੇ ਹੱਕਾਂ ਅਤੇ ਬਰਾਬਰ ਦੀ ਇੱਜ਼ਤ ਦਾ ਅਧਿਕਾਰ ਹੈ। ਉਨ੍ਹਾਂ ਨੂੰ ਅਕਲ ਅਤੇ ਜ਼ਮੀਰ ਦੀ ਦਾਤ ਮਿਲੀ ਹੋਈ ਹੈ, ਇਸ ਲਈ ਉਨ੍ਹਾਂ ਨੂੰ ਇੱਕ ਦੂਜੇ ਨਾਲ ਭਾਈਚਾਰੇ ਵਾਲਾ ਸਲੂਕ ਕਰਨਾ ਚਾਹੀਦਾ ਹੈ।",
    default: "Please read this sample text aloud to measure your speaking pace, accent clarity, and overall fluency. Try to speak as naturally as you would in a normal conversation."
};

const LANGUAGE_META: Record<string, { symbol: string; orbColor: string; orbLight: string }> = {
    english: { symbol: 'A', orbColor: PERIWINKLE, orbLight: '#EEEEF9' },
    hindi: { symbol: 'नमस्ते', orbColor: SAFFRON, orbLight: '#FFF0E4' },
    bengali: { symbol: 'আ', orbColor: '#5BB8C4', orbLight: '#E8F7F8' },
    marathi: { symbol: 'म', orbColor: '#C45BB8', orbLight: '#F8E8F7' },
    telugu: { symbol: 'తె', orbColor: '#5BC45B', orbLight: '#E8F8E8' },
    tamil: { symbol: 'த', orbColor: '#C4855B', orbLight: '#F8EDE8' },
    gujarati: { symbol: 'ગ', orbColor: '#7B5BC4', orbLight: '#EEE8F8' },
    kannada: { symbol: 'ಕ', orbColor: '#C47B5B', orbLight: '#F8F0E8' },
    odia: { symbol: 'ଓ', orbColor: '#5B8BC4', orbLight: '#E8EFF8' },
    malayalam: { symbol: 'ആ', orbColor: '#C45B8B', orbLight: '#F8E8EF' },
    punjabi: { symbol: 'ਸਤਿ', orbColor: '#8BC45B', orbLight: '#EFF8E8' },
};

function LanguageOrb({ symbol, orbColor, orbLight, size = 80 }: {
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
            }}>
                <Text style={{ fontSize: isLong ? size * 0.18 : size * 0.36, fontWeight: '800', color: orbColor, textAlign: 'center' }}>
                    {symbol}
                </Text>
            </View>
        </View>
    );
}

export default function TestLanguageScreen() {
    const { language } = useLocalSearchParams();
    const langKey = typeof language === 'string' ? language.toLowerCase() : 'english';
    const displayLang = typeof language === 'string'
        ? language.charAt(0).toUpperCase() + language.slice(1)
        : 'English';

    const meta = LANGUAGE_META[langKey] || LANGUAGE_META.english;
    const paragraph = SAMPLE_PARAGRAPHS[langKey] || SAMPLE_PARAGRAPHS.default;

    const insets = useSafeAreaInsets();
    const { getAccessToken } = useAuth();

    const [recordState, setRecordState] = useState<RecordingState>('idle');
    const [timer, setTimer] = useState(0);
    const [recordingUri, setRecordingUri] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // expo-audio hooks
    const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
    const playerRef = useRef<ReturnType<typeof createAudioPlayer> | null>(null);

    // Timer
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (recordState === 'recording') {
            interval = setInterval(() => setTimer((prev) => prev + 1), 1000);
        } else if (recordState === 'idle') {
            setTimer(0);
        }
        return () => clearInterval(interval);
    }, [recordState]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // ── Recording ──────────────────────────────────────────────────────────
    const startRecording = async () => {
        try {
            const { granted } = await requestRecordingPermissionsAsync();
            if (!granted) {
                Alert.alert('Permission Denied', 'Microphone access is required to record.');
                return;
            }
            await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
            await recorder.prepareToRecordAsync();
            recorder.record();
            setRecordState('recording');
        } catch (err) {
            console.error('Failed to start recording', err);
            Alert.alert('Microphone Error', 'Failed to access microphone.');
        }
    };

    const stopRecording = async () => {
        try {
            setRecordState('review');
            await recorder.stop();
            setRecordingUri(recorder.uri);
            await setAudioModeAsync({ allowsRecording: false });
        } catch (err) {
            console.error('Failed to stop recording', err);
        }
    };

    const handleMicPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (recordState === 'idle') {
            startRecording();
        } else if (recordState === 'recording') {
            stopRecording();
        }
    };

    // ── Playback ───────────────────────────────────────────────────────────
    const handlePlayback = async () => {
        if (!recordingUri) return;
        try {
            if (isPlaying && playerRef.current) {
                playerRef.current.pause();
                setIsPlaying(false);
            } else {
                if (!playerRef.current) {
                    playerRef.current = createAudioPlayer({ uri: recordingUri });
                    playerRef.current.addListener('playbackStatusUpdate', (status: any) => {
                        if (status.didJustFinish) setIsPlaying(false);
                    });
                }
                await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
                playerRef.current.play();
                setIsPlaying(true);
            }
        } catch (err) {
            console.error('Playback error', err);
        }
    };

    // ── Re-record ──────────────────────────────────────────────────────────
    const handleRerecord = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (playerRef.current) {
            playerRef.current.pause();
            playerRef.current.release();
            playerRef.current = null;
        }
        setIsPlaying(false);
        setRecordingUri(null);
        setRecordState('idle');
    };

    // ── Submit ─────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!recordingUri) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setRecordState('processing');

        // Simulate a slight delay for the "Analysis" feel
        await new Promise(resolve => setTimeout(resolve, 1500));

        try {
            const token = await getAccessToken();
            // We ignore token requirement for the "Dummy" view if it fails, but we try to be "real"

            const formData = new FormData();
            formData.append('audio', {
                uri: recordingUri,
                name: 'recording.m4a',
                type: 'audio/mp4',
            } as any);
            formData.append('language', langKey);
            formData.append('promptText', paragraph);

            // Attempt real fetch, but provide dummy fallback
            try {
                const response = await fetch(`${API_BASE}/api/test/analyze`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData,
                });

                const json = await response.json();
                if (response.ok && json.success) {
                    const result = json.data;
                    router.replace({
                        pathname: '/test/analysis',
                        params: {
                            language: displayLang,
                            pace_wpm: String(result.pace_wpm),
                            fluency_score: String(result.fluency_score),
                            dialect_inferred: String(result.dialect_inferred),
                            accent_feedback: String(result.accent_feedback),
                        },
                    });
                    return;
                }
            } catch (e) {
                console.warn('API Fetch failed, falling back to dummy data', e);
            }

            // Fallback to Dummy Data for UI demonstration
            router.replace({
                pathname: '/test/analysis',
                params: {
                    language: displayLang,
                    pace_wpm: '128',
                    fluency_score: '85',
                    dialect_inferred: 'Mild regional influence',
                    accent_feedback: 'Clear articulation with natural rhythm. Minor pauses between complex words.',
                },
            });

        } catch (error: any) {
            console.error('Submit error:', error);
            // Even if everything explodes, we still want to show the analysis page for the "Dummy UI" request
            router.replace({
                pathname: '/test/analysis',
                params: {
                    language: displayLang,
                    pace_wpm: '120',
                    fluency_score: '80',
                    dialect_inferred: 'Neutral',
                    accent_feedback: 'Recording processed. Good clarity overall.',
                },
            });
        }
    };

    return (
        <View style={styles.root}>
            <View style={[styles.bgOrb, { backgroundColor: meta.orbColor }]} />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 140 }]}
            >
                {/* Language orb */}
                <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.orbBlock}>
                    <LanguageOrb symbol={meta.symbol} orbColor={meta.orbColor} orbLight={meta.orbLight} size={80} />
                    <Text style={styles.testingLabel}>TESTING</Text>
                    <Text style={styles.languageName}>{displayLang}</Text>
                </Animated.View>

                {/* Ornamental divider */}
                <Animated.View entering={FadeIn.delay(200).duration(500)} style={styles.ornRow}>
                    <View style={styles.ornLine} />
                    <Text style={[styles.ornGlyph, { color: meta.orbColor }]}>◆</Text>
                    <View style={styles.ornLine} />
                </Animated.View>

                {/* Instructions */}
                <Animated.View entering={FadeInDown.delay(250).duration(600)} style={styles.instructionBlock}>
                    <Text style={styles.instructionTitle}>Read aloud</Text>
                    <Text style={styles.instructionSub}>
                        Speak naturally and clearly. We'll measure your pace, accent, and fluency.
                    </Text>
                </Animated.View>

                {/* Paragraph card */}
                <Animated.View
                    entering={FadeIn.delay(350).duration(600)}
                    style={[styles.paragraphCard, { backgroundColor: meta.orbLight, borderColor: meta.orbColor + '30' }]}
                >
                    <Text style={[styles.paragraphText, { color: DARK }]}>{paragraph}</Text>
                </Animated.View>

                {/* Recording status indicator */}
                {recordState === 'recording' && (
                    <Animated.View entering={FadeIn.duration(300)} style={styles.recordingStatus}>
                        <View style={styles.recordingDot} />
                        <Text style={styles.recordingText}>Recording · {formatTime(timer)}</Text>
                    </Animated.View>
                )}

                {/* Review: playback waveform bar + status */}
                {recordState === 'review' && (
                    <Animated.View entering={FadeIn.duration(300)} style={styles.reviewStatusBlock}>
                        <View style={styles.reviewStatusRow}>
                            <Ionicons name="checkmark-circle" size={20} color="#3DC47B" />
                            <Text style={styles.reviewText}>Recording complete · {formatTime(timer)}</Text>
                        </View>

                        {/* Playback bar */}
                        <Pressable
                            style={[styles.playbackBar, { borderColor: isPlaying ? meta.orbColor : 'rgba(28,18,24,0.12)' }]}
                            onPress={handlePlayback}
                        >
                            <View style={[styles.playbackIconBox, { backgroundColor: isPlaying ? meta.orbColor : '#cbd5e0' }]}>
                                <Ionicons name={isPlaying ? 'pause' : 'play'} size={16} color="#fff" />
                            </View>
                            <View style={styles.waveformRow}>
                                {[4, 10, 7, 14, 9, 5, 13, 8, 11, 6, 14, 10, 5, 8, 12].map((h, i) => (
                                    <View
                                        key={i}
                                        style={[styles.waveBar, {
                                            height: h * 1.5,
                                            backgroundColor: isPlaying ? meta.orbColor : '#a0aec0',
                                            opacity: isPlaying ? 0.7 + (i % 3) * 0.1 : 0.5,
                                        }]}
                                    />
                                ))}
                            </View>
                            <Text style={[styles.playbackLabel, { color: isPlaying ? meta.orbColor : MID }]}>
                                {isPlaying ? 'Playing...' : 'Listen'}
                            </Text>
                        </Pressable>
                    </Animated.View>
                )}
            </ScrollView>

            {/* Footer controls */}
            <Animated.View
                entering={FadeIn.delay(400).duration(500)}
                style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}
            >
                {recordState === 'idle' && (
                    <Pressable
                        style={[styles.recordBtn, { backgroundColor: meta.orbColor }]}
                        onPress={handleMicPress}
                    >
                        <Ionicons name="mic" size={28} color={CREAM} />
                        <Text style={styles.recordBtnText}>Start Recording</Text>
                    </Pressable>
                )}

                {recordState === 'recording' && (
                    <Pressable
                        style={styles.stopBtn}
                        onPress={handleMicPress}
                    >
                        <Ionicons name="stop" size={28} color={CREAM} />
                        <Text style={styles.stopBtnText}>Stop Recording</Text>
                    </Pressable>
                )}

                {recordState === 'review' && (
                    <View style={styles.reviewActions}>
                        <Pressable style={styles.rerecordBtn} onPress={handleRerecord}>
                            <Ionicons name="refresh" size={20} color="#ef4444" />
                            <Text style={styles.rerecordText}>Rerecord</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.submitBtn, { backgroundColor: meta.orbColor }]}
                            onPress={handleSubmit}
                        >
                            <Text style={styles.submitBtnText}>Submit →</Text>
                        </Pressable>
                    </View>
                )}
            </Animated.View>

            {/* Processing overlay */}
            {recordState === 'processing' && (
                <View style={styles.processingOverlay}>
                    <View style={styles.processingCard}>
                        <ActivityIndicator size="large" color={meta.orbColor} style={{ marginBottom: 20 }} />
                        <Text style={styles.processingTitle}>Analyzing your speech</Text>
                        <Text style={styles.processingDesc}>Measuring pace, accent, and fluency...</Text>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: OFF_WHITE },

    bgOrb: {
        position: 'absolute', top: -width * 0.35, right: -width * 0.15,
        width: width * 1.1, height: width * 0.9, borderRadius: width * 0.55, opacity: 0.09,
    },

    scroll: { paddingHorizontal: 20 },

    orbBlock: { alignItems: 'center', paddingTop: 16, paddingBottom: 16, gap: 8 },
    testingLabel: { fontSize: 11, fontWeight: '700', color: MID, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 4 },
    languageName: { fontSize: 36, fontWeight: '800', color: DARK, letterSpacing: -1.5 },

    ornRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
    ornLine: { flex: 1, height: 1, backgroundColor: 'rgba(232,129,60,0.2)' },
    ornGlyph: { fontSize: 12, opacity: 0.7 },

    instructionBlock: { marginBottom: 20, gap: 6 },
    instructionTitle: { fontSize: 24, fontWeight: '800', color: DARK, letterSpacing: -0.8 },
    instructionSub: { fontSize: 14, color: MID, lineHeight: 20 },

    paragraphCard: {
        borderRadius: 24, padding: 24, borderWidth: 2,
        minHeight: 200, justifyContent: 'center',
    },
    paragraphText: { fontSize: 17, lineHeight: 28, textAlign: 'center', fontWeight: '500' },

    recordingStatus: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        marginTop: 20, gap: 8,
    },
    recordingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444' },
    recordingText: { fontSize: 14, color: '#ef4444', fontWeight: '600' },

    reviewStatusBlock: { marginTop: 20, gap: 12 },
    reviewStatusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    reviewText: { fontSize: 14, color: '#3DC47B', fontWeight: '600' },

    // Playback bar
    playbackBar: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: CREAM, borderRadius: 16, borderWidth: 1.5,
        paddingHorizontal: 14, paddingVertical: 12, gap: 12,
    },
    playbackIconBox: {
        width: 34, height: 34, borderRadius: 17,
        alignItems: 'center', justifyContent: 'center',
    },
    waveformRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 3 },
    waveBar: { width: 3, borderRadius: 2 },
    playbackLabel: { fontSize: 13, fontWeight: '600' },

    footer: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: CREAM, paddingHorizontal: 20, paddingTop: 16,
        borderTopWidth: 1, borderTopColor: 'rgba(28,18,24,0.08)',
    },

    recordBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        borderRadius: 18, paddingVertical: 18, gap: 10,
    },
    recordBtnText: { fontSize: 18, fontWeight: '800', color: CREAM, letterSpacing: -0.3 },

    stopBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        borderRadius: 18, paddingVertical: 18, gap: 10, backgroundColor: '#ef4444',
    },
    stopBtnText: { fontSize: 18, fontWeight: '800', color: CREAM, letterSpacing: -0.3 },

    reviewActions: { flexDirection: 'row', gap: 12 },
    rerecordBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        borderRadius: 18, paddingVertical: 18, paddingHorizontal: 24,
        backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1.5, borderColor: '#ef4444',
        gap: 8,
    },
    rerecordText: { fontSize: 16, fontWeight: '700', color: '#ef4444' },

    submitBtn: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        borderRadius: 18, paddingVertical: 18,
    },
    submitBtnText: { fontSize: 18, fontWeight: '800', color: CREAM, letterSpacing: -0.3 },

    processingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(247,243,238,0.95)',
        justifyContent: 'center', alignItems: 'center',
        zIndex: 1000,
    },
    processingCard: {
        backgroundColor: '#FFF', borderRadius: 24, padding: 32,
        alignItems: 'center', width: '85%',
        borderWidth: 1, borderColor: 'rgba(28,18,24,0.08)',
    },
    processingTitle: { fontSize: 20, fontWeight: '800', color: DARK, marginBottom: 8, letterSpacing: -0.5 },
    processingDesc: { fontSize: 14, color: MID, textAlign: 'center', lineHeight: 20 },
});
