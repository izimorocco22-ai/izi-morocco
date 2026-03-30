import React from 'react';
import {
  Modal,
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native';
import { RFValue } from '../../../utils/responsive';
import QuillRenderer from '../../../components/QuillRenderer';

const AnswerResultModal = ({
  visible,
  isCorrect,
  onNext,
  commentsAfterFinishingQuestion = {},
}) => {
  const hasCorrectContent =
    commentsAfterFinishingQuestion?.commentsAfterCorrection &&
    Object.keys(commentsAfterFinishingQuestion.commentsAfterCorrection).length > 0;

  const hasRejectionContent =
    commentsAfterFinishingQuestion?.commentsAfterRejection &&
    Object.keys(commentsAfterFinishingQuestion.commentsAfterRejection).length > 0;

  // If no admin content set for this result, don't show the modal at all
  const hasContent = isCorrect ? hasCorrectContent : hasRejectionContent;
  if (!visible || !hasContent) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ width: '100%' }}
            contentContainerStyle={{ paddingBottom: RFValue(10) }}
          >
            <QuillRenderer
              questionName={
                isCorrect
                  ? commentsAfterFinishingQuestion?.commentsAfterCorrection
                  : commentsAfterFinishingQuestion?.commentsAfterRejection
              }
            />
          </ScrollView>

          <TouchableOpacity style={styles.button} onPress={onNext}>
            <Text style={styles.buttonText}>
              {isCorrect ? 'Next' : 'Try Again'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: 'white',
    borderRadius: RFValue(16),
    paddingVertical: RFValue(20),
    paddingHorizontal: RFValue(15),
    width: '92%',
    maxHeight: '85%',
    alignItems: 'center',
  },
  button: {
    marginTop: RFValue(14),
    backgroundColor: '#d8b443',
    borderRadius: RFValue(8),
    paddingVertical: RFValue(10),
    paddingHorizontal: RFValue(40),
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: RFValue(14),
  },
});

export default AnswerResultModal;
