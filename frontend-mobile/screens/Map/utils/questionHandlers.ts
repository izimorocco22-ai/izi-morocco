import { Alert } from 'react-native';
import { markerGets } from './markerLogic';
import { uploadFile } from '../../../../utils/uploadService';

export const handleSubmitAnswer = async (
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
    const correctAnswer = currentQuestion.puzzleAnswerText;
    isCorrect =
      stateRef.current.inputAnswer.trim().toLowerCase() ===
      correctAnswer?.trim().toLowerCase();
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
