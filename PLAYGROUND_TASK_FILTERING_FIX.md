# Playground Task Filtering Fix

## Problem Description
Tasks were showing incorrectly across different playgrounds in the mobile app. When task 1 was set in playground 1 and task 3 was set in playground 2, after completing tasks, task 1 would show in both playgrounds instead of being properly filtered by playground index.

## Root Cause
The issue was in the `PlaygroundView.tsx` component where the filtering logic didn't properly consider the `playgroundIndex` field when filtering tasks for different playgrounds.

## Files Modified

### 1. `frontend-mobile/screens/Map/Components/PlaygroundView.tsx`
- **Fixed**: Added proper playground index calculation based on current view
- **Fixed**: Enhanced task filtering logic to consider `playgroundIndex` field
- **Added**: Support for both multiple playgrounds and legacy single playground scenarios
- **Added**: Better logging for debugging playground task assignments

### 2. `frontend-mobile/screens/Map/Map.tsx`
- **Fixed**: Ensured `playgroundIndex` is preserved when updating task status after completion
- **Added**: Pass `playgroundName` prop to PlaygroundView component

## Key Changes

### Enhanced Playground Index Calculation
```typescript
const getCurrentPlaygroundIndex = () => {
  if (currentView === 'map') return null;
  
  if (playgrounds && playgrounds.length > 0) {
    const playgroundIndex = playgrounds.findIndex(p => p.name.toLowerCase() === currentView.toLowerCase());
    if (playgroundIndex !== -1) {
      return playgroundIndex + 1; // 1-based index
    }
  }
  
  // Support legacy single playground
  if (playgroundName && currentView.toLowerCase() === playgroundName.toLowerCase()) {
    return 1;
  }
  
  return 1; // Default fallback
};
```

### Improved Task Filtering Logic
```typescript
const playgroundTargets = targets.filter(t => {
  // Only show tasks that are marked to be shown on playground
  if (!t?.isShownOnPlayground) return false;
  
  // Don't show completed tasks
  if (completedTargets.includes(t?.question?._id)) return false;
  
  // Filter by playground index - only show tasks assigned to current playground
  if (currentPlaygroundIndex && t?.playgroundIndex) {
    return t.playgroundIndex === currentPlaygroundIndex;
  }
  
  // If no playground index specified, show on playground 1 by default
  return currentPlaygroundIndex === 1;
});
```

### Preserved Playground Index in Task Updates
```typescript
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
  playgroundIndex: q?.playgroundIndex || 1, // Preserve playground index
  points: q?.question?.points || 0,
}));
```

## How It Works

1. **Admin Panel**: When tasks are placed on playgrounds in the Canvas component, they are assigned a `playgroundIndex` (1-based) corresponding to their playground position.

2. **Mobile App**: The `PlaygroundView` component now:
   - Calculates the current playground index based on the selected view
   - Filters tasks to only show those assigned to the current playground
   - Preserves playground assignments when tasks are completed

3. **Data Flow**: The `playgroundIndex` field is maintained throughout the entire data flow from admin panel → backend → mobile app → task completion → backend updates.

## Testing
To verify the fix:
1. In admin panel, assign task 1 to playground 1 and task 3 to playground 2
2. In mobile app, switch between playground views
3. Verify that only the correct tasks appear in each playground
4. Complete tasks and verify they don't appear in other playgrounds

## Benefits
- Tasks now correctly appear only in their assigned playgrounds
- Supports both multiple playgrounds and legacy single playground setups
- Maintains backward compatibility
- Improved debugging with enhanced logging
- Proper data preservation throughout the task lifecycle