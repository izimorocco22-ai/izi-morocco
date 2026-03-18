# Implementation Plan

- [ ] 1. Write bug condition exploration test
  - **Property 1: Fault Condition** - Activate Branch Dispatches SET_MODAL_VISIBLE: false Before true
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior — it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the spurious SET_MODAL_VISIBLE: false dispatch
  - **Scoped PBT Approach**: Scope the property to the concrete failing case — a correct answer is submitted, an activate rule exists, and the target task is neither finished nor displayed (isBugCondition returns true)
  - Call `markerGets` directly with a task list containing an eligible target task and a blocklyJson that produces an `activate` result; capture all `dispatch` calls in order
  - Assert that `dispatch` is called with `{ type: 'SET_MODAL_VISIBLE', payload: true }` and that NO `{ type: 'SET_MODAL_VISIBLE', payload: false }` precedes it in the activate code path
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS — dispatch log contains `SET_MODAL_VISIBLE: false` before `SET_MODAL_VISIBLE: true`, proving the race condition exists
  - Document counterexamples found (e.g., "dispatch log: [..., {SET_MODAL_VISIBLE: false}, ..., {SET_MODAL_VISIBLE: true}]")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-Buggy Inputs Produce Identical Dispatch Sequences
  - **IMPORTANT**: Follow observation-first methodology
  - Observe dispatch behavior on UNFIXED code for inputs where isBugCondition returns false:
    - Observe: target task with `isFinished: true` → no `SET_MODAL_VISIBLE: true` dispatched
    - Observe: target task with `isDisplayed: true` → no `SET_MODAL_VISIBLE: true` dispatched
    - Observe: incorrect answer submission → `markerGets` is never called
    - Observe: other Blockly action types (`showTask`, `showAll`, `list`, `finish`, `playground`) → dispatch sequences for those paths
  - Write property-based tests: for any task array where no task satisfies the activate condition (all targets are finished or displayed, or no activate rule exists), assert the dispatch sequence matches the original implementation exactly
  - Write property-based tests: generate random task arrays with varying `isFinished`/`isDisplayed` states; for tasks where the guard blocks activation, assert `SET_MODAL_VISIBLE: true` is never dispatched
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS — confirms baseline behavior to preserve
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 3. Fix the activate race condition

  - [ ] 3.1 Remove spurious SET_MODAL_VISIBLE: false dispatch in markerLogic.ts
    - In `frontend-mobile/screens/Map/utils/markerLogic.ts`, locate the `activate` branch inside `markerGets`
    - Delete the line `dispatch({ type: 'SET_MODAL_VISIBLE', payload: false })` that precedes the `setTimeout(..., 100)` in that branch
    - Keep the `setTimeout` and the `SET_MODAL_VISIBLE: true` dispatch inside it — only the preceding `false` dispatch is removed
    - Keep any `SET_RESULT_MODAL: false` dispatch if present (it clears the result overlay, not the task modal)
    - _Bug_Condition: isBugCondition(input) where submittedTask.isCorrect = true AND activateRule IS NOT NULL AND NOT targetTask.isFinished AND NOT targetTask.isDisplayed AND dispatchLog CONTAINS SET_MODAL_VISIBLE:false BEFORE SET_MODAL_VISIBLE:true_
    - _Expected_Behavior: dispatch SET_MODAL_VISIBLE:true exactly once with no preceding SET_MODAL_VISIBLE:false in the activate path_
    - _Preservation: isFinished/isDisplayed guards, incorrect-answer path, other Blockly action dispatch sequences must remain unchanged_
    - _Requirements: 2.1, 2.2_

  - [ ] 3.2 Verify consistent task state is passed to markerGets in questionHandlers.ts
    - In `frontend-mobile/screens/Map/utils/questionHandlers.ts`, locate the `setTimeout(..., 300)` callback inside `handleSubmitAnswer` that calls `markerGets`
    - Confirm that `updatedTasks` passed to `markerGets` is computed from `stateRef.current.task` and includes `isFinished: true` and `isCorrect: true` for the answered task
    - Add a clarifying comment documenting why `updatedTasks` (locally-computed) is used rather than `stateRef.current.task` at call time, and that it must include the answered task's final state
    - If `updatedTasks` is NOT derived from `stateRef.current.task`, fix it to use `stateRef.current.task` as the base and apply the answer update on top
    - _Bug_Condition: stale or inconsistent task state passed to markerGets causing activate condition to evaluate incorrectly_
    - _Expected_Behavior: markerGets receives tasks array where answered task has isFinished:true and isCorrect:true_
    - _Preservation: outer setTimeout delay and other dispatches in handleSubmitAnswer must remain unchanged_
    - _Requirements: 2.3_

  - [ ] 3.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Activate Branch Dispatches SET_MODAL_VISIBLE: true Without Preceding false
    - **IMPORTANT**: Re-run the SAME test from task 1 — do NOT write a new test
    - The test from task 1 encodes the expected behavior; when it passes, the race condition is resolved
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES — confirms the spurious SET_MODAL_VISIBLE: false has been removed and the modal opens reliably
    - _Requirements: 2.1, 2.2_

  - [ ] 3.4 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-Buggy Inputs Produce Identical Dispatch Sequences
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS — confirms no regressions in guard logic, incorrect-answer path, or other Blockly action types
    - Confirm all tests still pass after fix (no regressions)

- [ ] 4. Checkpoint — Ensure all tests pass
  - Run the full test suite covering the modified files
  - Confirm Property 1 (fault condition) test passes — modal opens reliably for eligible activate rules
  - Confirm Property 2 (preservation) tests pass — all non-buggy paths behave identically to before
  - Ensure all tests pass; ask the user if questions arise
