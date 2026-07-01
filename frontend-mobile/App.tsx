// App.tsx
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './navigation/RootNavigator';
import { StatusBar } from 'react-native';
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { useDispatch } from 'react-redux';
import { init } from './store/authSlice';
import colors from './styles/colors';

function InitRestore() {
  const dispatch = useDispatch<any>();
  useEffect(() => {
    dispatch(init());
  }, [dispatch]);

  return null;
}

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <NavigationContainer>
          <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
          <InitRestore />
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </Provider>
  );
}
