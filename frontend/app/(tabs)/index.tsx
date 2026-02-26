import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ACTIVE_LANGUAGES = [
  { id: '1', name: 'English', code: 'en' },
  { id: '2', name: 'Hindi', code: 'hi' },
];

const COMING_SOON = [
  { id: '3', name: 'Tamil', code: 'ta' },
  { id: '4', name: 'Telugu', code: 'te' },
  { id: '5', name: 'Punjabi', code: 'pa' },
  { id: '6', name: 'Gujarati', code: 'gu' },
  { id: '7', name: 'Marathi', code: 'mr' },
  { id: '8', name: 'Japanese', code: 'ja' },
  { id: '9', name: 'German', code: 'de' },
  { id: '10', name: 'French', code: 'fr' },
];

// Mock data to demonstrate the UI structure. 
// Can be toggled to verify empty vs populated state
const MOCK_KNOWN_LANGUAGES = [
  { id: '1', name: 'English', fluency: 'Intermediate', score: 68 },
  { id: '2', name: 'Hindi', fluency: 'Advanced', score: 92 },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = Colors[isDark ? 'dark' : 'light'];

  const [knownLanguages] = useState(MOCK_KNOWN_LANGUAGES);

  // Provide a default greeting name
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Student';

  const renderEmptyState = () => (
    <View style={[styles.emptyState, { backgroundColor: isDark ? '#1a202c' : '#f7fafc', borderColor: isDark ? '#2d3748' : '#edf2f7' }]}>
      <View style={[styles.emptyStateIconBadge, { backgroundColor: theme.tint + '1a' }]}>
        <Ionicons name="school-outline" size={28} color={theme.tint} />
      </View>
      <ThemedText style={styles.emptyStateTitle}>No baseline yet</ThemedText>
      <ThemedText style={styles.emptyStateDesc}>
        You haven't added any languages yet. Test a language to establish your baseline!
      </ThemedText>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 1. Header Area */}
        <View style={styles.header}>
          <View>
            <ThemedText style={styles.greetingSub}>Welcome back,</ThemedText>
            <ThemedText type="title" style={styles.greetingTitle}>
              Hello, {firstName} 👋
            </ThemedText>
          </View>
          <TouchableOpacity style={[styles.profileBtn, { backgroundColor: isDark ? '#2d3748' : '#f7fafc' }]}>
            <Ionicons name="person-outline" size={20} color={theme.icon} />
          </TouchableOpacity>
        </View>

        {/* 2. Known Languages Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Your Known Languages</ThemedText>
          </View>

          {knownLanguages.length === 0 ? (
            renderEmptyState()
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.knownLanguagesList}
            >
              {knownLanguages.map((lang) => (
                <View
                  key={lang.id}
                  style={[
                    styles.knownLanguageCard,
                    {
                      backgroundColor: isDark ? '#1a202c' : '#fff',
                      borderColor: isDark ? '#2d3748' : '#e2e8f0',
                      shadowColor: isDark ? '#000' : '#cbd5e0'
                    }
                  ]}
                >
                  <View style={styles.knownCardTop}>
                    <View style={[styles.langIconBadge, { backgroundColor: theme.tint + '15' }]}>
                      <Ionicons name="language-outline" size={20} color={theme.tint} />
                    </View>
                    <View style={styles.scoreContainer}>
                      <Ionicons name="star" size={12} color="#f59e0b" />
                      <ThemedText style={styles.scoreText}>{lang.score}</ThemedText>
                    </View>
                  </View>
                  <ThemedText type="defaultSemiBold" style={styles.langName}>{lang.name}</ThemedText>
                  <ThemedText style={styles.fluencyText}>{lang.fluency}</ThemedText>
                </View>
              ))}

              {/* Action Button: Add Language */}
              <TouchableOpacity
                style={[
                  styles.addLanguageCard,
                  {
                    borderColor: isDark ? '#2d3748' : '#e2e8f0',
                    backgroundColor: isDark ? '#1a202c' : '#f8fafc'
                  }
                ]}
                onPress={() => router.push('/test/english' as any)}
              >
                <View style={[styles.addIconCircle, { backgroundColor: theme.tint + '15' }]}>
                  <Ionicons name="add" size={24} color={theme.tint} />
                </View>
                <ThemedText style={[styles.addLangText, { color: theme.tint }]}>Add Language</ThemedText>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>

        {/* 3. Learn Language Section */}
        <View style={[styles.sectionContainer, styles.lastSection]}>
          <ThemedText type="subtitle" style={[styles.sectionTitle, { marginLeft: 20, marginBottom: 16 }]}>
            Learn a New Language
          </ThemedText>

          <View style={styles.gridContainer}>
            {/* Active Languages */}
            {ACTIVE_LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.id}
                style={[
                  styles.gridItem,
                  styles.activeGridItem,
                  { backgroundColor: theme.tint, shadowColor: theme.tint }
                ]}
                onPress={() => router.push(`/learn/${lang.name.toLowerCase()}` as any)}
              >
                <Ionicons name="earth" size={32} color="#fff" style={styles.gridIcon} />
                <ThemedText style={styles.gridItemName}>{lang.name}</ThemedText>
                <View style={styles.playBadge}>
                  <Ionicons name="play" size={12} color={theme.tint} />
                  <ThemedText style={[styles.playBadgeText, { color: theme.tint }]}>Start</ThemedText>
                </View>
              </TouchableOpacity>
            ))}

            {/* Coming Soon Languages */}
            {COMING_SOON.map((lang) => (
              <View
                key={lang.id}
                style={[
                  styles.gridItem,
                  styles.disabledGridItem,
                  {
                    backgroundColor: isDark ? '#2d3748' : '#f1f5f9',
                    borderColor: isDark ? '#4a5568' : '#e2e8f0'
                  }
                ]}
              >
                <Ionicons name="lock-closed" size={28} color={isDark ? '#4a5568' : '#94a3b8'} style={styles.gridIcon} />
                <ThemedText style={[styles.gridItemNameDisabled, { color: isDark ? '#a0aec0' : '#64748b' }]}>
                  {lang.name}
                </ThemedText>
                <View style={[styles.comingSoonBadge, { backgroundColor: isDark ? '#4a5568' : '#e2e8f0' }]}>
                  <ThemedText style={[styles.comingSoonText, { color: isDark ? '#e2e8f0' : '#475569' }]}>Coming Soon</ThemedText>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  greetingSub: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 4,
  },
  greetingTitle: {
    fontSize: 26,
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionContainer: {
    marginBottom: 32,
  },
  lastSection: {
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
  },

  // Known Languages List
  knownLanguagesList: {
    paddingHorizontal: 20,
    gap: 16,
    paddingBottom: 8,
  },
  knownLanguageCard: {
    width: 160,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    marginRight: 16,
  },
  knownCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  langIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#d97706',
  },
  langName: {
    fontSize: 18,
    marginBottom: 4,
  },
  fluencyText: {
    fontSize: 13,
    color: '#718096',
  },
  addLanguageCard: {
    width: 140,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  addLangText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Empty State
  emptyState: {
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
  },
  emptyStateIconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyStateDesc: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Grid Layout
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    justifyContent: 'flex-start',
  },
  gridItem: {
    width: '45%',
    marginHorizontal: '2.5%',
    marginBottom: 16,
    borderRadius: 24,
    padding: 20,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeGridItem: {
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  disabledGridItem: {
    opacity: 0.8,
  },
  gridIcon: {
    marginBottom: 16,
  },
  gridItemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  gridItemNameDisabled: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  playBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  playBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  comingSoonBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  comingSoonText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
