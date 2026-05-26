import { PermissionsAndroid, Alert, Linking, Platform } from 'react-native';
import { promptForEnableLocationIfNeeded } from 'react-native-android-location-enabler';

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const isWithinRadius = (
  point: { latitude: number; longitude: number },
  target: any,
  radius: number,
) => calculateDistance(point.latitude, point.longitude, target.latitude, target.longitude) <= radius;

/**
 * ✅ Checks both permission and GPS status
 */
export const checkLocationEnabled = async (dispatch: any) => {

  try {
    const hasPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );

    dispatch({ type: 'SET_LOCATION_PERMISSION', payload: hasPermission });

    if (!hasPermission) {
      dispatch({ type: 'SET_GPS_ENABLED', payload: false });
      return;
    }

    try {
      await promptForEnableLocationIfNeeded({ interval: 10000, fastInterval: 5000 });
      dispatch({ type: 'SET_GPS_ENABLED', payload: true });
    } catch (error) {
      dispatch({ type: 'SET_GPS_ENABLED', payload: true }); // fallback true
    }
  } catch (err) {
    dispatch({ type: 'SET_GPS_ENABLED', payload: false });
  }
};


/**
 * ✅ Requests location permission and ensures GPS enabled
 */
export const requestLocationPermission = async (dispatch: any) => {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission Required',
        message: 'Izi Morocco collects location data to enable tracking your progress on the treasure hunt map and discovering hidden treasures even when the app is in use.',
        buttonPositive: 'OK',
      },
    );

    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      dispatch({ type: 'SET_LOCATION_PERMISSION', payload: true });
      await enableGPS(dispatch);
    } else {
      dispatch({ type: 'SET_LOCATION_PERMISSION', payload: false });
      Alert.alert('Permission Denied', 'Location permission is required.');
    }
  } catch (err) {
    dispatch({ type: 'SET_GPS_ENABLED', payload: false });
  }
};

/**
 * ✅ Enables GPS and updates reducer state
 */
export const enableGPS = async (dispatch: any) => {
  try {
    await promptForEnableLocationIfNeeded({ interval: 10000, fastInterval: 5000 });
    dispatch({ type: 'SET_GPS_ENABLED', payload: true });
  } catch {
    dispatch({ type: 'SET_GPS_ENABLED', payload: false });
    Alert.alert('Location Required', 'Please enable Location Services.', [
      {
        text: 'Open Settings',
        onPress: () => {
          Linking.openSettings?.() ||
            Linking.sendIntent?.('android.settings.LOCATION_SOURCE_SETTINGS');
        },
      },
    ]);
  }
};
