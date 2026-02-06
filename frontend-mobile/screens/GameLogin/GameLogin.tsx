// screens/Auth/SignInScreen.tsx
import React, { useState } from 'react';
import { View, Text, Dimensions, TouchableOpacity, Image } from 'react-native';
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

const { height } = Dimensions.get('window');

export default function GameLogin({ navigation, route }) {
  const { activationCode, game, qrGameID } = route.params || {};
  const gameId = qrGameID ? qrGameID : game?._id;
  const [activeCode, setActiveCode] = useState(activationCode || '');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch<any>();

  const handleSignIn = async () => {
    setLoading(true);
    if (!activeCode.length) {
      ToastAndroid.show('Please enter activation code', ToastAndroid.SHORT);
      setLoading(false);
      return;
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
            <View style={{ marginBottom: RFValue(40) }}>
              <Text style={[commonStyles.h1Text, { textAlign: 'center' }]}>
                Game Login
              </Text>
              <Text style={[commonStyles.pText, { textAlign: 'center' }]}>
                After Enter the credentials you can start the game
              </Text>
            </View>

            <CustomInput
              error={null}
              label="Activation Code"
              value={activeCode}
              onChangeText={setActiveCode}
              placeholder="Enter your Game ID"
            />

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
