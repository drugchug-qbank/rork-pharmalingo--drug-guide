import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Phone, ChevronRight, X, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { supabase } from '@/utils/supabase';

const PROFESSIONS = [
  { code: 'pharmacy', name: 'Pharmacy', emoji: '💊' },
  { code: 'nursing', name: 'Nursing', emoji: '🩺' },
  { code: 'pa', name: 'Physician Assistant', emoji: '🧑‍⚕️' },
  { code: 'physician_md', name: 'Physician MD', emoji: '🩻' },
  { code: 'physician_do', name: 'Physician DO', emoji: '🩻' },
  { code: 'dentistry', name: 'Dentistry', emoji: '🦷' },
  { code: 'other', name: 'Other', emoji: '✨' },
] as const;

type ProfessionCode = typeof PROFESSIONS[number]['code'];

function normalizePhone(input: string): string {
  const raw = (input ?? '').trim();
  if (!raw) return '';
  const keepPlus = raw.startsWith('+');
  const digits = raw.replace(/[^\d]/g, '');
  return (keepPlus ? '+' : '') + digits;
}

function digitCount(normalized: string): number {
  return (normalized ?? '').replace(/[^\d]/g, '').length;
}

export default function SignUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>(''); // Optional for now (goal: required + verified later)
  const [professionCode, setProfessionCode] = useState<ProfessionCode | null>(null);
  const [otherProfessionText, setOtherProfessionText] = useState<string>('');

  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [professionModalOpen, setProfessionModalOpen] = useState<boolean>(false);

  const phoneRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const normalizedPhone = useMemo(() => normalizePhone(phone), [phone]);

  const selectedProfession = useMemo(() => {
    if (!professionCode) return null;
    return PROFESSIONS.find(p => p.code === professionCode) ?? null;
  }, [professionCode]);

  const validate = (): boolean => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email');
      return false;
    }

    // Phone is optional for now, but validate it if provided
    if (normalizedPhone) {
      const digits = digitCount(normalizedPhone);
      if (digits < 10) {
        setError('Please enter a valid phone number (include country code if possible).');
        return false;
      }
    }

    // ✅ Profession is required (for Profession Leaderboard)
    if (!professionCode) {
      setError('Please choose your profession.');
      return false;
    }

    // If "Other", capture what they meant
    if (professionCode === 'other' && !otherProfessionText.trim()) {
      setError('Please enter your profession.');
      return false;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSignUp = async () => {
    setError('');
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    // TS guard (validate already ensures this)
    const prof = professionCode;
    if (!prof) {
      setError('Please choose your profession.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    try {
      const metadata: Record<string, any> = {
        profession_code: prof, // ✅ required for DB trigger -> profiles.profession_id
      };

      if (prof === 'other' && otherProfessionText.trim()) {
        metadata.other_profession_text = otherProfessionText.trim();
      }

      // Store phone number on the auth user as metadata (attached at signup)
      // Your DB trigger can copy + hash this into your private phone table later.
      if (normalizedPhone) {
        metadata.phone = normalizedPhone;
      }

      const payload: any = {
        email: email.trim(),
        password,
        options: { data: metadata },
      };

      const { data, error: signUpError } = await supabase.auth.signUp(payload);
      if (signUpError) throw signUpError;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const needsConfirmation = !data.session;
      if (needsConfirmation) {
        router.replace('/auth/email-confirmation');
      } else {
        router.replace('/auth/complete-profile');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            testID="back-button"
          >
            <ArrowLeft size={24} color={Colors.text} />
          </Pressable>

          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start your pharmacology learning journey</Text>

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputContainer}>
                <Mail size={18} color={Colors.textTertiary} />
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={Colors.textTertiary}
                  value={email}
                  onChangeText={(t) => { setEmail(t); setError(''); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => phoneRef.current?.focus()}
                  testID="email-input"
                />
              </View>
            </View>

            {/* Phone (optional for now) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone (optional for now)</Text>
              <View style={styles.inputContainer}>
                <Phone size={18} color={Colors.textTertiary} />
                <TextInput
                  ref={phoneRef}
                  style={styles.input}
                  placeholder="+1 555 123 4567"
                  placeholderTextColor={Colors.textTertiary}
                  value={phone}
                  onChangeText={(t) => { setPhone(t); setError(''); }}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  testID="phone-input"
                />
              </View>
              <Text style={styles.helperText}>
                Used for “Find My Friends” and future security verification (SMS). We don’t show your phone number publicly.
              </Text>
            </View>

            {/* Profession (required) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Profession</Text>

              <Pressable
                style={({ pressed }) => [
                  styles.selectContainer,
                  pressed && styles.selectContainerPressed,
                ]}
                onPress={() => setProfessionModalOpen(true)}
                testID="profession-picker"
              >
                <Text style={styles.selectEmoji}>{selectedProfession?.emoji ?? '✨'}</Text>
                <Text
                  style={[
                    styles.selectValue,
                    !selectedProfession && styles.selectPlaceholder,
                  ]}
                  numberOfLines={1}
                >
                  {selectedProfession?.name ?? 'Select your profession…'}
                </Text>
                <ChevronRight size={18} color={Colors.textTertiary} />
              </Pressable>

              {professionCode === 'other' ? (
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.helperText}>What best describes your profession?</Text>
                  <View style={styles.inputContainer}>
                    <Sparkles size={18} color={Colors.textTertiary} />
                    <TextInput
                      style={styles.input}
                      placeholder="Type your profession (e.g., Respiratory Therapy)"
                      placeholderTextColor={Colors.textTertiary}
                      value={otherProfessionText}
                      onChangeText={setOtherProfessionText}
                      autoCapitalize="words"
                      autoCorrect={false}
                      testID="other-profession-input"
                    />
                  </View>
                </View>
              ) : null}

              <Text style={styles.helperText}>
                This sets which Profession you represent on the monthly Profession Leaderboard.
              </Text>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <Lock size={18} color={Colors.textTertiary} />
                <TextInput
                  ref={passwordRef}
                  style={styles.input}
                  placeholder="At least 6 characters"
                  placeholderTextColor={Colors.textTertiary}
                  value={password}
                  onChangeText={(t) => { setPassword(t); setError(''); }}
                  secureTextEntry={!showPassword}
                  returnKeyType="next"
                  onSubmitEditing={() => confirmRef.current?.focus()}
                  testID="password-input"
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                  {showPassword ? <EyeOff size={18} color={Colors.textTertiary} /> : <Eye size={18} color={Colors.textTertiary} />}
                </Pressable>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputContainer}>
                <Lock size={18} color={Colors.textTertiary} />
                <TextInput
                  ref={confirmRef}
                  style={styles.input}
                  placeholder="Re-enter your password"
                  placeholderTextColor={Colors.textTertiary}
                  value={confirmPassword}
                  onChangeText={(t) => { setConfirmPassword(t); setError(''); }}
                  secureTextEntry={!showConfirm}
                  returnKeyType="done"
                  onSubmitEditing={handleSignUp}
                  testID="confirm-password-input"
                />
                <Pressable onPress={() => setShowConfirm(!showConfirm)} hitSlop={8}>
                  {showConfirm ? <EyeOff size={18} color={Colors.textTertiary} /> : <Eye size={18} color={Colors.textTertiary} />}
                </Pressable>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.submitButton,
                loading && styles.submitButtonDisabled,
                pressed && !loading && styles.submitButtonPressed,
              ]}
              onPress={handleSignUp}
              disabled={loading}
              testID="submit-signup-button"
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Create Account</Text>
              )}
            </Pressable>
          </View>

          <Pressable
            style={styles.switchLink}
            onPress={() => router.replace('/auth/sign-in')}
          >
            <Text style={styles.switchLinkText}>
              Already have an account? <Text style={styles.switchLinkBold}>Sign In</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Profession picker modal */}
      <Modal
        visible={professionModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setProfessionModalOpen(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setProfessionModalOpen(false)}
          testID="profession-modal-overlay"
        >
          <Pressable
            style={styles.modalCard}
            onPress={() => { /* eat presses */ }}
            testID="profession-modal-card"
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Profession</Text>
              <Pressable
                onPress={() => setProfessionModalOpen(false)}
                style={styles.modalCloseBtn}
                hitSlop={8}
                testID="profession-modal-close"
              >
                <X size={18} color={Colors.text} />
              </Pressable>
            </View>

            {PROFESSIONS.map((p) => {
              const isSelected = professionCode === p.code;
              return (
                <Pressable
                  key={p.code}
                  style={[styles.modalRow, isSelected && styles.modalRowSelected]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setProfessionCode(p.code);
                    setProfessionModalOpen(false);
                    setError('');
                  }}
                  testID={`profession-option-${p.code}`}
                >
                  <Text style={[styles.modalRowText, isSelected && styles.modalRowTextSelected]}>
                    {p.emoji} {p.name}
                  </Text>
                  {isSelected ? <Text style={styles.modalCheck}>✓</Text> : null}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.surfaceAlt,
  },
  title: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  errorBanner: {
    backgroundColor: Colors.errorLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.error,
    textAlign: 'center',
  },
  form: {
    gap: 18,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: Colors.surfaceAlt,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontWeight: '600' as const,
    marginLeft: 4,
    lineHeight: 16,
    marginTop: 2,
  },

  // Profession picker row (matches input style)
  selectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: Colors.surfaceAlt,
  },
  selectContainerPressed: {
    transform: [{ scale: 0.99 }],
  },
  selectEmoji: {
    fontSize: 18,
  },
  selectValue: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  selectPlaceholder: {
    color: Colors.textTertiary,
    fontWeight: '600' as const,
  },

  submitButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  switchLink: {
    alignItems: 'center',
    marginTop: 28,
    paddingVertical: 8,
  },
  switchLinkText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  switchLinkBold: {
    fontWeight: '700' as const,
    color: Colors.primary,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceAlt,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: Colors.text,
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.surfaceAlt,
    marginTop: 8,
  },
  modalRowSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  modalRowText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  modalRowTextSelected: {
    color: Colors.primary,
    fontWeight: '800' as const,
  },
  modalCheck: {
    fontSize: 16,
    fontWeight: '900' as const,
    color: Colors.primary,
  },
});
