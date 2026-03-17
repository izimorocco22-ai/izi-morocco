export const initialState = {
  task: [],
  location: null,
  popupShown: false,
  targets: [],
  modalVisible: false,
  introVisible: false,
  finishVisible: false,
  currentQuestion: null,
  selectedOption: [] as number[],
  inputAnswer: '',
  currentTargetId: null,
  checking: false,
  gpsEnabled: false,
  locationPermissionGranted: false,
  showOverlay: false,
  questionQueue: [] as any[],
  currentIndex: 0,
  shownTargets: [] as string[],
  resultModalVisible: false,
  isAnswerCorrect: false,
  completedTargets: [] as string[],
  pendingOpenTaskId: null as string | null,
  navigateFinish: false,
  score: 0,
  loading: false,
  triggerMarker: false,
  timerData: [] as any[],
  time: 0,
  list: [] as any[],
  cameraTarget: null as { latitude: number; longitude: number } | null,
};

export type State = typeof initialState;

export type Action =
  | { type: 'SET_TASK'; payload: any[] }
  | { type: 'UPDATE_TASK_ITEM'; payload: { id: string; updates: any } }
  | {
      type: 'SET_LOCATION';
      payload: { latitude: number; longitude: number } | null;
    }
  | { type: 'SET_POPUP_SHOWN'; payload: boolean }
  | { type: 'SET_TARGETS'; payload: any[] }
  | { type: 'SET_MODAL_VISIBLE'; payload: boolean }
  | { type: 'SET_CURRENT_QUESTION'; payload: any | null }
  | { type: 'SET_SELECTED_OPTION'; payload: number[] }
  | { type: 'SET_INPUT_ANSWER'; payload: string }
  | { type: 'SET_GPS_ENABLED'; payload: boolean }
  | { type: 'SET_LOCATION_PERMISSION'; payload: boolean }
  | { type: 'SET_SHOW_OVERLAY'; payload: boolean }
  | { type: 'SET_QUESTION_QUEUE'; payload: any[] }
  | { type: 'SET_CURRENT_INDEX'; payload: number }
  | { type: 'ADD_SHOWN_TARGETS'; payload: string[] }
  | { type: 'ADD_COMPLETED_TARGETS'; payload: string[] }
  | { type: 'SET_RESULT_MODAL'; payload: boolean }
  | { type: 'SET_IS_ANSWER_CORRECT'; payload: boolean }
  | { type: 'SET_PENDING_OPEN_TASK'; payload: string | null }
  | { type: 'SET_SCORE'; payload: number | { replace: boolean; value: number } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_NAVIGATE_FINISH'; payload: boolean }
  | { type: 'SET_INTRO_VISIBLE'; payload: boolean }
  | { type: 'SET_FINISH_VISIBLE'; payload: boolean }
  | { type: 'SET_TIMER_DATA'; payload: any }
  | { type: 'SET_TIMER'; payload: any }
  | { type: 'SET_LIST'; payload: string[] }
  | { type: 'UPDATE_TIMER_FINISHED'; payload: any }
  | { type: 'TRIGGER_MARKER_GETS' }
  | {
      type: 'SET_CAMERA_TARGET';
      payload: { latitude: number; longitude: number } | null;
    };

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_TASK':
      return { ...state, task: action.payload };
    case 'UPDATE_TASK_ITEM':
      return {
        ...state,
        task: state.task.map(t =>
          t.question?._id === action.payload.id
            ? { ...t, ...action.payload.updates }
            : t,
        ),
      };
    case 'SET_LOCATION':
      return { ...state, location: action.payload };
    case 'SET_POPUP_SHOWN':
      return { ...state, popupShown: action.payload };
    case 'SET_TARGETS':
      return { ...state, targets: action.payload };

    case 'SET_MODAL_VISIBLE':
      return { ...state, modalVisible: action.payload };
    case 'SET_CURRENT_QUESTION':
      return { ...state, currentQuestion: action.payload };
    case 'SET_SELECTED_OPTION':
      return { ...state, selectedOption: action.payload };
    case 'SET_INPUT_ANSWER':
      return { ...state, inputAnswer: action.payload };
    case 'SET_GPS_ENABLED':
      return { ...state, gpsEnabled: action.payload };
    case 'SET_LOCATION_PERMISSION':
      return { ...state, locationPermissionGranted: action.payload };
    case 'SET_SHOW_OVERLAY':
      return { ...state, showOverlay: action.payload };
    case 'SET_QUESTION_QUEUE':
      return { ...state, questionQueue: action.payload };
    case 'SET_CURRENT_INDEX':
      return { ...state, currentIndex: action.payload };
    case 'ADD_SHOWN_TARGETS':
      return {
        ...state,
        shownTargets: Array.from(
          new Set([...state.shownTargets, ...action.payload]),
        ),
      };
    case 'ADD_COMPLETED_TARGETS':
      return {
        ...state,
        completedTargets: Array.from(
          new Set([...state.completedTargets, ...action.payload]),
        ),
      };
    case 'SET_RESULT_MODAL':
      return { ...state, resultModalVisible: action.payload };
    case 'SET_IS_ANSWER_CORRECT':
      return { ...state, isAnswerCorrect: action.payload };
    case 'SET_PENDING_OPEN_TASK':
      return { ...state, pendingOpenTaskId: action.payload };
    case 'SET_NAVIGATE_FINISH':
      return { ...state, navigateFinish: action.payload };
    case 'SET_SCORE':
      return { ...state, score: typeof action.payload === 'object' && action.payload.replace 
        ? action.payload.value 
        : state.score + (action.payload || 0) };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_INTRO_VISIBLE':
      return { ...state, introVisible: action.payload };

    case 'SET_FINISH_VISIBLE':
      return { ...state, finishVisible: action.payload };
    case 'TRIGGER_MARKER_GETS':
      return { ...state, triggerMarker: !state.triggerMarker };
    case 'SET_TIMER_DATA':
      return { ...state, timerData: action.payload };
    case 'UPDATE_TIMER_FINISHED':
      return {
        ...state,
        timerData: state.timerData.map(t =>
          t.seconds === action.payload ? { ...t, isFinished: true } : t,
        ),
      };
    case 'SET_TIMER':
      return { ...state, time: action.payload };
    case 'SET_LIST':
      return { ...state, list: action.payload };
    case 'SET_CAMERA_TARGET':
      return { ...state, cameraTarget: action.payload };
    default:
      return state;
  }
}
