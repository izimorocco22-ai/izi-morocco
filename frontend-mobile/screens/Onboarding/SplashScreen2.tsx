import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Animated,
} from 'react-native';
import commonStyles from '../../styles/commonStyles';
import LinearGradient from 'react-native-linear-gradient';
import { RFValue } from '../../utils/responsive';
import colors from '../../styles/colors';
import SplashButton from '../../components/SplashButton';
import {
  promptForEnableLocationIfNeeded,
  AndroidLocationEnablerResult,
} from 'react-native-android-location-enabler';
import ScreenWrapper from '../../components/ScreenWrapper';

const SplashScreen2 = ({ navigation }) => {
  const [checking, setChecking] = useState(false);
  const [showPermissionBox, setShowPermissionBox] = useState(false);

  // Function to request location permission
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        enableGPS();
      } else {
        setShowPermissionBox(true);
      }
    } else {
      navigation.replace('SignIn');
    }
  };

  // Function to ask user to enable GPS
  const enableGPS = async () => {
    try {
      const result = await promptForEnableLocationIfNeeded({
        interval: 10000,
        fastInterval: 5000,
      });
      navigation.replace('SignIn');
    } catch (err) {
      setShowPermissionBox(true);
    }
  };

  // On mount: check permission and GPS
  useEffect(() => {
    const checkPermissions = async () => {
      setChecking(true);

      if (Platform.OS === 'android') {
        const hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );

        if (hasPermission) {
          enableGPS();
        } else {
          setShowPermissionBox(true);
        }
      } else {
        navigation.replace('SignIn');
      }

      setChecking(false);
    };

    checkPermissions();
  }, []);

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
    <ScreenWrapper>
      <LinearGradient
        colors={[
          colors.white,
          colors.white,
          colors.primaryLight,
          colors.primary,
        ]}
        style={[commonStyles.containerPadded, { position: 'relative' }]}
      >
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
              <Image
                source={require('../../assets/images/splash/splash-location.png')}
                style={styles.logo}
                resizeMode="contain"
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
              <Text style={[commonStyles.h2Text, { textAlign: 'center' }]}>
                Location Needed for Your Quest
              </Text>
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
                The Treasure Hut adventure relies on real-world locations. Allow
                location access so you don’t miss hidden treasures. If you
                decline, you won’t be able to proceed.
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
            {/* instead of calling requestLocationPermission directly → open modal */}
            <SplashButton
              title={checking ? 'Checking...' : 'Allow Location'}
              onPress={() => setShowPermissionBox(true)}
            />
          </Animated.View>
        </View>

        {/* Custom Permission Modal */}
        <Modal transparent visible={showPermissionBox} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={[commonStyles.h2Text, { textAlign: 'center' }]}>
                Permission Required
              </Text>
              <Text style={[commonStyles.pText, { textAlign: 'center' }]}>
                You need to allow location access to continue your treasure
                hunt!
              </Text>

              <View style={styles.modalActions}>
                {/* Continue without location */}
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    { backgroundColor: colors.black },
                  ]}
                  onPress={() => {
                    setShowPermissionBox(false);
                  }}
                >
                  <Text style={styles.modalBtnText}>No, Stay</Text>
                </TouchableOpacity>

                {/* Ask system permission */}
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={() => {
                    setShowPermissionBox(false);
                    requestLocationPermission();
                  }}
                >
                  <Text style={styles.modalBtnText}>Yes, Allow</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </ScreenWrapper>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    padding: RFValue(20),
    borderRadius: RFValue(12),
    width: '80%',
  },
  modalTitle: {
    fontSize: RFValue(18),
    fontWeight: 'bold',
    marginBottom: RFValue(10),
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: RFValue(14),
    textAlign: 'center',
    marginBottom: RFValue(20),
    color: colors.black,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: RFValue(20),
  },
  modalButton: {
    flex: 1,
    padding: RFValue(10),
    marginHorizontal: RFValue(5),
    borderRadius: RFValue(8),
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default SplashScreen2;
