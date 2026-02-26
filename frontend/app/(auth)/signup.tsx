import { useAuth } from '@/contexts/AuthContext';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import Animated, {
    Easing,
    FadeIn,
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// ── Password strength indicator ──────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
    const strength = React.useMemo(() => {
        let score = 0;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        return score;
    }, [password]);

    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['', '#E85B5B', '#E8A83C', '#5BB8C4', '#5BC45B'];

    if (!password) return null;

    return (
        <View style={pwStyles.container}>
            <View style={pwStyles.bars}>
                {[1, 2, 3, 4].map(i => (
                    <View
                        key={i}
                        style={[
                            pwStyles.bar,
                            { backgroundColor: i <= strength ? colors[strength] : 'rgba(28,18,24,0.1)' },
                        ]}
                    />
                ))}
            </View>
            <Text style={[pwStyles.label, { color: colors[strength] }]}>{labels[strength]}</Text>
        </View>
    );
}

const pwStyles = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
    bars: { flexDirection: 'row', gap: 4, flex: 1 },
    bar: { flex: 1, height: 3, borderRadius: 2 },
    label: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
});

// ── Animated orb blob ────────────────────────────────────────────────────────
function OrnamentScroll({ color = 'rgba(139,143,212,0.3)' }: { color?: string }) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {[16, 10, 6, 10, 16].map((r, i) => (
                <View
                    key={i}
                    style={{
                        width: r,
                        height: r,
                        borderRadius: r / 2,
                        borderWidth: 1.5,
                        borderColor: color,
                    }}
                />
            ))}
        </View>
    );
}

