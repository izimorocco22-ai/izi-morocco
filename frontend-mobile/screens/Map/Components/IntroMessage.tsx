// components/IntroMessage.js
import React from 'react';
import { Modal, View, StyleSheet, ScrollView } from 'react-native';
import commonStyles from '../../../styles/commonStyles';
import QuillRenderer from '../../../components/QuillRenderer';
import SplashButton from '../../../components/SplashButton';
import { RFValue } from '../../../utils/responsive';
import colors from '../../../styles/colors';

import { t } from '../../../utils/translations';

const IntroMessage = ({ visible, onContinue, message, language }: any) => {
  if (!visible) return null;

  return (
    <>
      {visible && (
        <View
          style={[
            { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
          ]}
        >
          <View style={styles.overlay}>
            <View style={styles.modalContainer}>
              {/* White content box (same structure as QuestionModal) */}
              <View style={styles.whiteBox}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={[
                    commonStyles.scrollContainer,
                    styles.scrollInner,
                  ]}
                >
                  <View style={{ marginBottom: RFValue(10) }}>
                    <QuillRenderer questionName={message} />
                  </View>
                </ScrollView>
              </View>

              {/* Fixed footer button */}
              <View style={styles.footer}>
                <SplashButton

                  onPress={onContinue}
                  title={t(language, 'continue')}
                  loadingText="Please wait..."
                  buttonStyle={styles.continueButton}
                />
              </View>
            </View>
          </View>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: RFValue(20),
    paddingTop: RFValue(120),
  },
  modalContainer: {
    width: '100%',
    maxHeight: '90%',
    alignItems: 'center',
    flex: 1,
  },
  whiteBox: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderRadius: RFValue(10),
    padding: RFValue(15),
    width: '100%',
    flex: 1,
    elevation: 0,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  footer: {
    width: '100%',
    marginTop: RFValue(15),
  },
  continueButton: {
    width: '100%',
    height: RFValue(45),
    borderRadius: RFValue(8),
    backgroundColor: '#deca88',
  },
  scrollInner: {
    paddingBottom: RFValue(10),
  },
});

export default IntroMessage;
