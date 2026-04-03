let questions = [];
let TIMER = 0
let timer_conditions = [] //[{conditions:{},isFinished:true,finishedAt:timestamp}]
let SCORE = 0;

// Precomputed maps for faster lookups
let questionMap = new Map();
let finishedMap = new Set();
let displayedMap = new Set();
let tagMap = new Map();
let playgroundMap = new Set();
let conditionCache = new Map();
let correctMap = new Set();

export const analyzeDataRule = (markerJson, questionFromMain, extras = {}) => {
    const rules = markerJson?.flow || [];
    questions = questionFromMain || [];
    SCORE = extras?.score || 0;
    TIMER = extras?.timer+1 || 0;
    console.log({TIMER, questionsCount: questions.length, finishedCount: questions.filter(q => q.isFinished).length})

    if (!Array.isArray(rules) || rules.length === 0) return [{ finish: true }];

    // Pre-index all data for O(1) lookups - rebuild every time to ensure fresh state
    buildIndexes();
    
    // Clear condition cache to ensure fresh evaluation
    conditionCache.clear();

    const processtheWholeData = [];
    for (const rule of rules) {
        const result = processRule(rule, rules.length);
        if (Array.isArray(result)) processtheWholeData.push(...result);
        else if (result) processtheWholeData.push(result);
    }

    console.log("processtheWholeData", processtheWholeData);
    return processtheWholeData;
};

// ------------------------------------------------------
// Preprocessing helpers
// ------------------------------------------------------

const buildIndexes = () => {
    questionMap.clear();
    finishedMap.clear();
    displayedMap.clear();
    tagMap.clear();
    playgroundMap.clear();
    conditionCache.clear();
    correctMap.clear();

    console.log('🔄 Building indexes for', questions.length, 'questions');
    
    for (const q of questions) {
        const id = q.question._id?.toString();
        if (!id) continue;

        questionMap.set(id, q);
        if (q.isFinished) {
            finishedMap.add(id);
            console.log('✅ Task marked as finished:', id, q.question?.questionName);
        }
        if (q.isDisplayed) displayedMap.add(id);
        if (q.isShownOnPlayground) playgroundMap.add(id);
        if (q.isCorrect) correctMap.add(id);

        if (Array.isArray(q.question.tags)) {
            for (const t of q.question.tags) {
                const tagName = t.name?.toLowerCase();
                if (!tagName) continue;
                if (!tagMap.has(tagName)) tagMap.set(tagName, []);
                tagMap.get(tagName).push(id);
            }
        }
    }
    
    console.log('📊 Index summary:', {
        totalQuestions: questionMap.size,
        finishedTasks: finishedMap.size,
        displayedTasks: displayedMap.size,
        correctTasks: correctMap.size,
        finishedTaskIds: Array.from(finishedMap),
        allTaskIds: Array.from(questionMap.keys())
    });
};

// ------------------------------------------------------
// Core Rule Processor
// ------------------------------------------------------

