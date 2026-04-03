import React from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { RFValue } from '../../../utils/responsive';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Extract first image URL from Quill delta content
const extractImageUrl = (content: any): string | null => {
  if (!content) return null;
  if (typeof content === 'string' && content.startsWith('http')) return content;
  if (content?.ops && Array.isArray(content.ops)) {
    for (const op of content.ops) {
      if (op?.insert?.image) return op.insert.image;
    }
  }
  return null;
};

const AnswerResultModal = ({
  visible,
  isCorrect,
  onNext,
  commentsAfterFinishingQuestion = {},
}: any) => {
  if (!visible) return null;

  const correctContent = commentsAfterFinishingQuestion?.commentsAfterCorrection;
  const rejectionContent = commentsAfterFinishingQuestion?.commentsAfterRejection;
  const content = isCorrect ? correctContent : rejectionContent;
  const imageUrl = extractImageUrl(content);

  return (
    <View style={styles.overlay}>
      {/* Full centered image */}
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="contain"
        />
      ) : null}

      {/* Button only */}
      <TouchableOpacity
        style={[styles.button, isCorrect ? styles.nextBtn : styles.retryBtn]}
        onPress={onNext}
        activeOpacity={0.85}
      >
        <Text style={styles.buttonText}>
          {isCorrect ? 'Next' : 'Try Again'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 200,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: RFValue(20),
    paddingBottom: RFValue(30),
  },
  image: {
    width: SCREEN_WIDTH - RFValue(40),
    height: SCREEN_HEIGHT * 0.65,
    marginBottom: RFValue(24),
  },
  button: {
    borderRadius: RFValue(12),
    paddingVertical: RFValue(14),
    paddingHorizontal: RFValue(64),
    alignSelf: 'center',
  },
  nextBtn: {
    backgroundColor: '#d8b443',
  },
  retryBtn: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: RFValue(16),
  },
});

export default AnswerResultModal;
