// components/QuestionModal.js
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  AppState,
  Image,
  Text,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Sound from 'react-native-sound';
import QuillRenderer from '../../../components/QuillRenderer';
import commonStyles from '../../../styles/commonStyles';
import SplashButton from '../../../components/SplashButton';
import { RFValue } from '../../../utils/responsive';
import QuestionRenderer from './QuestionRender';
import MediaRenderer from './MediaRenderer';

const QuestionModal = ({
  visible,
  questionData,
  selectedOption,
  setSelectedOption,
  inputAnswer,
  setInputAnswer,
  onSubmit,
}) => {
  const soundRef = useRef(null);

  // Sequence Index for starting audios
  const startAudioIndex = useRef(0);
  const isPlayingStartAudios = useRef(false);

  const isSubmitType =
    questionData?.answerType === 'mcq' ||
    questionData?.answerType === 'multiple' ||
    questionData?.answerType === 'number' ||
    questionData?.answerType === 'text' ||
    questionData?.answerType === 'take_photo' ||
    questionData?.answerType === 'augmented_photo' ||
    questionData?.answerType === 'record_video';

  const buttonTitle = isSubmitType ? 'Submit' : 'Next';

  // -------------------------------
  // FUNCTION → Play Starting Audios Sequentially
  // -------------------------------
  const playStartingAudios = (startingAudios, onComplete) => {
    if (!startingAudios.length) return onComplete(); // no starting → go to background

    isPlayingStartAudios.current = true;
    startAudioIndex.current = 0;

    const playNext = () => {
      const current = startingAudios[startAudioIndex.current];
      if (!current) {
        isPlayingStartAudios.current = false;
        return onComplete(); // finish → start background
      }

      const fullUrl = (current.url && (current.url.startsWith('http') || current.url.startsWith('file:'))) 
        ? current.url 
        : `https://res.cloudinary.com/dxoipnmx0/video/upload/v1759483737/${current.url}`;

      const sound = new Sound(fullUrl, null, error => {
        if (error) return playNext(); // skip invalid audio

        sound.play(success => {
          sound.release();
          startAudioIndex.current += 1;
          playNext(); // play next in sequence
        });
      });

      soundRef.current = sound;
    };

    playNext();
  };

  // -------------------------------
  // FUNCTION → Play Background Audio Loop
  // -------------------------------
  const playBackgroundAudio = backgroundAudio => {
    if (!backgroundAudio) return;

    const fullUrl = (backgroundAudio.url && (backgroundAudio.url.startsWith('http') || backgroundAudio.url.startsWith('file:'))) 
      ? backgroundAudio.url 
      : `https://res.cloudinary.com/dxoipnmx0/video/upload/v1759483737/${backgroundAudio.url}`;

    const sound = new Sound(fullUrl, null, error => {
      if (error) return;

      sound.setVolume(0.6);
      sound.setNumberOfLoops(-1); // loop
      sound.play();
    });

    soundRef.current = sound;
  };

  // -------------------------------
  // useEffect → Manage All Audio Logic
  // -------------------------------
  useEffect(() => {
    if (!visible) return;

    let audios = questionData?.media?.audios || [];
    const startingAudios = audios.filter(a => a.type === 'starting');
    const backgroundAudio = audios.find(a => a.type === 'background');

    // Step 1 → Play all starting audios in order
    playStartingAudios(startingAudios, () => {
      // Step 2 → After finishing → play loop background audio
      playBackgroundAudio(backgroundAudio);
    });

    // AppState Stop Audio
    const appListener = AppState.addEventListener('change', nextState => {
      if (nextState !== 'active' && soundRef.current) {
        soundRef.current.stop(() => soundRef?.current?.release());
        soundRef.current = null;
      }
    });

    // Stop on unmount or modal close
    return () => {
      if (soundRef.current) {
        soundRef?.current?.stop(() => soundRef?.current?.release());
        soundRef.current = null;
      }
      appListener.remove();
    };
  }, [visible, questionData]);

  const [showScrollArrow, setShowScrollArrow] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);

  const isPuzzle = questionData?.answerType === 'puzzle';

  const puzzleInjectedJS = `
    (function() {
      try {
        var style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = 'body{margin:0;padding:0;} audio{max-width:100%;width:100%;box-sizing:border-box;display:block;}';
        document.head.appendChild(style);

        var existing = document.querySelector('meta[name="viewport"]');
        var content = 'width=device-width, initial-scale=0.5, minimum-scale=0.3, maximum-scale=4, user-scalable=1';
        if (existing) {
          existing.setAttribute('content', content);
        } else {
          var meta = document.createElement('meta');
          meta.setAttribute('name', 'viewport');
          meta.setAttribute('content', content);
          document.head.appendChild(meta);
        }
      } catch (e) {}
    })();
    true;
  `;

  return (
    <View
      style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 ,zIndex:99}]}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Scrollable Question Area */}
          <View style={styles.whiteBox}>
            <ScrollView
              scrollEnabled={!isPuzzle}
              nestedScrollEnabled={!isPuzzle}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                commonStyles.scrollContainer,
                styles.scrollInner,
              ]}
              onContentSizeChange={(contentWidth, contentHeight) => {
                // Detect if content is larger than visible area (approx)
                if (!isPuzzle && contentHeight > 300) {
                  setShowScrollArrow(true);
                }
              }}
              onScroll={e => {
                if (isPuzzle) return;

                const { contentOffset, layoutMeasurement, contentSize } =
                  e.nativeEvent;

                const isBottom =
                  layoutMeasurement.height + contentOffset.y >=
                  contentSize.height - 20;

                setIsAtBottom(isBottom);
              }}
              scrollEventThrottle={16}
            >
              {/* Question */}
              <View
                style={{
                  borderWidth: 1,
                  borderColor: '#deca88',
                  borderRadius: RFValue(8),
                  borderStyle: 'dashed',
                  marginBottom: RFValue(10),
                }}
              >
                <MediaRenderer media={questionData?.media} />

                <QuillRenderer questionName={questionData?.question} />
              </View>

              {questionData && questionData?.answerType === 'puzzle' && (
                <View
                  style={[
                    styles.webviewContainer,
                    { height: RFValue(420), marginBottom: RFValue(10) },
                  ]}
                >
                  <WebView
                    source={{
                      uri: 'https://izimorocco-jeux.online/Puzzle-mots-croises.html',
                    }}
                    style={{ flex: 1 }}
                    javaScriptEnabled
                    domStorageEnabled
                    startInLoadingState
                    injectedJavaScript={puzzleInjectedJS}
                    injectedJavaScriptBeforeContentLoaded={puzzleInjectedJS}
                    onError={syntheticEvent => {
                      const { nativeEvent } = syntheticEvent;
                      console.warn('WebView error: ', nativeEvent);
                    }}
                  />
                </View>
              )}

              <QuestionRenderer
                question={questionData}
                selectedOption={selectedOption}
                setSelectedOption={setSelectedOption}
                inputAnswer={inputAnswer}
                setInputAnswer={setInputAnswer}
              />
            </ScrollView>
            {showScrollArrow && !isAtBottom && !isPuzzle && (
              <View
                style={{
                  position: 'absolute',
                  bottom: RFValue(30),
                  alignSelf: 'center',
                  zIndex: 100,
                }}
              >
                <Image
                  source={require('../../../assets/images/icon/down-arrow.png')}
                  style={{ width: 30, height: 30, opacity: 0.6 }}
                />
              </View>
            )}
          </View>

          {/* Fixed Footer Button */}
          <View style={styles.footer}>
            <SplashButton
              buttonStyle={styles.submitButton}
              onPress={() => onSubmit()}
              title={buttonTitle}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: RFValue(20),
  },
  modalContainer: {
    width: '100%',
    maxHeight: '95%',
    alignItems: 'center',
    flex: 1,
  },
  whiteBox: {
    backgroundColor: '#faf6ed',
    borderWidth: 2,
    borderColor: '#deca88',
    borderRadius: RFValue(10),
    padding: RFValue(15),
    width: '100%',
    flex: 1,
    elevation: 8,
    shadowColor: '#fc9300ff',
    shadowOpacity: 0.15,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  webviewContainer: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f2f2f2',
  },
  scrollInner: {
    paddingBottom: RFValue(10),
  },
  footer: {
    width: '100%',
    marginTop: RFValue(15),
  },
  submitButton: {
    width: '100%',
    height: RFValue(45),
    borderRadius: RFValue(8),
    backgroundColor: '#d8b443',
  },
});

export default QuestionModal;
