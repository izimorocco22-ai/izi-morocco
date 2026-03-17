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
  const safeTasks = Array.isArray(tasks) ? [...tasks] : [];
  const result = analyzeDataRule(blocklyJson, safeTasks, {
    score: currentState?.score,
    timer,
  });

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
      console.log('Activate rule triggered for task:', r.taskId);
      const questionToOpen = safeTasks.find(
        t => t?.question?._id === r.taskId && !t.isDisplayed,
      );
      if (questionToOpen) {
        console.log('Opening task immediately:', {
          taskId: r.taskId,
          taskName: questionToOpen.question?.questionName
        });
        dispatch({
          type: 'UPDATE_TASK_ITEM',
          payload: { id: r.taskId, updates: { isDisplayed: true } },
        });
        dispatch({
          type: 'SET_CURRENT_QUESTION',
          payload: {
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
          },
        });
        dispatch({ type: 'SET_PENDING_OPEN_TASK', payload: r.taskId });
      } else {
        console.log('Task not found or already displayed:', r.taskId);
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
        // Only set list if there are unfinished tasks
        if (listTasks.length > 0) {
          dispatch({
            type: 'SET_LIST',
            payload: listTasks,
          });
        }
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