export default function SignupScreen() {
    const insets = useSafeAreaInsets();
    const { signUp } = useAuth();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const orbScale = useSharedValue(0.8);
    const orbOpacity = useSharedValue(0);
    const buttonScale = useSharedValue(1);

    useEffect(() => {
        orbOpacity.value = withTiming(1, { duration: 1000 });
        orbScale.value = withSequence(
            withTiming(1.06, { duration: 1400, easing: Easing.out(Easing.cubic) }),
            withTiming(0.97, { duration: 900, easing: Easing.inOut(Easing.sin) }),
            withTiming(1.02, { duration: 700, easing: Easing.inOut(Easing.sin) }),
            withTiming(1, { duration: 500 }),
        );
    }, []);

    const orbStyle = useAnimatedStyle(() => ({
        opacity: orbOpacity.value,
        transform: [{ scale: orbScale.value }],
    }));

    const buttonAnimStyle = useAnimatedStyle(() => ({
        transform: [{ scale: buttonScale.value }],
    }));

    const handleSignup = async () => {
        if (!fullName.trim() || !email.trim() || !password.trim()) {
            Alert.alert('Missing fields', 'Please fill in all fields.');
            return;
        }
        if (password.length < 8) {
            Alert.alert('Weak password', 'Password must be at least 8 characters.');
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        buttonScale.value = withSequence(
            withSpring(0.97, { damping: 10 }),
            withSpring(1, { damping: 8 }),
        );

        setLoading(true);
        try {
            // Auth happens directly via Supabase SDK (no backend call)
            // The full_name is stored in raw_user_meta_data → used by DB trigger
            const errorMsg = await signUp(email.trim(), password, {
                full_name: fullName.trim(),
            });
            if (errorMsg) {
                throw new Error(errorMsg);
            }

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            // If Supabase auto-confirms, AuthProvider in _layout.tsx will
            // detect the session and navigate to (tabs) automatically.
            // If email confirmation is required, the user gets an alert from AuthContext.
        } catch (err: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Sign up failed', err.message ?? 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.root}>
            {/* ── Soft periwinkle gradient orb (top-right) ── */}
            <Animated.View style={[styles.orbContainerRight, orbStyle]}>
                <View style={styles.orbOuterRight} />
                <View style={styles.orbMiddleRight} />
            </Animated.View>

            {/* ── Saffron accent blob (bottom-left) ── */}
            <View style={styles.saffronBlob} />

            <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 },
                    ]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* ── Back + Brand ── */}
                    <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.topRow}>
                        <Pressable style={styles.backBtn} onPress={() => router.back()}>
                            <Text style={styles.backArrow}>←</Text>
                        </Pressable>
                        <View style={styles.logoMark}>
                            <Text style={styles.logoGlyph}>ब</Text>
                        </View>
                        <Text style={styles.brandName}>boli.ai</Text>
                    </Animated.View>

                    {/* ── Ornamental scroll ── */}
                    <Animated.View entering={FadeIn.delay(300).duration(600)} style={styles.ornamentCenter}>
                        <OrnamentScroll color="rgba(139,143,212,0.45)" />
                    </Animated.View>

                    {/* ── Headline ── */}
                    <Animated.View entering={FadeInDown.delay(350).duration(700)} style={styles.headlineContainer}>
                        <Text style={styles.headline}>Join the{'\n'}movement</Text>
                        <Text style={styles.subheadline}>
                            Powered by Sarvam AI · Built for India
                        </Text>
                    </Animated.View>

                    {/* ── Benefits pills ── */}
                    <Animated.View entering={FadeIn.delay(450).duration(600)} style={styles.pillsRow}>
                        {['🎤 Voice coaching', '🤖 AI feedback', '🇮🇳 Indian languages'].map(label => (
                            <View key={label} style={styles.pill}>
                                <Text style={styles.pillText}>{label}</Text>
                            </View>
                        ))}
                    </Animated.View>

                    {/* ── Form card ── */}
                    <Animated.View entering={FadeInUp.delay(500).duration(700).springify()} style={styles.card}>
                        {/* Full name */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Full name</Text>
                            <View style={[styles.inputWrap, focusedField === 'name' && styles.inputFocused]}>
                                <TextInput
                                    style={styles.input}
                                    value={fullName}
                                    onChangeText={setFullName}
                                    placeholder="Priya Sharma"
                                    placeholderTextColor="#B8B0C8"
                                    autoCapitalize="words"
                                    autoCorrect={false}
                                    onFocus={() => setFocusedField('name')}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </View>
                        </View>

                        {/* Email */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Email address</Text>
                            <View style={[styles.inputWrap, focusedField === 'email' && styles.inputFocused]}>
                                <TextInput
                                    style={styles.input}
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="you@example.com"
                                    placeholderTextColor="#B8B0C8"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    onFocus={() => setFocusedField('email')}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </View>
                        </View>

                        {/* Password */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Password</Text>
                            <View style={[styles.inputWrap, focusedField === 'password' && styles.inputFocused]}>
                                <TextInput
                                    style={[styles.input, { flex: 1 }]}
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="Min. 8 characters"
                                    placeholderTextColor="#B8B0C8"
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    onFocus={() => setFocusedField('password')}
                                    onBlur={() => setFocusedField(null)}
                                />
                                <Pressable
                                    onPress={() => setShowPassword(v => !v)}
                                    hitSlop={10}
                                    style={styles.eyeBtn}
                                >
                                    <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
                                </Pressable>
                            </View>
                            <PasswordStrength password={password} />
                        </View>

                        {/* Terms note */}
                        <Text style={styles.termsText}>
                            By creating an account you agree to our{' '}
                            <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                            <Text style={styles.termsLink}>Privacy Policy</Text>.
                        </Text>

                        {/* CTA */}
                        <Animated.View style={buttonAnimStyle}>
                            <Pressable
                                style={[styles.ctaButton, loading && styles.ctaButtonLoading]}
                                onPress={handleSignup}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFF8F0" size="small" />
                                ) : (
                                    <Text style={styles.ctaText}>Create account</Text>
                                )}
                            </Pressable>
                        </Animated.View>
                    </Animated.View>

                    {/* ── Divider ── */}
                    <Animated.View entering={FadeIn.delay(700).duration(500)} style={styles.dividerRow}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>already have an account?</Text>
                        <View style={styles.dividerLine} />
                    </Animated.View>

                    {/* ── Sign in link ── */}
                    <Animated.View entering={FadeIn.delay(800).duration(500)} style={styles.signinRow}>
                        <Pressable onPress={() => router.back()}>
                            <Text style={styles.signinLink}>Sign in instead →</Text>
                        </Pressable>
                    </Animated.View>

                    {/* ── Bottom flourish ── */}
                    <Animated.View entering={FadeIn.delay(950).duration(600)} style={styles.bottomOrnament}>
                        <View style={styles.flourishDots}>
                            {[8, 5, 3, 5, 8].map((s, i) => (
                                <View
                                    key={i}
                                    style={{
                                        width: s,
                                        height: s,
                                        borderRadius: s / 2,
                                        backgroundColor: 'rgba(232,129,60,0.35)',
                                    }}
                                />
                            ))}
                        </View>
                        <Text style={styles.bottomTagline}>
                            Voice coaching · Indian languages · Sarvam AI
                        </Text>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

// ── Colors ───────────────────────────────────────────────────────────────────
const SAFFRON = '#E8813C';
const SAFFRON_LIGHT = '#F5A65B';
const PERIWINKLE = '#8B8FD4';
const PERIWINKLE_LIGHT = '#C5C7F0';
const PERIWINKLE_PALE = '#EEEEF9';
const CREAM = '#FFFAF4';
const OFF_WHITE = '#F7F3EE';
const DARK_TEXT = '#1C1218';
const MID_TEXT = '#6B5F72';
const CARD_BG = '#FFFFFF';

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: OFF_WHITE,
    },

    // ── Orbs ──────────────────────────────────────────────────────────────────
    orbContainerRight: {
        position: 'absolute',
        top: -height * 0.1,
        right: -width * 0.25,
        alignItems: 'center',
        justifyContent: 'center',
        width: width * 0.9,
        height: height * 0.4,
    },
    orbOuterRight: {
        position: 'absolute',
        width: width * 0.9,
        height: height * 0.4,
        borderRadius: width * 0.5,
        backgroundColor: PERIWINKLE_LIGHT,
        opacity: 0.28,
    },
    orbMiddleRight: {
        position: 'absolute',
        width: width * 0.65,
        height: height * 0.28,
        borderRadius: width * 0.36,
        backgroundColor: PERIWINKLE,
        opacity: 0.25,
    },
    saffronBlob: {
        position: 'absolute',
        bottom: -height * 0.12,
        left: -width * 0.2,
        width: width * 0.7,
        height: height * 0.3,
        borderRadius: width * 0.4,
        backgroundColor: SAFFRON_LIGHT,
        opacity: 0.2,
    },

    // ── Layout ────────────────────────────────────────────────────────────────
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        gap: 0,
    },

    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 24,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(28,18,24,0.06)',
        alignItems: 'center',
        justifyContent: 'center',
        borderCurve: 'continuous',
        marginRight: 4,
    },
    backArrow: {
        fontSize: 18,
        color: DARK_TEXT,
        fontWeight: '600',
    },
    logoMark: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: DARK_TEXT,
        alignItems: 'center',
        justifyContent: 'center',
        borderCurve: 'continuous',
    },
    logoGlyph: {
        fontSize: 20,
        color: CREAM,
        fontWeight: '700',
    },
    brandName: {
        fontSize: 20,
        fontWeight: '700',
        color: DARK_TEXT,
        letterSpacing: -0.5,
    },

    ornamentCenter: {
        alignItems: 'center',
        marginBottom: 18,
    },

    // ── Headline ──────────────────────────────────────────────────────────────
    headlineContainer: {
        marginBottom: 16,
        gap: 6,
    },
    headline: {
        fontSize: 44,
        fontWeight: '800',
        color: DARK_TEXT,
        letterSpacing: -2,
        lineHeight: 48,
    },
    subheadline: {
        fontSize: 14,
        color: MID_TEXT,
        letterSpacing: 0.1,
        marginTop: 4,
    },

    // ── Pills ─────────────────────────────────────────────────────────────────
    pillsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20,
    },
    pill: {
        backgroundColor: PERIWINKLE_PALE,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: 'rgba(139,143,212,0.25)',
    },
    pillText: {
        fontSize: 12,
        color: PERIWINKLE,
        fontWeight: '600',
    },

    // ── Card ──────────────────────────────────────────────────────────────────
    card: {
        backgroundColor: CARD_BG,
        borderRadius: 24,
        padding: 20,
        gap: 14,
        borderCurve: 'continuous',
        boxShadow: '0 8px 32px rgba(28,18,24,0.08), 0 2px 8px rgba(139,143,212,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(139,143,212,0.12)',
    },

    fieldGroup: { gap: 6 },
    fieldLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: MID_TEXT,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: OFF_WHITE,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: 'rgba(139,143,212,0.18)',
        paddingHorizontal: 16,
        borderCurve: 'continuous',
        minHeight: 52,
    },
    inputFocused: {
        borderColor: PERIWINKLE,
        backgroundColor: CREAM,
        boxShadow: '0 0 0 3px rgba(139,143,212,0.12)',
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: DARK_TEXT,
        paddingVertical: 14,
    },
    eyeBtn: { padding: 4 },
    eyeText: { fontSize: 18 },

    termsText: {
        fontSize: 12,
        color: MID_TEXT,
        lineHeight: 18,
        marginTop: -2,
    },
    termsLink: {
        color: PERIWINKLE,
        fontWeight: '600',
    },

    ctaButton: {
        backgroundColor: SAFFRON,
        borderRadius: 16,
        paddingVertical: 17,
        alignItems: 'center',
        justifyContent: 'center',
        borderCurve: 'continuous',
        marginTop: 4,
        boxShadow: '0 4px 16px rgba(232,129,60,0.35)',
    },
    ctaButtonLoading: {
        backgroundColor: '#C4601A',
    },
    ctaText: {
        fontSize: 17,
        fontWeight: '700',
        color: CREAM,
        letterSpacing: -0.3,
    },

    // ── Divider ───────────────────────────────────────────────────────────────
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 20,
        marginBottom: 14,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(28,18,24,0.08)',
    },
    dividerText: {
        fontSize: 12,
        color: MID_TEXT,
        fontWeight: '500',
    },

    signinRow: {
        alignItems: 'center',
    },
    signinLink: {
        fontSize: 15,
        fontWeight: '700',
        color: DARK_TEXT,
    },

    // ── Bottom ornament ───────────────────────────────────────────────────────
    bottomOrnament: {
        alignItems: 'center',
        marginTop: 24,
        gap: 8,
    },
    flourishDots: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    bottomTagline: {
        fontSize: 11,
        color: 'rgba(107,95,114,0.55)',
        letterSpacing: 0.4,
        textAlign: 'center',
    },
});
