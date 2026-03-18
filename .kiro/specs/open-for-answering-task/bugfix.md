# Bugfix Requirements Document

## Introduction

In the Blockly game editor, the "open [task] for answering" block is supposed to automatically open the task modal in the mobile app when its condition is met (e.g., "When answer is correct for aziza-2, Then open task-3 for answering"). The modal does not auto-open. The block generates a rule of type `activate` in the game's JSON flow, which the mobile rule engine processes and dispatches `SET_MODAL_VISIBLE: true` — but the modal never appears.

Through code investigation, the root cause is a **state race condition** in `questionHandlers.ts`. When a correct answer is submitted:

1. `dispatch({ type: 'SET_TASK', payload: updatedTasks })` is called to mark the task as finished.
2. `markerGets(...)` is called inside a `setTimeout(..., 300)` — but it receives `updatedTasks` (the locally-computed array) rather than reading from `stateRef.current.task`, which may not yet reflect the dispatch.
3. Inside `markerGets` → `analyzeDataRule`, the rule engine builds its indexes from the tasks array passed in. The `activate` case checks `!isTaskDisplayed` — but the `isDisplayed` flag for the target task (task-3) is never set to `true` before the check, so the rule fires correctly.
4. However, the modal dispatch (`SET_MODAL_VISIBLE: true`) happens inside a nested `setTimeout(..., 100)` within `markerGets`. By the time this fires, the outer `SET_RESULT_MODAL` and other dispatches may have already closed or overridden the modal state.
5. Additionally, `markerGets` dispatches `SET_MODAL_VISIBLE: false` immediately before the delayed `SET_MODAL_VISIBLE: true`, which can race with other state updates and result in the modal never visibly opening.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the condition for an "open [task] for answering" Blockly block is met (e.g., answer is correct for aziza-2) THEN the system does NOT open the task modal in the mobile app — the modal remains closed and the player sees no prompt to answer task-3.

1.2 WHEN `markerGets` processes an `activate` result from the rule engine THEN the system dispatches `SET_MODAL_VISIBLE: false` immediately followed by `SET_MODAL_VISIBLE: true` inside a `setTimeout(..., 100)`, causing a race condition where the modal open dispatch may be overridden or lost.

1.3 WHEN `handleSubmitAnswer` calls `markerGets` inside a `setTimeout(..., 300)` with a locally-computed `updatedTasks` array THEN the system passes stale or inconsistent task state to the rule engine, potentially causing the `activate` condition to not evaluate correctly in edge cases.

### Expected Behavior (Correct)

2.1 WHEN the condition for an "open [task] for answering" Blockly block is met THEN the system SHALL automatically open the task question modal in the mobile app, displaying the target task's question to the player without requiring any additional interaction.

2.2 WHEN `markerGets` processes an `activate` result THEN the system SHALL open the modal reliably without an intermediate `SET_MODAL_VISIBLE: false` dispatch that can race with the delayed open.

2.3 WHEN `handleSubmitAnswer` triggers `markerGets` after a correct answer THEN the system SHALL pass the fully updated task state (with the answered task marked as `isFinished: true` and `isCorrect: true`) to the rule engine so the `activate` condition evaluates correctly.

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the "open for answering" block is triggered for a task that is already finished (`isFinished: true`) THEN the system SHALL CONTINUE TO NOT open the modal for that task.

3.2 WHEN the "open for answering" block is triggered for a task that is already displayed (`isDisplayed: true`) THEN the system SHALL CONTINUE TO NOT open the modal for that task.

3.3 WHEN other Blockly action blocks (show on map, show in list, finish game) have their conditions met THEN the system SHALL CONTINUE TO execute those actions correctly and without interference.

3.4 WHEN an incorrect answer is submitted THEN the system SHALL CONTINUE TO show the answer result modal (incorrect feedback) and NOT trigger any `activate` rules.

3.5 WHEN the game state is saved/synced to the backend after a correct answer THEN the system SHALL CONTINUE TO persist the updated task state correctly.
