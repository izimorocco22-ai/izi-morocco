# Puzzle URL and Answer Type Fix

## Problem
1. All puzzle tasks were showing the same hardcoded puzzle URL instead of loading the unique puzzle configured for each task in the admin panel
2. Puzzle answer types (mcq, number, text, code_box) were not being properly passed to the mobile app

## Root Cause
1. The puzzle URL was hardcoded in `QuestionModal.tsx`
2. Missing data fields in question mapping: `puzzleAnswerType`, `puzzleUrl`, and `codeBoxConfig`

## Solution

### 1. Updated QuestionModal.tsx
**File:** `frontend-mobile/screens/Map/Components/QuestionModal.tsx`

- Added dynamic puzzle URL from question data:
```javascript
const puzzleUrl = questionData?.puzzleUrl || 'https://izimorocco-jeux.online/Puzzle-mots-croises.html';
```

- Updated WebView to use dynamic URL with key prop for proper reloading:
```javascript
<WebView
  key={puzzleUrl}  // Forces reload when URL changes
  source={{ uri: puzzleUrl }}
  ...
/>
```

### 2. Updated Map.tsx
**File:** `frontend-mobile/screens/Map/Map.tsx`

- Added all puzzle-related fields to question data mapping:
```javascript
const queuedQuestions = overlapping.map(t => ({
  ...
  puzzleAnswerType: t?.question?.puzzleAnswerType,  // NEW: Answer type for puzzle
  puzzleUrl: t?.question?.puzzle?.url,               // NEW: Dynamic puzzle URL
  codeBoxConfig: t?.question?.codeBoxConfig,         // NEW: Code box configuration
  ...
}));
```

## Puzzle Answer Types Supported

The admin panel allows 4 puzzle answer types, all now properly supported in mobile:

### 1. Text Answer
- **Admin:** Sets `puzzleAnswerType: "text"` and `puzzleAnswerText: "answer"`
- **Mobile:** Shows text input, validates against `puzzleAnswerText`
- **Validation:** Case-insensitive text comparison

### 2. Number Answer  
- **Admin:** Sets `puzzleAnswerType: "number"` and `puzzleAnswerText: "123"`
- **Mobile:** Shows numeric input, validates against `puzzleAnswerText`
- **Validation:** Exact number match

### 3. Code Box Answer
- **Admin:** Sets `puzzleAnswerType: "code_box"`, `codeBoxConfig: {length: 4, mode: "alphanumeric"}`, and `correctAnswers: ["AB12"]`
- **Mobile:** Shows code box input with specified length and mode
- **Validation:** Case-insensitive match against `correctAnswers[0]`
- **Modes:** numeric, alpha, alphanumeric

### 4. MCQ Answer
- **Admin:** Sets `puzzleAnswerType: "mcq"`, `options: [{text: "A", isCorrect: true}, ...]`, and `correctAnswers: ["A"]`
- **Mobile:** Shows multiple choice options
- **Validation:** Selected option must match correct answer

## How It Works

1. **Admin Panel:** 
   - Admin creates puzzles with unique URLs in the Puzzles section
   - When creating a task with puzzle answer type, admin:
     - Selects a puzzle from dropdown
     - Chooses answer type (text/number/code_box/mcq)
     - Configures answer based on type

2. **Backend:** 
   - Stores puzzle reference (ID) in the question document
   - Stores `puzzleAnswerType`, `puzzleAnswerText`, `codeBoxConfig`, `options`, and `correctAnswers`

3. **Mobile App:** 
   - Fetches question data with populated puzzle object
   - Extracts all puzzle-related fields
   - Passes them to QuestionModal and QuestionRenderer
   - WebView loads the specific puzzle URL
   - Shows appropriate input based on `puzzleAnswerType`
   - Validates answer based on type

## Data Flow

```
Admin Panel (Puzzle Creation)
  ↓
  { name: "Crossword 1", url: "https://example.com/puzzle1.html" }
  ↓
Admin Panel (Task Creation with Puzzle)
  ↓
  {
    answerType: "puzzle",
    puzzle: "puzzle_id_123",
    puzzleAnswerType: "code_box",
    codeBoxConfig: { length: 4, mode: "alphanumeric" },
    correctAnswers: ["AB12"]
  }
  ↓
Backend API (with populate)
  ↓
  {
    answerType: "puzzle",
    puzzle: { _id: "...", name: "...", url: "https://..." },
    puzzleAnswerType: "code_box",
    codeBoxConfig: { length: 4, mode: "alphanumeric" },
    correctAnswers: ["AB12"]
  }
  ↓
Mobile App
  ↓
  puzzleUrl = question.puzzle.url
  puzzleAnswerType = question.puzzleAnswerType
  codeBoxConfig = question.codeBoxConfig
  ↓
WebView loads specific puzzle
QuestionRenderer shows code box input (4 chars, alphanumeric)
Validation checks input against correctAnswers[0]
```

## Testing
1. Create multiple puzzles with different URLs in admin panel
2. Create tasks with puzzle answer type:
   - Test with text answer
   - Test with number answer
   - Test with code box answer (different lengths and modes)
   - Test with MCQ answer
3. Play the game on mobile
4. Verify:
   - Each task loads its own unique puzzle
   - Correct input type is shown based on puzzleAnswerType
   - Answer validation works correctly for each type

## Files Modified
- `frontend-mobile/screens/Map/Components/QuestionModal.tsx` - Dynamic puzzle URL
- `frontend-mobile/screens/Map/Map.tsx` - Added puzzleAnswerType, puzzleUrl, codeBoxConfig
- `frontend-mobile/screens/Map/Components/QuestionRender.tsx` - Already supports all types
- `frontend-mobile/screens/Map/utils/questionHandlers.ts` - Already validates all types
