import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProgressProvider, useProgress } from "@/contexts/ProgressContext";
import { XpSyncProvider } from "@/contexts/XpSyncContext";
import StreakBreakModal from "@/components/StreakBreakModal";
import Colors from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof Error && error.name === 'AbortError') return false;
        if (error instanceof Error && error.message?.includes('signal is aborted')) return false;
        return failureCount < 2;
      },
      networkMode: 'online',
    },
    mutations: {
      retry: false,
      networkMode: 'online',
    },
  },
});

function StreakBreakGuard() {
  const {
    progress,
    streakBreakPending,
    useStreakSave,
    acceptStreakBreak,
    buyStreakSave,
  } = useProgress();

  const applyStreakSave = useStreakSave;

  const handleBuyAndUse = React.useCallback(() => {
    if (progress.stats.coins >= 200) {
      buyStreakSave();
      setTimeout(() => applyStreakSave(), 50);
    }
  }, [progress.stats.coins, buyStreakSave, applyStreakSave]);

  return (
    <StreakBreakModal
      visible={streakBreakPending}
      streakCount={progress.stats.streakCurrent}
      streakSaves={progress.stats.streakSaves ?? 0}
      coins={progress.stats.coins}
      onUseStreakSave={useStreakSave}
      onBuyStreakSave={handleBuyAndUse}
      onAcceptBreak={acceptStreakBreak}
    />
  );
}

function AuthGate() {
  const { isLoading, isAuthenticated, isProfileComplete, needsProfile } = useAuth();
  const segments = useSegments() as string[];
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!isAuthenticated) {
      if (!inAuthGroup) {
        console.log('[AuthGate] Not authenticated, redirecting to welcome');
        router.replace('/auth/welcome');
      }
    } else if (needsProfile) {
      if (segments[1] !== 'complete-profile') {
        console.log('[AuthGate] Needs profile, redirecting to complete-profile');
        router.replace('/auth/complete-profile');
      }
    } else if (isProfileComplete && inAuthGroup) {
      console.log('[AuthGate] Authenticated + profile complete, redirecting to main app');
      router.replace('/');
    }
  }, [isLoading, isAuthenticated, isProfileComplete, needsProfile, segments, router]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return null;
}

function RootLayoutNav() {
  const { isAuthenticated, isProfileComplete } = useAuth();

  return (
    <>
      <AuthGate />
      <Stack screenOptions={{ headerBackTitle: "Back" }}>
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="lesson"
          options={{
            headerShown: false,
            presentation: "fullScreenModal",
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="lesson-complete"
          options={{
            headerShown: false,
            presentation: "fullScreenModal",
            gestureEnabled: false,
          }}
        />
      </Stack>
      {isAuthenticated && isProfileComplete && <StreakBreakGuard />}
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView>
        <AuthProvider>
          <ProgressProvider>
            <XpSyncProvider>
              <RootLayoutNav />
            </XpSyncProvider>
          </ProgressProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
});
