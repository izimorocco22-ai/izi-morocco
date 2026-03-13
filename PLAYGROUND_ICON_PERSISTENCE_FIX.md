# Playground Icon Persistence Fix

## Issue
When a task is completed, it correctly disappears from the playground. However, when refreshing and rejoining the game, the completed task's icon never reappears on the playground, even if the Blockly rules should make it visible again.

## Root Cause
When rejoining a game, completed tasks retain their `isShownOnPlayground: true` flag from the saved game state. The rule engine's `checkIfShownOnPlayground` function only shows tasks that are NOT already marked as shown (`!playgroundMap.has(id)`), so completed tasks are never re-evaluated for playground visibility.

## Solution
Modified the backend game logs pipeline to reset `isShownOnPlayground` to `false` for completed tasks when rejoining a game. This allows the Blockly rules to re-evaluate and potentially show the task icon on the playground again.

### Code Change
In `backend-player/src/controllers/games.ts`, line ~290:

```typescript
isShownOnPlayground: {
  $cond: {
    if: { $eq: ['$$q.isFinished', true] },
    then: false, // Reset playground visibility for completed tasks
    else: { $ifNull: ['$$q.isShownOnPlayground', false] }
  }
},
```

## Expected Behavior After Fix
1. ✅ Task completes → Icon disappears from playground (unchanged)
2. ✅ Refresh/rejoin game → Completed task's playground visibility resets
3. ✅ Blockly rules re-evaluate → Icon can reappear if conditions are met
4. ✅ Icons maintain correct positions when they reappear

## Testing
1. Complete a task in playground → Icon should disappear
2. Refresh and rejoin the game
3. If Blockly rules dictate the task should be visible → Icon should reappear in correct position
4. Verify positioning is accurate using the debug logs from previous fix