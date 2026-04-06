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
    ? [t(language, 'map'), ...playgrounds.map(p => p.name)]
    : [t(language, 'map'), playgroundName];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
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