const processRule = (rule, n) => {
    const whichCase = rule?.type;
    switch (whichCase) {
        case "show_on_playground": {
            return processRule(rule?.task, n);
        }

        case "tasks_with_tag": {
            return { showTag: true, tagName: rule?.tag };
        }

        case "all_tasks": {
            return { showAll: true, idsToShow: getFinishedButNotDisplayedTaskIds() };
        }

        case "task": {
            if (getUnDisplayedTaskFromID(rule?.id))
                return { showTask: true, idToShow: rule?.id };
            break;
        }

        case "tasks_range": {
            const idsToShow = getRange(rule?.start, rule?.end).filter(id => getUnDisplayedTaskFromID(id));
            return { showAll: true, idsToShow }; // will test with showAll
        }

        case "when_then": {
            const condition = evaluateCondition(rule?.condition);
            console.log('🔍 when_then condition evaluation:', {
                condition: rule?.condition,
                result: condition,
                finishedTasks: Array.from(finishedMap)
            });
            if (condition) {
                const doThen = rule?.do || [];
                const processed = [];
                for (const dos of doThen) {
                    const res = processRule(dos, n);
                    if (Array.isArray(res)) processed.push(...res);
                    else if (res) processed.push(res);
                }
                console.log('✅ when_then actions processed:', processed);
                return processed;
            } else {
                console.log('❌ when_then condition FALSE, skipping actions');
            }
            break;
        }

        case "activate": {
            console.log('🎯 Processing activate rule for task:', rule?.task?.id);
            const taskId = rule?.task?.id?.toString();
            const isTaskFinished = checkIfTaskFinished(taskId);
            const taskExists = questionMap.has(taskId);
            
            // Only block if task is already finished — isDisplayed does NOT block activate
            if (taskId && taskExists && !isTaskFinished) {
                console.log('✅ Activate rule will trigger for task:', taskId);
                return { activate: true, taskId: taskId };
            } else {
                console.log('❌ Activate rule blocked:', {
                    reason: !taskId ? 'No taskId' : !taskExists ? 'Task not found' : 'Task already finished',
                    taskId,
                    taskExists,
                    isFinished: isTaskFinished,
                });
            }
            break;
        }

        case "deactivate": {
            const task = rule?.task;
            if (!task) break;

            switch (task?.type) {
                case "task":
                    return { deactivate: true, taskId: [task?.id] };
                case "all_tasks":
                    return { deactivateAll: true };
                case "tasks_range":
                    return { deactivate: true, taskId: getRange(task?.start, task?.end) };
                case "tasks_with_tag":
                    return { deactivate: true, taskId: tagMap.get(task?.tag) || [] };
            }
            break;
        }

        case "show_tasks_on_playground": {
            const task = rule?.task;
            if (!task) break;

            const playgroundId = rule?.playground;
            switch (task?.type) {
                case "task":
                    return { playground: true, taskId: checkIfShownOnPlayground([task?.id]), playgroundId };
                case "all_tasks":
                    const allIds = Array.from(questionMap.keys()).filter(id => !playgroundMap.has(id));
                    return { playground: true, taskId: allIds, playgroundId };
                case "tasks_range":
                    const rangeIds = getRange(task?.start, task?.end);
                    return { playground: true, taskId: checkIfShownOnPlayground(rangeIds, []), playgroundId };
                case "tasks_with_tag":
                    return { playground: true, taskId: checkIfShownOnPlayground([], [{ tagName: task?.tag }]), playgroundId };
            }
            break;
        }

        case "show_in_list": {
            const task = rule?.task;
            if (!task) break;
            switch (task?.type) {
                case "task":
                    if (task?.id && !finishedMap.has(task?.id))
                        return { list: true, idsToShow: [task?.id] };
                    break;
                // Once clicked on the task list than after finishing make sure we remove the task from the marker list if there
                case "all_tasks":
                    return {
                        list: true, idsToShow: Array.from(questionMap.values())
                            .filter(q => !q.isFinished)
                            .map(q => q.question._id)
                    }
                case "tasks_range":
                    const rangeIds = getRange(task?.start, task?.end);
                    const filteredIds = rangeIds.filter(id => !finishedMap.has(id));
                    console.log('📋 show_in_list tasks_range:', {
                        start: task?.start,
                        end: task?.end,
                        rangeIds,
                        finishedTasks: Array.from(finishedMap),
                        filteredIds,
                        willShowInList: filteredIds.length
                    });
                    return {
                        list: true, idsToShow: filteredIds
                    };
                case "tasks_with_tag": {
                    const tagName = task?.tag;
                    // const taggedQuestions = getQuestionsByTags([{ tagName }], questions, null, null, false);
                    return {
                        list: true, idsToShow: (tagMap.get(tagName) || [])
                            .filter(id => {
                                const question = questionMap.get(id);
                                return question && !question.isFinished;
                            })
                    };
                }
            }
            break;
        }

        case "finish": {
            return { finish: true };
        }
    }
};

// ------------------------------------------------------
// Utility functions
// ------------------------------------------------------

const getRange = (start, end) => {
    if (start == null || end == null || !Array.isArray(questions)) return [];
    return questions.slice(start ? start - 1 : 0, end).map(item => item.question._id);
};

// ------------------------------------------------------
// Condition evaluation (cached + recursive)
// ------------------------------------------------------

