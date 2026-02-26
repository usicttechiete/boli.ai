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

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

// ── Ornamental SVG-like decorative dots pattern ─────────────────────────────
function OrnamentalDots({ color = 'rgba(255,255,255,0.25)', size = 5 }: { color?: string; size?: number }) {
    const positions = [
        [0, 0], [size * 2, 0], [size * 4, 0],
        [size, size], [size * 3, size],
        [0, size * 2], [size * 2, size * 2], [size * 4, size * 2],
        [size, size * 3], [size * 3, size * 3],
        [0, size * 4], [size * 2, size * 4], [size * 4, size * 4],
    ];
    return (
        <View style={{ width: size * 4 + 4, height: size * 4 + 4 }}>
            {positions.map(([x, y], i) => (
                <View
                    key={i}
                    style={{
                        position: 'absolute',
                        left: x,
                        top: y,
                        width: 3,
                        height: 3,
                        borderRadius: 2,
                        backgroundColor: color,
                    }}
                />
            ))}
        </View>
    );
}

// ── Mandala ring decoration ──────────────────────────────────────────────────
function MandalaRing({ size = 120, color = 'rgba(255,200,120,0.18)' }: { size?: number; color?: string }) {
    const rings = [1, 0.78, 0.56];
    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            {rings.map((scale, i) => (
                <View
                    key={i}
                    style={{
                        position: 'absolute',
                        width: size * scale,
                        height: size * scale,
                        borderRadius: (size * scale) / 2,
                        borderWidth: 1,
                        borderColor: color,
                    }}
                />
            ))}
            {/* Petal shapes */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
                <View
                    key={`petal-${i}`}
                    style={{
                        position: 'absolute',
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: color,
                        transform: [
                            { rotate: `${deg}deg` },
                            { translateY: -(size * 0.38) },
                        ],
                    }}
                />
            ))}
            {/* Center */}
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
        </View>
    );
}

export default function LoginScreen() {
    const insets = useSafeAreaInsets();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);

    const orbScale = useSharedValue(0.8);
    const orbOpacity = useSharedValue(0);
    const buttonScale = useSharedValue(1);

    useEffect(() => {
        orbOpacity.value = withTiming(1, { duration: 1000 });
        orbScale.value = withSequence(
            withTiming(1.05, { duration: 1200, easing: Easing.out(Easing.cubic) }),
            withTiming(0.98, { duration: 800, easing: Easing.inOut(Easing.sin) }),
            withTiming(1.02, { duration: 600, easing: Easing.inOut(Easing.sin) }),
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

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Missing fields', 'Please enter your email and password.');
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        buttonScale.value = withSequence(
            withSpring(0.97, { damping: 10 }),
            withSpring(1, { damping: 8 }),
        );

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), password }),
            });

            const json = await res.json();
            if (!res.ok || !json.success) {
                throw new Error(json.error?.message ?? 'Login failed. Please try again.');
            }

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.replace('/(tabs)');
        } catch (err: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Login Failed', err.message ?? 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.root}>
            {/* ── Warm saffron gradient orb ── */}
            <Animated.View style={[styles.orbContainer, orbStyle]}>
                <View style={styles.orbOuter} />
                <View style={styles.orbMiddle} />
                <View style={styles.orbInner} />
            </Animated.View>

            {/* ── Top mandala decoration ── */}
            <Animated.View
                entering={FadeIn.delay(400).duration(800)}
                style={styles.mandalaTop}
            >
                <MandalaRing size={110} color="rgba(255,200,120,0.22)" />
            </Animated.View>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 },
                    ]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* ── Logo / Brand ── */}
                    <Animated.View entering={FadeInDown.delay(200).duration(700).springify()} style={styles.brandRow}>
                        <View style={styles.logoMark}>
                            <Text style={styles.logoGlyph}>ब</Text>
                        </View>
                        <Text style={styles.brandName}>boli.ai</Text>
                    </Animated.View>

                    {/* ── Ornamental divider dots ── */}
                    <Animated.View entering={FadeIn.delay(350).duration(600)} style={styles.ornamentRow}>
                        <OrnamentalDots color="rgba(224,140,60,0.4)" size={6} />
                        <View style={styles.ornamentLine} />
                        <OrnamentalDots color="rgba(224,140,60,0.4)" size={6} />
                    </Animated.View>

                    {/* ── Headline ── */}
                    <Animated.View entering={FadeInDown.delay(400).duration(700)} style={styles.headlineContainer}>
                        <Text style={styles.headline}>Welcome{'\n'}back</Text>
                        <Text style={styles.subheadline}>Your voice coaching journey continues</Text>
                    </Animated.View>

                    {/* ── Form card ── */}
                    <Animated.View entering={FadeInUp.delay(500).duration(700).springify()} style={styles.card}>
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
                                    placeholder="••••••••"
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
                        </View>

                        {/* Forgot password */}
                        <Pressable style={styles.forgotRow}>
                            <Text style={styles.forgotText}>Forgot password?</Text>
                        </Pressable>

                        {/* CTA Button */}
                        <Animated.View style={buttonAnimStyle}>
                            <Pressable
                                style={[styles.ctaButton, loading && styles.ctaButtonLoading]}
                                onPress={handleLogin}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFF8F0" size="small" />
                                ) : (
                                    <Text style={styles.ctaText}>Sign in</Text>
                                )}
                            </Pressable>
                        </Animated.View>
                    </Animated.View>

                    {/* ── Divider ── */}
                    <Animated.View entering={FadeIn.delay(700).duration(500)} style={styles.dividerRow}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>or</Text>
                        <View style={styles.dividerLine} />
                    </Animated.View>

                    {/* ── Sign up link ── */}
                    <Animated.View entering={FadeIn.delay(800).duration(500)} style={styles.signupRow}>
                        <Text style={styles.signupPrompt}>New to boli.ai? </Text>
                        <Pressable onPress={() => router.push('/(auth)/signup' as any)}>
                            <Text style={styles.signupLink}>Create account →</Text>
                        </Pressable>
                    </Animated.View>

                    {/* ── Bottom ornament ── */}
                    <Animated.View entering={FadeIn.delay(900).duration(600)} style={styles.bottomOrnament}>
                        <Text style={styles.bottomTagline}>Voice coaching for India's next billion</Text>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const SAFFRON = '#E8813C';
