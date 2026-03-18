# Open For Answering Task — Bugfix Design

## Overview

The "open [task] for answering" Blockly block generates an `activate` rule that should automatically open a task modal in the mobile app when its condition is met. The modal never appears due to two compounding issues in the activate handler inside `markerLogic.ts` and the caller in `questionHandlers.ts`:

1. `markerGets` dispatches `SET_MODAL_VISIBLE: false` immediately before a `setTimeout(..., 100)` that dispatches `SET_MODAL_VISIBLE: true`. The intermediate `false` races with other concurrent state updates and the modal open is lost.
2. `handleSubmitAnswer` calls `markerGets` inside a `setTimeout(..., 300)` with a locally-computed `updatedTasks` array rather than reading from `stateRef.current.task`, creating a state consistency risk.

The fix removes the spurious `SET_MODAL_VISIBLE: false` dispatch and ensures `markerGets` receives the fully-updated task state.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug — a correct answer is submitted for a task that has an `activate` rule pointing to a target task that is neither finished nor displayed.
- **Property (P)**: The desired behavior when the bug condition holds — `SET_MODAL_VISIBLE: true` is dispatched and the target task modal opens reliably.
- **Preservation**: Existing behaviors (other Blockly actions, incorrect-answer flow, already-finished/displayed task guards) that must remain unchanged by the fix.
- **markerGets**: The function in `frontend-mobile/screens/Map/utils/markerLogic.ts` that runs the rule engine and dispatches state updates based on the result.
- **handleSubmitAnswer**: The function in `frontend-mobile/screens/Map/utils/questionHandlers.ts` that evaluates the player's answer and triggers `markerGets` on a correct answer.
- **analyzeDataRule**: The rule engine function in `ruleEngine.js` that processes the Blockly JSON and returns an array of action results including `activate` entries.
- **activate result**: A rule engine result of the form `{ activate: true, taskId: string }` that signals a task modal should be opened.
- **isDisplayed / isFinished**: Boolean flags on each task object that guard whether the activate handler should proceed.

## Bug Details

### Fault Condition

The bug manifests when a player submits a correct answer for a task whose Blockly rule contains an `activate` action targeting another task. The `markerGets` activate handler dispatches `SET_MODAL_VISIBLE: false` immediately before the delayed `SET_MODAL_VISIBLE: true`, and the delayed dispatch races with other concurrent state updates so the modal never visibly opens.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { submittedTask, tasks, blocklyJson, dispatchLog }
  OUTPUT: boolean

  answeredTask := tasks.find(t => t.question._id === submittedTask._id)
  activateRule := analyzeDataRule(blocklyJson, tasks).find(r => r.activate AND r.taskId)
  targetTask   := tasks.find(t => t.question._id === activateRule.taskId)

  RETURN submittedTask.isCorrect = true
         AND activateRule IS NOT NULL
         AND targetTask IS NOT NULL
         AND NOT targetTask.isFinished
         AND NOT targetTask.isDisplayed
         AND dispatchLog CONTAINS { type: 'SET_MODAL_VISIBLE', payload: false }
                         BEFORE   { type: 'SET_MODAL_VISIBLE', payload: true }
