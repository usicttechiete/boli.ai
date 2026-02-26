import { Image } from 'expo-image';
import React from 'react';
import { Platform, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function AccountScreen() {
    const colorScheme = useColorScheme();
    const theme = colorScheme ?? 'light';
    const insets = useSafeAreaInsets();

    const isDark = theme === 'dark';

    // Theme derived values
    const backgroundColor = Colors[theme].background;
    const cardBackgroundColor = isDark ? '#212425' : '#F2F2F7';
    const borderColor = isDark ? '#3A3D40' : '#E5E5EA';
    const iconColor = Colors[theme].icon;
    const textPrimary = Colors[theme].text;
    const textSecondary = isDark ? '#A1A1A6' : '#8E8E93';

    // Dummy data for visual representation
    const userTempData = {
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        memberSince: 'October 2023',
    };

    // UI Component for Settings Rows
    const SettingRow = ({
        icon,
        label,
        value,
        isDestructive = false,
        showChevron = true,
        rightElement,
        onPress,
    }: {
        icon: React.ComponentProps<typeof IconSymbol>['name'];
        label: string;
        value?: string;
        isDestructive?: boolean;
        showChevron?: boolean;
        rightElement?: React.ReactNode;
        onPress?: () => void;
    }) => {
        return (
            <TouchableOpacity
                style={[styles.settingRow, { borderBottomColor: borderColor }]}
                onPress={onPress}
                disabled={!onPress}
                activeOpacity={0.7}
            >
                <View style={styles.settingRowLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: cardBackgroundColor }]}>
                        <IconSymbol name={icon} size={20} color={isDestructive ? '#FF3B30' : iconColor} />
                    </View>
                    <ThemedText
                        style={[
                            styles.settingLabel,
                            isDestructive && { color: '#FF3B30' },
                        ]}
                    >
                        {label}
                    </ThemedText>
                </View>

                <View style={styles.settingRowRight}>
                    {value && <ThemedText style={{ color: textSecondary }}>{value}</ThemedText>}
                    {rightElement}
                    {showChevron && !rightElement && (
                        <IconSymbol name="chevron.right" size={20} color={textSecondary} />
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <ThemedView style={styles.container}>
            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 },
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Header */}
                <View style={styles.headerContainer}>
                    <View style={[styles.avatarContainer, { borderColor: cardBackgroundColor }]}>
                        <Image
                            source="https://i.pravatar.cc/300?img=47"
                            style={styles.avatarImage}
                            contentFit="cover"
                            transition={1000}
                        />
                        {/* Edit avatar badge */}
                        <View style={[styles.editAvatarBadge, { backgroundColor: Colors[theme].background }]}>
                            <IconSymbol name="pencil" size={12} color={textPrimary} />
                        </View>
                    </View>

                    <ThemedText type="title" style={styles.userName}>
                        {userTempData.name}
                    </ThemedText>
                    <ThemedText style={[styles.userEmail, { color: textSecondary }]}>
                        {userTempData.email}
                    </ThemedText>

                    <View style={[styles.badgeContainer, { backgroundColor: cardBackgroundColor }]}>
                        <IconSymbol name="info.circle.fill" size={14} color={iconColor} />
                        <ThemedText style={[styles.badgeText, { color: textSecondary }]}>
                            Member since {userTempData.memberSince}
                        </ThemedText>
                    </View>
                </View>

                {/* Settings Sections */}
                <View style={styles.sectionContainer}>
                    <ThemedText style={[styles.sectionTitle, { color: textSecondary }]}>
                        ACCOUNT
                    </ThemedText>
                    <View style={[styles.cardGroup, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFFFFF' }]}>
                        <SettingRow
                            icon="person.fill"
                            label="Edit Profile"
                            onPress={() => { }}
                        />
                        <SettingRow
                            icon="bell.fill"
                            label="Notifications"
                            showChevron={false}
                            rightElement={
                                <Switch
                                    value={true}
                                    onValueChange={() => { }}
                                    trackColor={{ false: '#767577', true: '#34C759' }}
                                    thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : '#f4f3f4'}
                                />
                            }
                        />
                    </View>
                </View>

                <View style={styles.sectionContainer}>
                    <ThemedText style={[styles.sectionTitle, { color: textSecondary }]}>
                        ABOUT
                    </ThemedText>
                    <View style={[styles.cardGroup, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFFFFF' }]}>
                        <SettingRow
                            icon="info.circle.fill"
                            label="Privacy Policy"
                            onPress={() => { }}
                        />
                        <SettingRow
                            icon="info.circle.fill"
                            label="Terms of Service"
                            onPress={() => { }}
                        />
                        <SettingRow
                            icon="info.circle.fill"
                            label="App Version"
                            value="1.0.0"
                            showChevron={false}
                        />
                    </View>
                </View>

                {/* Destructive Actions */}
                <View style={[styles.sectionContainer, styles.lastSection]}>
                    <TouchableOpacity
                        style={[styles.signOutButton, { backgroundColor: isDark ? '#2C1C1E' : '#FFF0F0', borderColor: '#FF3B30' }]}
                        activeOpacity={0.8}
                        onPress={() => { }}
                    >
                        <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color="#FF3B30" />
                        <ThemedText style={styles.signOutText}>Sign Out</ThemedText>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 40,
        marginTop: 10,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 16,
        position: 'relative',
        borderWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
    },
    editAvatarBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    userName: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 16,
        marginBottom: 12,
    },
    badgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    sectionContainer: {
        marginBottom: 32,
    },
    lastSection: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 16,
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    cardGroup: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    settingRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    settingRowRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 1,
        gap: 8,
    },
    signOutText: {
        color: '#FF3B30',
        fontSize: 16,
        fontWeight: '600',
    },
});
