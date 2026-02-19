import { Alert } from 'react-native';
const RADIUS_METERS = 500;

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
  dispatch({
    type: 'SET_CURRENT_QUESTION',
    payload: {
      _id: question.question?._id,
      question: question?.question?.questionDescription,
      answerType: question?.question?.answerType,
      options: question?.question?.options,
      correctAnswers: question?.question?.correctAnswers,
      points: question?.question?.points,
      comments: question?.comments,
      media: question?.media || null,
      settings: question?.settings || null,
      augmentedPhotoImage: question?.question?.augmentedPhotoImage,
    },
  });
  dispatch({ type: 'SET_MODAL_VISIBLE', payload: true });
  if (question?.settings?.behaviorOption === 'remove_on_answer') {
    dispatch({
      type: 'SET_TARGETS',
      payload: state.list?.filter(
        t => t.question?._id !== question?.question._id,
      ),
    });
    dispatch({
      type: 'SET_LIST',
      payload: state.list?.filter(
        t => t.question?._id !== question?.question._id,
      ),
    });
  }
};
