// screens/Main/SettingsScreen.tsx
import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Switch, Image, TextInput, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import SplashButton from '../../components/SplashButton';
import { signOut } from '../../store/authSlice';
import ScreenWrapper from '../../components/ScreenWrapper';
import commonStyles from '../../styles/commonStyles';
import { RFValue } from '../../utils/responsive';
import ApiService from '../../utils/apiService';
import { apiPaths } from '../../utils/apiPaths';
import { RootState } from '../../store/store';

export default function SettingsScreen({ navigation }) {
  const dispatch = useDispatch<any>();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const user = useSelector((state: RootState) => state.auth.user);
  const [teamName, setTeamName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [team, setTeam] = useState<any | null>(null);

  const fetchTeam = async () => {
    try {
      const res = await ApiService({
        method: 'GET',
        endpoint: apiPaths.teamMe,
      });
      if (res?.success && res?.data) {
        setTeam(res.data);
      } else {
        setTeam(null);
      }
    } catch (err: any) {
      setTeam(null);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleSignOut = async () => {
    await dispatch(signOut());
    navigation.reset({
      index: 0,
      routes: [{ name: 'SignIn' }],
    });
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      Alert.alert('Validation', 'Please enter team name');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await ApiService({
        method: 'POST',
        endpoint: apiPaths.teamCreate,
        data: { name: teamName.trim() },
      });
      if (res?.success && res?.data) {
        setTeam(res.data);
        setTeamName('');
      } else if (res?.message) {
        Alert.alert('Error', res.message);
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to create team';
      Alert.alert('Error', msg);
    } finally {
      setIsSubmitting(false);
    }
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

          <View style={{ marginTop: RFValue(10), marginBottom: RFValue(20) }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                marginBottom: RFValue(8),
              }}>
              Team
            </Text>
            {team ? (
              <View
                style={{
                  paddingVertical: RFValue(10),
                  paddingHorizontal: RFValue(12),
                  borderRadius: 8,
                  backgroundColor: '#f5f7ff',
                }}>
                <Text style={{ fontSize: 16, fontWeight: '500' }}>
                  {team.name}
                </Text>
                {team?.createdAt && (
                  <Text style={{ fontSize: 12, color: '#555', marginTop: 4 }}>
                    Created on {new Date(team.createdAt).toLocaleDateString()}
                  </Text>
                )}
                {user?.name && (
                  <Text style={{ fontSize: 12, color: '#555', marginTop: 4 }}>
                    Owner: {user.name}
                  </Text>
                )}
              </View>
            ) : (
              <View>
                <TextInput
                  placeholder="Enter team name"
                  value={teamName}
                  onChangeText={setTeamName}
                  style={{
                    borderWidth: 1,
                    borderColor: '#ddd',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 14,
                    marginBottom: RFValue(12),
                  }}
                />
                <SplashButton
                  onPress={handleCreateTeam}
                  loading={isSubmitting}
                  loadingText="Creating..."
                  buttonStyle={{
                    backgroundColor: '#2f73fd',
                    borderRadius: 8,
                    height: RFValue(44),
                    width: '100%',
                  }}
                  title="Create Team"
                />
              </View>
            )}
          </View>

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
