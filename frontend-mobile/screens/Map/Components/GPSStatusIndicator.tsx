import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const GPSStatusIndicator = ({ gpsEnabled, visible = true }) => {
  if (!visible) return null;
  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: gpsEnabled ? '#4CAF50' : '#FF5722' }]} />
      <Text style={styles.text}>GPS: {gpsEnabled ? 'Enabled' : 'Disabled'}</Text>
    </View>
  );
};

export default GPSStatusIndicator;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 120,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
    zIndex: 1001,
  },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  text: { color: 'white', fontSize: 12, fontWeight: 'bold' },
});
