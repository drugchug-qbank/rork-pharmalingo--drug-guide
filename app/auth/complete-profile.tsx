import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, GraduationCap, Briefcase, ChevronRight, Check, Search, X, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useProgress } from '@/contexts/ProgressContext';
import { supabase } from '@/utils/supabase';
import { schools, School } from '@/constants/schoolsData';

type Profession = {
  id: number;
  code: string;
  name: string;
  emoji: string | null;
  active?: boolean;
};

function normalizeProfessionCode(code: string | null | undefined): string {
  return (code ?? '').trim().toLowerCase();
}

export default function CompleteProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Auth: writes username/display_name/etc
  const { completeProfile, refreshProfile, profile, user } = useAuth();

  // Progress: Profile tab reads selectedSchoolName/Id from here
  const { selectSchool } = useProgress();

  const [username, setUsername] = useState<string>('');
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

  // Profession (required)
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [professionsLoading, setProfessionsLoading] = useState<boolean>(false);
  const [professionsError, setProfessionsError] = useState<string>('');
  const [professionModalVisible, setProfessionModalVisible] = useState<boolean>(false);
  const [professionSearchQuery, setProfessionSearchQuery] = useState<string>('');
  const [selectedProfession, setSelectedProfession] = useState<Profession | null>(null);
  const [otherProfessionText, setOtherProfessionText] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [schoolModalVisible, setSchoolModalVisible] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Prefill username if we already have it
  useEffect(() => {
    if (!profile) return;
    if (!username && profile.username) {
      setUsername(profile.username);
    }
  }, [profile, username]);

  // Prefill school if we already have it
  useEffect(() => {
    if (!profile?.school_name) return;
    if (selectedSchool) return;

    const name = profile.school_name;
    if (!name) return;

    const found = schools.find((s) => s.name === name) ?? null;
    if (found) setSelectedSchool(found);
  }, [profile?.school_name, selectedSchool]);

  // Load professions from Supabase (authenticated)
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setProfessionsError('');
      setProfessionsLoading(true);
      try {
        const { data, error: fetchErr } = await supabase
          .from('professions')
          .select('id, code, name, emoji, active')
          .eq('active', true)
          .order('id', { ascending: true });

        if (!mounted) return;

        if (fetchErr) {
          console.log('[CompleteProfile] professions fetch error:', JSON.stringify(fetchErr, null, 2));
          setProfessionsError('Could not load professions. Please try again.');
          setProfessions([]);
        } else {
          setProfessions((data ?? []) as Profession[]);
        }
      } catch (e) {
        if (!mounted) return;
        console.log('[CompleteProfile] professions fetch exception:', e);
        setProfessionsError('Could not load professions. Please try again.');
        setProfessions([]);
      } finally {
        if (mounted) setProfessionsLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Prefill profession if profile already has profession_id
  useEffect(() => {
    const profId = (profile as any)?.profession_id as number | null | undefined;
    if (!profId) return;
    if (!professions.length) return;
    if (selectedProfession) return;

    const found = professions.find((p) => Number(p.id) === Number(profId)) ?? null;
    if (found) setSelectedProfession(found);
  }, [profile, professions, selectedProfession]);

  // Prefill "other profession" from auth metadata if present
  useEffect(() => {
    const isOther = normalizeProfessionCode(selectedProfession?.code) === 'other';
    if (!isOther) return;

    const meta: any = (user as any)?.user_metadata;
    const v = typeof meta?.other_profession_text === 'string' ? meta.other_profession_text : '';
    if (v && !otherProfessionText) {
      setOtherProfessionText(v);
    }
  }, [selectedProfession?.code, otherProfessionText, user]);

  const filteredSchools = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return schools;
    return schools.filter((s) => s.name.toLowerCase().includes(q));
  }, [searchQuery]);

  const filteredProfessions = useMemo(() => {
    const q = professionSearchQuery.trim().toLowerCase();
    if (!q) return professions;
    return professions.filter((p) => {
      return (
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q)
      );
    });
  }, [professions, professionSearchQuery]);

  const isOtherProfession = normalizeProfessionCode(selectedProfession?.code) === 'other';

  const handleSelectSchool = useCallback((school: School) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedSchool(school);
    setSchoolModalVisible(false);
    setSearchQuery('');
  }, []);

  const handleSelectProfession = useCallback((p: Profession) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedProfession(p);
    setProfessionModalVisible(false);
    setProfessionSearchQuery('');
  }, []);

  const renderSchoolItem = useCallback(({ item }: { item: School }) => {
    const isSelected = selectedSchool?.id === item.id;
    return (
      <Pressable
        style={[styles.schoolListItem, isSelected && styles.schoolListItemSelected]}
        onPress={() => handleSelectSchool(item)}
      >
        <GraduationCap size={18} color={isSelected ? Colors.primary : Colors.textSecondary} />
        <Text style={[styles.schoolListName, isSelected && styles.schoolListNameSelected]} numberOfLines={2}>
          {item.name}
        </Text>
        {isSelected && <Check size={18} color={Colors.primary} />}
      </Pressable>
    );
  }, [selectedSchool, handleSelectSchool]);

  const renderProfessionItem = useCallback(({ item }: { item: Profession }) => {
    const isSelected = selectedProfession?.id === item.id;
    return (
      <Pressable
        style={[styles.schoolListItem, isSelected && styles.schoolListItemSelected]}
        onPress={() => handleSelectProfession(item)}
      >
        <Text style={styles.profEmoji}>{item.emoji ?? '💼'}</Text>
        <Text style={[styles.schoolListName, isSelected && styles.schoolListNameSelected]} numberOfLines={2}>
          {item.name}
        </Text>
        {isSelected && <Check size={18} color={Colors.primary} />}
      </Pressable>
    );
  }, [selectedProfession, handleSelectProfession]);

  const handleComplete = async () => {
    setError('');
    setProfessionsError('');

    const usernameTrim = username.trim();
    if (!usernameTrim) {
      setError('Username is required');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (!selectedProfession) {
      setError('Profession is required');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const otherTrim = otherProfessionText.trim();
    if (isOtherProfession && otherTrim.length < 2) {
      setError('Please enter your profession');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);

    try {
      const chosenSchoolName = selectedSchool?.name ?? null;

      // 1) Save profile fields (username + display name + school name)
      await completeProfile(
        usernameTrim,
        usernameTrim,
        chosenSchoolName
      );

      // 2) Set profession (required for leaderboards)
      const professionCode = selectedProfession.code;
      const { error: profErr } = await supabase.rpc('set_my_profession', { p_profession_code: professionCode });
      if (profErr) {
        console.log('[CompleteProfile] set_my_profession error:', JSON.stringify(profErr, null, 2));
        throw new Error(profErr.message || 'Failed to set profession');
      }

      // 3) If profession is "Other", capture the free-text suggestion (non-fatal if it fails)
      try {
        if (isOtherProfession && otherTrim) {
          const uid = user?.id ?? (await supabase.auth.getUser()).data.user?.id;
          if (uid) {
            const { error: sugErr } = await supabase
              .from('profession_suggestions')
              .insert({ user_id: uid, suggestion: otherTrim });

            if (sugErr) {
              console.log('[CompleteProfile] profession_suggestions insert error (non-fatal):', JSON.stringify(sugErr, null, 2));
            }
          }
        }
      } catch (sugCatch) {
        console.log('[CompleteProfile] profession_suggestions insert exception (non-fatal):', sugCatch);
      }

      /**
       * 4) IMPORTANT: The user’s Profile tab shows school from ProgressContext,
       * not directly from Supabase.
       *
       * So we sync school into local progress state immediately after saving.
       */
      try {
        const { data: userRes, error: userErr } = await supabase.auth.getUser();
        const authedUser = userRes?.user;

        if (userErr || !authedUser) {
          console.log('[CompleteProfile] Could not get authed user to sync school:', userErr);
        } else {
          // Ensure school_name is set exactly as selected (trigger will resolve UUID)
          if (chosenSchoolName) {
            const { error: schoolWriteErr } = await supabase
              .from('profiles')
              .update({ school_name: chosenSchoolName })
              .eq('id', authedUser.id);

            if (schoolWriteErr) {
              console.log('[CompleteProfile] Extra school_name write failed:', JSON.stringify(schoolWriteErr, null, 2));
            }
          }

          // Fetch saved profile row so we get the REAL school_id UUID
          const { data: savedProfile, error: fetchErr } = await supabase
            .from('profiles')
            .select('school_id, school_name')
            .eq('id', authedUser.id)
            .single();

          if (fetchErr) {
            console.log('[CompleteProfile] Fetch profile after save failed:', JSON.stringify(fetchErr, null, 2));
            // Fallback: set school name locally so UI shows something
            selectSchool(null, chosenSchoolName ?? null);
          } else {
            const schoolId = (savedProfile as any)?.school_id ?? null;
            const schoolName = (savedProfile as any)?.school_name ?? chosenSchoolName ?? null;
            selectSchool(schoolId, schoolName);
          }
        }
      } catch (syncErr) {
        console.log('[CompleteProfile] Post-save school sync exception:', syncErr);
        if (selectedSchool?.name) selectSchool(null, selectedSchool.name);
      }

      // Keep auth profile in sync too (so AuthContext sees profession_id)
      try {
        await refreshProfile();
      } catch (e) {
        console.log('[CompleteProfile] refreshProfile failed (non-fatal):', e);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // If your app uses needsProfile redirects, navigation isn't necessary.
      // router.replace('/(tabs)');
      // router.replace('/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save profile';
      setError(message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const professionLabel = useMemo(() => {
    if (!selectedProfession) return null;
    const emoji = selectedProfession.emoji ? `${selectedProfession.emoji} ` : '';
    return `${emoji}${selectedProfession.name}`.trim();
  }, [selectedProfession]);

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
          <View style={styles.headerSection}>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>Tell us a bit about yourself</Text>
          </View>

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username *</Text>
              <View style={styles.inputContainer}>
                <User size={18} color={Colors.textTertiary} />
                <TextInput
                  style={styles.input}
                  placeholder="Choose a username"
                  placeholderTextColor={Colors.textTertiary}
                  value={username}
                  onChangeText={(t) => { setUsername(t); setError(''); }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  testID="username-input"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Profession *</Text>

              <Pressable
                style={styles.schoolSelector}
                onPress={() => setProfessionModalVisible(true)}
                testID="profession-selector"
              >
                <Briefcase size={18} color={selectedProfession ? Colors.primary : Colors.textTertiary} />
                <Text
                  style={[styles.schoolSelectorText, selectedProfession && styles.schoolSelectorTextActive]}
                  numberOfLines={1}
                >
                  {professionLabel ?? 'Tap to choose your profession'}
                </Text>
                <ChevronRight size={18} color={Colors.textTertiary} />
              </Pressable>

              {professionsError ? (
                <View style={styles.smallErrorBanner}>
                  <Text style={styles.smallErrorText}>{professionsError}</Text>
                </View>
              ) : null}

              {isOtherProfession ? (
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.helperText}>What best describes your profession?</Text>
                  <View style={styles.inputContainer}>
                    <Sparkles size={18} color={Colors.textTertiary} />
                    <TextInput
                      style={styles.input}
                      placeholder="Type your profession (e.g., Respiratory Therapy)"
                      placeholderTextColor={Colors.textTertiary}
                      value={otherProfessionText}
                      onChangeText={(t) => { setOtherProfessionText(t); setError(''); }}
                      autoCapitalize="words"
                      autoCorrect={false}
                      testID="other-profession-input"
                    />
                  </View>
                </View>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>School (optional)</Text>
              <Pressable
                style={styles.schoolSelector}
                onPress={() => setSchoolModalVisible(true)}
                testID="school-selector"
              >
                <GraduationCap size={18} color={selectedSchool ? Colors.primary : Colors.textTertiary} />
                <Text style={[styles.schoolSelectorText, selectedSchool && styles.schoolSelectorTextActive]} numberOfLines={1}>
                  {selectedSchool?.name ?? 'Tap to choose your school'}
                </Text>
                <ChevronRight size={18} color={Colors.textTertiary} />
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.submitButton,
                loading && styles.submitButtonDisabled,
                pressed && !loading && styles.submitButtonPressed,
              ]}
              onPress={handleComplete}
              disabled={loading}
              testID="complete-profile-button"
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Get Started</Text>
              )}
            </Pressable>

            {!selectedSchool && (
              <Pressable
                style={styles.skipSchool}
                onPress={handleComplete}
                disabled={loading}
              >
                <Text style={styles.skipSchoolText}>Skip school for now</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Profession Modal */}
      <Modal
        visible={professionModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setProfessionModalVisible(false);
          setProfessionSearchQuery('');
        }}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose Profession</Text>
            <Pressable
              onPress={() => { setProfessionModalVisible(false); setProfessionSearchQuery(''); }}
              style={styles.modalCloseBtn}
            >
              <X size={20} color={Colors.text} />
            </Pressable>
          </View>

          <View style={styles.searchContainer}>
            <Search size={16} color={Colors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search professions..."
              placeholderTextColor={Colors.textTertiary}
              value={professionSearchQuery}
              onChangeText={setProfessionSearchQuery}
              autoCorrect={false}
            />
          </View>

          {professionsLoading ? (
            <View style={{ padding: 20 }}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : (
            <FlatList
              data={filteredProfessions}
              renderItem={renderProfessionItem}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.schoolList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptySearch}>
                  <Text style={styles.emptySearchText}>No professions found</Text>
                </View>
              }
            />
          )}
        </View>
      </Modal>

      {/* School Modal */}
      <Modal
        visible={schoolModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setSchoolModalVisible(false);
          setSearchQuery('');
        }}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose School</Text>
            <Pressable
              onPress={() => { setSchoolModalVisible(false); setSearchQuery(''); }}
              style={styles.modalCloseBtn}
            >
              <X size={20} color={Colors.text} />
            </Pressable>
          </View>

          <View style={styles.searchContainer}>
            <Search size={16} color={Colors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search schools..."
              placeholderTextColor={Colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
            />
          </View>

          <FlatList
            data={filteredSchools}
            renderItem={renderSchoolItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.schoolList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptySearch}>
                <Text style={styles.emptySearchText}>No schools found</Text>
              </View>
            }
          />
        </View>
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
  headerSection: {
    marginBottom: 24,
    marginTop: 20,
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
  smallErrorBanner: {
    backgroundColor: Colors.errorLight,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  smallErrorText: {
    fontSize: 12,
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
  helperText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginLeft: 4,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  schoolSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  schoolSelectorText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textTertiary,
  },
  schoolSelectorTextActive: {
    color: Colors.text,
  },
  submitButton: {
    marginTop: 6,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonPressed: {
    opacity: 0.9,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800' as const,
  },
  skipSchool: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipSchoolText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: Colors.text,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    margin: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  schoolList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 10,
  },
  schoolListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  schoolListItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  schoolListName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  schoolListNameSelected: {
    color: Colors.primary,
  },
  emptySearch: {
    padding: 30,
    alignItems: 'center',
  },
  emptySearchText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  profEmoji: {
    fontSize: 18,
  },
});
