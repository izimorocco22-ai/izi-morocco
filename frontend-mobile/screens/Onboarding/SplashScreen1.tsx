import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { RFValue } from '../../utils/responsive';
import colors from '../../styles/colors';
import SplashButton from '../../components/SplashButton';
import ScreenWrapper from '../../components/ScreenWrapper';

const { width, height } = Dimensions.get('window');

const SplashScreen1 = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <ScreenWrapper>
      <LinearGradient
        colors={['#ffffff', '#ffffff', colors.primaryLight, colors.primary]}
        style={styles.gradient}
      >
        {/* Center Content */}
        <Animated.View
          style={[
            styles.centerContent,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
            },
          ]}
        >
          <Image
            source={require('../../assets/images/logo/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>IZI Morocco</Text>
          <Text style={styles.description}>
            Welcome to your amazing journey.{'\n'}
            Discover the hidden treasures of{'\n'}
            Morocco's rich culture and history.
          </Text>
        </Animated.View>

        {/* Bottom Button */}
        <Animated.View
          style={[styles.buttonWrapper, { opacity: fadeAnim }]}
        >
          <SplashButton
            title="Continue"
            onPress={() => navigation.navigate('Splash2')}
          />
        </Animated.View>
      </LinearGradient>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: RFValue(24),
    paddingTop: height * 0.1,
    paddingBottom: height * 0.06,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  logo: {
    width: RFValue(150),
    height: RFValue(150),
    marginBottom: RFValue(24),
  },
  appName: {
    fontSize: RFValue(26),
    color: colors.textPrimary,
    fontFamily: 'Neue-ExtraBold',
    marginBottom: RFValue(16),
    textAlign: 'center',
  },
  description: {
    fontSize: RFValue(15),
    color: colors.textPrimary,
    fontFamily: 'Neue-Regular',
    textAlign: 'center',
    lineHeight: RFValue(24),
    opacity: 0.75,
    paddingHorizontal: RFValue(10),
  },
  buttonWrapper: {
    width: '100%',
    alignItems: 'center',
  },
});

export default SplashScreen1;
