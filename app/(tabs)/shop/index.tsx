import React, { useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Coins, Play, Sparkles, ShoppingBag, Zap, Gift, Shield, Clock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useProgress } from '@/contexts/ProgressContext';

interface ShopItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  price: string;
  priceType: 'coins' | 'ad' | 'free';
  onPress: () => void;
  disabled?: boolean;
  highlight?: boolean;
}

const ShopItem = React.memo(function ShopItem({
  icon,
  title,
  description,
  price,
  priceType,
  onPress,
  disabled = false,
  highlight = false,
}: ShopItemProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [disabled, scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
    }).start();
  }, [scaleAnim]);

  const handlePress = useCallback(() => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  }, [disabled, onPress]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.shopItem,
          highlight && styles.shopItemHighlight,
          disabled && styles.shopItemDisabled,
        ]}
        testID={`shop-item-${title.toLowerCase().replace(/\s/g, '-')}`}
      >
        <View style={[styles.shopItemIcon, highlight && styles.shopItemIconHighlight]}>
          {icon}
        </View>
        <View style={styles.shopItemInfo}>
          <Text style={[styles.shopItemTitle, highlight && styles.shopItemTitleHighlight]}>
            {title}
          </Text>
          <Text style={styles.shopItemDesc}>{description}</Text>
        </View>
        <View style={[
          styles.priceTag,
          priceType === 'ad' && styles.priceTagAd,
          priceType === 'free' && styles.priceTagFree,
          highlight && styles.priceTagHighlight,
        ]}>
          {priceType === 'coins' && <Coins size={14} color={Colors.gold} />}
          {priceType === 'ad' && <Play size={14} color="#FFFFFF" />}
          <Text style={[
            styles.priceText,
            priceType === 'ad' && styles.priceTextAd,
            priceType === 'free' && styles.priceTextFree,
          ]}>
            {price}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
});

