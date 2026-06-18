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

import { setupPassword } from '../../store/authSlice';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store/store';

const { height } = Dimensions.get('window');

export default function ResetPassword({ navigation, route }: any) {
  const { email, otp, token } = route.params || {};
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { isLoading: loading } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();

  const handleReset = async () => {
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      // The backend setup-password expects a token in the body.
      // We got this token from the verifyAccount API call in OtpScreen.
      await dispatch(
        setupPassword({
          data: { password, confirmPassword, email, otp, token },
        }),
      ).unwrap();
      Alert.alert('Success', 'Password reset successfully', [
        { text: 'OK', onPress: () => navigation.navigate('SignIn') },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Something went wrong');
    }
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <LinearGradient
            colors={[
              colors.white,
              colors.white,
              colors.primaryLight,
              colors.primary,
            ]}
            style={[
              commonStyles.containerPadded,
              { flex: 1 },
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
                  { flex: 2, width: '100%' },
                ]}
              >
                <View style={{ marginBottom: RFValue(40) }}>
                  <Text style={[commonStyles.h1Text, { textAlign: 'center' }]}>
                    Reset Password
                  </Text>
                  <Text style={[commonStyles.pText, { textAlign: 'center' }]}>
                    Secure your account to continue
                  </Text>
                </View>

                <CustomInput
                  label="New Password"
                  placeholder="Enter your new password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  error={null}
                />

                <CustomInput
                  label="Confirm Password"
                  placeholder="Enter your confirm password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  error={null}
                />

                <SplashButton
                  onPress={handleReset}
                  loading={loading}
                  loadingText="Loading..."
                  buttonStyle={{
                    backgroundColor: colors.primarydark,
                    borderRadius: 8,
                    height: RFValue(50),
                    width: '100%',
                    marginTop: RFValue(20),
                  }}
                  title="Reset Password"
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
          </LinearGradient>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}
