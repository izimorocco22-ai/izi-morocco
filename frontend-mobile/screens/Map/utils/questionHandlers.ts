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
      console.log('[handleSubmitAnswer] Starting upload for:', localUri);

      dispatch({ type: 'SET_LOADING', payload: true });
      
      const uploadResult = await uploadFile(localUri);
      console.log('[handleSubmitAnswer] Upload successful:', uploadResult);
      
      if (!uploadResult || !uploadResult.url) {
        throw new Error('Upload succeeded but no URL returned');
      }
      
      dispatch({ type: 'SET_INPUT_ANSWER', payload: uploadResult.url });
      isCorrect = true;
    } catch (error: any) {
      console.error('[handleSubmitAnswer] Upload error:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
      
      const errorMsg = error.message || 'Failed to upload media';
      Alert.alert('Upload Failed', errorMsg);
      return;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
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
  
  if (!isCorrect) {
    dispatch({ type: 'SET_RESULT_MODAL', payload: true });
    if (onComplete) onComplete();
    return;
  }
  
  console.log('Answer is correct, marking task as completed for activate rules:', currentQuestion._id);
  const updatedTasks = stateRef.current.task.map(t => 
    t.question?._id === currentQuestion._id 
      ? { ...t, isFinished: true, isCorrect: true, userAnswer: stateRef.current.inputAnswer }
      : t
  );
  
  dispatch({ type: 'SET_TASK', payload: updatedTasks });
  
  dispatch({
    type: 'ADD_COMPLETED_TARGETS',
    payload: [currentQuestion._id],
  });
  
  console.log('🚀 Calling markerGets with completed task state for activate rules');
  const updatedState = { 
    ...stateRef.current, 
    task: updatedTasks, 
    completedTargets: [...stateRef.current.completedTargets, currentQuestion._id] 
  };
  
  markerGets(
    updatedTasks,
    blocklyJson,
    dispatch,
    updatedState,
    stateRef.current.time,
  );
  
  // Wait a bit to see if activate rule opened a new modal
  setTimeout(() => {
    // If modal is still showing the same question, call onComplete to proceed
    if (stateRef.current.currentQuestion?._id === currentQuestion._id) {
      console.log('✅ No activate rule fired, proceeding with normal flow');
      if (onComplete) onComplete();
    } else {
      console.log('✅ Activate rule opened new question, skipping normal flow');
    }
  }, 200);
  
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
};
