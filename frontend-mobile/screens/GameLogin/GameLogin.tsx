// screens/GameLogin/GameLogin.tsx
import React, { useRef, useState } from 'react';
import { View, Text, Dimensions, TouchableOpacity, Image, Animated, Alert, Platform } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import colors from '../../styles/colors';
import commonStyles from '../../styles/commonStyles';
import CustomInput from '../../components/CustomInput';
import { RFValue } from '../../utils/responsive';
import SplashButton from '../../components/SplashButton';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useDispatch } from 'react-redux';
import { gameLogin } from '../../store/gameSlice';
import { ToastAndroid } from 'react-native';
import { offlineManager } from '../../utils/offlineManager';
import ApiService from '../../utils/apiService';
import { apiPaths } from '../../utils/apiPaths';

const { height } = Dimensions.get('window');

// ToastAndroid is a no-op on iOS, so fall back to an Alert there.
const showMessage = (message: string) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.LONG);
  } else {
    Alert.alert('Game Login', message);
  }
};

export default function GameLogin({ navigation, route }) {
  const { activationCode, game, qrGameID } = route.params || {};
  const gameId = qrGameID ? qrGameID : game?._id;
  const [activeCode, setActiveCode] = useState(activationCode || '');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'single' | 'team'>('single');
  const [teamName, setTeamName] = useState('');
  const [errors, setErrors] = useState<{ code?: string; team?: string }>({});
  const tabAnim = useRef(new Animated.Value(0)).current;
  const dispatch = useDispatch<any>();

  const switchMode = (next: 'single' | 'team') => {
    if (next === mode) return;
    setMode(next);
    Animated.timing(tabAnim, {
      toValue: next === 'single' ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleSignIn = async () => {
    const code = activeCode.trim();
    const nextErrors: { code?: string; team?: string } = {};
    if (!code) nextErrors.code = 'Please enter activation code';
    if (mode === 'team' && !teamName.trim()) nextErrors.team = 'Please enter team name';
    setErrors(nextErrors);
    if (nextErrors.code || nextErrors.team) return;

    setLoading(true);

    if (mode === 'team') {

      try {
        await ApiService({
          method: 'POST',
          endpoint: apiPaths.teamJoin,
          data: { name: teamName.trim() },
        });
      } catch (error: any) {
        const msg =
          error?.response?.data?.message ||
          error?.message ||
          'Unable to join team';
        showMessage(msg);
        setLoading(false);
        return;
      }
    }

    try {
      const result = await dispatch(gameLogin({ activeCode: code, gameId })).unwrap();
      console.log({result})
      navigation.navigate('Map', {
        questions: result?.game?.questions || [],
        game: result?.game,
        activeCode: code,
        gameId,
      });
    } catch (error) {
      // Check offline capability
      try {
        const offlineGame = await offlineManager.loadGame(gameId);
        const offlineCore = offlineGame && offlineGame.game ? offlineGame.game : null;

        if (offlineCore) {
          const offlineQuestions = Array.isArray(offlineCore.questions)
            ? offlineCore.questions
            : [];

          showMessage('Playing in Offline Mode');
          navigation.navigate('Map', {
            questions: offlineQuestions,
            game: offlineCore,
            activeCode: code,
            gameId,
          });
          setLoading(false);
          return;
        }
      } catch (e) {
        console.log('Offline load failed', e);
      }

      // Try to read backend message
      const errorMessage = error?.message || 'Login failed. Please try again.';
      console.log({ error });

      showMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  // sample steps - this array would come from backend in real app

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
        <View
          style={[
            commonStyles.fullFlex,
            commonStyles.col,
            commonStyles.justifyBetween,
            { paddingHorizontal: RFValue(15) },
          ]}
        >
          <View
            style={[
              commonStyles.col,
              commonStyles.justifyCenter,
              commonStyles.alignCenter,
              { flex: 1, width: '100%' },
            ]}
          >
            <View style={{ marginBottom: RFValue(20) }}>
              <Text
                style={[
                  commonStyles.h1Text,
                  { textAlign: 'center', color: colors.black },
                ]}
              >
                Game Login
              </Text>
              <Text
                style={[
                  commonStyles.pText,
                  { textAlign: 'center', color: colors.black },
                ]}
              >
                After enter the credentials you can start the game
              </Text>
            </View>

            <View
              style={{
                flexDirection: 'row',
                borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.6)',
                padding: 4,
                marginBottom: RFValue(20),
                overflow: 'hidden',
              }}
            >
              <Animated.View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: 4,
                  bottom: 4,
                  width: '50%',
                  borderRadius: 999,
                  backgroundColor: 'white',
                  transform: [
                    {
                      translateX: tabAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 150],
                      }),
                    },
                  ],
                }}
              />
              <View style={{ flex: 1 }}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={{
                    paddingVertical: RFValue(8),
                    alignItems: 'center',
                  }}
                  onPress={() => switchMode('single')}
                >
                  <Text
                    style={{
                      color: '#000',
                      fontWeight: mode === 'single' ? '700' : '500',
                    }}
                  >
                    Single
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1 }}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={{
                    paddingVertical: RFValue(8),
                    alignItems: 'center',
                  }}
                  onPress={() => switchMode('team')}
                >
                  <Text
                    style={{
                      color: '#000',
                      fontWeight: mode === 'team' ? '700' : '500',
                    }}
                  >
                    Team
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <CustomInput
              error={errors.code}
              label="Activation Code"
              value={activeCode}
              onChangeText={(text: string) => {
                setActiveCode(text);
                if (errors.code) setErrors(prev => ({ ...prev, code: undefined }));
              }}
              placeholder="Enter your Game ID"
            />

            {mode === 'team' && (
              <View style={{ marginTop: RFValue(12), width: '100%' }}>
                <CustomInput
                  error={errors.team}
                  label="Team Name"
                  value={teamName}
                  onChangeText={(text: string) => {
                    setTeamName(text);
                    if (errors.team) setErrors(prev => ({ ...prev, team: undefined }));
                  }}
                  placeholder="Enter your Team Name"
                />
              </View>
            )}

            <SplashButton
              onPress={handleSignIn}
              loading={loading}
              loadingText="Loading..."
              buttonStyle={{
                backgroundColor: colors.primarydark,
                borderRadius: 8,
                height: RFValue(50),
                width: '100%',
                marginTop: RFValue(20),
              }}
              title="Login"
            />

            <View
              style={[
                commonStyles.row,
                { gap: RFValue(10), marginTop: RFValue(20) },
              ]}
            >
              <View
                style={{
                  height: 1,
                  backgroundColor: colors.textSecondary,
                  flex: 1,
                  alignSelf: 'center',
                }}
              />
              <Text
                style={[commonStyles.pText, { color: colors.textSecondary }]}
              >
                OR
              </Text>
              <View
                style={{
                  height: 1,
                  backgroundColor: colors.textSecondary,
                  flex: 1,
                  alignSelf: 'center',
                }}
              />
            </View>

            <View
              style={[
                commonStyles.col,
                commonStyles.alignCenter,
                { marginTop: RFValue(30) },
              ]}
            >
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('QRCode');
                }}
              >
                <Image
                  style={[
                    {
                      height: RFValue(45),
                      width: RFValue(45),
                      objectFit: 'contain',
                    },
                  ]}
                  source={require('../../assets/images/icon/qrcode.png')}
                />
              </TouchableOpacity>
              <Text
                style={[
                  commonStyles.pText,
                  { color: colors.black, textAlign: 'center' },
                ]}
              >
                Use this QR code to quickly log into your game.
              </Text>
            </View>
          </View>
        </View>
        </View>
      </ScreenWrapper>
    </LinearGradient>
  );
}
