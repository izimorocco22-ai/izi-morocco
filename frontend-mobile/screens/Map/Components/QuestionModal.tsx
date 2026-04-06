import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  AppState,
  Image,
  Text,
  ImageBackground,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Sound from 'react-native-sound';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DeviceInfo from 'react-native-device-info';
import QuillRenderer from '../../../components/QuillRenderer';
import commonStyles from '../../../styles/commonStyles';
import SplashButton from '../../../components/SplashButton';
import { RFValue } from '../../../utils/responsive';
import QuestionRenderer from './QuestionRender';
import MediaRenderer from './MediaRenderer';
import { t } from '../../../utils/translations';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const statusBarHeight = StatusBar.currentHeight || 0;

const QuestionModal = ({
  visible,
  questionData,
  selectedOption,
  setSelectedOption,
  inputAnswer,
  setInputAnswer,
  onSubmit,
  backgroundImage,
  language,
}) => {
  const soundRef = useRef(null);
  const insets = useSafeAreaInsets();
  const [hasNavigationBar, setHasNavigationBar] = useState(false);

  // Check if device has navigation bar
  useEffect(() => {
    const checkNavigationBar = async () => {
      if (Platform.OS === 'android') {
        try {
          const hasNotch = await DeviceInfo.hasNotch();
          const brand = await DeviceInfo.getBrand();
          // Samsung devices often have navigation bars
          const isSamsung = brand.toLowerCase().includes('samsung');
          setHasNavigationBar(isSamsung || insets.bottom > 0);
        } catch (error) {
          // Fallback: assume navigation bar exists if bottom inset > 0
          setHasNavigationBar(insets.bottom > 0);
        }
      }
    };
    checkNavigationBar();
  }, [insets.bottom]);

  // Sequence Index for starting audios
  const startAudioIndex = useRef(0);
  const isPlayingStartAudios = useRef(false);

  const isSubmitType =
    questionData?.answerType === 'mcq' ||
    questionData?.answerType === 'multiple' ||
    questionData?.answerType === 'number' ||
    questionData?.answerType === 'text' ||
    questionData?.answerType === 'code_box' ||
    questionData?.answerType === 'take_photo' ||
    questionData?.answerType === 'augmented_photo' ||
    questionData?.answerType === 'record_video' ||
    (questionData?.answerType === 'puzzle' && !!questionData?.puzzleAnswerType);

  const buttonTitle = isSubmitType ? t(language, 'submit') : t(language, 'next');

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

  const getBackgroundImageUri = () => {
    if (!backgroundImage) return null;
    if (backgroundImage.startsWith('http') || backgroundImage.startsWith('file:')) {
      return backgroundImage;
    }
    return `https://res.cloudinary.com/dik1l8tqu/image/upload/v1759483737/${backgroundImage}`;
  };

  const backgroundUri = getBackgroundImageUri();

  const [showScrollArrow, setShowScrollArrow] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);

  const isPuzzle = questionData?.answerType === 'puzzle';
  const [showPuzzleFull, setShowPuzzleFull] = useState(false);
  const puzzleUrl = questionData?.puzzleUrl || 'https://izi-morocco-delta.vercel.app/puzzle-default.html';

  useEffect(() => {
    if (!visible) {
      setShowPuzzleFull(false);
    }
  }, [visible, questionData]);

  const puzzleInjectedJS = `
    (function() {
      try {
        var style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = 'body{margin:0;padding:0;} audio{max-width:100%;width:100%;box-sizing:border-box;display:block;}';
        document.head.appendChild(style);

        var existing = document.querySelector('meta[name="viewport"]');
         var content = 'width=device-width, initial-scale=0.5, minimum-scale=0.3, maximum-scale=4, user-scalable=no';
        if (existing) {
          existing.setAttribute('content', content);
        } else {
          var meta = document.createElement('meta');
          meta.setAttribute('name', 'viewport');
          meta.setAttribute('content', content);
          document.head.appendChild(meta);
        }

        // Disable double-tap zoom
        var lastTap = 0;
        document.addEventListener('touchend', function(e) {
          var now = Date.now();
          if (now - lastTap < 300) {
            e.preventDefault();
          }
          lastTap = now;
        }, { passive: false });
      } catch (e) {}
    })();
    true;
  `;

  // Add loading state check to ensure modal renders properly
  if (!visible || !questionData || !questionData.question) {
    return null;
  }

  return (
    <View
      style={[{ 
        position: 'absolute', 
        top: 0,
        left: 0, 
        right: 0, 
        bottom: 0,
        width: screenWidth,
        height: screenHeight,
        zIndex: 99 
      }]}
    >
      {backgroundUri && (
        <ImageBackground
          source={{ uri: backgroundUri }}
          style={styles.fullBackgroundImage}
          resizeMode="cover"
        >
          <View style={styles.fullBackgroundOverlay} />
        </ImageBackground>
      )}
      <View style={[styles.overlay, { 
        paddingBottom: hasNavigationBar ? Math.max(insets.bottom + 20, 60) : Math.max(insets.bottom, 20) 
      }]}>
        <View style={styles.modalContainer}>
          {/* Scrollable Question Area */}
          <View style={styles.whiteBox}>
            {isPuzzle && showPuzzleFull ? (
              <ScrollView
                scrollEnabled
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                  commonStyles.scrollContainer,
                  styles.scrollInner,
                ]}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: RFValue(5),
                    paddingHorizontal: RFValue(10),
                  }}
                >
                  <Text style={[commonStyles.h2Text]}>{t(language, 'puzzle')}</Text>
                  <SplashButton
                    buttonStyle={{
                      paddingHorizontal: RFValue(12),
                      height: RFValue(32),
                      borderRadius: RFValue(6),
                      backgroundColor: '#d8b443',
                    }}
                    title={t(language, 'back')}
                    onPress={() => setShowPuzzleFull(false)}
                  />
                </View>

                <View
                  style={[
                    styles.webviewContainer,
                    { height: RFValue(420), marginBottom: RFValue(5), marginHorizontal: RFValue(10) },
                  ]}
                >
                  <WebView
                    key={puzzleUrl}
                    source={{
                      uri: puzzleUrl,
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

                <View style={{ paddingHorizontal: RFValue(10) }}>
                  <QuestionRenderer
                    question={questionData}
                    selectedOption={selectedOption}
                    setSelectedOption={setSelectedOption}
                    inputAnswer={inputAnswer}
                    setInputAnswer={setInputAnswer}
                  />
                </View>
              </ScrollView>
            ) : (
              <>
                <ScrollView
                  scrollEnabled
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={[
                    commonStyles.scrollContainer,
                    styles.scrollInner,
                  ]}
                  onContentSizeChange={(contentWidth, contentHeight) => {
                    if (contentHeight > 300) {
                      setShowScrollArrow(true);
                    }
                  }}
                  onScroll={e => {
                    const { contentOffset, layoutMeasurement, contentSize } =
                      e.nativeEvent;

                    const isBottom =
                      layoutMeasurement.height + contentOffset.y >=
                      contentSize.height - 20;

                    setIsAtBottom(isBottom);
                  }}
                  scrollEventThrottle={16}
                >
                  <View
                    style={{
                      marginBottom: RFValue(1),
                    }}
                  >
                    <MediaRenderer media={questionData?.media} />

                    <View style={{ paddingHorizontal: RFValue(10) }}>
                      <QuillRenderer questionName={questionData?.question} />
                    </View>
                  </View>

                  {questionData && questionData?.answerType === 'puzzle' && (
                    <View style={{ marginBottom: RFValue(5) }}>
                      <SplashButton
                        buttonStyle={{
                          width: '100%',
                          height: RFValue(42),
                          borderRadius: RFValue(8),
                          backgroundColor: '#d8b443',
                        }}
                        title={t(language, 'openPuzzle')}
                        onPress={() => setShowPuzzleFull(true)}
                      />
                    </View>
                  )}

                  <View style={{ paddingHorizontal: RFValue(10) }}>
                    <QuestionRenderer
                      question={questionData}
                      selectedOption={selectedOption}
                      setSelectedOption={setSelectedOption}
                      inputAnswer={inputAnswer}
                      setInputAnswer={setInputAnswer}
                    />
                  </View>
                </ScrollView>
                {showScrollArrow && !isAtBottom && (
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
              </>
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
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: RFValue(20),
    paddingTop: RFValue(120), // Add top padding to start below Map/Playground buttons
  },
  modalContainer: {
    width: '100%',
    maxHeight: '95%',
    alignItems: 'center',
    flex: 1,
  },
  whiteBox: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderRadius: RFValue(10),
    padding: 0,
    width: '100%',
    flex: 1,
    elevation: 0,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    overflow: 'hidden',
  },
  fullBackgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  fullBackgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  webviewContainer: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f2f2f2',
  },
  scrollInner: {
    paddingBottom: RFValue(30),
  },
  footer: {
    width: '100%',
    marginTop: RFValue(8),
    paddingBottom: RFValue(10),
  },
  submitButton: {
    width: '100%',
    height: RFValue(45),
    borderRadius: RFValue(8),
    backgroundColor: '#d8b443',
  },
});

export default QuestionModal;
