import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { createAudioPlayer, RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

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
    punjabi: "ਸਾਰੇ ਇਨਸਾਨ ਜਨਮ ਤੋਂ ਹੀ ਆਜ਼ਾਦ ਹਨ ਅਤੇ ਉਨ੍ਹਾਂ ਨੂੰ ਬਰਾਬਰ ਦੇ ਹੱਕਾਂ ਅਤੇ ਬਰਾਬਰ ਦੀ ਇੱਜ਼ਤ ਦਾ ਅਧਿਕਾਰ ਹੈ। ਉਨ੍ਹਾਂ ਨੂੰ ਅਕਲ ਅਤੇ ਜ਼ਮੀਰ ਦੀ ਦਾਤ ਮਿਲੀ ਹੋਈ ਹੈ, ਇਸ ਲਈ ਉਨ੍ਹਾਂ ਨੂੰ ਇੱਕ ਦੂਜੇ ਨਾਲ ਭਾਈਚਾਰੇ ਵਾਲਾ ਸਲੂਕ ਕਰਨਾ ਚਾਹੀਦਾ ਹੈ।",
    default: "Please read this sample text aloud to measure your speaking pace, accent clarity, and overall fluency. Try to speak as naturally as you would in a normal conversation."
};

export default function TestLanguageScreen() {
    const { language } = useLocalSearchParams();
    const langKey = typeof language === 'string' ? language.toLowerCase() : 'english';
    const displayLang = typeof language === 'string'
        ? language.charAt(0).toUpperCase() + language.slice(1)
        : 'English';

    const paragraph = SAMPLE_PARAGRAPHS[langKey] || SAMPLE_PARAGRAPHS.default;

    const [recordState, setRecordState] = useState<RecordingState>('idle');
    const [timer, setTimer] = useState(0);
    const [recordingUri, setRecordingUri] = useState<string | null>(null);
    const { getAccessToken } = useAuth();

    // expo-audio recorder hook (auto-lifecycle managed)
    const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
    const playerRef = useRef<ReturnType<typeof createAudioPlayer> | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const theme = Colors[isDark ? 'dark' : 'light'];

    // Timer effect
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (recordState === 'recording') {
            interval = setInterval(() => {
                setTimer((prev) => prev + 1);
            }, 1000);
        } else if (recordState === 'idle') {
            setTimer(0);
        }
        return () => clearInterval(interval);
    }, [recordState]);

    // Cleanup on unmount is handled automatically by useAudioRecorder

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

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
        if (recordState === 'idle') {
            startRecording();
        } else if (recordState === 'recording') {
            stopRecording();
        }
    };

    const handleRerecord = () => {
        // Stop any playing audio
        if (playerRef.current) {
            playerRef.current.pause();
            playerRef.current.release();
            playerRef.current = null;
        }
        setIsPlaying(false);
        setRecordingUri(null);
        setRecordState('idle');
    };

    const handlePlayback = async () => {
        if (!recordingUri) return;
        try {
            if (isPlaying && playerRef.current) {
                playerRef.current.pause();
                setIsPlaying(false);
            } else {
                // Create a fresh player each time (or reuse)
                if (!playerRef.current) {
                    playerRef.current = createAudioPlayer({ uri: recordingUri });
                    // When playback finishes, reset state
                    playerRef.current.addListener('playbackStatusUpdate', (status: any) => {
                        if (status.didJustFinish) {
                            setIsPlaying(false);
                        }
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

    const handleSubmit = async () => {
        if (!recordingUri) return;
        setRecordState('processing');

        try {
            const token = await getAccessToken();
            if (!token) throw new Error('Not authenticated');

            const formData = new FormData();

            // Append the audio file
            // Note: React Native FormData requires { uri, name, type } for files
            formData.append('audio', {
                uri: recordingUri,
                name: `recording.m4a`, // iOS defaults to m4a for high quality
                type: 'audio/mp4',
            } as any);

            // Append fields required by backend
            formData.append('language', langKey);
            formData.append('promptText', paragraph);

            const response = await fetch(`${API_BASE}/api/test/analyze`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    // Note: Ensure Content-Type is NOT manually set so boundary gets injected automatically
                },
                body: formData,
            });

            const json = await response.json();

            if (!response.ok || !json.success) {
                throw new Error(json.error?.message || 'Failed to analyze recording');
            }

            // Route to analysis passing the real data
            const result = json.data;
            router.replace({
                pathname: '/test/analysis',
                params: {
                    language: displayLang,
                    pace_wpm: String(result.pace_wpm),
                    fluency_score: String(result.fluency_score),
                    dialect_inferred: String(result.dialect_inferred),
                    accent_feedback: String(result.accent_feedback)
                }
            });

        } catch (error: any) {
            console.error('Submit error:', error);
            Alert.alert('Analysis Failed', error.message || 'Something went wrong.');
            setRecordState('review');
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            {/* 1. Header Area */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={theme.text} />
                </TouchableOpacity>
                <ThemedText type="subtitle" style={styles.headerTitle}>
                    Test your {displayLang}
                </ThemedText>
                <View style={styles.headerRight} />
            </View>

            {/* Main Content */}
            <ScrollView contentContainerStyle={styles.content}>

                {/* 2. Instructions & Paragraph Card */}
                <View style={styles.instructionsContainer}>
                    <View style={[styles.iconBadge, { backgroundColor: theme.tint + '15' }]}>
                        <Ionicons name="mic-outline" size={24} color={theme.tint} />
                    </View>
                    <ThemedText style={styles.instructionText}>
                        Please read the paragraph below aloud. Speak naturally!
                    </ThemedText>
                </View>

                <View style={[styles.paragraphCard, {
                    backgroundColor: isDark ? '#1a202c' : '#f8fafc',
                    borderColor: isDark ? '#2d3748' : '#e2e8f0'
                }]}>
                    <Ionicons name="document-text" size={24} color={isDark ? '#4a5568' : '#cbd5e0'} style={styles.quoteIcon} />
                    <ThemedText style={[styles.paragraphText, { color: isDark ? '#e2e8f0' : '#1e293b' }]}>
                        {paragraph}
                    </ThemedText>
                </View>

            </ScrollView>

            {/* 3. Recording Controls */}
            <View style={[styles.footer, {
                backgroundColor: isDark ? '#1a202c' : '#ffffff',
                borderTopColor: isDark ? '#2d3748' : '#e2e8f0'
            }]}>

                {recordState === 'idle' && (
                    <View style={styles.controlCenter}>
                        <ThemedText style={styles.helperText}>Tap to Start</ThemedText>
                        <TouchableOpacity
                            style={[styles.recordButton, { backgroundColor: theme.tint }]}
                            onPress={handleMicPress}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="mic" size={36} color="#fff" />
                        </TouchableOpacity>
                    </View>
                )}

                {recordState === 'recording' && (
                    <View style={styles.controlCenter}>
                        <View style={styles.timerContainer}>
                            <View style={[styles.recordingDot, { backgroundColor: '#ef4444' }]} />
                            <ThemedText type="subtitle" style={styles.timerText}>{formatTime(timer)}</ThemedText>
                        </View>
                        <TouchableOpacity
                            style={[styles.stopButton, { backgroundColor: '#ef4444' }]}
                            onPress={handleMicPress}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="square" size={24} color="#fff" />
                        </TouchableOpacity>
                        <ThemedText style={[styles.helperText, { marginTop: 16 }]}>Recording in progress...</ThemedText>
                    </View>
                )}

                {recordState === 'review' && (
                    <View style={styles.reviewContainer}>
                        <ThemedText style={styles.helperText}>Recording complete ({formatTime(timer)})</ThemedText>

                        {/* Playback Bar */}
                        <TouchableOpacity
                            style={[styles.playbackBar, { backgroundColor: isDark ? '#2d3748' : '#f1f5f9', borderColor: isPlaying ? theme.tint : (isDark ? '#4a5568' : '#e2e8f0') }]}
                            onPress={handlePlayback}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.playbackIconBox, { backgroundColor: isPlaying ? theme.tint : (isDark ? '#4a5568' : '#cbd5e0') }]}>
                                <Ionicons name={isPlaying ? 'pause' : 'play'} size={18} color="#fff" />
                            </View>
                            {/* Waveform bars */}
                            <View style={styles.waveformRow}>
                                {[4, 10, 7, 14, 9, 5, 13, 8, 11, 6, 14, 10, 5, 8, 12].map((h, i) => (
                                    <View
                                        key={i}
                                        style={[styles.waveBar, {
                                            height: h * 1.6,
                                            backgroundColor: isPlaying ? theme.tint : (isDark ? '#4a5568' : '#a0aec0'),
                                            opacity: isPlaying ? 0.7 + (i % 3) * 0.1 : 0.5,
                                        }]}
                                    />
                                ))}
                            </View>
                            <ThemedText style={[styles.playbackLabel, { color: isPlaying ? theme.tint : (isDark ? '#a0aec0' : '#64748b') }]}>
                                {isPlaying ? 'Playing...' : 'Listen'}
                            </ThemedText>
                        </TouchableOpacity>

                        <View style={styles.reviewActions}>
                            <TouchableOpacity
                                style={[styles.iconButton, { backgroundColor: isDark ? '#2d3748' : '#f1f5f9' }]}
                                onPress={handleRerecord}
                            >
                                <Ionicons name="trash-outline" size={24} color="#ef4444" />
                                <ThemedText style={styles.iconButtonText}>Rerecord</ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.primaryButton, { backgroundColor: theme.tint }]}
                                onPress={handleSubmit}
                            >
                                <ThemedText style={styles.primaryButtonText}>Submit for Analysis</ThemedText>
                                <Ionicons name="arrow-forward" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

            </View>

            {/* 4. Processing State Form */}
            {recordState === 'processing' && (
                <View style={[styles.processingOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.95)' }]}>
                    <View style={[styles.processingCard, { backgroundColor: isDark ? '#1a202c' : '#fff' }]}>
                        <ActivityIndicator size="large" color={theme.tint} style={styles.spinner} />
                        <ThemedText type="subtitle" style={styles.processingTitle}>Analyzing your speech</ThemedText>
                        <ThemedText style={styles.processingDesc}>
                            Measuring pace, accent, and fluency...
                        </ThemedText>

                        {/* For UI mockup purposes: back to idle */}
                        <TouchableOpacity
                            style={{ marginTop: 32, padding: 12 }}
                            onPress={() => setRecordState('idle')}
                        >
                            <ThemedText style={{ color: theme.tint, fontWeight: '600' }}>Cancel</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    headerRight: {
        width: 44,
    },
    content: {
        padding: 24,
        flexGrow: 1,
    },
    instructionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    iconBadge: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    instructionText: {
        flex: 1,
        fontSize: 16,
        lineHeight: 24,
        fontWeight: '500',
    },
    paragraphCard: {
        padding: 24,
        borderRadius: 24,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
        position: 'relative',
        minHeight: 220,
        justifyContent: 'center',
    },
    quoteIcon: {
        position: 'absolute',
        top: 20,
        left: 20,
        opacity: 0.3,
    },
    paragraphText: {
        fontSize: 24,
        lineHeight: 38,
        textAlign: 'center',
        fontWeight: '500',
        marginTop: 16,
    },
    footer: {
        paddingStart: 24,
        paddingEnd: 24,
        paddingTop: 24,
        paddingBottom: 40,
        borderTopWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 10,
    },
    controlCenter: {
        alignItems: 'center',
    },
    helperText: {
        fontSize: 15,
        color: '#64748b',
        marginBottom: 16,
        fontWeight: '500',
        textAlign: 'center',
    },
    recordButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#0a7ea4',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    stopButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    recordingDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
    timerText: {
        color: '#ef4444',
        fontSize: 20,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
    },
    reviewContainer: {
        width: '100%',
    },
    playbackBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        borderWidth: 1.5,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 14,
        gap: 12,
    },
    playbackIconBox: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    waveformRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    waveBar: {
        width: 3,
        borderRadius: 2,
    },
    playbackLabel: {
        fontSize: 13,
        fontWeight: '600',
    },
    reviewActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 16,
    },
    iconButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 16,
    },
    iconButtonText: {
        color: '#ef4444',
        marginLeft: 8,
        fontWeight: '600',
        fontSize: 16,
    },
    primaryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        shadowColor: '#0a7ea4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 8,
    },
    processingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    processingCard: {
        width: '85%',
        padding: 32,
        borderRadius: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    spinner: {
        marginBottom: 24,
        transform: [{ scale: 1.5 }],
    },
    processingTitle: {
        fontSize: 20,
        marginBottom: 8,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    processingDesc: {
        fontSize: 15,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 22,
    },
});
