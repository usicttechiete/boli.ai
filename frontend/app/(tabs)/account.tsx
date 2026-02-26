import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const SAFFRON = '#E8813C';
const PERIWINKLE = '#8B8FD4';
const OFF_WHITE = '#F7F3EE';
const CREAM = '#FFFAF4';
const DARK = '#1C1218';
const MID = '#6B5F72';
const DANGER = '#D94040';
const DANGER_LIGHT = '#FEF0F0';
const CARD_BG = '#FFFFFF';

// ─────────────────────────────────────────────────────────────────────────────
// Avatar orb — initials on dark circle with glow rings
// ─────────────────────────────────────────────────────────────────────────────
function Avatar({ name, size = 84 }: { name: string; size?: number }) {
    const initials = name
        .split(' ')
        .slice(0, 2)
        .map(w => w[0]?.toUpperCase() ?? '')
        .join('');

    return (
        <View style={{ alignItems: 'center', justifyContent: 'center', width: size + 28, height: size + 28 }}>
            {/* Glow rings */}
            <View style={{ position: 'absolute', width: size + 24, height: size + 24, borderRadius: (size + 24) / 2, borderWidth: 1, borderColor: SAFFRON + '20' }} />
            <View style={{ position: 'absolute', width: size + 12, height: size + 12, borderRadius: (size + 12) / 2, borderWidth: 1.5, borderColor: SAFFRON + '35' }} />
            {/* Core circle */}
            <View style={{
                width: size, height: size, borderRadius: size / 2,
                backgroundColor: DARK,
                alignItems: 'center', justifyContent: 'center',
            }}>
                <Text style={{ fontSize: size * 0.32, fontWeight: '800', color: CREAM, letterSpacing: -0.5 }}>
                    {initials || '?'}
                </Text>
            </View>
            {/* Online dot */}
            <View style={{
                position: 'absolute', bottom: 6, right: 6,
                width: 16, height: 16, borderRadius: 8,
                backgroundColor: '#3DC47B',
                borderWidth: 2.5, borderColor: OFF_WHITE,
            }} />
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stat pill
// ─────────────────────────────────────────────────────────────────────────────
function StatPill({ icon, label, value, color }: {
    icon: keyof typeof Ionicons.glyphMap; label: string; value: string; color: string;
}) {
    return (
        <View style={[spStyles.pill, { backgroundColor: color + '14', borderColor: color + '30' }]}>
            <Ionicons name={icon} size={16} color={color} />
            <Text style={[spStyles.value, { color }]}>{value}</Text>
            <Text style={spStyles.label}>{label}</Text>
        </View>
    );
}
const spStyles = StyleSheet.create({
    pill: {
        flex: 1, borderRadius: 14, padding: 12,
        alignItems: 'center', gap: 4,
        borderWidth: 1,
    },
    value: { fontSize: 17, fontWeight: '800' },
    label: { fontSize: 11, color: MID, fontWeight: '600', textAlign: 'center' },
});

// ─────────────────────────────────────────────────────────────────────────────
// Section header
// ─────────────────────────────────────────────────────────────────────────────
function SectionLabel({ label }: { label: string }) {
    return (
        <View style={slStyles.row}>
            <Text style={slStyles.text}>{label}</Text>
            <View style={slStyles.line} />
        </View>
    );
}
const slStyles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    text: { fontSize: 11, fontWeight: '700', color: MID, letterSpacing: 0.8, textTransform: 'uppercase' },
    line: { flex: 1, height: 1, backgroundColor: 'rgba(107,95,114,0.15)' },
});

// ─────────────────────────────────────────────────────────────────────────────
// Setting row
// ─────────────────────────────────────────────────────────────────────────────
type RowProps = {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    iconBg?: string;
    label: string;
    sublabel?: string;
    value?: string;
    isDestructive?: boolean;
    rightElement?: React.ReactNode;
    showArrow?: boolean;
    onPress?: () => void;
    isLast?: boolean;
};

