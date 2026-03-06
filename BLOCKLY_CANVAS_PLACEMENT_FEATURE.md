# Blockly Canvas Placement Feature

## Overview
This feature allows tasks to be automatically placed on the playground canvas when added via Blockly's "show tasks on playground" block. Users can then resize and move the task icons on the canvas.

## Changes Made

### 1. Frontend - Canvas Component (`frontend-admin/src/features/Games/components/Canvas.jsx`)

#### Added Features:
- **Blockly Integration**: Detects when a task is added via Blockly's "show tasks on playground" block
- **Pending Task Detection**: Monitors `blocklyData` to find tasks that need to be placed on the canvas
- **Click to Place**: Shows "Click to set in playground" instruction when a pending task is detected
- **Resize Functionality**: Added resize handle to task icons (small circle at bottom-right)
- **Icon Size Persistence**: Saves icon size when resizing is complete

#### Key Changes:
```javascript
// Added state for pending Blockly tasks
const [pendingBlocklyTask, setPendingBlocklyTask] = useState(null);

// Added blocklyData to selector
const { selectedQuestion, selectedQuestions, getGameInfobyIdApi, blocklyData } = useSelector((state) => state.games);

// Added playground index calculation
const playgroundIndex = playgroundData
  ? (getGameInfobyIdApi?.data?.response?.playgrounds || []).findIndex(
      (pg) => pg.name === playgroundData.name
    ) + 1
  : 1;

// Added useEffect to detect pending tasks from Blockly
useEffect(() => {
  if (!blocklyData?.blocksJson?.flow) return;
  
  const flow = blocklyData.blocksJson.flow;
  let foundPendingTask = null;

  for (const rule of flow) {
    if (rule.type === 'when_then' && rule.do) {
      for (const action of rule.do) {
        if (
          action.type === 'show_tasks_on_playground' &&
          action.playground === playgroundIndex &&
          action.task
        ) {
          const taskId = action.task.id;
          const question = selectedQuestions.find((q) => q.id === taskId);
          if (question && !question.isPlacedCanvas) {
            foundPendingTask = question;
            break;
          }
        }
      }
    }
    if (foundPendingTask) break;
  }

  setPendingBlocklyTask(foundPendingTask);
}, [blocklyData, selectedQuestions, playgroundIndex]);
```

#### Resize Functionality:
```javascript
// Added resize state and handlers in QuestionMarker component
const [isResizing, setIsResizing] = useState(false);
const [iconSize, setIconSize] = useState(question.iconSize || 40);
const resizeStartRef = useRef({ size: 40, mouseX: 0, mouseY: 0 });

const handleResizeStart = useCallback((e) => {
  e.preventDefault();
  e.stopPropagation();
  setIsResizing(true);
  resizeStartRef.current = {
    size: iconSize,
    mouseX: e.clientX,
    mouseY: e.clientY,
  };

  const handleResizeMove = (moveEvent) => {
    const deltaX = moveEvent.clientX - resizeStartRef.current.mouseX;
    const deltaY = moveEvent.clientY - resizeStartRef.current.mouseY;
    const delta = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const direction = deltaX + deltaY > 0 ? 1 : -1;
    const newSize = Math.max(20, Math.min(200, resizeStartRef.current.size + delta * direction * 0.5));
    setIconSize(newSize);
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
    
    // Save the new size
    dispatch((dispatch, getState) => {
      const currentSelectedQuestions = getState().games.selectedQuestions;
      const updatedQuestions = currentSelectedQuestions.map((field) =>
        field.id === question.id
          ? { ...field, iconSize }
          : field
      );
      dispatch(setSelectedQuestions(updatedQuestions));
    });
  };

  document.addEventListener('mousemove', handleResizeMove);
  document.addEventListener('mouseup', handleResizeEnd);
}, [iconSize, question.id, dispatch]);
```

### 2. Frontend - Rules Condition Component (`frontend-admin/src/features/Games/components/RulesCondition.jsx`)

#### Changes:
- Added `iconSize` to the payload when submitting game questions

```javascript
const questions = selectedQuestions.map((pq) => {
  return {
    questionId: pq.id,
    latitude: pq.lat,
    longitude: pq.lng,
    radius: pq.locationRadius || 0,
    order: pq.index,
    isPlaced: pq.isPlaced,
    isPlacedCanvas: pq.isPlacedCanvas,
    x: pq.x,
    y: pq.y,
    iconSize: pq.iconSize || 40  // Added this line
  };
});
```

