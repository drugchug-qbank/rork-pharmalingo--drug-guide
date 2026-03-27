import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Pill, ArrowRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import MascotAnimated from '@/components/MascotAnimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function WelcomeAuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const mascotScale = useRef(new Animated.Value(0.8)).current;
  const buttonFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(mascotScale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(buttonFade, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={['#0F172A', '#1E293B', '#0F172A']}
      style={styles.container}
    >
      <View style={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 20 }]}>
        <Animated.View style={[styles.heroSection, { opacity: fadeAnim, transform: [{ scale: mascotScale }] }]}>
          <View style={styles.mascotGlow}>
            <MascotAnimated mood="happy" size={120} />
          </View>

          <View style={styles.logoRow}>
            <Pill size={28} color={Colors.primary} />
            <Text style={styles.appName}>PharmaLingo</Text>
          </View>

          <Text style={styles.tagline}>Master pharmacy drugs{'\n'}one quiz at a time</Text>

          <View style={styles.featureRow}>
            {['500+ Drugs', 'Spaced Repetition', 'Gamified'].map((feature, i) => (
              <View key={i} style={styles.featurePill}>
                <Text style={styles.featurePillText}>{feature}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View style={[styles.buttonsSection, { opacity: buttonFade, transform: [{ translateY: slideAnim }] }]}>
          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
            onPress={() => router.push('/auth/sign-up')}
            testID="create-account-button"
          >
            <Text style={styles.primaryButtonText}>Create Account</Text>
            <ArrowRight size={20} color="#FFFFFF" />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
            onPress={() => router.push('/auth/sign-in')}
            testID="sign-in-button"
          >
            <Text style={styles.secondaryButtonText}>Sign In</Text>
          </Pressable>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  heroSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  mascotGlow: {
    padding: 20,
    borderRadius: 80,
    backgroundColor: 'rgba(14, 165, 233, 0.08)',
    marginBottom: 32,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  appName: {
    fontSize: 32,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  featurePill: {
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.2)',
  },
  featurePillText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  buttonsSection: {
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  secondaryButtonPressed: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.8)',
  },
});
