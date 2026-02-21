// navigation/RootNavigator.tsx
import React, { useState, useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AuthStack from './AuthStack';
import AppNavigator from './AppNavigator';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import LoadingScreen from '../screens/Onboarding/LoadingScreen';
import Map from '../screens/Map/Map';
import BottomTabs from './BottomTabs';
import ChooseAvatar from '../screens/Onboarding/ChooseAvatar';
import QRCode from '../screens/QRCode/QRCode';
import GameLogin from '../screens/GameLogin/GameLogin';
import OtpScreen from '../screens/Auth/OtpScreen';
import SplashScreen1 from '../screens/Onboarding/SplashScreen1';
import SplashScreen2 from '../screens/Onboarding/SplashScreen2';
import SplashScreen3 from '../screens/Onboarding/SplashScreen3';
import SignInScreen from '../screens/Auth/SignInScreen';
import SignUpScreen from '../screens/Auth/SignUpScreen';
import ForgotPassword from '../screens/Auth/ForgotPassword';
import ResetPassword from '../screens/Auth/ResetPassword';
import HomeScreen from '../screens/Main/HomeScreen';
import AboutScreen from '../screens/Main/AboutScreen';
import SettingsScreen from '../screens/Main/SettingsScreen';
import TeamManagementScreen from '../screens/Main/TeamManagementScreen';
import { Congratulation } from '../screens/Map/Components/Congratulation';

const Stack = createStackNavigator();

export default function RootNavigator() {
  // const { token, isLoading } = useSelector((state: RootState) => state.auth);
    const { token, isInitLoading, isVerified ,user} = useSelector((state: RootState) => state.auth);
    console.log({token,user})

  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  if (showLoading || isInitLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {token && isVerified ? (
        <Stack.Screen name="App" component={AppNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}

      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="TeamManagement" component={TeamManagementScreen} />
      <Stack.Screen name="Map" component={Map} />
      <Stack.Screen name="BottomTabs" component={BottomTabs} />
      <Stack.Screen name="Avatar" component={ChooseAvatar} />
      <Stack.Screen name="QRCode" component={QRCode} />
      <Stack.Screen name="GameLogin" component={GameLogin} />
      <Stack.Screen name="Splash1" component={SplashScreen1} />
      <Stack.Screen name="Splash2" component={SplashScreen2} />
      <Stack.Screen name="Splash3" component={SplashScreen3} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="Otp" component={OtpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
      <Stack.Screen name="ResetPassword" component={ResetPassword} />
      <Stack.Screen name="Congratulation" component={Congratulation} />
    </Stack.Navigator>
  );
}
