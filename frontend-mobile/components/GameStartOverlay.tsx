import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Image } from 'react-native';
import { RFValue } from '../utils/responsive';
import colors from '../styles/colors';
import SplashButton from './SplashButton';
import commonStyles from '../styles/commonStyles';

interface GameStartOverlayProps {
  steps: { title: string; content: string }[]; // Steps with dynamic titles and content
  onFinish: () => void;
  visible: boolean;
}

const GameStartOverlay: React.FC<GameStartOverlayProps> = ({
  steps,
  onFinish,
  visible,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setCurrentStep(0);
      onFinish(); // Call finish handler after all steps
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.bubbleContainer}>
          <View
            style={[
              {
                position: 'absolute',
                left: -RFValue(40),
                bottom: -RFValue(80),
                right: 0,
                justifyContent: 'flex-end',
                paddingHorizontal: RFValue(20),
              },
            ]}
          >
            <View style={styles.bubble}>
              <Image
                style={styles.tail}
                source={require('../assets/images/avatar/tail.png')}
              />
              <Text style={[commonStyles.h3Text, { textAlign: 'center' }]}>
                {steps[currentStep].title}
              </Text>
              <Text style={[commonStyles.pText]}>
                {steps[currentStep].content}
              </Text>
            </View>
            <Image
              source={require('../assets/images/avatar/start-avatar.png')}
              style={styles.character}
              resizeMode="contain"
            />
          </View>
          <SplashButton
            onPress={handleNext}
            loadingText="Loading..."
            buttonStyle={{
              position: 'absolute',
              bottom: RFValue(50),
              left: RFValue(20),
              right: RFValue(20),
              backgroundColor: colors.primarydark,
              borderRadius: 8,
              height: RFValue(50),
            }}
            title="Continue"
          />
        </View>
      </View>
    </Modal>
  );
};

export default GameStartOverlay;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bubbleContainer: {
    position: 'absolute',
    justifyContent: 'flex-end',
    alignItems: 'center',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    padding: RFValue(20),
  },
  bubble: {
    position: 'relative',
    backgroundColor: 'white',
    padding: RFValue(20),
    borderRadius: RFValue(12),
    marginBottom: RFValue(20),
    marginLeft: 'auto',
  },
  tail: {
    position: 'absolute',
    width: RFValue(50),
    height: RFValue(50),
    resizeMode: 'contain',
    left: RFValue(20),
    bottom: RFValue(-20),
  },
  character: {
    width: RFValue(250),
    height: RFValue(430),
  },
});