const evaluateCondition = (condition) => {
    if (!condition) return false;

    const cacheKey = JSON.stringify(condition);
    if (conditionCache.has(cacheKey)) return conditionCache.get(cacheKey);

    let result = false;
    const type = condition?.type;

    switch (type) {
        case "and": {
            const conditions = condition?.conditions || [];
            result = conditions.every(cond => evaluateCondition(cond));
            break;
        }
        case "or": {
            const conditions = condition?.conditions || [];
            result = conditions.some(cond => evaluateCondition(cond));
            break;
        }
        case "not": {
            result = !evaluateCondition(condition?.condition);
            break;
        }
        // case 'timer_after_finished':
        case "task_finished": {
            result = evaluateTasks(condition.task);
            break;
        }
        case "answer_is": {
            // need to do the task evaluation here
            result = checkIfAnswerIsCorrect(condition?.task, condition?.isCorrect);
            break;
        }
        case "compare_variable": {
            const { variable, op, value } = condition;
            const localVars = { SCORE, TIMER };
            const left = localVars[variable];
            switch (op) {
                case ">": result = left > value; break;
                case "<": result = left < value; break;
                case ">=": result = left >= value; break;
                case "<=": result = left <= value; break;
                case "==": result = left == value; break;
                case "===": result = left === value; break;
                case "!=": result = left != value; break;
                case "!==": result = left !== value; break;
                default: throw new Error(`Unsupported operator: ${op}`);
            }
            break;
        }

        case "timer_after_finished": {
            var task = condition?.task;
            // var seconds = condition?.seconds || 0;
            // var ops = condition?.op || ">";
            // console.log({condition,task,ops,seconds})
            // if (seconds && evaluateCondition({ type: "compare_variable", variable: "TIMER", op: ops, value: seconds })) {
            //     return evaluateTasks(task);
            // }
            result = evaluateTasks(task);
            break;
        }

        case "timer": {
            var seconds = condition?.seconds || 0;
            var ops = condition?.op || ">";
            if (!seconds) {
                throw new Error(`Invalid seconds value in timer condition: ${JSON.stringify(condition)}`);
            }
            result = evaluateCondition({ type: "compare_variable", variable: "TIMER", op: ops, value: seconds });
            break;
        }

        default:
            throw new Error(`Unknown condition type: ${type}, rule: ${JSON.stringify(condition)}`);
    }

    conditionCache.set(cacheKey, result);
    return result;
};

// ------------------------------------------------------
// Task evaluation helpers
// ------------------------------------------------------
//this method is used for the evalutation of task which are finished
const evaluateTasks = (taskList) => {
    const type = taskList?.type;
    console.log('🔍 evaluateTasks called:', { type, taskList });
    switch (type) {
        case "task":
            const result = checkIfTaskFinished(taskList?.id);
            console.log('🔍 Task evaluation result:', { taskId: taskList?.id, result });
            return result;
        case "all_tasks":
            return Array.from(questionMap.values())
                .every(q => q.isFinished === true);
        case "tasks_with_tag": {
            const tagName = taskList?.tag?.toLowerCase();
            const taggedIds = tagMap.get(tagName) || [];
            return taggedIds.every(id => finishedMap.has(id));
        }
        case "tasks_range": {
            let taskIds = getRange(taskList?.start, taskList?.end);
            const allFinished = taskIds.every(id => finishedMap.has(id));
            console.log('🔍 tasks_range evaluation:', { taskIds, finishedMap: Array.from(finishedMap), allFinished });
            return allFinished;
        }
        default:
            throw new Error(`Unknown task type: ${type} in evaluateTasks`);
    }
};

// ------------------------------------------------------
// Question accessors
// ------------------------------------------------------

export const getQuestionsByTags = (
    selectedTags,
    questions,
    isDisplayToCheck = null,
    isCorrectToCheck = null,
    isFinishToCheck = null,
    isShownOnPlayground = null
) => {
    // Early exits for invalid inputs
    if (!Array.isArray(selectedTags) || selectedTags.length === 0) return [];
    if (!Array.isArray(questions) || questions.length === 0) return [];

    const tagNames = selectedTags.map(tag => tag.tagName?.toLowerCase()).filter(Boolean);

    // Use pre-indexed tagMap if available (O(1) lookups)
    const candidates = new Set();
    if (typeof tagMap !== "undefined" && tagMap.size > 0) {
        for (const name of tagNames) {
            const ids = tagMap.get(name);
            if (ids && ids.length > 0) ids.forEach(id => candidates.add(id));
        }
    }

    // Filter only matching questions (O(k) instead of O(N×T))
    const filtered = [];
    for (const q of questions) {
        const id = q.question._id?.toString();
        if (!id) continue;

        // If tagMap exists, skip if not in candidates
        if (candidates.size && !candidates.has(id)) continue;

        if (
            (isDisplayToCheck === null || q.isDisplayed === isDisplayToCheck) &&
            (isShownOnPlayground === null || q.isShownOnPlayground === isShownOnPlayground) &&
            (isFinishToCheck === null || q.isFinished === isFinishToCheck)
        ) {
            // Optional fallback check if tagMap is not built
            if (!candidates.size) {
                const qTags = q.question.tags.map(t => t.name?.toLowerCase());
                if (!tagNames.some(tag => qTags.includes(tag))) continue;
            }
            filtered.push(q);
        }
    }

    return filtered;
};

