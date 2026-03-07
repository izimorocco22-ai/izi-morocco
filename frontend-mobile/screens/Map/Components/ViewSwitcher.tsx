import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../../../styles/colors';

interface ViewSwitcherProps {
  currentView: 'map' | string;
  playgroundName?: string;
  onViewChange: (view: 'map' | string) => void;
}

const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
  currentView,
  playgroundName,
  onViewChange,
}) => {
  const views = ['Map'];
  
  if (playgroundName) {
    views.push(playgroundName);
  }

  return (
    <View style={styles.container}>
      {views.map((view, index) => {
        const viewKey = view.toLowerCase();
        const isActive = currentView === viewKey;
        
        return (
          <TouchableOpacity
            key={viewKey}
            style={[
              styles.button,
              isActive && styles.activeButton,
            ]}
            onPress={() => onViewChange(viewKey)}
          >
            <Text style={[styles.buttonText, isActive && styles.activeButtonText]}>
              {view}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    zIndex: 1000,
  },
  button: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 100,
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: colors.primary || '#007AFF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  activeButtonText: {
    color: '#FFFFFF',
  },
});

export default ViewSwitcher;
