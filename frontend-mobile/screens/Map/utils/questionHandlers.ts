import { Alert } from 'react-native';
import { markerGets } from './markerLogic';
import { useEffect } from 'react';

export const handleSubmitAnswer = (
  stateRef: any,
  dispatch: any,
  blocklyJson: any,
) => {
  const currentQuestion = stateRef.current.currentQuestion;
  if (!currentQuestion) return Alert.alert('Invalid question data');

  const { answerType, options = [], correctAnswers = [] } = currentQuestion;
  let isCorrect = false;

  if (answerType === 'mcq' || answerType === 'multiple') {
    const selectedTexts = stateRef.current.selectedOption.map(
      (index: number) => options[index]?.text,
    );
    isCorrect =
      JSON.stringify([...selectedTexts].sort()) ===
      JSON.stringify([...correctAnswers].sort());
  } else if (answerType === 'number') {
    isCorrect =
      stateRef.current.inputAnswer.trim() === correctAnswers[0]?.trim();
  } else if (answerType === 'text' || answerType === 'code_box') {
    isCorrect =
      stateRef.current.inputAnswer.trim().toLowerCase() ===
      correctAnswers[0]?.trim().toLowerCase();
  } else if (answerType === 'puzzle') {
    const inputStr = stateRef.current.inputAnswer.trim();
    const config = currentQuestion.puzzleConfig || { matchType: 'exact' };

    const parseUrl = (url: string) => {
      let clean = url.replace(/^(?:f|ht)tps?:\/\//i, '');
      clean = clean.split('?')[0].split('#')[0];
      const parts = clean.split('/');
      const host = parts[0].toLowerCase();
      const rawPath = '/' + parts.slice(1).join('/');
      const path = rawPath.endsWith('/') && rawPath.length > 1 ? rawPath.slice(0, -1) : rawPath;
      return { host, path, full: host + path };
    };

    const inputParsed = parseUrl(inputStr);

    isCorrect = correctAnswers.some((ans: string) => {
      const correctParsed = parseUrl(ans.trim());
      
      if (config.matchType === 'domain') {
        return inputParsed.host === correctParsed.host;
      }
      if (config.matchType === 'path') {
        return inputParsed.path === correctParsed.path;
      }
      // exact
      return inputParsed.full === correctParsed.full;
    });
  } else isCorrect = true;
  console.log({ submit: stateRef.current });
  console.log({ questionId: currentQuestion._id });
  const sortedTimers = stateRef.current.timerData.filter(
    t => t.type === 'timer_after_finished' && t.task.id === currentQuestion._id,
  );
  console.log({ sortedTimers });
  sortedTimers.forEach(item => {
    setTimeout(() => {
      console.log(item.seconds);
      markerGets(
        stateRef.current.task,
        blocklyJson,
        dispatch,
        stateRef.current,
        item.seconds,
      );
      dispatch({
        type: 'UPDATE_TIMER_FINISHED',
        payload: item.seconds,
      });
    }, item.seconds * 1000);
  });

  dispatch({ type: 'SET_IS_ANSWER_CORRECT', payload: isCorrect });
  if (
    currentQuestion?.settings?.behaviorOption === 'keep_until_correct' &&
    isCorrect
  ) {
    dispatch({
      type: 'SET_TARGETS',
      payload: stateRef.current.targets.filter(
        t => t.question._id !== currentQuestion._id,
      ),
    });
  }
  dispatch({ type: 'SET_RESULT_MODAL', payload: true });
};