export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const { progress, buyHeartWithCoins, buyFullRefillWithCoins, watchAdForHeart, buyStreakSave, heartCountdownSeconds, getMaxStreakSaves } = useProgress();
  const [watchingAd, setWatchingAd] = useState<boolean>(false);
  const heartsFull = progress.stats.hearts >= progress.stats.heartsMax;

  const handleBuyOneHeart = useCallback(() => {
    if (progress.stats.coins < 30) {
      Alert.alert('Not Enough Coins! 😢', 'You need 30 coins to buy a heart. Complete more lessons to earn coins!');
      return;
    }
    if (heartsFull) {
      Alert.alert('Hearts Full! 💖', 'Your hearts are already full!');
      return;
    }
    buyHeartWithCoins();
    Alert.alert('Heart Purchased! 💖', 'You got +1 heart!');
  }, [progress.stats.coins, heartsFull, buyHeartWithCoins]);

  const handleBuyFullRefill = useCallback(() => {
    if (progress.stats.coins < 100) {
      Alert.alert('Not Enough Coins! 😢', 'You need 100 coins for a full refill. Keep learning to earn more!');
      return;
    }
    if (heartsFull) {
      Alert.alert('Hearts Full! 💖', 'Your hearts are already full!');
      return;
    }
    buyFullRefillWithCoins();
    Alert.alert('Hearts Refilled! 💖💖💖💖💖', 'All your hearts have been restored!');
  }, [progress.stats.coins, heartsFull, buyFullRefillWithCoins]);

  const maxStreakSaves = getMaxStreakSaves(progress.stats.streakCurrent);
  const currentStreakSaves = progress.stats.streakSaves ?? 0;
  const streakSavesFull = currentStreakSaves >= maxStreakSaves;

  const handleBuyStreakSave = useCallback(() => {
    if (streakSavesFull) {
      Alert.alert('Already Full! 🛡️', `You already have the maximum of ${maxStreakSaves} streak save(s). ${maxStreakSaves < 3 ? 'Reach a higher streak to unlock more slots!' : ''}`);
      return;
    }
    if (progress.stats.coins < 200) {
      Alert.alert('Not Enough Coins! 😢', 'You need 200 coins to buy a Streak Save.');
      return;
    }
    buyStreakSave();
    Alert.alert('Streak Save Purchased! 🛡️', `You now have ${currentStreakSaves + 1}/${maxStreakSaves} streak save(s).`);
  }, [progress.stats.coins, streakSavesFull, maxStreakSaves, currentStreakSaves, buyStreakSave]);

  const handleWatchAd = useCallback(() => {
    if (heartsFull) {
      Alert.alert('Hearts Full! 💖', 'Your hearts are already full!');
      return;
    }
    setWatchingAd(true);
    setTimeout(() => {
      watchAdForHeart();
      setWatchingAd(false);
      Alert.alert('Heart Earned! 💖', 'You watched an ad and earned +1 heart!');
    }, 2000);
  }, [heartsFull, watchAdForHeart]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerRow}>
          <ShoppingBag size={28} color="#FFFFFF" />
          <Text style={styles.headerTitle}>Shop</Text>
        </View>
        <Text style={styles.headerSubtitle}>Power up your learning!</Text>

        <View style={styles.walletRow}>
          <View style={styles.walletItem}>
            <Heart size={20} color={Colors.accent} fill={Colors.accent} />
            <Text style={styles.walletValue}>{progress.stats.hearts}</Text>
            <Text style={styles.walletLabel}>Hearts</Text>
          </View>
          <View style={styles.walletDivider} />
          <View style={styles.walletItem}>
            <Coins size={20} color={Colors.gold} />
            <Text style={styles.walletValue}>{progress.stats.coins}</Text>
            <Text style={styles.walletLabel}>Coins</Text>
          </View>
          <View style={styles.walletDivider} />
          <View style={styles.walletItem}>
            <Zap size={20} color="#FFFFFF" />
            <Text style={styles.walletValue}>{progress.stats.xpTotal}</Text>
            <Text style={styles.walletLabel}>XP</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heartsDisplay}>
          {Array.from({ length: 5 }).map((_, i) => (
            <View key={i} style={styles.heartSlot}>
              <Heart
                size={32}
                color={i < progress.stats.hearts ? Colors.accent : Colors.border}
                fill={i < progress.stats.hearts ? Colors.accent : 'transparent'}
              />
            </View>
          ))}
        </View>

        {heartCountdownSeconds > 0 && (
          <View style={styles.regenBanner}>
            <Clock size={14} color={Colors.gold} />
            <Text style={styles.regenText}>
              Next heart in{' '}
              <Text style={styles.regenTime}>
                {Math.floor(heartCountdownSeconds / 60)}:{(heartCountdownSeconds % 60).toString().padStart(2, '0')}
              </Text>
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>❤️ Hearts</Text>
        <Text style={styles.sectionDesc}>
          Need more hearts? Buy them with coins or watch a short ad!
        </Text>

        <ShopItem
          icon={<Heart size={24} color={Colors.accent} fill={Colors.accent} />}
          title="+1 Heart"
          description="Get one extra heart"
          price="30"
          priceType="coins"
          onPress={handleBuyOneHeart}
          disabled={heartsFull}
        />

        <ShopItem
          icon={<Sparkles size={24} color={Colors.gold} />}
          title="Full Refill"
          description="Restore all 5 hearts"
          price="100"
          priceType="coins"
          onPress={handleBuyFullRefill}
          disabled={heartsFull}
          highlight
        />

        <ShopItem
          icon={<Play size={24} color={Colors.primary} />}
          title="Watch Ad"
          description={watchingAd ? 'Watching ad...' : 'Watch a short ad for +1 heart'}
          price="FREE"
          priceType="ad"
          onPress={handleWatchAd}
          disabled={heartsFull || watchingAd}
        />

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>🛡️ Streak Protection</Text>
        <Text style={styles.sectionDesc}>
          Protect your streak if you miss a day of practice!
        </Text>

        <ShopItem
          icon={<Shield size={24} color={Colors.primary} />}
          title="Streak Save"
          description={`You have ${currentStreakSaves}/${maxStreakSaves} saved • Protects 1 missed day`}
          price="200"
          priceType="coins"
          onPress={handleBuyStreakSave}
          disabled={streakSavesFull}
          highlight={!streakSavesFull}
        />

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>🪙 Earn Coins</Text>
        <Text style={styles.sectionDesc}>
          Complete lessons to earn coins automatically!
        </Text>

        <View style={styles.earnCard}>
          <View style={styles.earnRow}>
            <View style={styles.earnIcon}>
              <Gift size={20} color={Colors.primary} />
            </View>
            <View style={styles.earnInfo}>
              <Text style={styles.earnTitle}>Complete a Lesson</Text>
              <Text style={styles.earnDesc}>Earn coins based on XP gained</Text>
            </View>
            <View style={styles.earnReward}>
              <Coins size={14} color={Colors.gold} />
              <Text style={styles.earnRewardText}>~5-20</Text>
            </View>
          </View>
        </View>

        <View style={styles.earnCard}>
          <View style={styles.earnRow}>
            <View style={styles.earnIcon}>
              <Zap size={20} color={Colors.gold} />
            </View>
            <View style={styles.earnInfo}>
              <Text style={styles.earnTitle}>Perfect Score Bonus</Text>
              <Text style={styles.earnDesc}>100% on any lesson</Text>
            </View>
            <View style={styles.earnReward}>
              <Coins size={14} color={Colors.gold} />
              <Text style={styles.earnRewardText}>+17</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    fontWeight: '600' as const,
  },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  walletItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  walletValue: {
    fontSize: 20,
    fontWeight: '900' as const,
    color: '#FFFFFF',
  },
  walletLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600' as const,
  },
  walletDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  heartsDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
    marginTop: 8,
  },
  heartSlot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  regenBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.goldLight,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  regenText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#92400E',
  },
  regenTime: {
    fontWeight: '800' as const,
    fontVariant: ['tabular-nums'] as const,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  shopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  shopItemHighlight: {
    borderColor: Colors.gold,
    backgroundColor: '#FFFBEB',
  },
  shopItemDisabled: {
    opacity: 0.5,
  },
  shopItemIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopItemIconHighlight: {
    backgroundColor: Colors.goldLight,
  },
  shopItemInfo: {
    flex: 1,
    marginLeft: 14,
  },
  shopItemTitle: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  shopItemTitleHighlight: {
    color: '#92400E',
  },
  shopItemDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: '500' as const,
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.goldLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  priceTagAd: {
    backgroundColor: Colors.primary,
  },
  priceTagFree: {
    backgroundColor: Colors.success,
  },
  priceTagHighlight: {
    backgroundColor: Colors.gold,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#92400E',
  },
  priceTextAd: {
    color: '#FFFFFF',
  },
  priceTextFree: {
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 20,
  },
  earnCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  earnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  earnIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  earnInfo: {
    flex: 1,
    marginLeft: 12,
  },
  earnTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  earnDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  earnReward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.goldLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  earnRewardText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#92400E',
  },
});
