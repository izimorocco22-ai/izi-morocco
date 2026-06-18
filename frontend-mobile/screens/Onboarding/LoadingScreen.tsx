import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import commonStyles from '../../styles/commonStyles';
import { RFValue } from '../../utils/responsive';
import colors from '../../styles/colors';
import LinearGradient from 'react-native-linear-gradient';
import LottieView from 'lottie-react-native';
import ScreenWrapper from '../../components/ScreenWrapper';

const LoadingScreen = () => {
  const progress = useRef(new Animated.Value(0)).current;
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    // Animate progress bar from 0 → 100 in 5 seconds
    Animated.timing(progress, {
      toValue: 100,
      duration: 2000,
      easing: Easing.linear,
      useNativeDriver: false, // width animation needs false
    }).start();

    // Interval to update text percentage
    const interval = setInterval(() => {
      progress.addListener(({ value }) => {
        setPercent(Math.round(value));
      });
    }, 100);

    return () => {
      clearInterval(interval);
      progress.removeAllListeners();
    };
  }, []);

  const barWidth = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <ScreenWrapper>
      <LinearGradient
        colors={[
          colors.white,
          colors.white,
          colors.primaryLight,
          colors.primary,
        ]}
        style={[
          commonStyles.containerPadded,
          commonStyles.col,
          commonStyles.justifyCenter,
          commonStyles.alignCenter,
          { flex: 1 },
        ]}
      >
        {/* Logo */}
        <Image
          source={require('../../assets/images/logo/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Progress bar container */}
        <LottieView
          source={require('../../assets/animation/loader.json')}
          autoPlay
          loop
          style={[{ height: 70, width: 240 }]}
          resizeMode="cover"
        />
      </LinearGradient>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  logo: {
    width: RFValue(200),
    height: RFValue(200),
    marginBottom: 40,
  },

  progressContainer: {
    width: '70%',
    height: 12,
    marginTop: 5,
    backgroundColor: '#e0e0e0',
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.secondary,
  },
});

export default LoadingScreen;
