// screens/Main/SettingsScreen.tsx
import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Image,
  Alert,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { ArrowLeft } from 'lucide-react-native';
import { deleteAccount, signOut } from '../../store/authSlice';
import ScreenWrapper from '../../components/ScreenWrapper';
import { RFValue } from '../../utils/responsive';
import colors from '../../styles/colors';

export default function SettingsScreen({ navigation }) {
  const dispatch = useDispatch<any>();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSignOut = async () => {
    await dispatch(signOut());
    navigation.reset({
      index: 0,
      routes: [{ name: 'SignIn' }],
    });
  };

  const performDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await dispatch(deleteAccount()).unwrap();
      Alert.alert('Account deleted', 'Your account has been permanently deleted.');
      navigation.reset({
        index: 0,
        routes: [{ name: 'SignIn' }],
      });
    } catch (error: any) {
      setIsDeleting(false);
      Alert.alert(
        'Could not delete account',
        error?.message || 'Something went wrong. Please try again.',
      );
    }
  };

  const confirmDeleteAccount = () => {
    if (isDeleting) return;
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account, your team and your game history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: performDeleteAccount },
      ],
    );
  };

  const SettingItem = ({
    icon,
    iconColor,
    iconBg,
    title,
    subtitle,
    onPress,
    showArrow = true,
    showSwitch = false,
    switchValue,
    onSwitchChange,
    isDestructive = false,
    isLast = false,
  }: any) => (
    <TouchableOpacity
      style={[styles.settingItem, !isLast && styles.settingItemDivider]}
      onPress={onPress}
      activeOpacity={showSwitch ? 1 : 0.6}
      disabled={showSwitch}
    >
      <View style={styles.leftContent}>
        <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
          <Image source={icon} style={[styles.icon, { tintColor: iconColor }]} />
        </View>
        <View style={styles.textWrap}>
          <Text
            style={[styles.settingText, isDestructive && styles.destructiveText]}
          >
            {title}
          </Text>
          {subtitle ? <Text style={styles.settingSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {showArrow && (
        <Image
          source={require('../../assets/images/setting/rightArrow.png')}
          style={styles.arrow}
        />
      )}
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
    <ScreenWrapper backgroundColor="#ffffff">
      <View style={styles.container}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={RFValue(22)} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Account section */}
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <View style={styles.card}>
            <SettingItem
              icon={require('../../assets/images/setting/user.png')}
              iconBg="#fff7eb"
              iconColor="#fda01c"
              title="Personal Info"
              subtitle="Name & email"
              onPress={() => navigation.navigate('Profile')}
            />
            <SettingItem
              icon={require('../../assets/images/setting/user.png')}
              iconBg="#edf3ff"
              iconColor="#2f73fd"
              title="Team Management"
              subtitle="Manage your team"
              onPress={() => navigation.navigate('TeamManagement')}
            />
            <SettingItem
              icon={require('../../assets/images/setting/delete.png')}
              iconBg="#fff2f2"
              iconColor="#FF3B30"
              title="Delete Account"
              subtitle={isDeleting ? 'Deleting...' : 'Permanently delete your account'}
              onPress={confirmDeleteAccount}
              isDestructive
              isLast
            />
          </View>

          {/* Support section */}
          <Text style={styles.sectionLabel}>SUPPORT</Text>
          <View style={styles.card}>
            <SettingItem
              icon={require('../../assets/images/setting/help.png')}
              iconBg="#edf8f1"
              iconColor="#24d496"
              title="Help Center"
              subtitle="Get help & support"
              onPress={() => navigation.navigate('Help')}
            />
            <SettingItem
              icon={require('../../assets/images/setting/about.png')}
              iconBg="#edf3ff"
              iconColor="#2f73fd"
              title="About"
              subtitle="App info & version"
              onPress={() => navigation.navigate('About')}
              isLast
            />
          </View>

          {/* Logout */}
          <View style={[styles.card, styles.logoutCard]}>
            <SettingItem
              icon={require('../../assets/images/setting/logout.png')}
              iconBg="#fff2f2"
              iconColor="#ff7784"
              title="Logout"
              onPress={handleSignOut}
              showArrow={false}
              isDestructive={true}
              isLast
            />
          </View>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: RFValue(16),
    paddingVertical: RFValue(12),
  },
  backBtn: {
    width: RFValue(40),
    height: RFValue(40),
    borderRadius: RFValue(20),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f7',
  },
  headerTitle: {
    fontSize: RFValue(18),
    color: colors.textPrimary,
    fontFamily: 'Neue-ExtraBold',
  },
  scrollContent: {
    paddingHorizontal: RFValue(18),
    paddingTop: RFValue(8),
    paddingBottom: RFValue(40),
  },
  sectionLabel: {
    fontSize: RFValue(11),
    color: colors.textSecondary,
    fontFamily: 'Neue-Bold',
    letterSpacing: 1,
    marginBottom: RFValue(8),
    marginTop: RFValue(16),
    marginLeft: RFValue(4),
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: RFValue(16),
    paddingHorizontal: RFValue(14),
    borderWidth: 1,
    borderColor: '#f0f0f2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutCard: {
    marginTop: RFValue(24),
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: RFValue(14),
  },
  settingItemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f4',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: RFValue(44),
    height: RFValue(44),
    borderRadius: RFValue(14),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: RFValue(14),
  },
  icon: {
    height: RFValue(20),
    width: RFValue(20),
    objectFit: 'contain',
  },
  textWrap: {
    flex: 1,
  },
  settingText: {
    fontSize: RFValue(15),
    color: colors.textPrimary,
    fontFamily: 'Neue-Bold',
  },
  settingSubtitle: {
    fontSize: RFValue(12),
    color: colors.textSecondary,
    fontFamily: 'Neue-Regular',
    marginTop: RFValue(2),
  },
  destructiveText: {
    color: '#FF3B30',
  },
  arrow: {
    height: RFValue(22),
    width: RFValue(22),
    objectFit: 'contain',
  },
});
