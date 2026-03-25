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
    displayedTasks: tasks?.filter(t => t.isDisplayed).length,
    completedTargets: currentState?.completedTargets?.length || 0
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
  const listTaskIds: string[] = [];

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
          payload: mergeUnique(currentState.targets, QuestionsByTags),
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
        
        // Clear result modal but don't reset modal visibility to avoid race condition
        dispatch({ type: 'SET_RESULT_MODAL', payload: false });
        
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
          payload: mergeUnique(currentState.targets, [questionToOpen]),
        });
        
        // 🔥 CRITICAL: Open modal immediately - no setTimeout to avoid race with handleNextQuestion
        console.log('🚀 Opening modal for activated task:', r.taskId);
        dispatch({ type: 'SET_MODAL_VISIBLE', payload: true });
        
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
      if (r?.showAll) {
        showTaskIds.push(...r.idsToShow);
      }
      if (r?.list) {
        listTaskIds.push(...r.idsToShow);
      }
    }
    else if (r?.list && r?.taskId) {
      listTaskIds.push(r.taskId);
    }
    else if (r?.finish) {
      dispatch({ type: 'SET_NAVIGATE_FINISH', payload: true });
    } else if (r?.playground && Array.isArray(r.taskId)) {
      playgroundTaskIds.push(...r.taskId);
    }
  });

  // ✅ Process accumulated showTaskIds
  if (showTaskIds.length > 0) {
    const uniqueShowIds = Array.from(new Set(showTaskIds));
    const updatedTasks = safeTasks.map(q =>
      uniqueShowIds.includes(q.question?._id) ? { ...q, isDisplayed: true } : q,
    );
    const questionsToAdd = safeTasks.filter(
      t => uniqueShowIds.includes(t.question?._id) && !t.isDisplayed,
    );
    if (questionsToAdd.length > 0) {
      dispatch({
        type: 'SET_TARGETS',
        payload: mergeUnique(currentState.targets, questionsToAdd),
      });
    }
    dispatch({ type: 'SET_TASK', payload: updatedTasks });
  }

  // ✅ Process accumulated listTaskIds
  if (listTaskIds.length > 0) {
    const uniqueListIds = Array.from(new Set(listTaskIds));
    
    // Merge new tasks with existing list tasks that are not finished
    const currentList = currentState.list || [];
    const newTasksForList = safeTasks.filter(
      t => uniqueListIds.includes(t.question?._id) && !t.isFinished
    );
    
    const mergedList = mergeUnique(currentList, newTasksForList);
    
    console.log('🔥 BEFORE DISPATCHING SET_LIST:', {
      uniqueListIds,
      currentListLength: currentList.length,
      newTasksForListCount: newTasksForList.length,
      mergedListCount: mergedList.length,
      mergedListTasks: mergedList.map(t => ({
        id: t.question?._id,
        name: t.question?.questionName,
        isFinished: t.isFinished
      }))
    });
    
    console.log('🚀 DISPATCHING SET_LIST with', mergedList.length, 'tasks');
    dispatch({
      type: 'SET_LIST',
      payload: mergedList,
    });
    console.log('✅ SET_LIST dispatched successfully');
    
    // Also ensure these tasks are marked as displayed and added to targets
    const updatedTasks = safeTasks.map(q =>
      uniqueListIds.includes(q.question?._id) ? { ...q, isDisplayed: true } : q,
    );
    dispatch({ type: 'SET_TASK', payload: updatedTasks });
    
    const questionsToAdd = safeTasks.filter(
      t => uniqueListIds.includes(t.question?._id) && !t.isDisplayed,
    );
    if (questionsToAdd.length > 0) {
      dispatch({
        type: 'SET_TARGETS',
        payload: mergeUnique(currentState.targets, questionsToAdd),
      });
    }
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
