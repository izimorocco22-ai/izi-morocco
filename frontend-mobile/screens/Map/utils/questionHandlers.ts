import { Alert } from 'react-native';
import { markerGets } from './markerLogic';
import { uploadFile } from '../../../utils/uploadService';

export const handleSubmitAnswer = async (
  stateRef: any,
  dispatch: any,
  blocklyJson: any,
  onComplete?: () => void,
) => {
  const currentQuestion = stateRef.current.currentQuestion;
  if (!currentQuestion) return Alert.alert('Invalid question data');

  const {
    answerType,
    options = [],
    correctAnswers = [],
    puzzleAnswerType,
    puzzleAnswerText,
  } = currentQuestion;
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
    if (puzzleAnswerType === 'mcq') {
      const selectedTexts = stateRef.current.selectedOption.map(
        (index: number) => options[index]?.text,
      );
      isCorrect =
        JSON.stringify([...selectedTexts].sort()) ===
        JSON.stringify([...correctAnswers].sort());
    } else if (puzzleAnswerType === 'code_box') {
      const user = stateRef.current.inputAnswer || '';
      const correct = correctAnswers[0] ?? '';
      isCorrect =
        user.trim().toLowerCase() === correct.toString().trim().toLowerCase();
    } else if (puzzleAnswerType === 'number') {
      isCorrect =
        stateRef.current.inputAnswer.trim() ===
        (puzzleAnswerText || '').trim();
    } else if (puzzleAnswerType === 'text') {
      isCorrect =
        stateRef.current.inputAnswer.trim().toLowerCase() ===
        (puzzleAnswerText || '').trim().toLowerCase();
    } else {
      const correctAnswer = currentQuestion.puzzleAnswerText;
      isCorrect =
        stateRef.current.inputAnswer.trim().toLowerCase() ===
        correctAnswer?.trim().toLowerCase();
    }
  } else if (['take_photo', 'augmented_photo', 'record_video'].includes(answerType)) {
    const localUri = stateRef.current.inputAnswer;
    if (!localUri) {
      return Alert.alert('Error', `Please capture a ${answerType.replace('_', ' ')} before submitting.`);
    }
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const uploadResult = await uploadFile(localUri);
      if (!uploadResult || !uploadResult.url) {
        throw new Error('Upload succeeded but no URL returned');
      }
      dispatch({ type: 'SET_INPUT_ANSWER', payload: uploadResult.url });
      isCorrect = true;
    } catch (error: any) {
      dispatch({ type: 'SET_LOADING', payload: false });
      Alert.alert('Upload Failed', error.message || 'Failed to upload media');
      return;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  } else {
    // no-answer types (info, none) — always correct
    isCorrect = true;
  }

  dispatch({ type: 'SET_IS_ANSWER_CORRECT', payload: isCorrect });

  // Wrong answer: show result modal with admin's rejection image/text, task stays incomplete
  if (!isCorrect) {
    if (onComplete) onComplete();
    return;
  }

  // Correct answer only: fire timers, mark task finished, update map & list
  const sortedTimers = stateRef.current.timerData.filter(
    (t: any) => t.type === 'timer_after_finished' && t.task.id === currentQuestion._id,
  );
  sortedTimers.forEach((item: any) => {
    setTimeout(() => {
      markerGets(
        stateRef.current.task,
        blocklyJson,
        dispatch,
        stateRef.current,
        item.seconds,
      );
      dispatch({ type: 'UPDATE_TIMER_FINISHED', payload: item.seconds });
    }, item.seconds * 1000);
  });

  const updatedTasks = stateRef.current.task.map((t: any) =>
    t.question?._id === currentQuestion._id
      ? { ...t, isFinished: true, isCorrect: true, isDisplayed: true, userAnswer: stateRef.current.inputAnswer }
      : t,
  );

  dispatch({ type: 'SET_TASK', payload: updatedTasks });
  dispatch({ type: 'ADD_COMPLETED_TARGETS', payload: [currentQuestion._id] });

  const updatedState = {
    ...stateRef.current,
    task: updatedTasks,
    list: (stateRef.current.list || []).filter((t: any) => t.question?._id !== currentQuestion._id),
    completedTargets: [...stateRef.current.completedTargets, currentQuestion._id],
  };

  markerGets(updatedTasks, blocklyJson, dispatch, updatedState, stateRef.current.time);

  // onComplete fires only on correct answer — shows result modal and auto-advances
  if (onComplete) onComplete();

  if (currentQuestion?.settings?.behaviorOption === 'keep_until_correct') {
    dispatch({
      type: 'SET_TARGETS',
      payload: stateRef.current.targets.filter(
        (t: any) => t.question._id !== currentQuestion._id,
      ),
    });
  }
};
