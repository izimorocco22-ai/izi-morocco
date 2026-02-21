// screens/GameLogin/GameLogin.tsx
import React, { useRef, useState } from 'react';
import { View, Text, Dimensions, TouchableOpacity, Image, Animated } from 'react-native';
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

export default function GameLogin({ navigation, route }) {
  const { activationCode, game, qrGameID } = route.params || {};
  const gameId = qrGameID ? qrGameID : game?._id;
  const [activeCode, setActiveCode] = useState(activationCode || '');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'single' | 'team'>('single');
  const [teamName, setTeamName] = useState('');
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
    setLoading(true);
    if (!activeCode.length) {
      ToastAndroid.show('Please enter activation code', ToastAndroid.SHORT);
      setLoading(false);
      return;
    }

    if (mode === 'team') {
      if (!teamName.trim()) {
        ToastAndroid.show('Please enter team name', ToastAndroid.SHORT);
        setLoading(false);
        return;
      }

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
        ToastAndroid.show(msg, ToastAndroid.LONG);
        setLoading(false);
        return;
      }
    }

    try {
      const result = await dispatch(gameLogin({ activeCode, gameId })).unwrap();
      console.log({result})
      navigation.navigate('Map', {
        questions: result?.game?.questions || [],
        game: result?.game,
        activeCode,
        gameId,
      });
    } catch (error) {
      // Check offline capability
      try {
        const offlineGame = await offlineManager.loadGame(gameId);
        if (offlineGame) {
           ToastAndroid.show('Playing in Offline Mode', ToastAndroid.LONG);
           navigation.navigate('Map', {
             questions: offlineGame?.game?.questions || [],
             game: offlineGame?.game,
             activeCode,
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

      // Show toast on Android
      ToastAndroid.show(errorMessage, ToastAndroid.LONG);
    } finally {
      setLoading(false);
    }
  };
  // sample steps - this array would come from backend in real app

  return (
    <ScreenWrapper>
      <LinearGradient
        colors={[
          colors.white,
          colors.white,
          colors.primaryLight,
          colors.primary,
        ]}
        style={[
          commonStyles.containerPadded,
          { position: 'relative', minHeight: height },
        ]}
      >
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
              error={null}
              label="Activation Code"
              value={activeCode}
              onChangeText={setActiveCode}
              placeholder="Enter your Game ID"
            />

            {mode === 'team' && (
              <View style={{ marginTop: RFValue(12), width: '100%' }}>
                <CustomInput
                  error={null}
                  label="Team Name"
                  value={teamName}
                  onChangeText={setTeamName}
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
      </LinearGradient>
    </ScreenWrapper>
  );
}
