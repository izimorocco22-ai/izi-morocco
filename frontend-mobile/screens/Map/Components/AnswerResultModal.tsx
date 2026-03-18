// components/AnswerResultModal.js
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import colors from '../../../styles/colors'; // adjust import path if needed
import { RFValue } from '../../../utils/responsive'; // optional if you use it elsewhere
import SplashButton from '../../../components/SplashButton';
import commonStyles from '../../../styles/commonStyles';
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
          
          {isCorrect ? (
            <>
              <View
                style={[
                  {
                    borderWidth: 1,
                    borderColor: '#deca88',
                    borderRadius: RFValue(8),
                    borderStyle: 'dashed',
                    marginBottom: RFValue(10),
                  },
                ]}
              >
                <QuillRenderer
                  questionName={
                    commentsAfterFinishingQuestion?.comments
                      ?.commentsAfterCorrection
                  }
                />
              </View>
            </>
          ) : (
            <>
              <View
                style={[
                  {
                    borderWidth: 1,
                    borderColor: '#deca88',
                    borderRadius: RFValue(8),
                    borderStyle: 'dashed',
                    marginBottom: RFValue(10),
                  },
                ]}
              >
                <QuillRenderer
                  questionName={
                    commentsAfterFinishingQuestion?.comments
                      ?.commentsAfterRejection
                  }
                />
              </View>
            </>
          )}


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
    backgroundColor: '#faf6ed',
    borderColor: '#d8b443',
    borderWidth: 2,
    paddingVertical: 30,
    paddingHorizontal: 25,
    borderRadius: 16,
    width: '80%',
    alignItems: 'center',
    elevation: 10,
  },
});

export default AnswerResultModal;
