import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import commonStyles from '../../styles/commonStyles';
import { RFValue } from '../../utils/responsive';
import colors from '../../styles/colors';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { signOut } from '../../store/authSlice';

const ProfileScreen = ({ navigation }: any) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch<any>();

  const handleSignOut = async () => {
    await dispatch(signOut());
    navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] });
  };

  return (
    <ScreenWrapper backgroundColor="#ffffff">
      <ScrollView
        style={commonStyles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Image
              source={require('../../assets/images/user/profile.png')}
              style={styles.avatar}
              resizeMode="cover"
            />
          </View>
          <Text style={styles.name}>{user?.name || 'Player'}</Text>
          <Text style={styles.email}>{user?.email || ''}</Text>
        </View>

        {/* Info Cards */}
        <View style={styles.infoCard}>
          <InfoRow label="Player ID" value={user?.playerId || '-'} />
          <InfoRow label="Phone" value={user?.phone || '-'} />
          <InfoRow label="Email" value={user?.email || '-'} />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenWrapper>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  content: {
    paddingTop: RFValue(30),
    paddingBottom: RFValue(60),
    paddingHorizontal: RFValue(20),
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: RFValue(30),
  },
  avatarCircle: {
    width: RFValue(90),
    height: RFValue(90),
    borderRadius: RFValue(45),
    borderWidth: 3,
    borderColor: colors.primary,
    overflow: 'hidden',
    marginBottom: RFValue(12),
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  name: {
    fontSize: RFValue(20),
    fontFamily: 'Neue-ExtraBold',
    color: colors.textPrimary,
  },
  email: {
    fontSize: RFValue(13),
    color: colors.textSecondary,
    marginTop: RFValue(4),
    fontFamily: 'Neue-Regular',
  },
  infoCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: RFValue(12),
    paddingHorizontal: RFValue(16),
    marginBottom: RFValue(24),
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: RFValue(14),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: RFValue(14),
    color: colors.textSecondary,
    fontFamily: 'Neue-Regular',
  },
  infoValue: {
    fontSize: RFValue(14),
    color: colors.textPrimary,
    fontFamily: 'Neue-Bold',
    maxWidth: '60%',
    textAlign: 'right',
  },
  logoutBtn: {
    backgroundColor: '#fff2f2',
    borderRadius: RFValue(10),
    paddingVertical: RFValue(14),
    alignItems: 'center',
  },
  logoutText: {
    fontSize: RFValue(15),
    color: '#FF3B30',
    fontFamily: 'Neue-Bold',
  },
});

export default ProfileScreen;
