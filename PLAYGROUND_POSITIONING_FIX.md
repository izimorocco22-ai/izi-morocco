# Playground Task Positioning and Filtering Fix

## Issues Fixed

### 1. Task Filtering by Playground Index
**Problem**: Tasks were showing in wrong playgrounds (e.g., task set in playground 2 showing in playground 1)
**Root Cause**: Backend wasn't returning `playgroundIndex` field to mobile app

**Fixes**:
- Added `playgroundIndex` to backend aggregation pipelines
- Enhanced mobile app filtering logic to properly filter by playground index
- Added comprehensive error handling and debugging

### 2. Icon Positioning Accuracy
**Problem**: Task icons positioned in admin panel (e.g., box 7 in row 3) were showing in different locations in mobile app
**Root Cause**: Incorrect positioning calculation and missing canvas location mapping

**Fixes**:
- Fixed backend to map `canvasLocation` to `playgroundPosition`
- Improved mobile app positioning calculation to account for image aspect ratios
- Added proper centering and offset calculations for different screen sizes

## Files Modified

### Backend Player (games.ts)
```typescript
// Added playgroundIndex to aggregation pipelines
playgroundIndex: { $ifNull: ['$$q.playgroundIndex', 1] }

// Fixed canvas location mapping
playgroundPosition: {
  x: { $ifNull: [{ $arrayElemAt: ['$$q.canvasLocation.coordinates', 0] }, 50] },
  y: { $ifNull: [{ $arrayElemAt: ['$$q.canvasLocation.coordinates', 1] }, 50] }
}
```

### Mobile App PlaygroundView.tsx
```typescript
// Enhanced filtering logic
const playgroundTargets = targets.filter(t => {
  if (!t?.isShownOnPlayground) return false;
  if (completedTargets.includes(t?.question?._id)) return false;
  
  // Filter by playground index
  if (currentPlaygroundIndex && t?.playgroundIndex) {
    return t.playgroundIndex === currentPlaygroundIndex;
  }
  
  return currentPlaygroundIndex === 1;
});

// Improved positioning calculation
const imageAspectRatio = imageDimensions.width / imageDimensions.height;
const containerAspectRatio = containerWidth / containerHeight;

// Calculate actual display size with 'contain' mode
if (imageAspectRatio > containerAspectRatio) {
  displayWidth = containerWidth;
  displayHeight = containerWidth / imageAspectRatio;
} else {
  displayHeight = containerHeight;
  displayWidth = containerHeight * imageAspectRatio;
}

// Convert percentage to pixels with proper centering
xPos = (playgroundPos.x / 100) * displayWidth + offsetX;
yPos = (playgroundPos.y / 100) * displayHeight + offsetY;
```

## How It Works Now

### Task Filtering
1. **Admin Panel**: When tasks are placed on playgrounds, they get assigned a `playgroundIndex` (1-based)
2. **Backend**: Returns `playgroundIndex` field in API responses
3. **Mobile App**: Filters tasks based on current playground view and `playgroundIndex`

### Icon Positioning
1. **Admin Panel**: Stores positions as percentages in `canvasLocation.coordinates[x, y]`
2. **Backend**: Maps `canvasLocation` to `playgroundPosition` with x/y structure
3. **Mobile App**: 
   - Gets actual image dimensions on load
   - Calculates display size accounting for 'contain' resize mode
   - Converts percentages to pixels with proper centering
   - Positions icons accurately regardless of screen size

## Testing Steps
1. **Set up test**: In admin panel, place task 1 in playground 1 and task 3 in playground 2
2. **Test filtering**: Switch between playgrounds in mobile app - each should show only its assigned tasks
3. **Test positioning**: Place a task in a specific location (e.g., box 7 row 3) in admin panel
4. **Verify accuracy**: Check that the task appears in the exact same location in mobile app

## Debug Information
The mobile app now logs detailed information:
- Playground index calculations
- Task filtering decisions
- Position calculations with image dimensions
- Screen size and aspect ratio calculations

Check console logs to debug any remaining positioning issues.

## Benefits
- ✅ Tasks now appear only in their assigned playgrounds
- ✅ Icon positions are accurate across different screen sizes
- ✅ Proper aspect ratio handling for different playground images
- ✅ Comprehensive error handling prevents crashes
- ✅ Detailed logging for debugging