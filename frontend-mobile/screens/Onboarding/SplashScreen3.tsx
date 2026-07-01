import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import commonStyles from '../../styles/commonStyles';
import LinearGradient from 'react-native-linear-gradient';
import { RFValue } from '../../utils/responsive';
import colors from '../../styles/colors';
import SplashButton from '../../components/SplashButton';
import LottieView from 'lottie-react-native';
import ScreenWrapper from '../../components/ScreenWrapper';

const SplashScreen3 = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    // Start animations when component mounts
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={[
        colors.white,
        colors.white,
        colors.primaryLight,
        colors.primary,
      ]}
      style={{ flex: 1 }}
    >
      <ScreenWrapper>
        <View style={[commonStyles.containerPadded, { flex: 1, backgroundColor: 'transparent' }]}>
        <View style={[commonStyles.fullFlex, commonStyles.justifyBetween]}>
          {/* Main content */}
          <Animated.View
            style={[
              styles.mainContent,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {/* Logo container with glow effect */}
            <View style={styles.logoContainer}>
              <LottieView
                source={require('../../assets/animation/splash3.json')}
                autoPlay
                loop
                style={styles.logo}
              />
            </View>

            {/* App name */}
            <Animated.View
              style={[
                styles.titleContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <Text style={[commonStyles.h2Text]}>Screen 3</Text>
            </Animated.View>

            <Animated.View
              style={[
                styles.descriptionContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <Text
                style={[
                  commonStyles.pText,
                  { color: colors.black, textAlign: 'center' },
                ]}
              >
                Welcome to your amazing journey. Experience something
                extraordinary with our innovative platform.
              </Text>
            </Animated.View>
          </Animated.View>

          <Animated.View
            style={[
              styles.buttonWrapper,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <SplashButton
              title={"Let's Start "}
              onPress={() => {
                navigation.navigate('SignIn');
              }}
            />
          </Animated.View>
        </View>
        </View>
      </ScreenWrapper>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  mainContent: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  logoContainer: {
    position: 'relative',
    marginBottom: RFValue(32),
  },
  logo: {
    width: RFValue(200),
    height: RFValue(200),
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: RFValue(14),
  },
  descriptionContainer: {
    alignItems: 'center',
    paddingHorizontal: RFValue(10),
  },
  buttonWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
  },
});

export default SplashScreen3;
