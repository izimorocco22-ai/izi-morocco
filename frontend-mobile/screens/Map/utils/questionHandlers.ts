import { Alert } from 'react-native';
import { markerGets } from './markerLogic';
import { uploadFile } from '../../../utils/uploadService';

// Answer types that require checking
const CHECK_TYPES = ['mcq', 'multiple', 'number', 'text', 'code_box', 'puzzle'];

export const handleSubmitAnswer = async (
  stateRef: any,
  dispatch: any,
  blocklyJson: any,
  onComplete: () => void,
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

  // ── Determine correctness ────────────────────────────────────────────────
  if (answerType === 'mcq' || answerType === 'multiple') {
    const selectedTexts = stateRef.current.selectedOption.map(
      (i: number) => options[i]?.text,
    );
    isCorrect =
      JSON.stringify([...selectedTexts].sort()) ===
      JSON.stringify([...correctAnswers].sort());

  } else if (answerType === 'number') {
    isCorrect =
      stateRef.current.inputAnswer.trim() === (correctAnswers[0] ?? '').trim();

  } else if (answerType === 'text' || answerType === 'code_box') {
    isCorrect =
      stateRef.current.inputAnswer.trim().toLowerCase() ===
      (correctAnswers[0] ?? '').trim().toLowerCase();

  } else if (answerType === 'puzzle') {
    const effectiveType = puzzleAnswerType || 'text';
    if (effectiveType === 'mcq') {
      const selectedTexts = stateRef.current.selectedOption.map(
        (i: number) => options[i]?.text,
      );
      isCorrect =
        JSON.stringify([...selectedTexts].sort()) ===
        JSON.stringify([...correctAnswers].sort());
    } else if (effectiveType === 'number') {
      const correct = (puzzleAnswerText ?? correctAnswers[0] ?? '').toString().trim();
      isCorrect = stateRef.current.inputAnswer.trim() === correct;
    } else if (effectiveType === 'text') {
      const correct = (puzzleAnswerText ?? correctAnswers[0] ?? '').toString().trim().toLowerCase();
      isCorrect = stateRef.current.inputAnswer.trim().toLowerCase() === correct;
    } else if (effectiveType === 'code_box') {
      const correct = (correctAnswers[0] ?? puzzleAnswerText ?? '').toString().trim().toLowerCase();
      isCorrect = stateRef.current.inputAnswer.trim().toLowerCase() === correct;
    } else {
      const correct = (puzzleAnswerText ?? correctAnswers[0] ?? '').toString().trim().toLowerCase();
      isCorrect = stateRef.current.inputAnswer.trim().toLowerCase() === correct;
    }

  } else if (['take_photo', 'augmented_photo', 'record_video'].includes(answerType)) {
    const localUri = stateRef.current.inputAnswer;
    if (!localUri) {
      return Alert.alert('Error', `Please capture a ${answerType.replace(/_/g, ' ')} before submitting.`);
    }
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const uploadResult = await uploadFile(localUri);
      if (!uploadResult?.url) throw new Error('Upload succeeded but no URL returned');
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
    // no_answer / info types — always correct, just advance
    isCorrect = true;
  }

  // ── Save result ──────────────────────────────────────────────────────────
  dispatch({ type: 'SET_IS_ANSWER_CORRECT', payload: isCorrect });

  if (isCorrect) {
    // Mark task as finished only on correct answer
    const updatedTasks = stateRef.current.task.map((t: any) =>
      t.question?._id === currentQuestion._id
        ? { ...t, isFinished: true, isCorrect: true, isDisplayed: true, userAnswer: stateRef.current.inputAnswer }
        : t,
    );
    dispatch({ type: 'SET_TASK', payload: updatedTasks });
    dispatch({ type: 'ADD_COMPLETED_TARGETS', payload: [currentQuestion._id] });

    // Fire timer_after_finished rules
    const sortedTimers = stateRef.current.timerData.filter(
      (t: any) => t.type === 'timer_after_finished' && t.task?.id === currentQuestion._id,
    );
    sortedTimers.forEach((item: any) => {
      setTimeout(() => {
        markerGets(stateRef.current.task, blocklyJson, dispatch, stateRef.current, item.seconds);
        dispatch({ type: 'UPDATE_TIMER_FINISHED', payload: item.seconds });
      }, item.seconds * 1000);
    });

    // Run rule engine with updated state
    const updatedState = {
      ...stateRef.current,
      task: updatedTasks,
      list: (stateRef.current.list || []).filter((t: any) => t.question?._id !== currentQuestion._id),
      completedTargets: [...stateRef.current.completedTargets, currentQuestion._id],
    };
    markerGets(updatedTasks, blocklyJson, dispatch, updatedState, stateRef.current.time);
  }

  // Always show result modal (correct or wrong)
  onComplete();
};
