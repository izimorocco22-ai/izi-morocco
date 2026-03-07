import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import colors from '../../../styles/colors';

interface ViewSwitcherProps {
  currentView: 'map' | string;
  playgrounds?: Array<{ name: string; image: string }>;
  playgroundName?: string;
  onViewChange: (view: 'map' | string) => void;
  isModalOpen?: boolean;
}

const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
  currentView,
  playgrounds,
  playgroundName,
  onViewChange,
  isModalOpen = false,
}) => {
  console.log('ViewSwitcher:', { playgrounds, playgroundName, isModalOpen });
  
  if (isModalOpen) return null;
  
  const hasPlaygrounds = playgrounds && playgrounds.length > 0;
  const hasLegacyPlayground = playgroundName;
  
  if (!hasPlaygrounds && !hasLegacyPlayground) return null;

  const views = hasPlaygrounds 
    ? ['Map', ...playgrounds.map(p => p.name)]
    : ['Map', playgroundName];

  return (
    <View style={styles.container}>
      {views.map((view) => {
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
    backgroundColor: colors.primary,
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