### 3. Frontend - Create/Update Game Component (`frontend-admin/src/features/Games/pages/CreateUpdateGame.jsx`)

#### Changes:
- Added `iconSize` when loading game questions data

```javascript
return {
  id: _id,
  name: questionName,
  points,
  tags: tags?.map((t) => t.name) || [],
  index: q.order,
  icon: icon,
  iconName: iconName,
  locationRadius: locationRadius ?? q.radius,
  radiusColor: radiusColor,
  isSelected: false,
  isPlaced: q.isPlaced || false,
  lng: q.longitude,
  lat: q.latitude,
  isPlacedCanvas: q.isPlacedCanvas || false,
  x: q.x,
  y: q.y,
  iconSize: q.iconSize || 40  // Added this line
};
```

### 4. Backend - Game Questions Schema (`backend-admin/api/models/game-questions.schema.js`)

#### Changes:
- Added `iconSize` field to the questions schema

```javascript
iconSize: {
  type: Number,
  required: false,
  default: 40
}
```

### 5. Backend - Game Question Controller (`backend-admin/api/controllers/game-question.controller.js`)

#### Changes:
- Added `iconSize` handling in `upsertGameQuestionsController`
- Added `iconSize` to response formatting
- Added `iconSize` to aggregation pipeline in `getGameQuestionsController`

```javascript
// In upsertGameQuestionsController
const formattedQuestions = questions.map((q, index) => ({
  questionId: q.questionId,
  location: {
    type: 'Point',
    coordinates: [q.longitude, q.latitude]
  },
  radius: q.radius || 0,
  order: q.order ? q.order : index,
  isPlaced: q.isPlaced || false,
  isPlacedCanvas: q.isPlacedCanvas || false,
  canvasLocation: {
    type: 'Point',
    coordinates: [q.x, q.y]
  },
  iconSize: q.iconSize || 40  // Added this line
}));

// In response formatting
questions: gameQuestions.questions.map((q) => ({
  questionId: q.questionId,
  latitude: q.location.coordinates[1],
  longitude: q.location.coordinates[0],
  radius: q.radius,
  order: q.order,
  _id: q._id,
  isPlaced: q.isPlaced,
  isPacedCanvas: q.isPlacedCanvas,
  x: q.canvasLocation?.coordinates[0],
  y: q.canvasLocation?.coordinates[1],
  iconSize: q.iconSize || 40  // Added this line
})),

// In aggregation pipeline
iconSize: { $ifNull: ['$$q.iconSize', 40] }  // Added this line
```

## How It Works

1. **User adds a Blockly block**: When a user adds "show aziza-1 on playground" in Blockly
2. **Detection**: The Canvas component detects this via the `blocklyData` state
3. **Instruction shown**: A blue instruction box appears saying "Click to set in playground"
4. **Placement**: User clicks on the canvas to place the task icon
5. **Resize**: User can drag the small circle at the bottom-right of the icon to resize it
6. **Move**: User can drag the icon to move it around the canvas
7. **Save**: All changes (position and size) are saved when the user submits the form

## UI Elements

### Instruction Box
- Appears when a task needs to be placed
- Shows "Click to set in playground" message
- Displays the task name to be placed

### Resize Handle
- Small circle at bottom-right of task icon
- Color matches the task's radius color
- Cursor changes to `nwse-resize` on hover
- Size constraints: 20px minimum, 200px maximum

### Task Icon
- Displays task icon or avatar
- Shows radius circle around it
- Can be dragged to move
- Can be resized using the resize handle
- Shows position tooltip on hover

## Testing

To test this feature:

1. Go to Games → Create/Update Game
2. Navigate to "Rules & Conditions" step
3. Select a playground tab
4. In Blockly, add a "When-Then" block
5. Add "show [task] on playground [playground-name]" action
6. Switch to the corresponding playground tab
7. You should see "Click to set in playground" instruction
8. Click on the canvas to place the task
9. Drag the task icon to move it
10. Drag the resize handle to resize the icon
11. Submit the form to save changes

## Notes

- Icon size is stored in pixels (default: 40px)
- Position is stored as percentage of canvas dimensions
- The feature works with multiple playgrounds
- Only unplaced tasks trigger the "Click to set" instruction
- Resize and move operations are independent