END FUNCTION
```

### Examples

- Player answers aziza-2 correctly; rule says "open task-3 for answering"; task-3 is not yet displayed or finished → modal for task-3 should open but does NOT (bug).
- Player answers aziza-2 correctly; task-3 is already `isFinished: true` → modal correctly stays closed (guard works, not a bug case).
- Player answers aziza-2 correctly; task-3 is already `isDisplayed: true` → modal correctly stays closed (guard works, not a bug case).
- Player answers aziza-2 incorrectly; activate rule exists → `markerGets` is never called, modal stays closed (correct behavior).

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Tasks with `isFinished: true` or `isDisplayed: true` must continue to be skipped by the activate handler.
- Incorrect answer submissions must continue to show the result modal (incorrect feedback) and must NOT call `markerGets`.
- All other Blockly action types (`showTask`, `showAll`, `list`, `finish`, `playground`) must continue to dispatch their respective state updates without interference.
- Backend state persistence (score sync, task completion upload) must continue to work after a correct answer.

**Scope:**
All inputs that do NOT satisfy the bug condition (i.e., where `isBugCondition` returns false) must be completely unaffected by this fix. This includes:
- Mouse/touch taps on map markers (not keyboard-driven)
- Incorrect answer submissions
- Correct answers for tasks with no `activate` rule
- Correct answers where the target task is already finished or displayed

## Hypothesized Root Cause

1. **Spurious `SET_MODAL_VISIBLE: false` dispatch**: In the `activate` branch of `markerGets`, the code dispatches `SET_MODAL_VISIBLE: false` synchronously to "clear" any existing modal, then dispatches `SET_MODAL_VISIBLE: true` inside a `setTimeout(..., 100)`. React Native's state batching means the `false` dispatch may be processed together with other concurrent dispatches (e.g., `SET_RESULT_MODAL: false`), and the delayed `true` arrives after the render cycle has already settled on `false`.

2. **Timing conflict with `SET_RESULT_MODAL`**: `handleSubmitAnswer` dispatches `SET_RESULT_MODAL: false` (implicitly, by not dispatching `true` for correct answers) and other state resets. These land in the same render batch as the `SET_MODAL_VISIBLE: false`, making the modal state unpredictable when the delayed `true` fires.

3. **Stale task state passed to `markerGets`**: `handleSubmitAnswer` computes `updatedTasks` locally and passes it to `markerGets` inside a `setTimeout(..., 300)`. While `stateRef.current.task` may have been updated by the prior `dispatch({ type: 'SET_TASK', payload: updatedTasks })`, using the locally-computed array is fragile if any other dispatch modifies task state between the two calls.

4. **No guarantee of dispatch ordering across timeouts**: The 100 ms inner timeout in `markerGets` and the 300 ms outer timeout in `handleSubmitAnswer` create a window where other dispatches can interleave, making the final modal state non-deterministic.

## Correctness Properties

Property 1: Fault Condition — Activate Rule Opens Modal Reliably

_For any_ input where the bug condition holds (`isBugCondition` returns true) — i.e., a correct answer is submitted, an `activate` rule exists, and the target task is neither finished nor displayed — the fixed `markerGets` activate handler SHALL dispatch `SET_MODAL_VISIBLE: true` exactly once, with no preceding `SET_MODAL_VISIBLE: false` dispatch in the same activate code path, so the modal opens reliably.

**Validates: Requirements 2.1, 2.2**

Property 2: Preservation — Non-Buggy Inputs Produce Identical Behavior

_For any_ input where the bug condition does NOT hold (`isBugCondition` returns false) — including incorrect answers, already-finished/displayed target tasks, and all non-activate Blockly actions — the fixed code SHALL produce exactly the same dispatch sequence as the original code, preserving all existing functionality.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assuming the root cause analysis is correct:

**File**: `frontend-mobile/screens/Map/utils/markerLogic.ts`

**Function**: `markerGets` — `activate` branch

**Specific Changes**:

1. **Remove the spurious `SET_MODAL_VISIBLE: false` dispatch**: Delete the line `dispatch({ type: 'SET_MODAL_VISIBLE', payload: false })` that precedes the `setTimeout` in the activate branch. The `SET_RESULT_MODAL: false` dispatch that follows it can stay if needed to clear the result overlay, but the modal-visible reset must be removed.

2. **Keep or adjust the `setTimeout` delay**: The 100 ms delay before `SET_MODAL_VISIBLE: true` can remain to allow preceding state dispatches (task update, question queue setup) to settle, but it must not be preceded by a `false` dispatch that races with it.

---

**File**: `frontend-mobile/screens/Map/utils/questionHandlers.ts`

**Function**: `handleSubmitAnswer`

**Specific Changes**:

3. **Pass consistent task state to `markerGets`**: The `setTimeout(..., 300)` callback already constructs `updatedState` with the locally-computed `updatedTasks`. This is acceptable as long as `updatedTasks` is computed from `stateRef.current.task` at call time and includes `isFinished: true` and `isCorrect: true` for the answered task. Verify this is the case and add a comment clarifying the intent.

4. **Optional — reduce or remove the outer setTimeout**: If the only reason for the 300 ms delay was to wait for `SET_MODAL_VISIBLE: false` to clear, it may be reducible. However, if other dispatches (e.g., `ADD_COMPLETED_TARGETS`) need to settle first, keep the delay but document it.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on the unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Fault Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If refuted, re-hypothesize.

**Test Plan**: Write unit tests that call `markerGets` directly with an `activate` result and a mock `dispatch`, then assert the dispatch call sequence. Run on the UNFIXED code to observe the `SET_MODAL_VISIBLE: false` before `true` pattern.

**Test Cases**:
1. **Activate dispatch sequence test**: Call `markerGets` with a task list containing an eligible target task and a blocklyJson that produces an `activate` result. Assert that `dispatch` is called with `SET_MODAL_VISIBLE: true` and that no `SET_MODAL_VISIBLE: false` precedes it in the activate path. (Will fail on unfixed code.)
2. **Modal opens after correct answer**: Simulate `handleSubmitAnswer` with a correct answer and an activate rule. Assert `SET_MODAL_VISIBLE: true` is dispatched. (Will fail on unfixed code.)
3. **Task state passed to markerGets**: Capture the `tasks` argument passed to `markerGets` inside the `setTimeout` and assert the answered task has `isFinished: true`. (May fail on unfixed code if stale state is passed.)
4. **Out-of-order dispatch race**: Simulate concurrent dispatches and assert the final modal state is `true`. (Will fail on unfixed code due to race.)

**Expected Counterexamples**:
- `dispatch` is called with `{ type: 'SET_MODAL_VISIBLE', payload: false }` before `{ type: 'SET_MODAL_VISIBLE', payload: true }` in the activate path.
- Possible causes: spurious reset dispatch, timing conflict with `SET_RESULT_MODAL`, stale task state.

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  dispatchLog := []
  markerGets_fixed(input.tasks, input.blocklyJson, mockDispatch(dispatchLog), input.state, input.timer)
  WAIT for all pending timeouts
  ASSERT dispatchLog CONTAINS { type: 'SET_MODAL_VISIBLE', payload: true }
  ASSERT dispatchLog DOES NOT CONTAIN { type: 'SET_MODAL_VISIBLE', payload: false }
         BEFORE { type: 'SET_MODAL_VISIBLE', payload: true } IN activate path
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same dispatch sequence as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  dispatchLog_original := captureDispatches(markerGets_original, input)
  dispatchLog_fixed    := captureDispatches(markerGets_fixed, input)
  ASSERT dispatchLog_original = dispatchLog_fixed
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many task configurations automatically (finished, displayed, mixed states).
- It catches edge cases that manual unit tests might miss (e.g., empty task list, all tasks finished).
- It provides strong guarantees that non-activate dispatch paths are unchanged.

**Test Plan**: Observe dispatch behavior on UNFIXED code for non-activate inputs, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Already-finished task preservation**: For any task where `isFinished: true`, assert the activate handler does not dispatch `SET_MODAL_VISIBLE: true`.
2. **Already-displayed task preservation**: For any task where `isDisplayed: true`, assert the activate handler does not dispatch `SET_MODAL_VISIBLE: true`.
3. **Incorrect answer preservation**: Assert `markerGets` is never called when `isCorrect` is false.
4. **Other action types preservation**: For `showTask`, `showAll`, `list`, `finish`, `playground` results, assert dispatch sequences are identical before and after the fix.

### Unit Tests

- Test the activate branch dispatch sequence with an eligible target task (no `SET_MODAL_VISIBLE: false` before `true`).
- Test the activate branch guard: task with `isFinished: true` → no modal dispatch.
- Test the activate branch guard: task with `isDisplayed: true` → no modal dispatch.
- Test `handleSubmitAnswer` passes `updatedTasks` with `isFinished: true` to `markerGets`.
- Test incorrect answer path does not call `markerGets`.

### Property-Based Tests

- Generate random task arrays with varying `isFinished`/`isDisplayed` states; for any task satisfying the activate condition, assert `SET_MODAL_VISIBLE: true` is dispatched exactly once with no preceding `false` in the activate path.
- Generate random task arrays where no task satisfies the activate condition; assert dispatch sequences match the original implementation exactly (preservation).
- Generate random correct-answer submissions across many task configurations; assert the tasks array passed to `markerGets` always has the answered task marked `isFinished: true`.

### Integration Tests

- Full flow: player answers aziza-2 correctly → task-3 modal opens automatically.
- Full flow: player answers aziza-2 correctly → task-3 already finished → modal stays closed.
- Full flow: player answers aziza-2 incorrectly → result modal shows, task-3 modal does not open.
- Context switching: other Blockly actions (show on map, finish game) continue to work after the fix is applied.
