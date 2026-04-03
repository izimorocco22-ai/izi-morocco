import { Alert } from 'react-native';
const RADIUS_METERS = 500;

// Infer puzzleAnswerType when backend sends null (old saved data)
const inferPuzzleAnswerType = (q: any): string | null => {
  if (q?.answerType !== 'puzzle') return q?.puzzleAnswerType || null;
  if (q?.puzzleAnswerType) return q.puzzleAnswerType;
  if (Array.isArray(q?.options) && q.options.length > 0) return 'mcq';
  if (q?.codeBoxConfig) return 'code_box';
  if (q?.puzzleAnswerText) return 'text';
  return null;
};

export const createGeoJSONCircle = (
  center: [number, number],
  radius: number,
  points = 64,
) => {
  const [longitude, latitude] = center;
  const km = radius / 1000;
  const ret: [number, number][] = [];
  const distanceX = km / (111.32 * Math.cos((latitude * Math.PI) / 180));
  const distanceY = km / 110.574;

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    ret.push([
      longitude + distanceX * Math.cos(theta),
      latitude + distanceY * Math.sin(theta),
    ]);
  }
  ret.push(ret[0]);

  return {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ret] } },
    ],
  };
};

export const handleMapPress = (event: any, stateRef: any, dispatch: any) => {
  const { geometry } = event;
  const [lon, lat] = geometry.coordinates;
  const targets = stateRef.current.targets;
  if (!targets?.length) return;

  const target = targets.find(t => {
    const dx = t.latitude - lat;
    const dy = t.longitude - lon;
    return (
      Math.sqrt(dx * dx + dy * dy) <=
      (t.question.locationRadius || RADIUS_METERS) / 100000
    );
  });

  if (!target)
    return Alert.alert(
      'Outside Target',
      'You clicked outside any target area.',
    );

  dispatch({
    type: 'SET_CURRENT_QUESTION',
    payload: {
      _id: target.question?._id,
      question: target?.question?.questionDescription,
      answerType: target?.question?.answerType,
      options: target?.question?.options,
      correctAnswers: target?.question?.correctAnswers,
      points: target?.question?.points,
      comments: target?.comments,
      media: target?.media || null,
      settings: target?.settings || null,
      puzzleAnswerText: target?.question?.puzzleAnswerText,
      puzzleAnswerType: inferPuzzleAnswerType(target?.question),
      puzzleUrl: target?.question?.puzzle?.url,
      puzzle: target?.question?.puzzle,
      codeBoxConfig: target?.question?.codeBoxConfig,
      augmentedPhotoImage: target?.question?.augmentedPhotoImage,
    },
  });
  dispatch({ type: 'SET_MODAL_VISIBLE', payload: true });
  if (target?.settings?.behaviorOption === 'remove_on_answer') {
    dispatch({
      type: 'SET_TARGETS',
      payload: targets.filter(t => t.question._id !== target.question._id),
    });
  }
};

export const handleListQuestionPress = (
  state: any,
  question: any,
  dispatch: any,
) => {
  // Directly open the task modal instead of just navigating to location
  const questionData = {
    _id: question.question?._id,
    question: question.question?.questionDescription,
    answerType: question.question?.answerType,
    options: question.question?.options,
    correctAnswers: question.question?.correctAnswers,
    points: question.question?.points,
    comments: question?.comments,
    media: question?.media || null,
    settings: question?.settings || null,
    puzzleAnswerText: question?.question?.puzzleAnswerText,
    puzzleAnswerType: inferPuzzleAnswerType(question?.question),
    puzzleUrl: question?.question?.puzzle?.url,
    puzzle: question?.question?.puzzle,
    codeBoxConfig: question?.question?.codeBoxConfig,
    augmentedPhotoImage: question?.question?.augmentedPhotoImage,
  };

  // Set up the question queue with just this single question
  dispatch({ type: 'SET_QUESTION_QUEUE', payload: [questionData] });
  dispatch({ type: 'SET_CURRENT_INDEX', payload: 0 });
  dispatch({ type: 'SET_CURRENT_QUESTION', payload: questionData });
  dispatch({ type: 'SET_MODAL_VISIBLE', payload: true });
  dispatch({ type: 'SET_SELECTED_OPTION', payload: [] });
  dispatch({ type: 'SET_INPUT_ANSWER', payload: '' });

  // Mark the task as displayed
  dispatch({
    type: 'UPDATE_TASK_ITEM',
    payload: { id: question.question?._id, updates: { isDisplayed: true } },
  });

  // Add to shown targets to prevent location-based triggering
  dispatch({
    type: 'ADD_SHOWN_TARGETS',
    payload: [question.question?._id],
  });

  // Optional: Still navigate camera to the location for context
  let longitude: number | null = null;
  let latitude: number | null = null;

  if (question) {
    if (question.longitude != null && question.latitude != null) {
      longitude = Number(question.longitude);
      latitude = Number(question.latitude);
    } else if (question?.question) {
      if (
        question.question.longitude != null &&
        question.question.latitude != null
      ) {
        longitude = Number(question.question.longitude);
        latitude = Number(question.question.latitude);
      }
    }
  }

  if ((longitude == null || isNaN(longitude)) && Array.isArray(state.targets)) {
    const target = state.targets.find(
      (t: any) => t?.question?._id === question?.question?._id,
    );
    if (target) {
      if (target.longitude != null) {
        longitude = Number(target.longitude);
      }
      if (target.latitude != null) {
        latitude = Number(target.latitude);
      }
    }
  }

  // Navigate camera to location if coordinates are available
  if (
    longitude != null &&
    latitude != null &&
    !isNaN(longitude) &&
    !isNaN(latitude)
  ) {
    dispatch({
      type: 'SET_CAMERA_TARGET',
      payload: { latitude, longitude },
    });
  }
};
