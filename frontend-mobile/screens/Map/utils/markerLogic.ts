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
      const questionToOpen = safeTasks.find(
        t => t?.question?._id === r.taskId && !t.isDisplayed,
      );
      if (questionToOpen) {
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
          },
        });
        dispatch({ type: 'SET_PENDING_OPEN_TASK', payload: r.taskId });
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
        dispatch({
          type: 'SET_LIST',
          payload: [...currentState.list, ...questionsToAdd],
        });
      }
      dispatch({ type: 'SET_TASK', payload: updatedTasks });
    }
    // else if (r?.list && r?.taskId) {
    //   showTaskIds.push(r?.taskId);
    // }
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
