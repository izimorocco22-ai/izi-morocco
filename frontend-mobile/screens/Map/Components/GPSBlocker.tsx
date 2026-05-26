import React from 'react';
import { View, Text, TouchableOpacity, Platform, Linking, StyleSheet } from 'react-native';
import commonStyles from '../../../styles/commonStyles';

const GPSBlocker = ({ onEnableLocation, onEnableGPS }) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={commonStyles.h2Text}>Location Permission Required</Text>
        <Text style={[commonStyles.pText, { textAlign: 'center', marginTop: 10 }]}>
          Izi Morocco collects location data to enable tracking your progress on the treasure hunt map, 
          discovering nearby points of interest, and calculating your distance from hidden treasures. 
          This data is used even when the app is in use to provide the core gameplay experience.
        </Text>

        <View style={styles.buttons}>
          <TouchableOpacity style={styles.primaryButton} onPress={onEnableLocation}>
            <Text style={styles.primaryButtonText}>Enable Location</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={onEnableGPS}>
            <Text style={styles.secondaryButtonText}>Enable GPS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => {
              if (Platform.OS === 'android') {
                Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
              }
            }}
          >
            <Text style={styles.settingsButtonText}>Open Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default GPSBlocker;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  content: { backgroundColor: 'white', padding: 30, borderRadius: 15, alignItems: 'center' },
  buttons: { width: '100%', gap: 12 },
  primaryButton: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center' },
  primaryButtonText: { color: 'white', fontWeight: 'bold' },
  secondaryButton: { backgroundColor: '#34C759', padding: 15, borderRadius: 8, alignItems: 'center' },
  secondaryButtonText: { color: 'white', fontWeight: 'bold' },
  settingsButton: { backgroundColor: '#8E8E93', padding: 15, borderRadius: 8, alignItems: 'center' },
  settingsButtonText: { color: 'white', fontWeight: 'bold' },
});
