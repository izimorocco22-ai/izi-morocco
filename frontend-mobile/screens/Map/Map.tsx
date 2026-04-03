import React, { useEffect, useReducer, useRef, useState } from 'react';
import { Text, TouchableOpacity, View, BackHandler, Alert, StyleSheet } from 'react-native';
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
import PlaygroundView from './Components/PlaygroundView';
import ViewSwitcher from './Components/ViewSwitcher';
import { clearGameTimer, useGameTimer } from './utils/gameTimer';

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
  const [mapStyleJson, setMapStyleJson] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'map' | string>('map');

  useEffect(() => {
    const backAction = () => {
      if (state.modalVisible || state.resultModalVisible || showList) {
        if (showList) {
          setShowList(false);
        } else if (state.modalVisible) {
          // If a task is open, we can close it if the user wants to "go back"
          // but usually these are location-triggered. 
          // However, to satisfy "stay in game", we just prevent the default back action.
          dispatch({ type: 'SET_MODAL_VISIBLE', payload: false });
        } else if (state.resultModalVisible) {
          dispatch({ type: 'SET_RESULT_MODAL', payload: false });
        }
        return true; // handled
      }
      
      Alert.alert('Exit Game?', 'Are you sure you want to leave the game?', [
        {
          text: 'Cancel',
          onPress: () => null,
          style: 'cancel',
        },
        { 
          text: 'YES', 
          onPress: () => {
            // Don't clear timer data when temporarily exiting - let it persist
            navigation.goBack();
          }
        },
      ]);
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [state.modalVisible, state.resultModalVisible, showList, navigation]);

  useEffect(() => {
    console.log('Game data loaded:', {
      hasGame: !!game,
      hasGameGame: !!game?.game,
      playgroundName: game?.game?.playgroundName,
      playgroundImage: game?.game?.playgroundImage,
      playgrounds: game?.game?.playgrounds,
      fullGameData: JSON.stringify(game?.game)
    });
    const initialTasks = questions || [];
    dispatch({ type: 'SET_TASK', payload: initialTasks });

    // ✅ Initialize targets and completedTargets based on initial status of tasks
    // This ensures already completed tasks or tasks marked to show on playground appear after re-entry
    const initialTargets = initialTasks.filter(
      t => t.isDisplayed || t.isFinished || t.isShownOnPlayground
    );
    const initialCompleted = initialTasks
      .filter(t => t.isFinished)
      .map(t => t.question?._id);
    const initialShown = initialTasks
      .filter(t => t.isDisplayed || t.isFinished)
      .map(t => t.question?._id);

    if (initialTargets.length > 0) {
      dispatch({ type: 'SET_TARGETS', payload: initialTargets });
    }
    if (initialCompleted.length > 0) {
      dispatch({ type: 'ADD_COMPLETED_TARGETS', payload: initialCompleted });
    }
    if (initialShown.length > 0) {
      dispatch({ type: 'ADD_SHOWN_TARGETS', payload: initialShown });
    }

    setBlocklyJson(game?.blocklyJsonRules || null);
    const initialScore =
      game && typeof game.score === 'number' ? game.score : 0;
    dispatch({ type: 'SET_SCORE', payload: { replace: true, value: initialScore } });

    const initialTime =
      game && typeof game.currentTime === 'number' ? game.currentTime : 0;
    dispatch({ type: 'SET_TIMER', payload: initialTime });
    
    console.log('Timer initialization:', {
      gameCurrentTime: game?.currentTime,
      initialTime,
      gameStatus: game?.status
    });
  }, [questions, game]);

  useEffect(() => {
    const buildStyle = async () => {
      try {
        const token = MAPBOX_ACCESS_TOKEN;
        if (!token) return;
        const response = await fetch(
          `https://api.mapbox.com/styles/v1/mapbox/light-v10?access_token=${token}`,
        );
        if (!response.ok) return;
        const style = await response.json();
        const filteredLayers = (style.layers || []).filter((layer: any) => {
          const id = String(layer.id || '').toLowerCase();
          const sourceLayer = String(layer['source-layer'] || '').toLowerCase();

          const isCountryLabel =
            id.includes('country-label') ||
            (layer.type === 'symbol' &&
              (id.includes('country') || sourceLayer.includes('country')));

          const isCountryBoundary =
            id.includes('country-boundary') ||
            id.includes('admin-0') ||
            sourceLayer.includes('admin-0') ||
            sourceLayer.includes('country-boundary');

          if (isCountryLabel || isCountryBoundary) return false;

          return true;
        });
        const nextStyle = { ...style, layers: filteredLayers };
        setMapStyleJson(JSON.stringify(nextStyle));
      } catch (e) {
        setMapStyleJson(null);
      }
    };
    buildStyle();
  }, []);

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

  // ✅ NEW: Trigger markerGets when both blocklyJson and tasks are ready
  useEffect(() => {
    if (blocklyJson && state.task && state.task.length > 0) {
      console.log('🔄 Initial markerGets trigger - evaluating rules with fresh data');
      markerGets(
        state.task,
        blocklyJson,
        dispatch,
        state,
        state.time,
      );
    }
  }, [blocklyJson, state.task.length]);

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

  const listItems = React.useMemo(() => {
    return (state.list || []).filter((item: any) => !item.isFinished);
  }, [state.list, state.task]);

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

  // Run markerGets when triggerMarker changes (for manual triggers after completing tasks)
  useEffect(() => {
    if (blocklyJson && stateRef.current.task && stateRef.current.task.length > 0 && state.triggerMarker !== initialState.triggerMarker) {
      console.log('🔄 Manual markerGets trigger after task completion');
      markerGets(
        stateRef.current.task,
        blocklyJson,
        dispatch,
        stateRef.current,
        stateRef.current.time,
      );
    }
  }, [state.triggerMarker]);

  // Get timer data from the header component
  const [, , elapsedTime] = useGameTimer(game, gameId, state.time, activeCode);

  // ✅ Effect: Sync state changes to backend whenever tasks are updated
  useEffect(() => {
    if (state.task && state.task.length > 0) {
      const filteredQuestions = state.task.map(q => ({
        _id: q?.question?._id,
        latitude: q?.latitude,
        longitude: q?.longitude,
        radius: q?.radius,
        order: q?.order,
        isFinished: q?.isFinished || false,
      isCorrect: q?.isCorrect || false,
      userAnswer: q?.userAnswer || null,
      isDisplayed: q?.isDisplayed || false,
      isShownOnPlayground: q?.isShownOnPlayground || false,
      playgroundIndex: q?.playgroundIndex || 1,
      playgroundPosition: q?.playgroundPosition,
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
          currentTime: elapsedTime || state.time,
        }),
      );
    }
  }, [state.task, elapsedTime, activeCode, gameId, user?.playerId, dispatchForApis]);



  // ✅ Effect: Sync targets with task list changes
  useEffect(() => {
    if (state.task && state.task.length > 0) {
      const newTargets = state.task.filter(
        t => t.isDisplayed || t.isFinished || t.isShownOnPlayground
      );
      
      // Update targets in reducer if they differ from current state.targets
      // We check multiple fields to ensure that updates (like isFinished) are reflected
      const currentTargetData = state.targets.map(t => `${t.question?._id}_${t.isFinished}_${t.isShownOnPlayground}`).sort().join('|');
      const newTargetData = newTargets.map(t => `${t.question?._id}_${t.isFinished}_${t.isShownOnPlayground}`).sort().join('|');
      
      if (currentTargetData !== newTargetData) {
        dispatch({ type: 'SET_TARGETS', payload: newTargets });
      }
    }
  }, [state.task, state.targets]);

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

          const queuedQuestions = overlapping.map(t => {
            console.log('Mapping question data:', {
              questionId: t.question?._id,
              answerType: t.question?.answerType,
              puzzle: t.question?.puzzle,
              puzzleUrl: t?.question?.puzzle?.url
            });
            
            return {
              _id: t.question?._id,
              question: t.question?.questionDescription,
              answerType: t.question?.answerType,
              options: t.question?.options,
              correctAnswers: t.question?.correctAnswers,
              points: t?.question?.points,
              comments: t?.comments,
              media: t?.media || null,
              puzzleAnswerText: t?.question?.puzzleAnswerText,
              puzzleAnswerType: t?.question?.puzzleAnswerType,
              puzzleUrl: t?.question?.puzzle?.url,
              puzzle: t?.question?.puzzle,
              codeBoxConfig: t?.question?.codeBoxConfig,
              augmentedPhotoImage: t?.question?.augmentedPhotoImage,
            };
          });

          dispatch({ type: 'SET_QUESTION_QUEUE', payload: queuedQuestions });
          dispatch({ type: 'SET_CURRENT_INDEX', payload: 0 });
          dispatch({
            type: 'SET_CURRENT_QUESTION',
            payload: queuedQuestions[0],
          });
          dispatch({ type: 'SET_SELECTED_OPTION', payload: [] });
          
          // Add small delay to ensure state is synchronized before showing modal
          setTimeout(() => {
            dispatch({ type: 'SET_MODAL_VISIBLE', payload: true });
          }, 100);

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

  const ANSWER_CHECK_TYPES = ['multiple', 'code_box', 'number', 'text'];

  const handleNextQuestion = () => {
    const currentQuestion = stateRef.current.currentQuestion;
    const isCorrect = stateRef.current.isAnswerCorrect;
    const needsCheck = ANSWER_CHECK_TYPES.includes(currentQuestion?.answerType);

    // For checked types with wrong answer: close result modal, re-show question
    if (!isCorrect && needsCheck) {
      dispatch({ type: 'SET_RESULT_MODAL', payload: false });
      dispatch({ type: 'SET_INPUT_ANSWER', payload: '' });
      dispatch({ type: 'SET_SELECTED_OPTION', payload: [] });
      dispatch({ type: 'SET_MODAL_VISIBLE', payload: true });
      return;
    }

    if (isCorrect) {
      const gained = currentQuestion?.points || 0;
      // Update total score
      dispatch({
        type: 'SET_SCORE',
        payload: gained,
      });
    }

    // ✅ Update task after pressing Next button
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
    
    // ✅ Add completed task to completedTargets immediately
    if (isCorrect) {
      dispatch({
        type: 'ADD_COMPLETED_TARGETS',
        payload: [currentQuestion?._id],
      });
    }
    
    // ✅ Check for activate rules AFTER state is updated - but don't duplicate the call from questionHandlers
    // The markerGets call in questionHandlers.ts should handle auto-opening
    
    const filteredQuestions = newTasks.map(q => ({
      _id: q?.question?._id,
      latitude: q?.latitude,
      longitude: q?.longitude,
      radius: q?.radius,
      order: q?.order,
      isFinished: q?.isFinished || false,
      isCorrect: q?.isCorrect || false,
      userAnswer: q?.userAnswer || null,
      isDisplayed: q?.isDisplayed || false,
      isShownOnPlayground: q?.isShownOnPlayground || false,
      playgroundIndex: q?.playgroundIndex || 1,
      playgroundPosition: q?.playgroundPosition,
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
        currentTime: elapsedTime || stateRef.current.time,
      }),
    );

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
      // Add completed task to completedTargets when finishing the question queue
      dispatch({
        type: 'ADD_COMPLETED_TARGETS',
        payload: questionQueue.map(q => q._id),
      });
      dispatch({ type: 'SET_MODAL_VISIBLE', payload: false });
      dispatch({ type: 'SET_POPUP_SHOWN', payload: false });
      dispatch({ type: 'SET_QUESTION_QUEUE', payload: [] });
      dispatch({ type: 'SET_CURRENT_INDEX', payload: 0 });
      
      // Update the list to remove completed tasks
      const currentList = stateRef.current.list || [];
      const updatedList = currentList.filter(item => 
        !questionQueue.some(q => q._id === item.question?._id) && !item.isFinished
      );
      dispatch({ type: 'SET_LIST', payload: updatedList });
      
      // Re-evaluate rules with updated task state so new list/map tasks appear immediately
      const latestTasks = newTasks; // use newTasks directly — stateRef hasn't updated yet
      const latestState = { ...stateRef.current, task: newTasks, list: (stateRef.current.list || []).filter((item: any) => !questionQueue.some((q: any) => q._id === item.question?._id)), completedTargets: [...stateRef.current.completedTargets, ...questionQueue.map(q => q._id)] };
      markerGets(latestTasks, blocklyJson, dispatch, latestState, latestState.time);
    }
  };

// Effect: when navigateFinish becomes true, navigate to Congratulation screen with current tasks
  useEffect(() => {
    if (state.navigateFinish) {
      dispatch({ type: 'SET_FINISH_VISIBLE', payload: true });
      dispatch({ type: 'SET_NAVIGATE_FINISH', payload: false });
    }
  }, [state.navigateFinish]);

  const handleFinishContinue = async () => {
    dispatch({ type: 'SET_FINISH_VISIBLE', payload: false });
    if (gameId) await clearGameTimer(gameId, activeCode);
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
        {game && <MapHeader game={game} state={state} gameId={gameId} activeCode={activeCode} />}

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

        {currentView === 'map' ? (
          <MapboxGL.MapView
            style={[commonStyles.fullFlex]}
            logoEnabled={false}
            attributionEnabled={false}
            scaleBarEnabled={true}
            styleURL={mapStyleJson ? undefined : MapboxGL.StyleURL.Street}
            styleJSON={mapStyleJson || undefined}
            onPress={event => handleMapPress(event, stateRef, dispatch)}
            onDidFinishLoadingMap={() => setMapLoaded(true)}
          >
          {mapLoaded && (
            <>
              {state.location && (
                <MapboxGL.Camera
                  zoomLevel={state.cameraTarget ? 16 : 14}
                  centerCoordinate={
                    state.cameraTarget
                      ? [
                          state.cameraTarget.longitude,
                          state.cameraTarget.latitude,
                        ]
                      : [
                          state.location?.longitude,
                          state.location?.latitude,
                        ]
                  }
                  followUserLocation={!state.cameraTarget}
                  followZoomLevel={state.cameraTarget ? undefined : 14}
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
        ) : null}

        {currentView !== 'map' && (game?.game?.playgrounds?.length > 0 || game?.game?.playgroundImage) && (
          <PlaygroundView
            playgroundImage={game?.game?.playgroundImage}
            playgrounds={game?.game?.playgrounds}
            playgroundName={game?.game?.playgroundName}
            currentView={currentView}
            targets={state.targets}
            completedTargets={state.completedTargets}
          />
        )}

        <ViewSwitcher
          currentView={currentView}
          playgrounds={game?.game?.playgrounds}
          playgroundName={game?.game?.playgroundName}
          onViewChange={(view) => {
            console.log('Switching to view:', view);
            setCurrentView(view);
          }}
          isModalOpen={state.modalVisible || state.resultModalVisible || showList}
        />

        <GPSStatusIndicator 
          gpsEnabled={state.gpsEnabled} 
          visible={!(state.modalVisible || state.resultModalVisible || showList)} 
        />

        {/* Always show list button - shows 0 when no tasks */}
        <ListShowButton
          key={`list-button-${listItems.length}`}
          onPress={() => setShowList(!showList)}
          count={listItems.length}
        />
        {showList && (
          <ListModal
            state={{ ...stateRef.current, list: listItems }}
            dispatch={dispatch}
            list={listItems}
            onClose={() => {
              setShowList(false);
            }}
          />
        )}

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
              handleSubmitAnswer(stateRef, dispatch, blocklyJson, () => {
                dispatch({ type: 'SET_MODAL_VISIBLE', payload: false });
                dispatch({ type: 'SET_RESULT_MODAL', payload: true });
              });
            }}
            backgroundImage={game?.game?.backGroundImage}
          />
        )}

        <AnswerResultModal
          visible={state.resultModalVisible}
          isCorrect={state.isAnswerCorrect}
          onNext={handleNextQuestion}
          commentsAfterFinishingQuestion={state.currentQuestion?.comments}
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

const styles = StyleSheet.create({});

export default LiveLocationScreen;
