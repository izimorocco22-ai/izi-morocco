import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import { RFValue } from '../../../utils/responsive';
import commonStyles from '../../../styles/commonStyles';
import SplashButton from '../../../components/SplashButton';
import colors from '../../../styles/colors';
import { useDispatch, useSelector } from 'react-redux';
import { finishGame } from '../../../store/gameSlice';
import { RootState } from '../../../store/store';
import { clearGameTimer } from '../utils/gameTimer';
import { t } from '../../../utils/translations';

export const Congratulation = ({ navigation, route }) => {
  const { task, activeCode, gameId, score, language } = route.params;
  const dispatch = useDispatch<any>();
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const finishGameAndClearTimer = async () => {
      const filteredQuestions = task.map(q => ({
        _id: q?.question?._id,
        latitude: q?.latitude,
        longitude: q?.longitude,
        radius: q?.radius,
        order: q?.order,
        isFinished: q?.isFinished,
        isCorrect: q?.isCorrect,
        isDisplayed: q?.isFinished ? true : q?.isDisplayed,
        isShownOnPlayground: q?.isShownOnPlayground,
      }));
      dispatch(
        finishGame({
          activationCode: activeCode,
          gameId,
          playerId: user?.playerId,
          questions: filteredQuestions,
          status: 'finished',
          score,
        }),
      );
      if (gameId) {
        await clearGameTimer(gameId, activeCode);
      }
    };
    finishGameAndClearTimer();
  }, []);

  const answerableTypes = ['mcq', 'multiple', 'number', 'text', 'code_box', 'puzzle', 'take_photo', 'augmented_photo', 'record_video'];
  const answeredTasks = task?.filter(
    (t: any) => answerableTypes.includes(t.question?.answerType) && t.isFinished
  ) || [];
  const total = answeredTasks.length;
  const correct = answeredTasks.filter((t: any) => t.isCorrect).length;
  const wrong = total - correct;

  return (
    <View style={[commonStyles.container, styles.container]}>
      <LottieView
        source={require('../../../assets/animation/congratulation.json')}
        autoPlay
        loop={false}
        style={styles.congratulation}
      />
      <LottieView
        source={require('../../../assets/animation/Trophy.json')}
        autoPlay
        loop
        style={styles.trophy}
      />
      <Text style={[commonStyles.h1Text, styles.title]}>{t(language, 'congratulations')}</Text>
      <Text style={[commonStyles.pText, styles.subtitle]}>
        {t(language, 'completedTest')}
      </Text>
      <View style={styles.statsCard}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>{t(language, 'totalQuestions')}</Text>
          <Text style={styles.statValue}>{total}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>{t(language, 'correctAnswers')}</Text>
          <Text style={[styles.statValue, { color: 'green' }]}>{correct}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>{t(language, 'wrongAnswers')}</Text>
          <Text style={[styles.statValue, { color: 'red' }]}>{wrong}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>{t(language, 'accuracy')}</Text>
          <Text style={[styles.statValue, { color: colors.primarydark }]}>
            {total > 0 ? ((correct / total) * 100).toFixed(1) : '0.0'}%
          </Text>
        </View>
      </View>
      <SplashButton
        buttonStyle={[{ marginTop: RFValue(25), backgroundColor: colors.primarydark }]}
        onPress={() => navigation?.navigate('BottomTabs')}
        title={t(language, 'goToHome')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: RFValue(20),
  },
  congratulation: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  trophy: {
    width: RFValue(250),
    height: RFValue(250),
    marginBottom: RFValue(10),
  },
  title: {
    marginTop: RFValue(10),
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: RFValue(20),
  },
  statsCard: {
    width: '85%',
    backgroundColor: '#f9f9f9',
    borderRadius: RFValue(12),
    padding: RFValue(16),
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: RFValue(8),
  },
  statLabel: {
    fontSize: RFValue(15),
    color: '#444',
    fontWeight: '500',
  },
  statValue: {
    fontSize: RFValue(15),
    fontWeight: '700',
    color: '#222',
  },
});
