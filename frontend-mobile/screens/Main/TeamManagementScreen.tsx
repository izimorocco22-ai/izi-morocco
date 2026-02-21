import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert } from 'react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import commonStyles from '../../styles/commonStyles';
import { RFValue } from '../../utils/responsive';
import SplashButton from '../../components/SplashButton';
import ApiService from '../../utils/apiService';
import { apiPaths } from '../../utils/apiPaths';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

export default function TeamManagementScreen() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [team, setTeam] = useState<any | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(false);

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
        setMembers([]);
      }
    } catch (err: any) {
      setTeam(null);
      setMembers([]);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  useEffect(() => {
    const loadMembers = async () => {
      if (!team || !user?.playerId || team.ownerPlayerId !== user.playerId) {
        setMembers([]);
        return;
      }
      try {
        const res = await ApiService({
          method: 'GET',
          endpoint: apiPaths.teamMembers,
        });
        if (res?.success && res?.data?.members) {
          setMembers(res.data.members);
        } else {
          setMembers([]);
        }
      } catch (err: any) {
        setMembers([]);
      }
    };
    loadMembers();
  }, [team, user?.playerId]);

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      Alert.alert('Validation', 'Please enter team name');
      return;
    }
    setLoading(true);
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
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <View style={[commonStyles.container, styles.container]}>
        <Text style={styles.title}>Team Management</Text>

        {team ? (
          <View style={styles.card}>
            <Text style={styles.teamName}>{team.name}</Text>
            {team?.createdAt && (
              <Text style={styles.meta}>
                Created on {new Date(team.createdAt).toLocaleDateString()}
              </Text>
            )}
            {user?.name && (
              <Text style={styles.meta}>Owner: {user.name}</Text>
            )}
            {members.length > 0 && (
              <View style={{ marginTop: RFValue(12) }}>
                <Text style={styles.membersTitle}>Team Members</Text>
                {members.map(m => (
                  <Text key={m.playerId} style={styles.memberItem}>
                    {m.name || m.email || m.playerId}
                  </Text>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.label}>Create your team</Text>
            <TextInput
              placeholder="Enter team name"
              value={teamName}
              onChangeText={setTeamName}
              style={styles.input}
            />
            <SplashButton
              onPress={handleCreateTeam}
              loading={loading}
              loadingText="Creating..."
              buttonStyle={styles.button}
              title="Create Team"
            />
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: RFValue(20),
    paddingTop: RFValue(20),
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: RFValue(20),
  },
  card: {
    paddingVertical: RFValue(12),
    paddingHorizontal: RFValue(14),
    borderRadius: 10,
    backgroundColor: '#f5f7ff',
  },
  teamName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  meta: {
    fontSize: 12,
    color: '#555',
    marginTop: 4,
  },
  form: {
    marginTop: RFValue(10),
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: RFValue(8),
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: RFValue(12),
  },
  button: {
    backgroundColor: '#2f73fd',
    borderRadius: 8,
    height: RFValue(44),
    width: '100%',
  },
  membersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: RFValue(4),
  },
  memberItem: {
    fontSize: 13,
    color: '#333',
    marginTop: 2,
  },
});