function SettingRow({
    icon, iconColor, iconBg, label, sublabel, value,
    isDestructive = false, rightElement,
    showArrow = true, onPress, isLast = false,
}: RowProps) {
    const resolvedIconColor = isDestructive ? DANGER : (iconColor ?? DARK);
    const resolvedIconBg = isDestructive ? DANGER_LIGHT : (iconBg ?? 'rgba(28,18,24,0.06)');

    return (
        <Pressable
            style={({ pressed }) => [
                rowStyles.row,
                !isLast && rowStyles.border,
                pressed && onPress && rowStyles.pressed,
            ]}
            onPress={onPress}
            disabled={!onPress}
        >
            {/* Icon */}
            <View style={[rowStyles.iconBox, { backgroundColor: resolvedIconBg }]}>
                <Ionicons name={icon} size={18} color={resolvedIconColor} />
            </View>

            {/* Label + optional sublabel */}
            <View style={rowStyles.labelWrap}>
                <Text style={[rowStyles.label, isDestructive && { color: DANGER }]}>{label}</Text>
                {sublabel ? <Text style={rowStyles.sublabel}>{sublabel}</Text> : null}
            </View>

            {/* Right side */}
            <View style={rowStyles.right}>
                {value ? <Text style={rowStyles.value}>{value}</Text> : null}
                {rightElement}
                {showArrow && !rightElement && !value ? (
                    <Ionicons name="chevron-forward" size={16} color="rgba(107,95,114,0.5)" />
                ) : null}
            </View>
        </Pressable>
    );
}
const rowStyles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 13,
        gap: 12,
        backgroundColor: CARD_BG,
    },
    border: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(28,18,24,0.07)',
    },
    pressed: { backgroundColor: 'rgba(28,18,24,0.03)' },
    iconBox: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
    labelWrap: { flex: 1, gap: 1 },
    label: { fontSize: 15, fontWeight: '500', color: DARK },
    sublabel: { fontSize: 12, color: MID },
    right: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    value: { fontSize: 14, color: MID },
});

