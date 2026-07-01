import React, { useState } from 'react';
import {
  Image,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  Animated,
} from 'react-native';
import commonStyles from '../../styles/commonStyles';
import { RFValue } from '../../utils/responsive';
import SplashButton from '../../components/SplashButton';
import LinearGradient from 'react-native-linear-gradient';
import colors from '../../styles/colors';
import ScreenWrapper from '../../components/ScreenWrapper';

const avatars = [
  require('../../assets/images/avatar/avatar1.png'),
  require('../../assets/images/avatar/avatar2.png'),
  require('../../assets/images/avatar/avatar3.png'),
  require('../../assets/images/avatar/avatar4.png'),
  require('../../assets/images/avatar/avatar5.png'),
  require('../../assets/images/avatar/avatar6.png'),
  require('../../assets/images/avatar/avatar7.png'),
  require('../../assets/images/avatar/avatar8.png'),
];

const ChooseAvatar = ({ navigation }) => {
  const [selectedAvatar, setSelectedAvatar] = useState<number | null>(0);

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
        <View style={[commonStyles.containerPadded, { backgroundColor: 'transparent' }]}>
        <View
          style={[
            commonStyles.col,
            commonStyles.justifyCenter,
            commonStyles.alignCenter,
            { flex: 2 },
          ]}
        >
          {/* Title */}
          <Text style={[commonStyles.h1Text, { marginBottom: RFValue(30) }]}>
            Choose Avatar
          </Text>

          {/* Avatar Grid */}
          <View style={styles.avatarContainer}>
            {avatars.map((avatar, index) => {
              const isSelected = selectedAvatar === index;
              const scaleAnim = new Animated.Value(isSelected ? 1.1 : 1);

              if (isSelected) {
                Animated.spring(scaleAnim, {
                  toValue: 1.1,
                  useNativeDriver: true,
                }).start();
              }

              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedAvatar(index)}
                  activeOpacity={0.7}
                >
                  <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                    {isSelected ? (
                      <LinearGradient
                        colors={[
                          colors.white,
                          colors.primaryLight,
                          colors.primary,
                          colors.primarydark,
                        ]}
                        style={styles.avatarWrapperGradient}
                      >
                        <Image source={avatar} style={styles.avatarImage} />
                      </LinearGradient>
                    ) : (
                      <View style={styles.avatarWrapper}>
                        <Image source={avatar} style={styles.avatarImage} />
                      </View>
                    )}
                  </Animated.View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Button */}
        <View style={styles.buttonContainer}>
          <SplashButton
            title="Confirm Selection"
            onPress={() => {
              navigation.navigate('BottomTabs');
            }}
          />
        </View>
        </View>
      </ScreenWrapper>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  avatarContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: RFValue(15),
    marginBottom: RFValue(30),
  },
  avatarWrapper: {
    backgroundColor: colors.white,
    padding: RFValue(8),
    borderRadius: RFValue(50),
    borderWidth: 2,
    borderColor: colors.inactive,
  },
  avatarWrapperGradient: {
    padding: RFValue(8),
    borderRadius: RFValue(50),
    borderWidth: 2,
    borderColor: colors.primarydark,
  },
  avatarImage: {
    width: RFValue(60),
    height: RFValue(60),
    borderRadius: RFValue(30),
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: RFValue(10),
  },
});

export default ChooseAvatar;
