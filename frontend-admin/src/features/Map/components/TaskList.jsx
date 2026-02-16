import React, { useRef, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
// import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../../../components/ui/card';
// import CheckBox from '../../../../components/form/Checkbox';

const TaskCard = ({ task, index, onToggle }) => {
  // Display uses `isDisplayed` and Correct/Incorrect use `isCorrect` (true/false)
  // Any click should also mark the task as finished
  const toggleDisplay = () =>
    onToggle(index, "isDisplayed", !task?.isDisplayed, { isFinished: true });
  const setCorrect = () =>
    onToggle(index, "isCorrect", true, { isFinished: true });
  const setIncorrect = () =>
    onToggle(index, "isCorrect", false, { isFinished: true });

  return (
    <Card className="p-3">
      <CardHeader>
        <CardTitle>
          Task {task.question.questionName}
          {/* {task.to ? ` - ${task.to}` : ""} */}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* {task.tag && (
          <div className="text-sm text-muted mb-2">Tag: {task.tag}</div>
        )} */}
        <div className="flex gap-4 items-center">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!task.isDisplayed}
              onChange={toggleDisplay}
            />
            <span className="text-sm">Display</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={task.isCorrect === true}
              onChange={setCorrect}
            />
            <span className="text-sm">Correct</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={task.isCorrect === false}
              onChange={setIncorrect}
            />
            <span className="text-sm">Incorrect</span>
          </label>
        </div>
      </CardContent>
    </Card>
  );
};

const TaskList = ({ tasks = [], onChange = () => {} }) => {
  const containerRef = useRef(null);

  const handleToggle = (index, field, value, extra = {}) => {
    const next = tasks.map((t, i) =>
      i === index ? { ...t, [field]: value, ...extra } : t
    );
    onChange(next);
  };

  if (!tasks || tasks.length === 0) return <div className="p-4">No tasks</div>;

  const showScrollButtons = useMemo(() => (tasks?.length || 0) > 6, [tasks]);

  return (
    <div className="relative">
      {showScrollButtons && (
        <div className="absolute right-1 top-1 z-10 flex flex-col gap-1">
          <button
            type="button"
            className="h-7 w-7 lg:h-8 lg:w-8 rounded-full bg-accent text-white flex items-center justify-center shadow hover:scale-110 duration-200"
            onClick={() => {
              containerRef.current?.scrollBy({ top: -240, behavior: "smooth" });
            }}
            aria-label="Scroll up"
            title="Scroll up"
          >
            ↑
          </button>
          <button
            type="button"
            className="h-7 w-7 lg:h-8 lg:w-8 rounded-full bg-accent text-white flex items-center justify-center shadow hover:scale-110 duration-200"
            onClick={() => {
              containerRef.current?.scrollBy({ top: 240, behavior: "smooth" });
            }}
            aria-label="Scroll down"
            title="Scroll down"
          >
            ↓
          </button>
        </div>
      )}

      <div
        ref={containerRef}
        className="max-h-[60vh] overflow-y-auto pr-2"
      >
        <div className="grid grid-cols-1 gap-3">
          {tasks.map((task, idx) => (
            <TaskCard
              key={idx}
              task={task}
              index={idx}
              onToggle={handleToggle}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TaskList;