// ─────────────────────────────────────────────────────────────────────────────
// Card container
// ─────────────────────────────────────────────────────────────────────────────
function Card({ children }: { children: React.ReactNode }) {
    return <View style={cardStyles.card}>{children}</View>;
}
const cardStyles = StyleSheet.create({
    card: {
        backgroundColor: CARD_BG,
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(28,18,24,0.07)',
        boxShadow: '0 2px 10px rgba(28,18,24,0.05)',
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────
export default function AccountScreen() {
    const { user, signOut } = useAuth();
    const insets = useSafeAreaInsets();
    const [notifEnabled, setNotifEnabled] = useState(true);

    const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Learner';
    const email = user?.email ?? 'user@example.com';
    const memberSince = user?.created_at
        ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
        : 'January 2025';

    const handleSignOut = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Alert.alert('Sign out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Sign out', style: 'destructive',
                onPress: async () => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    await signOut?.();
                },
            },
        ]);
    };

    return (
        <View style={styles.root}>
            {/* Soft background orb */}
            <View style={styles.bgOrb} />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.scroll,
                    { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
                ]}
            >
                {/* ── Page title ── */}
                <Animated.View entering={FadeInDown.delay(80).duration(500)} style={styles.titleRow}>
                    <Text style={styles.pageTitle}>Account</Text>
                </Animated.View>

                {/* ── Profile card ── */}
                <Animated.View entering={FadeInDown.delay(160).duration(600)} style={styles.profileCard}>
                    <Avatar name={displayName} size={80} />

                    <View style={styles.profileText}>
                        <Text style={styles.profileName}>{displayName}</Text>
                        <Text style={styles.profileEmail}>{email}</Text>
                    </View>

                    {/* Stats row */}
                    <View style={styles.statsRow}>
                        <StatPill icon="calendar-outline" label="Joined" value={memberSince} color={PERIWINKLE} />
                        <StatPill icon="language-outline" label="Languages" value="2" color={SAFFRON} />
                        <StatPill icon="mic-outline" label="Tests" value="4" color="#3DC47B" />
                    </View>
                </Animated.View>

                {/* ── Account ── */}
                <Animated.View entering={FadeIn.delay(280).duration(500)} style={styles.section}>
                    <SectionLabel label="Account" />
                    <Card>
                        <SettingRow
                            icon="person-outline"
                            iconColor={PERIWINKLE} iconBg={PERIWINKLE + '18'}
                            label="Edit Profile"
                            sublabel="Update your name and details"
                            onPress={() => { }}
                        />
                        <SettingRow
                            icon="notifications-outline"
                            iconColor={SAFFRON} iconBg={SAFFRON + '18'}
                            label="Daily Reminders"
                            sublabel="Get nudged to practice every day"
                            showArrow={false}
                            rightElement={
                                <Switch
                                    value={notifEnabled}
                                    onValueChange={v => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setNotifEnabled(v);
                                    }}
                                    trackColor={{ false: '#E5E7EB', true: SAFFRON + 'CC' }}
                                    thumbColor={Platform.OS === 'ios' ? '#FFF' : notifEnabled ? SAFFRON : '#9CA3AF'}
                                />
                            }
                            isLast
                        />
                    </Card>
                </Animated.View>

                {/* ── Practice ── */}
                <Animated.View entering={FadeIn.delay(350).duration(500)} style={styles.section}>
                    <SectionLabel label="Practice" />
                    <Card>
                        <SettingRow
                            icon="mic-outline"
                            iconColor="#3DC47B" iconBg="#3DC47B18"
                            label="Test a Language"
                            sublabel="Measure your fluency & pace"
                            onPress={() => { }}
                        />
                        <SettingRow
                            icon="book-outline"
                            iconColor="#5B8BC4" iconBg="#5B8BC418"
                            label="Learn a Language"
                            sublabel="Start a course from your home tab"
                            onPress={() => { }}
                            isLast
                        />
                    </Card>
                </Animated.View>

                {/* ── Support ── */}
                <Animated.View entering={FadeIn.delay(420).duration(500)} style={styles.section}>
                    <SectionLabel label="Support" />
                    <Card>
                        <SettingRow
                            icon="shield-checkmark-outline"
                            iconColor="#6B5F72" iconBg="rgba(107,95,114,0.1)"
                            label="Privacy Policy"
                            onPress={() => { }}
                        />
                        <SettingRow
                            icon="document-text-outline"
                            iconColor="#6B5F72" iconBg="rgba(107,95,114,0.1)"
                            label="Terms of Service"
                            onPress={() => { }}
                        />
                        <SettingRow
                            icon="information-circle-outline"
                            iconColor="#6B5F72" iconBg="rgba(107,95,114,0.1)"
                            label="App Version"
                            value="1.0.0"
                            showArrow={false}
                            isLast
                        />
                    </Card>
                </Animated.View>

                {/* ── Sign out ── */}
                <Animated.View entering={FadeIn.delay(490).duration(500)} style={styles.section}>
                    <Card>
                        <SettingRow
                            icon="log-out-outline"
                            label="Sign Out"
                            isDestructive
                            showArrow={false}
                            onPress={handleSignOut}
                            isLast
                        />
                    </Card>
                </Animated.View>

                {/* Footer */}
                <Animated.View entering={FadeIn.delay(560).duration(500)} style={styles.footer}>
                    <Text style={styles.footerText}>boli.ai · Powered by Sarvam AI 🇮🇳</Text>
                </Animated.View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: OFF_WHITE },

    bgOrb: {
        position: 'absolute',
        top: -width * 0.4,
        right: -width * 0.3,
        width: width * 0.9,
        height: width * 0.9,
        borderRadius: width * 0.45,
        backgroundColor: SAFFRON,
        opacity: 0.07,
    },

    scroll: { paddingHorizontal: 20 },

    titleRow: { marginBottom: 20 },
    pageTitle: {
        fontSize: 34, fontWeight: '800', color: DARK, letterSpacing: -1.5,
    },

    // Profile card
    profileCard: {
        backgroundColor: CARD_BG,
        borderRadius: 24, padding: 24,
        alignItems: 'center', gap: 12,
        marginBottom: 24,
        borderWidth: 1, borderColor: 'rgba(28,18,24,0.07)',
        boxShadow: '0 4px 20px rgba(28,18,24,0.07)',
    },
    profileText: { alignItems: 'center', gap: 3 },
    profileName: {
        fontSize: 22, fontWeight: '800', color: DARK, letterSpacing: -0.5,
    },
    profileEmail: { fontSize: 14, color: MID },

    statsRow: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 6 },

    section: { marginBottom: 16 },

    footer: { alignItems: 'center', paddingTop: 12 },
    footerText: { fontSize: 12, color: 'rgba(107,95,114,0.45)', letterSpacing: 0.3 },
});
