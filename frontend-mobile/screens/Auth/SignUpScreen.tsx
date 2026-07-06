// screens/Auth/SignUpScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  ScrollView,
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
import { useDispatch, useSelector } from 'react-redux';
import { signUp } from '../../store/authSlice';
import { RootState } from '../../store/store';
import ScreenWrapper from '../../components/ScreenWrapper';

const { height } = Dimensions.get('window');

export default function SignUpScreen({ navigation }) {
  const dispatch = useDispatch<any>();
  const { isSignUpLoading } = useSelector((state: RootState) => state.auth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleSignUp = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const payload = { name: name.trim(), email: normalizedEmail, password, phone: phone.trim() };

    try {
      await dispatch(signUp(payload)).unwrap();
      navigation.navigate('Otp', {
        from: 'SignUp',
        email: normalizedEmail,
      });
    } catch (error: any) {
      if (error?.errors) {
        // build a key:value object of errors
        const fieldErrors: { [key: string]: string } = {};
        error.errors.forEach((err: any) => {
          fieldErrors[err.field] = err.message;
        });
        setErrors(fieldErrors);
      } else {
        // console.log('Signup error:', error.message || error);
      }
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
            <ScrollView
              contentContainerStyle={[commonStyles.scrollContainer]}
              showsVerticalScrollIndicator={false}
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
                    { width: '100%' },
                  ]}
                >
                  <View style={{ marginBottom: RFValue(40) }}>
                    <Text
                      style={[commonStyles.h1Text, { textAlign: 'center' }]}
                    >
                      Sign Up
                    </Text>
                    <Text style={[commonStyles.pText, { textAlign: 'center' }]}>
                      Join – Explore – Conquer
                    </Text>
                  </View>

                  <CustomInput
                    label="Name"
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your name"
                    error={errors.name}
                  />

                  <CustomInput
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    error={errors.email}
                  />

                  <CustomInput
                    keyboardType="number-pad"
                    label="Phone Number"
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Enter your phone number"
                    error={errors.phone}
                  />

                  <CustomInput
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    secureTextEntry
                    error={errors.password}
                  />

                  <SplashButton
                    onPress={handleSignUp}
                    loading={isSignUpLoading}
                    loadingText="Signing Up..."
                    buttonStyle={{
                      backgroundColor: colors.primarydark,
                      borderRadius: 8,
                      height: RFValue(50),
                      width: '100%',
                      marginTop: RFValue(20),
                    }}
                    title="Sign Up"
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
                        { color: colors.black, marginTop: 0 },
                      ]}
                    >
                      Already have an account?
                    </Text>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('SignIn')}
                    >
                      <Text
                        style={[
                          commonStyles.pText,
                          {
                            color: colors.primarydark,
                            textDecorationLine: 'underline',
                            marginTop: 0,
                          },
                        ]}
                      >
                        Sign In
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View
                  style={[
                    commonStyles.row,
                    commonStyles.justifyCenter,
                    commonStyles.alignEnd,
                    { gap: 10 },
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
                      Terms of Use
                    </Text>{' '}
                    and{' '}
                    <Text style={{ textDecorationLine: 'underline' }}>
                      Privacy Policy
                    </Text>
                  </Text>
                </View>
              </View>
            </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </ScreenWrapper>
    </LinearGradient>
  );
}
