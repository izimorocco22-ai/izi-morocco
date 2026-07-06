// screens/Auth/SignInScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import colors from '../../styles/colors';
import commonStyles from '../../styles/commonStyles';
import CustomInput from '../../components/CustomInput';
import { RFValue } from '../../utils/responsive';
import SplashButton from '../../components/SplashButton';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useDispatch, useSelector } from 'react-redux';
import { init, signIn } from '../../store/authSlice';
import { RootState } from '../../store/store';

const { height } = Dimensions.get('window');

export default function SignInScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<any>(null);

  const dispatch = useDispatch<any>();
  const { isSignInLoading, loginResponse } = useSelector(
    (state: RootState) => state.auth,
  );

  const handleSignIn = async () => {
    setErrors({}); // reset old errors
    try {
      await dispatch(signIn({ email: email.trim().toLowerCase(), password })).unwrap();
      await dispatch(init())
    } catch (error: any) {
      if (error?.errors) {
        const fieldErrors: { [key: string]: string } = {};
        error.errors.forEach((err: any) => {
          fieldErrors[err.field] = err.message;
        });
        setErrors(fieldErrors);
      } else if (!error?.success) {
        console.log({ msg: error?.message });
        setErrors({ general: error?.message });
      } else {
        setErrors({ general: error?.message || 'Something went wrong' });
      }
    }
  };

  useEffect(() => {
    if (loginResponse?.step === 'homeScreen') {
      navigation.navigate('BottomTabs');
    } else if (loginResponse?.step === 'otpScreen') {
      navigation.navigate('Otp', { email: email.trim().toLowerCase(), from: 'SignIn' });
    }
  }, [loginResponse]);

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
                    Login
                  </Text>
                  <Text style={[commonStyles.pText, { textAlign: 'center' }]}>
                    Locate – Play – Victory
                  </Text>
                </View>

                <CustomInput
                  label="Email / User Id"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email/user id"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={errors?.email || errors?.userId || errors?.general}
                />

                <CustomInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  secureTextEntry
                  error={errors?.password}
                />
                <View
                  style={[
                    commonStyles.row,
                    commonStyles.justifyEnd,
                    { width: '100%' },
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => {
                      navigation.navigate('ForgotPassword');
                    }}
                  >
                    <Text style={[commonStyles.pText, { color: colors.black }]}>
                      Forgot Password ?
                    </Text>
                  </TouchableOpacity>
                </View>

                <SplashButton
                  onPress={handleSignIn}
                  loading={isSignInLoading}
                  loadingText="Signing In..."
                  buttonStyle={{
                    backgroundColor: colors.primarydark,
                    borderRadius: 8,
                    height: RFValue(50),
                    width: '100%',
                    marginTop: RFValue(20),
                  }}
                  title="Sign In"
                />

                <View
                  style={[
                    commonStyles.row,
                    commonStyles.alignCenter,
                    { marginTop: RFValue(15), gap: 5 },
                  ]}
                >
                  <Text
                    style={[
                      commonStyles.pText,
                      { marginTop: 0, color: colors.black },
                    ]}
                  >
                    Create a new account
                  </Text>
                  <TouchableOpacity
                    style={[{}]}
                    onPress={() => {
                      navigation.navigate('SignUp');
                    }}
                  >
                    <Text
                      style={[
                        commonStyles.pText,
                        {
                          color: colors.primarydark,
                          marginTop: 0,
                          textDecorationLine: 'underline',
                        },
                      ]}
                    >
                      Sign Up
                    </Text>
                  </TouchableOpacity>
                </View>
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
