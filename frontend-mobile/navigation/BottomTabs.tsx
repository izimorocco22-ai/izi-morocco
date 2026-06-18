import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Dimensions,
  Platform,
  Image,
  Animated,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RFValue } from '../utils/responsive';
import colors from '../styles/colors';
import HomeScreen from '../screens/Main/HomeScreen';
import AboutScreen from '../screens/Main/AboutScreen';
import ProfileScreen from '../screens/Main/ProfileScreen';
import SettingsScreen from '../screens/Main/SettingsScreen';
import home from '../assets/images/bottomtab/home.png';
import history from '../assets/images/bottomtab/history.png';
import map from '../assets/images/bottomtab/map.png';
import profile from '../assets/images/bottomtab/profile.png';
import Map from '../screens/Map/Map';

const Tab = createBottomTabNavigator();
const { width: screenWidth } = Dimensions.get('window');

// Tab Button Component
const TabButton = ({ route, state, navigation, image, index }) => {
  const isFocused = state.index === index;

  // Create animated values for the up-down animation
  const bounceAnimation = useRef(new Animated.Value(0)).current;
  const animationRef = useRef(null); // keep a reference to stop animation

  useEffect(() => {
    if (isFocused) {
      // Start bounce animation only for the active tab
      animationRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnimation, {
            toValue: -5,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnimation, {
            toValue: 5,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnimation, {
            toValue: 0,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.delay(1500),
        ])
      );

      animationRef.current.start();
    } else {
      // Stop previous animation immediately when tab loses focus
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }

      // Reset to original position
      bounceAnimation.setValue(0);
    }
  }, [isFocused]);

  const bounceStyle = {
    transform: [{ translateY: bounceAnimation }],
  };

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate(route)}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          
          borderRadius: RFValue(20),
          // backgroundColor: isFocused ? colors.primary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Animated.View style={bounceStyle}>
          <Image
            style={{ height: RFValue(32), width: RFValue(32) ,opacity:isFocused ? 1 :0.3}} 
            source={image}
          />
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
};


// Custom tab bar component
const CustomTabBar = ({ state, descriptors, navigation }) => {
  const tabBarHeight = Platform.OS === 'ios' ? RFValue(80) : RFValue(60);

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: tabBarHeight,
        backgroundColor: colors.white,
        borderTopLeftRadius:RFValue(20),
        borderTopRightRadius:RFValue(20),
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'space-around',
        }}
      >
        <TabButton
          route="Home"
          state={state}
          navigation={navigation}
          image={home}
          index={0}
        />
        <TabButton
          route="About"
          state={state}
          navigation={navigation}
          image={history}
          index={1}
        />
        {/* <TabButton
          route="Map"
          state={state}
          navigation={navigation}
          image={map}
          index={2}
        /> */}
        <TabButton
          route="Settings"
          state={state}
          navigation={navigation}
          image={profile}
          index={2}
        />
      </View>
    </View>
  );
};

const BottomTabs = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
      initialRouteName="Home"
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="About" component={AboutScreen} />
      {/* <Tab.Screen name="Map" component={Map} /> */}
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

export default BottomTabs;
