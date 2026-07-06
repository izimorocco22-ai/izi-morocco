// screens/Auth/SignInScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import colors from '../../styles/colors';
import commonStyles from '../../styles/commonStyles';
import CustomInput from '../../components/CustomInput';
import { RFValue } from '../../utils/responsive';
import SplashButton from '../../components/SplashButton';
import ScreenWrapper from '../../components/ScreenWrapper';

import { forgetPassword } from '../../store/authSlice';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store/store';

const { height } = Dimensions.get('window');

export default function ForgotPassword({ navigation }: any) {
  const [email, setEmail] = useState('');
  const { isLoading: loading } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();

  const handleForgot = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    try {
      await dispatch(forgetPassword({ email: normalizedEmail })).unwrap();
      navigation.navigate('Otp', {
        from: 'ForgotPassword',
        email: normalizedEmail,
      });
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Something went wrong');
    }
  };

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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
                  { flex: 2, width: '100%' },
                ]}
              >
                <View style={{ marginBottom: RFValue(40) }}>
                  <Text style={[commonStyles.h1Text, { textAlign: 'center' }]}>
                    Forgot Password
                  </Text>
                  <Text style={[commonStyles.pText, { textAlign: 'center' }]}>
                    Lost your key? We'll help you respawn.
                  </Text>
                </View>

                <CustomInput
                  label="Email "
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={null}
                />

                <SplashButton
                  onPress={handleForgot}
                  loading={loading}
                  loadingText="Loading..."
                  buttonStyle={{
                    backgroundColor: colors.primarydark,
                    borderRadius: 8,
                    height: RFValue(50),
                    width: '100%',
                    marginTop: RFValue(20),
                  }}
                  title="Get OTP"
                />
              </View>

              <View
                style={[
                  commonStyles.row,
                  commonStyles.justifyCenter,
                  commonStyles.alignEnd,
                  { gap: 10, flex: 1 },
                ]}
              >
                <Text
                  style={[
                    { textAlign: 'center', width: '90%', color: colors.white },
                  ]}
                >
                  By logging in, you agree to the{' '}
                  <Text style={{ textDecorationLine: 'underline' }}>
                    Term of Use
                  </Text>{' '}
                  and{' '}
                  <Text style={{ textDecorationLine: 'underline' }}>
                    Privacy Policy
                  </Text>
                </Text>
              </View>
            </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </ScreenWrapper>
    </LinearGradient>
  );
}
