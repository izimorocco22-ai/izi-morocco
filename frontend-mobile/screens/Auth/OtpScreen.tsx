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
import { RFValue } from '../../utils/responsive';
import SplashButton from '../../components/SplashButton';
import OTPTextView from 'react-native-otp-textinput'; // ✅ OTP library
import ScreenWrapper from '../../components/ScreenWrapper';
import { verifyAccount, init } from '../../store/authSlice';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';

const { height } = Dimensions.get('window');

export default function OtpScreen({ navigation, route }: any) {
  const { from, email } = route.params || {};
  const [otp, setOtp] = useState('');
  const dispatch = useDispatch<any>();
  const [errors, setErrors] = useState<any>(null);
  const { isOtpLoading: loading } = useSelector(
    (state: RootState) => state.auth,
  );

  const handleOtp = async () => {
    if (otp.length !== 6) {
      Alert.alert('Error', 'Please enter valid OTP');
      return;
    }

    if (from === 'ForgotPassword') {
      try {
        const res = await dispatch(
          verifyAccount({
            data: {
              email: email?.toLowerCase(),
              otp: otp,
              reqFor: 'FORGET_PASSWORD',
            },
          }),
        ).unwrap();
        navigation.navigate('ResetPassword', {
          email: email?.toLowerCase(),
          otp: otp,
          token: res.token,
        });
      } catch (error: any) {
        console.error('Error verifying OTP:', error);
        if (error?.errors) {
          const fieldErrors: { [key: string]: string } = {};
          error.errors.forEach((err: any) => {
            fieldErrors[err.field] = err.message;
          });
          setErrors(fieldErrors);
        } else {
          setErrors({ general: error.message || 'Something went wrong' });
        }
      }
    }
    if (from === 'SignUp') {
      try {
        // Dispatch the verifyAccount action with correct values
        await dispatch(
          verifyAccount({ data: { email: email?.toLowerCase(), otp: otp } }),
        ).unwrap();

        await dispatch(init()).unwrap();

        // Navigate only if OTP verification is successful
        navigation.navigate('Avatar');
      } catch (error: any) {
        console.error('Error verifying OTP:', error);

        // Handle errors and display them to the user
        if (error?.errors) {
          const fieldErrors: { [key: string]: string } = {};
          error.errors.forEach((err: any) => {
            fieldErrors[err.field] = err.message;
          });
          setErrors(fieldErrors);
        } else {
          setErrors({ general: error.message || 'Something went wrong' });
        }
      }
    }
    if (from === 'SignIn') {
      try {
        console.log({ email, otp });

        // Dispatch the verifyAccount action with correct values
        const res: any = await dispatch(
          verifyAccount({ data: { email: email?.toLowerCase(), otp: otp } }),
        ).unwrap();
        console.log(res);

        await dispatch(init()).unwrap();

        // Navigate only if OTP verification is successful
        navigation.navigate('Avatar');
      } catch (error: any) {
        console.log(error);

        // Handle errors and display them to the user
        if (error?.success === false) {
          setErrors({ general: error.message || 'Invalid OTP' });
        } else if (error?.message) {
          setErrors({ general: error.message });
        } else {
          setErrors({ general: error.message || 'Something went wrong' });
        }
      }
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
                    Enter Otp
                  </Text>
                  <Text style={[commonStyles.pText, { textAlign: 'center' }]}>
                    Verification code has been sent to your registered email
                    address
                  </Text>
                </View>

                {/* ✅ OTP Input */}
                <OTPTextView
                  handleTextChange={setOtp}
                  inputCount={6}
                  keyboardType="numeric"
                  tintColor={colors.primarydark}
                  containerStyle={{ marginBottom: RFValue(20) }}
                  textInputStyle={{
                    borderWidth: 1,
                    borderRadius: 8,
                    borderColor: colors.primarydark,
                    width: RFValue(40),
                    height: RFValue(50),
                    textAlign: 'center',
                    color: colors.black,
                  } as any}
                />
                {errors && (
                  <Text style={[commonStyles.pText, { color: 'red', marginTop: RFValue(2) }]}>
                    {errors.general || 'Something went wrong'}
                  </Text>
                )}

                <SplashButton
                  onPress={handleOtp}
                  loading={loading}
                  loadingText="Loading..."
                  buttonStyle={{
                    backgroundColor: colors.primarydark,
                    borderRadius: 8,
                    height: RFValue(50),
                    width: '100%',
                    marginTop: RFValue(20),
                  }}
                  title="Verify OTP"
                />

                {/* <View
                  style={[
                    commonStyles.row,
                    commonStyles.alignCenter,
                    { marginTop: RFValue(15), gap: 5 },
                  ]}
                >
                  <Text style={[commonStyles.pText,{marginTop:0}]} >Didn’t get OTP?</Text>
                  <TouchableOpacity onPress={() => Alert('Resend OTP')}>
                    <Text
                      style={[commonStyles.pText,{color: colors.primarydark,marginTop:0,
                        textDecorationLine: 'underline',}]}
                    >
                      Resend
                    </Text>
                  </TouchableOpacity>
                </View> */}
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
                  style={{
                    textAlign: 'center',
                    width: '90%',
                    color: colors.white,
                  }}
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