const SAFFRON_LIGHT = '#F5A65B';
const SAFFRON_DEEP = '#C4601A';
const PERIWINKLE = '#8B8FD4';
const PERIWINKLE_LIGHT = '#C5C7F0';
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

    // ── Orb ───────────────────────────────────────────────────────────────────
    orbContainer: {
        position: 'absolute',
        top: -height * 0.08,
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        width: width * 1.1,
        height: height * 0.42,
    },
    orbOuter: {
        position: 'absolute',
        width: width * 1.1,
        height: height * 0.42,
        borderRadius: width * 0.6,
        backgroundColor: SAFFRON_LIGHT,
        opacity: 0.22,
    },
    orbMiddle: {
        position: 'absolute',
        width: width * 0.85,
        height: height * 0.34,
        borderRadius: width * 0.46,
        backgroundColor: SAFFRON,
        opacity: 0.35,
    },
    orbInner: {
        position: 'absolute',
        width: width * 0.62,
        height: height * 0.26,
        borderRadius: width * 0.35,
        backgroundColor: SAFFRON_DEEP,
        opacity: 0.28,
    },

    mandalaTop: {
        position: 'absolute',
        top: 36,
        alignSelf: 'center',
    },

    // ── Scroll ────────────────────────────────────────────────────────────────
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        gap: 0,
    },

    // ── Brand ─────────────────────────────────────────────────────────────────
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 28,
        marginTop: 8,
    },
    logoMark: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: DARK_TEXT,
        alignItems: 'center',
        justifyContent: 'center',
        borderCurve: 'continuous',
    },
    logoGlyph: {
        fontSize: 22,
        color: CREAM,
        fontWeight: '700',
    },
    brandName: {
        fontSize: 22,
        fontWeight: '700',
        color: DARK_TEXT,
        letterSpacing: -0.5,
    },

    // ── Ornament row ──────────────────────────────────────────────────────────
    ornamentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 20,
    },
    ornamentLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(224,140,60,0.25)',
    },

    // ── Headline ──────────────────────────────────────────────────────────────
    headlineContainer: {
        marginBottom: 24,
        gap: 6,
    },
    headline: {
        fontSize: 46,
        fontWeight: '800',
        color: DARK_TEXT,
        letterSpacing: -2,
        lineHeight: 50,
        fontVariant: ['oldstyle-nums'],
    },
    subheadline: {
        fontSize: 15,
        color: MID_TEXT,
        letterSpacing: -0.1,
        marginTop: 4,
    },

    // ── Card ──────────────────────────────────────────────────────────────────
    card: {
        backgroundColor: CARD_BG,
        borderRadius: 24,
        padding: 20,
        gap: 14,
        borderCurve: 'continuous',
        boxShadow: '0 8px 32px rgba(28,18,24,0.08), 0 2px 8px rgba(232,129,60,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(232,129,60,0.1)',
    },

    fieldGroup: {
        gap: 6,
    },
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
        borderColor: 'rgba(139,143,212,0.2)',
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
    eyeBtn: {
        padding: 4,
    },
    eyeText: {
        fontSize: 18,
    },

    forgotRow: {
        alignSelf: 'flex-end',
        marginTop: -4,
    },
    forgotText: {
        fontSize: 13,
        color: PERIWINKLE,
        fontWeight: '600',
    },

    ctaButton: {
        backgroundColor: DARK_TEXT,
        borderRadius: 16,
        paddingVertical: 17,
        alignItems: 'center',
        justifyContent: 'center',
        borderCurve: 'continuous',
        marginTop: 4,
        boxShadow: '0 4px 14px rgba(28,18,24,0.22)',
    },
    ctaButtonLoading: {
        backgroundColor: '#3A2E38',
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
        gap: 12,
        marginTop: 20,
        marginBottom: 16,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(28,18,24,0.1)',
    },
    dividerText: {
        fontSize: 13,
        color: MID_TEXT,
        fontWeight: '500',
    },

    // ── Signup ────────────────────────────────────────────────────────────────
    signupRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    signupPrompt: {
        fontSize: 15,
        color: MID_TEXT,
    },
    signupLink: {
        fontSize: 15,
        fontWeight: '700',
        color: SAFFRON,
    },

    // ── Bottom tagline ────────────────────────────────────────────────────────
    bottomOrnament: {
        alignItems: 'center',
        marginTop: 28,
    },
    bottomTagline: {
        fontSize: 12,
        color: 'rgba(107,95,114,0.6)',
        letterSpacing: 0.4,
        textAlign: 'center',
    },
});
