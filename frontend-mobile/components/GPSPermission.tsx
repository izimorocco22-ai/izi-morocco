// components/GPSPermissions.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Platform,
  PermissionsAndroid,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import {
  promptForEnableLocationIfNeeded,
  AndroidLocationEnablerResult,
} from 'react-native-android-location-enabler';

const GPSPermissions = ({ 
  children, 
  onGPSEnabled, 
  onGPSDisabled,
  showBlockingScreen = true,
  autoRetry = true 
}) => {
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [checking, setChecking] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  // Check location permission
  const checkLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        setLocationPermissionGranted(hasPermission);
        return hasPermission;
      } catch (error) {
        return false;
      }
    }
    return true; // For iOS, assume granted (you might want to implement iOS-specific checks)
  };

  // Request location permission
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission Required',
            message: 'Izi Morocco collects location data to enable tracking your progress on the treasure hunt map and discovering hidden treasures even when the app is in use.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        
        const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
        setLocationPermissionGranted(isGranted);
        
        if (isGranted) {
          await enableGPS();
        } else {
          onGPSDisabled?.();
          Alert.alert(
            'Permission Denied',
            'Location permission is required to use this feature.'
          );
        }
        
        return isGranted;
      } catch (err) {
        console.warn('Error requesting location permission:', err);
        return false;
      }
    }
    return true;
  };

  // Enable GPS
  const enableGPS = async () => {
    try {
      if (Platform.OS === 'android') {
        const result = await promptForEnableLocationIfNeeded({
          interval: 10000,
          fastInterval: 5000,
        });
        setGpsEnabled(true);
        onGPSEnabled?.();
        return true;
      }
      return true; // For iOS
    } catch (err) {
      setGpsEnabled(false);
      onGPSDisabled?.();
      
      if (autoRetry && retryCount < 3) {
        setRetryCount(prev => prev + 1);
        Alert.alert(
          'Location Required',
          'Please enable Location Services to continue.',
          [
            {
              text: 'Open Settings',
              onPress: () => openLocationSettings(),
            },
            {
              text: 'Try Again',
              onPress: () => enableGPS(),
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ],
        );
      }
      return false;
    }
  };

  // Open location settings
  const openLocationSettings = () => {
    if (Platform.OS === 'android') {
      Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
    } else {
      Linking.openURL('app-settings:');
    }
  };

  // Check GPS status
  const checkGPSStatus = async () => {
    setChecking(true);
    
    try {
      const hasPermission = await checkLocationPermission();
      
      if (hasPermission) {
        // For Android, we'll assume GPS is enabled if we have permission
        // You might want to add more sophisticated GPS status detection
        setGpsEnabled(true);
        onGPSEnabled?.();
      } else {
        setGpsEnabled(false);
        onGPSDisabled?.();
      }
    } catch (error) {
      setGpsEnabled(false);
      onGPSDisabled?.();
    } finally {
      setChecking(false);
    }
  };

  // Initialize
  useEffect(() => {
    checkGPSStatus();

    // Set up periodic checking
    const interval = setInterval(() => {
      if (!gpsEnabled) {
        checkGPSStatus();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Blocking screen when GPS is not enabled
  if (!gpsEnabled && showBlockingScreen) {
    return (
      <View style={styles.blockingContainer}>
        <View style={styles.blockingContent}>
          <Text style={styles.blockingTitle}>Location Permission Required</Text>
          <Text style={styles.blockingMessage}>
            Izi Morocco collects location data to enable tracking your progress on the treasure hunt map, 
            discovering nearby points of interest, and calculating your distance from hidden treasures. 
            This data is used even when the app is in use to provide the core gameplay experience.
          </Text>
          
          {checking && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Checking location services...</Text>
            </View>
          )}

          <View style={styles.blockingButtons}>
            {!locationPermissionGranted ? (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={requestLocationPermission}
                disabled={checking}
              >
                <Text style={styles.primaryButtonText}>
                  Grant Location Permission
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={enableGPS}
                disabled={checking}
              >
                <Text style={styles.primaryButtonText}>Enable GPS</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={openLocationSettings}
              disabled={checking}
            >
              <Text style={styles.secondaryButtonText}>Open Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tertiaryButton}
              onPress={checkGPSStatus}
              disabled={checking}
            >
              <Text style={styles.tertiaryButtonText}>
                {checking ? 'Checking...' : 'Check Again'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.noteText}>
            The app will automatically continue once location services are enabled.
          </Text>
        </View>
      </View>
    );
  }

  // Render children when GPS is enabled
  return children;
};

const styles = StyleSheet.create({
  blockingContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  blockingContent: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: '100%',
    maxWidth: 400,
  },
  blockingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  blockingMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  blockingButtons: {
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#34C759',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tertiaryButton: {
    backgroundColor: '#8E8E93',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  tertiaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noteText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default GPSPermissions;