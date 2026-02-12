import React, { useEffect, useReducer, useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { MAPBOX_ACCESS_TOKEN } from '@env';
import commonStyles from '../../styles/commonStyles';
import QuestionModal from './Components/QuestionModal';
import CustomMarker from './Components/CustomMarker';
import GPSBlocker from './Components/GPSBlocker';
import GPSStatusIndicator from './Components/GPSStatusIndicator';
import GameStartOverlay from '../../components/GameStartOverlay';
import AnswerResultModal from './Components/AnswerResultModal';
import LoadingMap from './Components/LoadingMap';
import { initialState, reducer } from './utils/reducer';
import { handleMapPress, createGeoJSONCircle } from './utils/mapHandlers';
import {
  checkLocationEnabled,
  requestLocationPermission,
  enableGPS,
  isWithinRadius,
} from './utils/locationUtils';
import { markerGets } from './utils/markerLogic';
import { handleSubmitAnswer } from './utils/questionHandlers';
import MapHeader from './Components/MapHeader';
import IntroMessage from './Components/IntroMessage';
import FinishMessage from './Components/FinishMessage';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { finishGame } from '../../store/gameSlice';
import ScreenWrapper from '../../components/ScreenWrapper';
import { getTimerAfterFinished } from './utils/ruleEngine';
import ListShowButton from './Components/ListShow';
import ListModal from './Components/ListModal';

MapboxGL.setAccessToken(MAPBOX_ACCESS_TOKEN);

const LiveLocationScreen = ({ navigation, route }: any) => {
  const RADIUS_METERS = 500;
  const [state, dispatch] = useReducer(reducer, initialState);
  const dispatchForApis = useDispatch<any>();
  const { questions, game, activeCode, gameId } = route.params || {};
  const { user } = useSelector((state: RootState) => state.auth);
  const [blocklyJson, setBlocklyJson] = useState<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showList, setShowList] = useState(false);
  useEffect(() => {
    dispatch({ type: 'SET_TASK', payload: questions });
    setBlocklyJson(game?.blocklyJsonRules || null);
    dispatch({ type: 'SET_SCORE', payload: game.score || 0 });
  }, [questions]);

  // Keep a ref to state for callbacks that shouldn't re-subscribe or to avoid stale closures.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const result = getTimerAfterFinished(blocklyJson);
    console.log({ result });
    dispatch({ type: 'SET_TIMER_DATA', payload: result });
  }, [blocklyJson]);

  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: 'SET_TIMER', payload: stateRef.current.time });
    }, 1000);

    return () => clearInterval(interval);
  }, [stateRef.current.time]);

  useEffect(() => {
    const sortedTimers = stateRef.current.timerData
      .filter(t => t.type === 'timer' && !t.isFinished) // only timers
      .sort((a, b) => a.seconds - b.seconds);
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
  }, [stateRef.current.timerData]);

  const cameraRef = useRef<any>(null);
  // show overlay on mount
  useEffect(() => {
    dispatch({ type: 'SET_SHOW_OVERLAY', payload: true });
  }, []);

  const handleStart = () => {
    dispatch({ type: 'SET_SHOW_OVERLAY', payload: false });
    if (game?.game?.introMessage && game?.status !== 'in_progress') {
      dispatch({ type: 'SET_INTRO_VISIBLE', payload: true });
    } else {
      dispatch({ type: 'SET_INTRO_VISIBLE', payload: false });
    }
  };

  const handleIntroContinue = () => {
    dispatch({ type: 'SET_INTRO_VISIBLE', payload: false });
  };

  // Initialize location on mount and poll GPS if disabled (same intent)
  useEffect(() => {
    checkLocationEnabled(dispatch);
    const interval = setInterval(() => {
      if (!stateRef.current.gpsEnabled) checkLocationEnabled(dispatch);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Run markerGets when markerJson OR the task list changes
  useEffect(() => {
    if (blocklyJson)
      markerGets(
        stateRef.current.task,
        blocklyJson,
        dispatch,
        state,
        state.time,
      );
  }, [state.triggerMarker, blocklyJson]);

  const onUserLocationUpdate = (locationUpdate: any) => {
    if (!stateRef.current.gpsEnabled) return;

    const { coords } = locationUpdate;
    if (!coords) return;

    const newLocation = {
      latitude: coords.latitude,
      longitude: coords.longitude,
    };

    dispatch({ type: 'SET_LOCATION', payload: newLocation });

    let triggered = false;
    const targets = stateRef.current.targets;
    const shownTargets = stateRef.current.shownTargets;

    for (const target of targets) {
      const alreadyShown = shownTargets.includes(target.question?._id);
      if (alreadyShown) continue;

      if (
        isWithinRadius(
          newLocation,
          target,
          target.question.locationRadius || RADIUS_METERS,
        )
      ) {
        triggered = true;

        const overlapping = targets.filter(
          t =>
            !shownTargets.includes(t.question?._id) &&
            isWithinRadius(
              newLocation,
              t,
              t.question.locationRadius || RADIUS_METERS,
            ),
        );

        if (overlapping.length > 0) {
          dispatch({ type: 'SET_POPUP_SHOWN', payload: true });

          const queuedQuestions = overlapping.map(t => ({
            _id: t.question?._id,
            question: t.question?.questionDescription,
            answerType: t.question?.answerType,
            options: t.question?.options,
            correctAnswers: t.question?.correctAnswers,
            points: t?.question?.points,
            comments: t?.comments,
            media: t?.media || null,
            puzzleAnswerText: t?.question?.puzzleAnswerText,
          }));

          dispatch({ type: 'SET_QUESTION_QUEUE', payload: queuedQuestions });
          dispatch({ type: 'SET_CURRENT_INDEX', payload: 0 });
          dispatch({
            type: 'SET_CURRENT_QUESTION',
            payload: queuedQuestions[0],
          });
          dispatch({ type: 'SET_MODAL_VISIBLE', payload: true });
          dispatch({ type: 'SET_SELECTED_OPTION', payload: [] });

          // mark tasks as displayed for overlapping ones
          queuedQuestions.forEach(q => {
            dispatch({
              type: 'UPDATE_TASK_ITEM',
              payload: { id: q._id, updates: { isDisplayed: true } },
            });
          });

          // mark shownTargets
          dispatch({
            type: 'ADD_SHOWN_TARGETS',
            payload: overlapping.map(t => t.question?._id),
          });
        }

        break;
      }
    }

    if (!triggered) {
      dispatch({ type: 'SET_POPUP_SHOWN', payload: false });
    }
  };

  const handleNextQuestion = () => {
    const currentQuestion = stateRef.current.currentQuestion;
    const isCorrect = stateRef.current.isAnswerCorrect;

    if (isCorrect) {
      const gained = currentQuestion?.points || 0;
      // Update total score
      dispatch({
        type: 'SET_SCORE',
        payload: gained,
      });
    }

    // ✅ Update task after pressing Next/OK
    const newTasks = stateRef.current.task.map(t => {
      if (t.question?._id === currentQuestion?._id) {
        return {
          ...t,
          isFinished: true,
          isCorrect: isCorrect,
          userAnswer: stateRef.current.inputAnswer,
        };
      }
      return t;
    });

    dispatch({ type: 'SET_TASK', payload: newTasks });
    const filteredQuestions = newTasks.map(q => ({
      _id: q?.question?._id,
      latitude: q?.latitude,
      longitude: q?.longitude,
      radius: q?.radius,
      order: q?.order,
      isFinished: q?.isFinished,
      isCorrect: q?.isCorrect,
      userAnswer: q?.userAnswer,
      isDisplayed: q?.isFinished ? true : false,
      isShownOnPlayground: q?.isShownOnPlayground,
      points: q?.question?.points || 0,
    }));

    const totalScore = filteredQuestions.reduce((acc, q) => {
      if (q.isFinished && q.isCorrect) {
        return acc + (q.points || 0);
      }
      return acc;
    }, 0);

    dispatchForApis(
      finishGame({
        activationCode: activeCode,
        gameId,
        playerId: user?.playerId,
        questions: filteredQuestions,
        status: 'in_progress',
        score: totalScore,
      }),
    );

    dispatch({ type: 'TRIGGER_MARKER_GETS' });
    // continue to next question logic
    dispatch({ type: 'SET_RESULT_MODAL', payload: false });
    dispatch({ type: 'SET_SELECTED_OPTION', payload: [] });
    dispatch({ type: 'SET_INPUT_ANSWER', payload: '' });

    const currentIndex = stateRef.current.currentIndex;
    const questionQueue = stateRef.current.questionQueue;

    if (currentIndex + 1 < questionQueue.length) {
      const nextIndex = currentIndex + 1;
      dispatch({ type: 'SET_CURRENT_INDEX', payload: nextIndex });
      dispatch({
        type: 'SET_CURRENT_QUESTION',
        payload: questionQueue[nextIndex],
      });
    } else {
      dispatch({
        type: 'ADD_COMPLETED_TARGETS',
        payload: questionQueue.map(q => q._id),
      });
      dispatch({ type: 'SET_MODAL_VISIBLE', payload: false });
      dispatch({ type: 'SET_POPUP_SHOWN', payload: false });
      dispatch({ type: 'SET_QUESTION_QUEUE', payload: [] });
      dispatch({ type: 'SET_CURRENT_INDEX', payload: 0 });
      dispatch({ type: 'SET_PENDING_OPEN_TASK', payload: null });
    }
  };

  // Effect: if pendingOpenTaskId is set (from markerGets activate), open modal reliably (no setTimeout)
  useEffect(() => {
    const pending = state.pendingOpenTaskId;
    if (!pending) return;

    // currentQuestion should already be set by markerGets, so simply open modal now.
    dispatch({ type: 'SET_MODAL_VISIBLE', payload: true });
    // clear pending
    dispatch({ type: 'SET_PENDING_OPEN_TASK', payload: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.pendingOpenTaskId]);

  // Effect: when navigateFinish becomes true, navigate to Congratulation screen with current tasks
  useEffect(() => {
    if (state.navigateFinish) {
      dispatch({ type: 'SET_FINISH_VISIBLE', payload: true });
      dispatch({ type: 'SET_NAVIGATE_FINISH', payload: false });
    }
  }, [state.navigateFinish]);

  const handleFinishContinue = () => {
    dispatch({ type: 'SET_FINISH_VISIBLE', payload: false });
    navigation.navigate('Congratulation', {
      task: stateRef.current.task,
      activeCode,
      gameId,
      score: state.score,
    });
  };

  // Render gating for GPS blocker (unchanged)
  if (!state.gpsEnabled) {
    return (
      <GPSBlocker
        onEnableLocation={() => {
          requestLocationPermission(dispatch);
        }}
        onEnableGPS={() => {
          enableGPS(dispatch);
        }}
      />
    );
  }

  return (
    <ScreenWrapper>
      <View style={[commonStyles.fullFlex, { position: 'relative' }]}>
        {game && <MapHeader game={game} state={state} />}

        {state.showOverlay && game && (
          <GameStartOverlay
            visible={state.showOverlay}
            steps={[
              {
                title: 'You’re in the game ',
                content: 'follow the next steps to continue.',
              },
            ]}
            onFinish={handleStart}
          />
        )}

        <MapboxGL.MapView
          style={[commonStyles.fullFlex]}
          styleURL={MapboxGL.StyleURL.Street}
          onPress={event => handleMapPress(event, stateRef, dispatch)}
          onDidFinishLoadingMap={() => setMapLoaded(true)}
        >
          {mapLoaded && (
            <>
              {state.location && (
                <MapboxGL.Camera
                  ref={cameraRef}
                  zoomLevel={14}
                  centerCoordinate={[
                    state.location?.longitude,
                    state.location?.latitude,
                  ]}
                  followUserLocation
                  followZoomLevel={14}
                  animationMode={'flyTo'}
                  animationDuration={1000}
                />
              )}

              <MapboxGL.UserLocation
                visible
                onUpdate={onUserLocationUpdate}
                rendersMode={'native'}
                androidRenderMode={'compass'}
              />

              {/* Target zones */}
              {state.targets.length >= 0 &&
                state.targets
                  .filter(
                    t => !state.completedTargets.includes(t.question?._id),
                  )
                  .map((target, index) => {
                    const geojson = createGeoJSONCircle(
                      [target.longitude, target.latitude],
                      target.question?.locationRadius || RADIUS_METERS,
                    );

                    const sourceId = `circle_${target.question?._id}_${index}`;
                    const fillId = `fill_${target.question?._id}_${index}`;
                    const lineId = `line_${target.question?._id}_${index}`;

                    return (
                      <MapboxGL.ShapeSource
                        key={sourceId}
                        id={sourceId}
                        shape={geojson}
                      >
                        <MapboxGL.FillLayer
                          id={fillId}
                          style={{
                            fillColor:
                              target.question?.radiusColor ||
                              'rgba(0,122,255,0.2)',
                            fillOpacity: 0.4,
                          }}
                        />
                        <MapboxGL.LineLayer
                          id={lineId}
                          style={{
                            lineColor:
                              target.question?.radiusColor || '#007AFF',
                            lineWidth: 2,
                            lineOpacity: 0.9,
                            lineDasharray: [2, 4],
                          }}
                        />
                      </MapboxGL.ShapeSource>
                    );
                  })}

              {/* Markers */}
              {state.targets.length >= 0 &&
                state.targets
                  .filter(
                    t => !state.completedTargets.includes(t.question?._id),
                  )
                  .map((target, index) => {
                    const markerKey = `marker_${target.question?._id}_${index}`;
                    return (
                      <MapboxGL.MarkerView
                        key={markerKey}
                        id={markerKey}
                        coordinate={[target?.longitude, target?.latitude]}
                      >
                        <CustomMarker icon={target?.question?.icon} />
                      </MapboxGL.MarkerView>
                    );
                  })}
            </>
          )}
        </MapboxGL.MapView>

        <ListShowButton
          onPress={() => setShowList(!showList)}
          count={stateRef.current.list?.length}
        />
        {showList && (
          <ListModal
            state={stateRef.current}
            dispatch={dispatch}
            list={stateRef.current.list}
            onClose={() => {
              setShowList(false);
            }}
          />
        )}
        <GPSStatusIndicator gpsEnabled={state.gpsEnabled} />
        {!state.showOverlay && state.modalVisible && !state.introVisible && (
          <QuestionModal
            visible={state.modalVisible}
            questionData={state.currentQuestion}
            selectedOption={state.selectedOption}
            setSelectedOption={(opts: number[]) =>
              dispatch({ type: 'SET_SELECTED_OPTION', payload: opts })
            }
            inputAnswer={state.inputAnswer}
            setInputAnswer={(val: string) =>
              dispatch({ type: 'SET_INPUT_ANSWER', payload: val })
            }
            onSubmit={() => {
              handleSubmitAnswer({ current: state }, dispatch,blocklyJson);
            }}
          />
        )}

        <AnswerResultModal
          visible={state.resultModalVisible}
          isCorrect={state.isAnswerCorrect}
          commentsAfterFinishingQuestion={state.currentQuestion}
          onNext={() => {
            markerGets(
              stateRef.current.task,
              blocklyJson,
              dispatch,
              state,
              state.time,
            ); // Trigger next tasks
            handleNextQuestion(); // Perform your normal logic
            dispatch({ type: 'SET_LOADING', payload: true });
            setTimeout(() => {
              dispatch({ type: 'SET_LOADING', payload: false });
            }, 2000);
          }}
        />

        {game?.game?.introMessage && game?.status !== 'in_progress' && (
          <IntroMessage
            visible={state.introVisible && game?.status !== 'in_progress'}
            onContinue={handleIntroContinue}
            message={game?.game?.introMessage}
          />
        )}

        <FinishMessage
          visible={state.finishVisible}
          onContinue={handleFinishContinue}
          message={game?.game?.finishMessage}
        />

        {state.loading && <LoadingMap visible={state.loading} />}
      </View>
    </ScreenWrapper>
  );
};

export default LiveLocationScreen;
