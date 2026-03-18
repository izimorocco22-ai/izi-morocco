import { analyzeDataRule, getQuestionsByTags } from './ruleEngine';

const mergeUnique = (existing, incoming) => {
  const map = new Map();

  [...existing, ...incoming].forEach(item => {
    const id = item?.question?._id;
    if (id) map.set(id, item);
  });

  return Array.from(map.values());
};

export const markerGets = (
  tasks: any[],
  blocklyJson: any,
  dispatch: any,
  currentState: any,
  timer: any,
) => {
  console.log('🔍 markerGets called with:', {
    tasksCount: tasks?.length,
    hasBlocklyJson: !!blocklyJson,
    timer,
    currentScore: currentState?.score,
    finishedTasks: tasks?.filter(t => t.isFinished).length,
    displayedTasks: tasks?.filter(t => t.isDisplayed).length
  });
  
  const safeTasks = Array.isArray(tasks) ? [...tasks] : [];
  const result = analyzeDataRule(blocklyJson, safeTasks, {
    score: currentState?.score,
    timer,
  });

  console.log('🎯 Rule engine result:', result);

  if (!Array.isArray(result)) return;

  // ✅ Collect all tasks to show in one go
  const showTaskIds: string[] = [];
  const playgroundTaskIds: string[] = [];

  result.forEach((r: any) => {
    if (r?.showTag) {
      const QuestionsByTags = getQuestionsByTags(
        result,
        safeTasks,
        false,
        null,
        null,
      );
      if (QuestionsByTags.length > 0) {
        const updatedTasks = safeTasks.map(q =>
          QuestionsByTags.filter(
            (t: any) => t.question?._id === q.question?._id,
          ).length > 0
            ? { ...q, isDisplayed: true }
            : q,
        );
        dispatch({ type: 'SET_TASK', payload: updatedTasks });
        dispatch({
          type: 'SET_TARGETS',
          payload: [...currentState.targets, ...QuestionsByTags],
        });
      }
    } else if (r?.activate && r?.taskId) {
      console.log('🎯 Activate rule triggered for task:', r.taskId);
      const questionToOpen = safeTasks.find(
        t => t?.question?._id === r.taskId && !t.isDisplayed && !t.isFinished,
      );
      if (questionToOpen) {
        console.log('✅ Opening task immediately:', {
          taskId: r.taskId,
          taskName: questionToOpen.question?.questionName,
          currentDisplayedTasks: safeTasks.filter(t => t.isDisplayed).length,
          currentFinishedTasks: safeTasks.filter(t => t.isFinished).length
        });
        
        // Update task as displayed
        const updatedTasks = safeTasks.map(q =>
          q.question?._id === r.taskId ? { ...q, isDisplayed: true } : q,
        );
        dispatch({ type: 'SET_TASK', payload: updatedTasks });
        
        // Set up question queue with single question
        const questionData = {
          _id: questionToOpen.question?._id,
          question: questionToOpen?.question?.questionDescription,
          answerType: questionToOpen?.question?.answerType,
          options: questionToOpen?.question?.options,
          correctAnswers: questionToOpen?.question?.correctAnswers,
          points: questionToOpen?.question?.points,
          comments: questionToOpen?.comments,
          media: questionToOpen?.media || null,
          puzzleAnswerText: questionToOpen?.question?.puzzleAnswerText,
          puzzleAnswerType: questionToOpen?.question?.puzzleAnswerType,
          puzzleUrl: questionToOpen?.question?.puzzle?.url,
          puzzle: questionToOpen?.question?.puzzle,
          codeBoxConfig: questionToOpen?.question?.codeBoxConfig,
          augmentedPhotoImage: questionToOpen?.question?.augmentedPhotoImage,
        };
        
        // Set up the question queue and current question
        dispatch({ type: 'SET_QUESTION_QUEUE', payload: [questionData] });
        dispatch({ type: 'SET_CURRENT_INDEX', payload: 0 });
        dispatch({ type: 'SET_CURRENT_QUESTION', payload: questionData });
        dispatch({ type: 'SET_SELECTED_OPTION', payload: [] });
        dispatch({ type: 'SET_INPUT_ANSWER', payload: '' });
        
        // Add to shown targets
        dispatch({
          type: 'ADD_SHOWN_TARGETS',
          payload: [questionToOpen.question?._id],
        });
        
        // Add to targets for display
        dispatch({
          type: 'SET_TARGETS',
          payload: [...currentState.targets, questionToOpen],
        });
        
        // 🔥 CRITICAL: Open modal with a small delay to ensure all state updates are processed
        setTimeout(() => {
          dispatch({ type: 'SET_MODAL_VISIBLE', payload: true });
        }, 50);
        
      } else {
        console.log('❌ Task not found, already displayed, or already finished:', {
          taskId: r.taskId,
          availableTasks: safeTasks.map(t => ({
            id: t.question?._id,
            name: t.question?.questionName,
            isDisplayed: t.isDisplayed,
            isFinished: t.isFinished
          }))
        });
      }
    }
    // 🔹 Collect all showTask ids
    else if (r?.showTask && r?.idToShow) {
      showTaskIds.push(r.idToShow);
    } else if ((r?.showAll || r?.list) && Array.isArray(r.idsToShow)) {
      const updatedTasks = safeTasks.map(q =>
        r.idsToShow.includes(q.question?._id) ? { ...q, isDisplayed: true } : q,
      );
      const questionsToAdd = safeTasks.filter(
        t => r.idsToShow.includes(t.question?._id) && !t.isDisplayed,
      );
      if (questionsToAdd.length > 0) {
        dispatch({
          type: 'SET_TARGETS',
          payload: [...currentState.targets, ...questionsToAdd],
        });
      }
      if (r?.list) {
        // For list, only include tasks that are not finished yet
        const listTasks = safeTasks.filter(
          t => r.idsToShow.includes(t.question?._id) && !t.isFinished
        );
        console.log('Setting list tasks:', {
          idsToShow: r.idsToShow,
          listTasks: listTasks.map(t => ({ id: t.question?._id, name: t.question?.questionName, isFinished: t.isFinished })),
          currentListLength: currentState.list.length
        });
        // Always update the list, even if empty, to remove completed tasks
        dispatch({
          type: 'SET_LIST',
          payload: listTasks,
        });
      }
      dispatch({ type: 'SET_TASK', payload: updatedTasks });
    }
    else if (r?.list && r?.taskId) {
      const taskToList = safeTasks.find(
        t => t?.question?._id === r.taskId && !t.isFinished
      );
      if (taskToList) {
        const updatedTasks = safeTasks.map(q =>
          q.question?._id === r.taskId ? { ...q, isDisplayed: true } : q,
        );
        dispatch({ type: 'SET_TASK', payload: updatedTasks });
        dispatch({
          type: 'SET_TARGETS',
          payload: mergeUnique(currentState.targets, [taskToList]),
        });
        // Only add to list if task is not finished
        dispatch({
          type: 'SET_LIST',
          payload: [taskToList],
        });
      } else {
        // If task is finished or not found, clear the list
        dispatch({
          type: 'SET_LIST',
          payload: [],
        });
      }
    }
    else if (r?.finish) {
      dispatch({ type: 'SET_NAVIGATE_FINISH', payload: true });
    } else if (r?.playground && Array.isArray(r.taskId)) {
      playgroundTaskIds.push(...r.taskId);
    }
  });

  // ✅ After loop — handle all showTask IDs together
  if (showTaskIds.length > 0) {
    const updatedTasks = safeTasks.map(q =>
      showTaskIds.includes(q.question?._id) ? { ...q, isDisplayed: true } : q,
    );

    const questionsToAdd = safeTasks.filter(
      t => showTaskIds.includes(t.question?._id) && !t.isDisplayed,
    );

    if (questionsToAdd.length > 0) {
      dispatch({
        type: 'SET_TARGETS',
        payload: [...currentState.targets, ...questionsToAdd],
      });
    }

    dispatch({ type: 'SET_TASK', payload: updatedTasks });
  }

  if (playgroundTaskIds.length > 0) {
    const uniquePlaygroundIds = Array.from(new Set(playgroundTaskIds));
    const updatedTasks = safeTasks.map(q =>
      uniquePlaygroundIds.includes(q.question?._id)
        ? { ...q, isShownOnPlayground: true }
        : q,
    );
    dispatch({ type: 'SET_TASK', payload: updatedTasks });
  }
};