// ------------------------------------------------------
// Timer Accesors
// ------------------------------------------------------

export const getTimerAfterFinished = (flowData, result = []) => {
    // const result = [];

    if (Array.isArray(flowData)) {
        flowData.forEach(item => getTimerAfterFinished(item, result));
    } else if (typeof flowData === "object" && flowData !== null) {
        if (flowData.type === "timer") {
            result.push({
                type: 'timer',
                seconds: flowData.seconds,
                isFinished: false
            });
        }
        else if (flowData?.type === 'timer_after_finished') {
            result.push({
                type: 'timer_after_finished',
                task: flowData.task,
                seconds: flowData.seconds,
                isFinished: false
            })
        }

        // Recursively search in all object properties
        Object.values(flowData).forEach(value => getTimerAfterFinished(value, result));
    }
    return result;
}

// ------------------------------------------------------
// Fast lookup helpers
// ------------------------------------------------------

const checkIfAnswerIsCorrect = (task, isCorrect) => {
    // here I need to create a same like the evaluateTasks but for isCorrect
    const type = task?.type;
    switch (type) {
        case "task":
            return isCorrect === correctMap.has(task?.id);
        case "all_tasks":
            return Array.from(questionMap.values())
                .every(q => q.isFinished === true && q.isCorrect === isCorrect);
        case "tasks_with_tag": {
            const tagName = task?.tag?.toLowerCase();
            const taggedIds = tagMap.get(tagName) || [];
            return taggedIds.every(id => finishedMap.has(id) && (isCorrect === correctMap.has(id)));
        }
        case "tasks_range": {
            let taskIds = getRange(task?.start, task?.end);
            return taskIds.every(id => finishedMap.has(id) && (isCorrect === correctMap.has(id)));
        }
        default:
            throw new Error(`Unknown task type: ${type} in checkIfAnswerIsCorrect`);
    }
};

const checkIfTaskFinished = (taskId) => {
    const taskIdStr = taskId?.toString();
    const isFinished = finishedMap.has(taskIdStr);
    console.log('🔍 checkIfTaskFinished:', { taskId, taskIdStr, isFinished, finishedMapSize: finishedMap.size });
    return isFinished;
};

const checkIfShownOnPlayground = (taskIds, tags = []) => {
    if (tags.length > 0) {
        const tagName = tags[0]?.tagName?.toLowerCase();
        const ids = tagMap.get(tagName) || [];
        return ids.filter(id => !playgroundMap.has(id));
    }
    return taskIds.filter(id => !playgroundMap.has(id));
};

const getFinishedButNotDisplayedTaskIds = () => {
    return Array.from(questionMap.values())
        .filter(q => q.isDisplayed === false)
        .map(q => q.question._id);
};

const getUnDisplayedTaskFromID = (id) => {
    const idStr = id?.toString();
    const q = questionMap.get(idStr);
    const result = q && q.isDisplayed === false ? q.question._id : null;
    console.log('🔍 getUnDisplayedTaskFromID:', { id, idStr, found: !!q, isDisplayed: q?.isDisplayed, result });
    return result;
};





















// let questions = []
// let SCORE = 0;
// export const analyzeDataRule = (markerJson, questionFromMain, extras = {}) => {
//     const rules = markerJson?.flow || [];
//     // console.log("questionFromMain", questionFromMain);
//     questions = questionFromMain;
//     SCORE = extras?.score;
//     // console.log(rules.length)
//     if (!Array.isArray(rules) || rules.length === 0) return [{ finish: true }];

