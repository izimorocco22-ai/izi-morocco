import React from 'react';
import {
  Modal,
  View,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { RFValue } from '../../../utils/responsive';
import QuillRenderer from '../../../components/QuillRenderer';

const AnswerResultModal = ({
  visible,
  isCorrect,
  onNext,
  commentsAfterFinishingQuestion = {},
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView showsVerticalScrollIndicator={false} style={{ width: '100%' }}>
          
          {isCorrect ? (
            <>
              <View style={{ marginBottom: RFValue(10) }}>
                <QuillRenderer
                  questionName={
                    commentsAfterFinishingQuestion?.commentsAfterCorrection
                  }
                />
              </View>
            </>
          ) : (
            <>
              <View style={{ marginBottom: RFValue(10) }}>
                <QuillRenderer
                  questionName={
                    commentsAfterFinishingQuestion?.commentsAfterRejection
                  }
                />
              </View>
            </>
          )}


          </ScrollView>
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
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderWidth: 0,
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderRadius: 16,
    width: '92%',
    maxHeight: '90%',
    alignItems: 'center',
    elevation: 0,
  },
});

export default AnswerResultModal;
