import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Animated, Image, Platform } from 'react-native';

export type MascotMood =
  | 'idle'
  | 'happy'
  | 'celebrating'
  | 'sad'
  | 'thinking'
  | 'encouraging'
  | 'waving'
  | 'shocked'
  | 'sleeping'
  | 'dancing';

interface MascotAnimatedProps {
  mood?: MascotMood;
  size?: number;
  showSpeechBubble?: boolean;
}

const MASCOT_URI = { uri: 'https://r2-pub.rork.com/attachments/67l8h3n3f7mxzmlge3ezj' };

export default React.memo(function MascotAnimated({
  mood = 'idle',
  size = 120,
}: MascotAnimatedProps) {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    bounceAnim.setValue(0);
    rotateAnim.setValue(0);
    scaleAnim.setValue(1);
    opacityAnim.setValue(1);
    shakeAnim.setValue(0);
    floatAnim.setValue(0);

    let animation: Animated.CompositeAnimation | undefined;

    switch (mood) {
      case 'idle':
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(floatAnim, { toValue: -8, duration: 1500, useNativeDriver: true }),
            Animated.timing(floatAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
          ])
        );
        break;

      case 'happy':
        animation = Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(bounceAnim, { toValue: -18, duration: 250, useNativeDriver: true }),
              Animated.timing(scaleAnim, { toValue: 1.12, duration: 250, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(bounceAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
              Animated.timing(scaleAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
            ]),
            Animated.delay(200),
          ])
        );
        break;

      case 'celebrating':
        animation = Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(bounceAnim, { toValue: -25, duration: 200, useNativeDriver: true }),
              Animated.timing(rotateAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
              Animated.timing(scaleAnim, { toValue: 1.2, duration: 200, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(bounceAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
              Animated.timing(rotateAnim, { toValue: -1, duration: 200, useNativeDriver: true }),
              Animated.timing(scaleAnim, { toValue: 0.95, duration: 200, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(bounceAnim, { toValue: -20, duration: 200, useNativeDriver: true }),
              Animated.timing(rotateAnim, { toValue: 0.5, duration: 200, useNativeDriver: true }),
              Animated.timing(scaleAnim, { toValue: 1.15, duration: 200, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(bounceAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
              Animated.timing(rotateAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
              Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
            ]),
          ])
        );
        break;

      case 'sad':
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(bounceAnim, { toValue: 6, duration: 800, useNativeDriver: true }),
            Animated.timing(bounceAnim, { toValue: 4, duration: 800, useNativeDriver: true }),
          ])
        );
        Animated.timing(scaleAnim, { toValue: 0.88, duration: 400, useNativeDriver: true }).start();
        Animated.timing(rotateAnim, { toValue: -0.5, duration: 400, useNativeDriver: true }).start();
        break;

      case 'thinking':
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(rotateAnim, { toValue: 0.8, duration: 600, useNativeDriver: true }),
            Animated.timing(rotateAnim, { toValue: -0.4, duration: 600, useNativeDriver: true }),
            Animated.timing(rotateAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
            Animated.delay(500),
          ])
        );
        break;

      case 'encouraging':
        animation = Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(scaleAnim, { toValue: 1.08, duration: 400, useNativeDriver: true }),
              Animated.timing(bounceAnim, { toValue: -6, duration: 400, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(scaleAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
              Animated.timing(bounceAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
            ]),
            Animated.delay(600),
          ])
        );
        break;

      case 'waving':
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(rotateAnim, { toValue: 2, duration: 200, useNativeDriver: true }),
            Animated.timing(rotateAnim, { toValue: -2, duration: 200, useNativeDriver: true }),
            Animated.timing(rotateAnim, { toValue: 2, duration: 200, useNativeDriver: true }),
            Animated.timing(rotateAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
            Animated.delay(1000),
          ])
        );
        break;

      case 'shocked':
        Animated.parallel([
          Animated.timing(scaleAnim, { toValue: 1.25, duration: 150, useNativeDriver: true }),
          Animated.timing(bounceAnim, { toValue: -15, duration: 150, useNativeDriver: true }),
        ]).start(() => {
          Animated.parallel([
            Animated.spring(scaleAnim, { toValue: 1.05, useNativeDriver: true, friction: 3 }),
            Animated.spring(bounceAnim, { toValue: 0, useNativeDriver: true, friction: 3 }),
          ]).start();
        });
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 3, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -3, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 2, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -2, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
            Animated.delay(800),
          ])
        );
        break;

      case 'sleeping':
        Animated.timing(rotateAnim, { toValue: -1.5, duration: 600, useNativeDriver: true }).start();
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 1.04, duration: 1200, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 0.96, duration: 1200, useNativeDriver: true }),
          ])
        );
        break;

      case 'dancing':
        animation = Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(bounceAnim, { toValue: -14, duration: 180, useNativeDriver: true }),
              Animated.timing(rotateAnim, { toValue: 3, duration: 180, useNativeDriver: true }),
              Animated.timing(shakeAnim, { toValue: 6, duration: 180, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(bounceAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
              Animated.timing(rotateAnim, { toValue: -3, duration: 180, useNativeDriver: true }),
              Animated.timing(shakeAnim, { toValue: -6, duration: 180, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(bounceAnim, { toValue: -10, duration: 180, useNativeDriver: true }),
              Animated.timing(rotateAnim, { toValue: 2, duration: 180, useNativeDriver: true }),
              Animated.timing(shakeAnim, { toValue: 4, duration: 180, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(bounceAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
              Animated.timing(rotateAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
              Animated.timing(shakeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
            ]),
          ])
        );
        break;
    }

    if (animation) {
      animation.start();
    }

    return () => {
      if (animation) animation.stop();
    };
  }, [mood, bounceAnim, rotateAnim, scaleAnim, opacityAnim, shakeAnim, floatAnim]);

  const rotateInterpolation = rotateAnim.interpolate({
    inputRange: [-5, 5],
    outputRange: ['-5deg', '5deg'],
  });

  const overlayColor = useMemo(() => {
    switch (mood) {
      case 'happy':
      case 'celebrating':
      case 'dancing':
        return 'rgba(34,197,94,0.12)';
      case 'sad':
      case 'shocked':
        return 'rgba(239,68,68,0.12)';
      case 'thinking':
        return 'rgba(14,165,233,0.12)';
      default:
        return 'transparent';
    }
  }, [mood]);

  const shadowStyle = useMemo(() => {
    if (mood === 'celebrating' || mood === 'dancing') {
      return {
        shadowColor: '#22C55E',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
      };
    }
    if (mood === 'sad' || mood === 'shocked') {
      return {
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
      };
    }
    return {
      shadowColor: '#0EA5E9',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    };
  }, [mood]);

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      <View style={[styles.glowCircle, { 
        width: size * 0.8, 
        height: size * 0.8, 
        borderRadius: size * 0.4,
        backgroundColor: overlayColor,
      }]} />
      <Animated.View
        style={[
          styles.mascotContainer,
          { width: size, height: size },
          shadowStyle,
          {
            transform: [
              { translateY: Animated.add(bounceAnim, floatAnim) },
              { translateX: shakeAnim },
              { rotate: rotateInterpolation },
              { scale: scaleAnim },
            ],
            opacity: opacityAnim,
          },
        ]}
      >
        <Image
          source={Platform.OS === 'web' ? MASCOT_URI : MASCOT_URI}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowCircle: {
    position: 'absolute',
  },
  mascotContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