//     let processtheWholeData = rules.flatMap((rule) => {
//         let finalReturned = processRule(rule, rules.length);
//         return finalReturned;
//     }).filter(item => item !== undefined);
//     console.log("processtheWholeData", processtheWholeData);
//     return processtheWholeData;
// }

// const processRule = (rule, n) => {
//     let whichCase = rule?.type;
//     switch (whichCase) {
//         case "show_on_playground": {
//             // console.log("Processing 'show_on_playground' rule");
//             let task = processRule(rule?.task, n);
//             return task;
//         }

//         case "tasks_with_tag": {
//             // console.log("Processing 'tasks_with_tag' rule");
//             return { showTag: true, tagName: rule?.tag };
//         }

//         case "all_tasks": {
//             return { showAll: true, idsToShow: getFinishedButNotDisplayedTaskIds() };
//         }

//         case "task": {
//             if (getUnDisplayedTaskFromID(rule?.id))
//                 return { showTask: true, idToShow: rule?.id };
//             break;
//         }

//         case "when_then": {
//             let condition = evaluateCondition(rule?.condition)
//             // console.log("Condition evaluated to:", { rule, condition });
//             if (condition) {
//                 let doThen = rule?.do;
//                 // console.log("'do' actions to process:", doThen);
//                 let processedDoThen = doThen.flatMap(dos => processRule(dos, n));
//                 // console.log("Processed 'do' actions:", processedDoThen);
//                 return processedDoThen;
//             }
//         }
//             break;

//         case 'activate': {
//             if (Object.keys(rule).includes('task') && rule?.task != null && checkIfTaskFinished(rule?.task?.id) === false) {
//                 return { activate: true, taskId: rule?.task?.id };
//             }
//             break;
//         }

//         case 'deactivate': {
//             let task = rule?.task;
//             switch (task?.type) {
//                 case 'task': {
//                     return { deactivate: true, taskId: [task?.id] }
//                 }

//                 case 'all_tasks': {
//                     return { deactivateAll: true };
//                 }

//                 case "tasks_range": {
//                     return { deactivate: true, taskId: getRange(task?.start, task?.end) }
//                 }
//             }
//             break;
//         }

//         case "show_tasks_on_playground": {
//             let task = rule?.task;
//             switch (task?.type) {
//                 case 'task': {
//                     return { playground: true, taskId: checkIfShownOnPlayground([task?.id]), playgroundId: rule?.playground };
//                 }

//                 case 'all_tasks': {
//                     return { playground: true, taskId: questions.filter(q => q.isShownOnPlayground === false).map(t => t.question._id), playgroundId: rule?.playground };
//                 }

//                 case "tasks_range": {
//                     const taskIds = getRange(task?.start, task?.end);
//                     return { playground: true, taskId: checkIfShownOnPlayground(taskIds, []), playgroundId: rule?.playground };
//                 }

//                 case "tasks_with_tag": {
//                     let tagName = task?.tag;
//                     return { playground: true, taskId: checkIfShownOnPlayground([], [{ tagName }]), playgroundId: rule?.playground };
//                 }
//             }
//             break;
//         }

//         case 'finish': {
//             return { finish: true };
//         }
//     }
// }

// // const getRange = (start, end) => {
// //     const result = [];
// //     for (let i = start; i <= end; i++) {
// //         result.push(i);
// //     }
// //     return result;
// // };

// const getRange = (start, end) => {
//     if (start == null || end == null || !Array.isArray(questions)) return [];
//     return questions.slice(start ? start - 1 : 0, end).map(item => item.question._id);
// };

// const evaluateCondition = (condition) => {
//     let conditionType = condition?.type;
//     switch (conditionType) {
//         case "and": {
//             let conditions = condition?.conditions || [];
//             let results = conditions.map(cond => evaluateCondition(cond));
//             return results.every(res => res === true);
//         }

//         case "or": {
//             let conditions = condition?.conditions || [];
//             let results = conditions.map(cond => evaluateCondition(cond));
//             return results.some(res => res === true);
//         }

//         case "not": {
//             let cond = condition?.condition;
//             return !evaluateCondition(cond);
//         }

//         case "task_finished": {
//             let task = condition.task;
//             return evaluateTasks(task);
//         }

