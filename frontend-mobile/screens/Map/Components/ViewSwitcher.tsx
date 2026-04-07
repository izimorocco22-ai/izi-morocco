import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import colors from '../../../styles/colors';

import { t } from '../../../utils/translations';

interface ViewSwitcherProps {
  currentView: 'map' | string;
  playgrounds?: Array<{ name: string; image: string }>;
  playgroundName?: string;
  language?: string;
  onViewChange: (view: 'map' | string) => void;
  isModalOpen?: boolean;
}

const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
  currentView,
  playgrounds,
  playgroundName,
  language,
  onViewChange,
  isModalOpen = false,
}) => {
  console.log('ViewSwitcher:', { playgrounds, playgroundName, isModalOpen });
  
  // Always show buttons, even when modal is open
  
  const hasPlaygrounds = playgrounds && playgrounds.length > 0;
  const hasLegacyPlayground = playgroundName;
  
  if (!hasPlaygrounds && !hasLegacyPlayground) return null;

  const views = hasPlaygrounds 
    ? [{ key: 'map', label: t(language, 'map') }, ...playgrounds.map(p => ({ key: p.name.toLowerCase(), label: p.name }))]
    : [{ key: 'map', label: t(language, 'map') }, { key: (playgroundName as string).toLowerCase(), label: playgroundName as string }];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {views.map(({ key, label }) => {
          const isActive = currentView === key;
          
          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.button,
                isActive && styles.activeButton,
              ]}
              onPress={() => onViewChange(key)}
            >
              <Text style={[styles.buttonText, isActive && styles.activeButtonText]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  scrollContent: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 5,
  },
  button: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  activeButtonText: {
    color: '#FFFFFF',
  },
});

export default ViewSwitcher;
