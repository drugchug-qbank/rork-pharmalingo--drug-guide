import React, { useState, useCallback } from 'react';
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
import { User, GraduationCap, ChevronRight, Check, Search, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useProgress } from '@/contexts/ProgressContext';
import { supabase } from '@/utils/supabase';
import { schools, School } from '@/constants/schoolsData';

export default function CompleteProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Auth: writes username/display_name/etc
  const { completeProfile, refreshProfile } = useAuth();

  // Progress: Profile tab reads selectedSchoolName/Id from here
  const { selectSchool } = useProgress();

  const [username, setUsername] = useState<string>('');
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [schoolModalVisible, setSchoolModalVisible] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredSchools = searchQuery.trim()
    ? schools.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : schools;

  const handleComplete = async () => {
    setError('');

    const usernameRaw = username.trim();
    const usernameTrim = usernameRaw.startsWith('@') ? usernameRaw.slice(1).trim() : usernameRaw;

    if (!usernameTrim) {
      setError('Username is required');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    // Never allow an email to be used as a public username
    if (usernameTrim.includes('@')) {
      setError('Username cannot be an email address');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    // Basic rules (keep in sync with AuthContext validation)
    if (/\s/.test(usernameTrim)) {
      setError('Username cannot contain spaces');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (!/^[A-Za-z0-9_.]+$/.test(usernameTrim)) {
      setError('Username can only use letters, numbers, _ and .');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (usernameTrim.length < 3 || usernameTrim.length > 20) {
      setError('Username must be 3–20 characters');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);

    try {
      const chosenSchoolName = selectedSchool?.name ?? null;

      // 1) Save profile fields (username + display name + school name)
      await completeProfile(
        usernameTrim,
        usernameTrim.toLowerCase(),
        chosenSchoolName
      );

      /**
       * 2) IMPORTANT: The user’s Profile tab shows school from ProgressContext,
       * not directly from Supabase.
       *
       * So we sync school into local progress state immediately after saving.
       */
      try {
        const { data: userRes, error: userErr } = await supabase.auth.getUser();
        const user = userRes?.user;

        if (userErr || !user) {
          console.log('[CompleteProfile] Could not get authed user to sync school:', userErr);
        } else {
          // (Optional but safe) ensure school_name is set exactly as selected (trigger will resolve UUID)
          // This protects you even if completeProfile() ever changes internally.
          if (chosenSchoolName) {
            const { error: schoolWriteErr } = await supabase
              .from('profiles')
              .update({ school_name: chosenSchoolName })
              .eq('id', user.id);

            if (schoolWriteErr) {
              console.log('[CompleteProfile] Extra school_name write failed:', JSON.stringify(schoolWriteErr, null, 2));
            }
          }

          // Fetch the saved profile row so we get the REAL school_id UUID
          const { data: savedProfile, error: fetchErr } = await supabase
            .from('profiles')
            .select('school_id, school_name')
            .eq('id', user.id)
            .single();

          if (fetchErr) {
            console.log('[CompleteProfile] Fetch profile after save failed:', JSON.stringify(fetchErr, null, 2));

            // Fallback: at least set the school name locally so UI shows something
            if (chosenSchoolName) {
              selectSchool(null, chosenSchoolName);
            } else {
              selectSchool(null, null);
            }
          } else {
            const schoolId = savedProfile?.school_id ?? null;
            const schoolName = savedProfile?.school_name ?? chosenSchoolName ?? null;

            // ✅ This is the key line that prevents needing to re-select on Profile tab
            selectSchool(schoolId, schoolName);
          }
        }
      } catch (syncErr) {
        console.log('[CompleteProfile] Post-save school sync exception:', syncErr);
        // Last-resort fallback
        if (selectedSchool?.name) selectSchool(null, selectedSchool.name);
      }

      // Keep auth profile in sync too (nice-to-have)
      try {
        await refreshProfile();
      } catch (e) {
        console.log('[CompleteProfile] refreshProfile failed (non-fatal):', e);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // If your app already auto-redirects after profile completion, you can remove this.
      // Leaving it alone is safest. If you DO need navigation, uncomment one of these:
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

  const handleSelectSchool = useCallback((school: School) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedSchool(school);
    setSchoolModalVisible(false);
    setSearchQuery('');
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
                <Text style={styles.skipSchoolText}>Skip for now</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
  schoolSelector: {
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
  schoolSelectorText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.textTertiary,
  },
  schoolSelectorTextActive: {
    color: Colors.text,
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
  skipSchool: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipSchoolText: {
    fontSize: 15,
    fontWeight: '600' as const,
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceAlt,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900' as const,
    color: Colors.text,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 14,
    paddingHorizontal: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.surfaceAlt,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  schoolList: {
    padding: 20,
    paddingBottom: 100,
  },
  schoolListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.surfaceAlt,
  },
  schoolListItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  schoolListName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  schoolListNameSelected: {
    color: Colors.primary,
    fontWeight: '700' as const,
  },
  emptySearch: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptySearchText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textTertiary,
  },
});