//         case "answer_is": {
//             return checkIfAnswerIsCorrect(condition.task.id, condition?.isCorrect);
//         }
//         case "compare_variable": {
//             const { variable, op, value } = condition;

//             // assuming your local variables are accessible globally or via an object
//             const localVars = { SCORE }; // you can add more vars here
//             const left = localVars[variable];
//             // console.log(left)

//             switch (op) {
//                 case ">": return left > value;
//                 case "<": return left < value;
//                 case ">=": return left >= value;
//                 case "<=": return left <= value;
//                 case "==": return left == value;
//                 case "===": return left === value;
//                 case "!=": return left != value;
//                 case "!==": return left !== value;
//                 default: throw new Error(`Unsupported operator: ${op}`);
//             }
//         }

//         default:
//             throw new Error(`Unknown condition type: ${conditionType}, rule: ${JSON.stringify(condition)}`);
//     }
// }



// const evaluateTasks = (taskList) => {
//     // console.log("Evaluating taskList:", taskList);
//     let type = taskList?.type;

//     switch (type) {
//         case "task": {
//             return checkIfTaskFinished(taskList?.id);
//         }
//         case "all_tasks": {
//             let allTasks = questions.map(q => (q.isFinished === true && q.isDisplayed === true));
//             // console.log("allTasks evaluation:", allTasks.every(res => res === true));
//             return allTasks.every(res => res === true);
//         }
//         case "tasks_with_tag": {
//             let tagName = taskList?.tag;
//             const filteredQuestions = getQuestionsByTags([{ tagName }], questions, null, null, true);
//             return filteredQuestions.every(q => q.isFinished === true);
//         }
//         default:
//             throw new Error(`Unknown task type: ${type} in evaluateTasks`);
//     }
// }

// export const getQuestionsByTags = (selectedTags, questions, isDisplayToCheck = null, isCorrectToCheck = null, isFinishToCheck = null, isShownOnPlayground = null) => {
//     // Extract only the tag names to search
//     const tagNames = selectedTags.map(tag => tag.tagName?.toLowerCase());

//     // Filter questions that have matching tags
//     const filteredQuestions = questions.filter(q => {
//         const questionTags = q.question.tags.map(t => t.name?.toLowerCase());
//         return tagNames.some(tagName =>
//             questionTags.includes(tagName)
//             && (isDisplayToCheck === null || q.isDisplayed === isDisplayToCheck)
//             // && (isFinishToCheck === null || q.isFinished === isFinishToCheck)
//             // && (isCorrectToCheck === null || q.isCorrect === isCorrectToCheck)
//             && (isShownOnPlayground === null || q.isShownOnPlayground === isShownOnPlayground)
//         );
//     });

//     // Map to simplified structure
//     return filteredQuestions;
// };

// const checkIfAnswerIsCorrect = (taskId, isCorrect) => {
//     const finishedTasks = questions.find((q) => {
//         return q.question._id?.toString() === taskId && q.isFinished === true && q.isCorrect === isCorrect;
//     });
//     return finishedTasks !== undefined;
// }

// const checkIfTaskFinished = (taskId) => {
//     const finishedTask = questions.find((q) => {
//         return q.question._id?.toString() === taskId && q.isFinished === true;
//     });
//     return finishedTask !== undefined;
// }

// const checkIfShownOnPlayground = (taskIds, tags = []) => {
//     if (tags.length > 0) {
//         const tasksWithTag = getQuestionsByTags(tags, questions, null, null, null, false);
//         const taskIdsWithTag = tasksWithTag.map(t => t.question._id);
//         return taskIdsWithTag;
//     }
//     else {
//         const tasks = questions.filter((q) => {
//             return taskIds.includes(q.question._id?.toString()) && q.isShownOnPlayground === false;
//         });
//         return tasks.length > 0 ? tasks.map(t => t.question._id) : [];
//     }
// }

// // Returns only the IDs of tasks that are finished and not displayed
// const getFinishedButNotDisplayedTaskIds = () => {
//     return questions
//         .filter(q => q.isDisplayed === false)
//         .map(q => q.question._id);
// }

// const getUnDisplayedTaskFromID = id => {
//     return questions
//         .find(q => q.isDisplayed === false && q.question._id?.toString() === id)
//         ?.question._id;
// };