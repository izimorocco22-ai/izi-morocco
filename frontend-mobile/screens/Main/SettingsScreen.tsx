// screens/Main/SettingsScreen.tsx
import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Switch, Image } from 'react-native';
import { useDispatch } from 'react-redux';
import SplashButton from '../../components/SplashButton';
import { signOut } from '../../store/authSlice';
import ScreenWrapper from '../../components/ScreenWrapper';
import commonStyles from '../../styles/commonStyles';
import { RFValue } from '../../utils/responsive';

export default function SettingsScreen({ navigation }) {
  const dispatch = useDispatch<any>();
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleSignOut = async () => {
    await dispatch(signOut());
    navigation.reset({
      index: 0,
      routes: [{ name: 'SignIn' }],
    });
  };

  const SettingItem = ({ icon, iconColor,iconBg, title, onPress, showArrow = true, showSwitch = false, switchValue, onSwitchChange, isDestructive = false }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={showSwitch ? 1 : 0.7}
      disabled={showSwitch}
    >
      <View style={styles.leftContent}>
        <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
          <Image source={icon} style={[styles.icon,{tintColor:iconColor}]} />
        </View>
        <Text style={[styles.settingText, isDestructive && styles.destructiveText]}>
          {title}
        </Text>
      </View>
      {showArrow && <Image source={require('../../assets/images/setting/rightArrow.png')} style={styles.arrow}/>}
      {showSwitch && (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: '#E5E5EA', true: '#34C759' }}
          thumbColor="#FFFFFF"
        />
      )}
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper>
      <View style={[commonStyles.container]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[commonStyles.scrollContainer, styles.scrollContent]}
        >
          <SettingItem
            icon={require('../../assets/images/setting/user.png')}
            iconBg="#fff7eb"
            iconColor="#fda01c"
            title="Personal Info"
            onPress={() => navigation.navigate('EditProfile')}
          />
          <SettingItem
            icon={require('../../assets/images/setting/user.png')}
            iconBg="#edf3ff"
            iconColor="#2f73fd"
            title="Team Management"
            onPress={() => navigation.navigate('TeamManagement')}
          />

          <SettingItem
            icon={require('../../assets/images/setting/help.png')}
            iconBg="#edf8f1"
            iconColor="#24d496"
            title="Help Center"
            onPress={() => navigation.navigate('Help')}
          />

          <SettingItem
            icon={require('../../assets/images/setting/about.png')}
            iconBg="#edf3ff"
            iconColor="#2f73fd"
            title="About"
            onPress={() => navigation.navigate('About')}
          />

          <SettingItem
            icon={require('../../assets/images/setting/logout.png')}
            iconBg="#fff2f2"
            iconColor="#ff7784"
            title="Logout"
            onPress={handleSignOut}
            showArrow={false}
            isDestructive={true}
          />
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 0,
    marginBottom: 12,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  icon: {
    height: RFValue(20),
    width: RFValue(20),
    objectFit: 'contain',
  },
  settingText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  destructiveText: {
    color: '#FF3B30',
  },
  arrow: {
    height: 24,
    width: 24,
    objectFit:'contain',
  },
});
