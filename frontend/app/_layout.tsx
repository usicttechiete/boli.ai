import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

// Keep splash visible until we know the auth state
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

// ── Inner layout that reacts to auth state ──────────────────────────────────

function RootLayoutReactor() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Hide splash once we know auth state
    SplashScreen.hideAsync();

    const inAuthGroup = segments[0] === ('(auth)' as string);

    if (!user && !inAuthGroup) {
      // Not signed in → redirect to login
      router.replace('/(auth)/login' as any);
    } else if (user && inAuthGroup) {
      // Signed in but on auth screen → redirect to tabs
      router.replace('/(tabs)' as any);
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F3EE' }}>
        <ActivityIndicator size="large" color="#E8813C" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
  );
}

// ── Root layout ──────────────────────────────────────────────────────────────

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <RootLayoutReactor />
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
