import React, { use, useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import LottieView from 'lottie-react-native';
import { RFValue } from '../../../utils/responsive';
import commonStyles from '../../../styles/commonStyles';
import SplashButton from '../../../components/SplashButton';
import colors from '../../../styles/colors';
import { useDispatch, useSelector } from 'react-redux';
import { finishGame } from '../../../store/gameSlice';
import { RootState } from '../../../store/store';
import { clearGameTimer } from '../utils/gameTimer';

export const Congratulation = ({ navigation, route }) => {
  const { task, activeCode, gameId, score } = route.params;
  const dispatch = useDispatch<any>();
  const { user } = useSelector((state: RootState) => state.auth);
  console.log({
    user,
    activeCode,
    gameId,
    playerId: user?.playerId,
    questions: task,
    status: 'finished',
  });

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
      
      // Clear timer data when game is finished
      if (gameId) {
        await clearGameTimer(gameId, activeCode);
      }
    };
    
    finishGameAndClearTimer();
  }, []);

  // ✅ Calculate stats
  console.log({ task });
  const total =
    task?.filter(t => t.question?.answerType !== 'no_answer')?.length || 0;
  const correct =
    task?.filter(t => t.isCorrect && t.question?.answerType !== 'no_answer')
      ?.length || 0;
  const wrong = total - correct;

  console.log({total:task?.filter(t => t.question?.answerType !== 'no_answer')})

  return (
    <View style={[commonStyles.container, styles.container]}>
      {/* 🎉 Background Animation */}
      <LottieView
        source={require('../../../assets/animation/congratulation.json')}
        autoPlay
        loop={false}
        style={styles.congratulation}
      />

      {/* 🏆 Trophy Animation */}
      <LottieView
        source={require('../../../assets/animation/Trophy.json')}
        autoPlay
        loop
        style={styles.trophy}
        
      />

      {/* 🥳 Text Section */}
      <Text style={[commonStyles.h1Text, styles.title]}>Congratulations!</Text>
      <Text style={[commonStyles.pText, styles.subtitle]}>
        You’ve successfully completed the test.
      </Text>

      {/* 📊 Result Summary */}
      <View style={styles.statsCard}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Total Questions:</Text>
          <Text style={styles.statValue}>{total}</Text>
        </View>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Correct Answers:</Text>
          <Text style={[styles.statValue, { color: 'green' }]}>{correct}</Text>
        </View>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Wrong Answers:</Text>
          <Text style={[styles.statValue, { color: 'red' }]}>{wrong}</Text>
        </View>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Accuracy:</Text>
          <Text style={[styles.statValue, { color: colors.primarydark }]}>
            {((correct / total) * 100).toFixed(1)}%
          </Text>
        </View>
      </View>

      {/* 🏠 Button */}
      <SplashButton
        buttonStyle={[
          { marginTop: RFValue(25), backgroundColor: colors.primarydark },
        ]}
        onPress={() => navigation?.navigate('BottomTabs')}
        title="Go To Home"
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
