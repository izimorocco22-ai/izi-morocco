/* eslint-disable no-unused-vars */
import { useRef, useState, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import CrossIcon from "../../../components/svgs/CrossIcon";
import {
  setSelectedQuestion,
  setSelectedQuestions,
} from "../../../slices/gameSlice";
import { MEDIA_URL } from "../../../utils/config";
import { getCleanImageUrl } from "../../../utils/common";

// --- Configuration ---
const CANVAS_IMAGE_URL =
  "https://res.cloudinary.com/dfpjcqywv/image/upload/v1758877538/galleryImages/2f7e7536-3593-4088-a358-e1403c6d626f.png";
const MEDIA_BASE_URL = MEDIA_URL();

const colorWithOpacity = (color, opacity = 0.1) => {
  const safeColor = color || "#3B82F6";
  if (safeColor.startsWith("rgb(")) {
    return safeColor.replace("rgb(", "rgba(").replace(")", `, ${opacity})`);
  }
  if (safeColor.startsWith("#")) {
    const hex = safeColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return `rgba(59, 130, 246, ${opacity})`;
};

const getIconUrl = (iconPath) => {
  const finalUrl = getCleanImageUrl(iconPath);
  console.log(`Canvas Icon URL:`, finalUrl, 'Original:', iconPath);
  return finalUrl;
};

// --- Question Placer Canvas Component ---

const QuestionPlacerCanvas = ({ playgroundData }) => {
  const canvasContainerRef = useRef(null);
  const dispatch = useDispatch();

  const [displayPlacedQuestions, setDisplayPlacedQuestions] = useState(false);
  const [pendingBlocklyTask, setPendingBlocklyTask] = useState(null);
  const { selectedQuestion, selectedQuestions, getGameInfobyIdApi, blocklyData } =
    useSelector((state) => state.games);
  
  const playgroundImage = playgroundData?.image
    ? getCleanImageUrl(playgroundData.image)
    : getGameInfobyIdApi?.data?.response?.playgroundImage
    ? getCleanImageUrl(getGameInfobyIdApi.data.response.playgroundImage)
    : CANVAS_IMAGE_URL;

  // Debug log for Canvas Playground Image
  if (playgroundImage !== CANVAS_IMAGE_URL) {
      console.log("Canvas Playground Image URL:", playgroundImage);
  }

  const playgroundName =
    playgroundData?.name ||
    getGameInfobyIdApi?.data?.response?.playgroundName ||
    "Untitled Playground";

  const playgroundIndex = playgroundData
    ? (getGameInfobyIdApi?.data?.response?.playgrounds || []).findIndex(
        (pg) => pg.name === playgroundData.name
      ) + 1
    : 1;

  // --- 1. NEW REFS FOR DRAGGING ---
  // We use Refs for logic to avoid stale closures in event listeners
  const dragItemRef = useRef(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // We still keep State for Rendering (so the UI updates)
  const [draggedQuestion, setDraggedQuestion] = useState(null);

  const placedQuestions = selectedQuestions.filter(
    (q) => q.isPlacedCanvas && q.playgroundIndex === playgroundIndex
  );

  const updateQuestionLocation = useCallback(
    (questionId, xPercent, yPercent) => {
      dispatch((dispatch, getState) => {
        const currentSelectedQuestions = getState().games.selectedQuestions;
        const updatedQuestions = currentSelectedQuestions.map((field) =>
          field.id === questionId
            ? {
              ...field,
              x: xPercent,
              y: yPercent,
              playgroundIndex: playgroundIndex
            }
            : field
        );
        dispatch(setSelectedQuestions(updatedQuestions));
      });
    },
    [dispatch, playgroundIndex]
  );

  // --- 2. FIXED DRAGGING LOGIC ---

  // Define these outside to be stable, or inside useEffect,
  // but refs make it easy to keep them as callbacks.

  const handleDrag = useCallback((e) => {
    // Check the REF, not the state. The Ref is always current.
    if (!dragItemRef.current || !canvasContainerRef.current) return;

    const rect = canvasContainerRef.current.getBoundingClientRect();

    // Calculate new pixels
    const finalX = e.clientX - rect.left - dragOffsetRef.current.x;
    const finalY = e.clientY - rect.top - dragOffsetRef.current.y;

    // Update the REF (for the next mousemove calculation)
    dragItemRef.current = { ...dragItemRef.current, x: finalX, y: finalY };

    // Update the STATE (to trigger a re-render so you see the marker move)
    setDraggedQuestion(dragItemRef.current);
  }, []);

  const handleDragEnd = useCallback(
    (e) => {
      if (!dragItemRef.current || !canvasContainerRef.current) return;

      const rect = canvasContainerRef.current.getBoundingClientRect();

      const finalPixelX = e.clientX - rect.left - dragOffsetRef.current.x;
      const finalPixelY = e.clientY - rect.top - dragOffsetRef.current.y;

      // Convert to Percentage
      const xPercent = (finalPixelX / rect.width) * 100;
      const yPercent = (finalPixelY / rect.height) * 100;

      console.log(
        `📍 Dropped at: ${xPercent.toFixed(2)}%, ${yPercent.toFixed(2)}%`
      );

      updateQuestionLocation(dragItemRef.current.id, xPercent, yPercent);

      // Cleanup
      document.removeEventListener("mousemove", handleDrag);
      document.removeEventListener("mouseup", handleDragEnd);
      document.body.style.cursor = "";

      // Clear State and Refs
      setDraggedQuestion(null);
      dragItemRef.current = null;
      dragOffsetRef.current = { x: 0, y: 0 };
    },
    [updateQuestionLocation, handleDrag]
  );

  const handleDragStart = useCallback(
    (e, question) => {
      e.preventDefault();
      e.stopPropagation();

      if (!canvasContainerRef.current) return;

      const rect = canvasContainerRef.current.getBoundingClientRect();

      // Calculate start pixels from the percentage stored in the question
      const currentPixelX = (question.x / 100) * rect.width;
      const currentPixelY = (question.y / 100) * rect.height;

      const startX = e.clientX - rect.left;
      const startY = e.clientY - rect.top;

      // Update Refs (Immediate data for listeners)
      dragOffsetRef.current = {
        x: startX - currentPixelX,
        y: startY - currentPixelY,
      };
      dragItemRef.current = { ...question, x: currentPixelX, y: currentPixelY };

      // Update State (Visuals)
      setDraggedQuestion(dragItemRef.current);

      // Attach Global Listeners
      document.addEventListener("mousemove", handleDrag);
      document.addEventListener("mouseup", handleDragEnd);
      document.body.style.cursor = "grabbing";
    },
    [handleDrag, handleDragEnd]
  );

  // --- Check for Blockly pending tasks ---
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

  // --- Placement Logic ---

  const handleCanvasClick = useCallback(
    (e) => {
      const currentSelectedQuestion = selectedQuestion || pendingBlocklyTask;
      if (!currentSelectedQuestion || !canvasContainerRef.current) return;

      const rect = canvasContainerRef.current.getBoundingClientRect();

      let pixelX = e.clientX - rect.left;
      let pixelY = e.clientY - rect.top;

      const markerSize = 40;
      pixelX = pixelX - markerSize / 2;
      pixelY = pixelY - markerSize / 2;

      const xPercent = (pixelX / rect.width) * 100;
      const yPercent = (pixelY / rect.height) * 100;

      dispatch((dispatch, getState) => {
        const currentSelectedQuestions = getState().games.selectedQuestions;
        const updatedQuestions = currentSelectedQuestions.map((field) =>
          field.id === currentSelectedQuestion.id
            ? {
              ...field,
              isSelected: false,
              isPlacedCanvas: true,
              x: xPercent,
              y: yPercent,
              playgroundIndex: playgroundIndex
            }
            : field
        );

        dispatch(setSelectedQuestions(updatedQuestions));
        dispatch(setSelectedQuestion(null));
      });
      setPendingBlocklyTask(null);
    },
    [selectedQuestion, pendingBlocklyTask, dispatch, playgroundIndex]
  );

  // --- Removal Logic ---
  const removePlacedQuestion = useCallback(
    (questionId) => {
      dispatch((dispatch, getState) => {
        const currentSelectedQuestions = getState().games.selectedQuestions;
        const updatedQuestions = currentSelectedQuestions.map((field) => {
          if (field.id === questionId) {
            const { x, y, isPlacedCanvas, isSelected, playgroundIndex, ...rest } = field;
            return rest;
          }
          return field;
        });

        dispatch(setSelectedQuestions(updatedQuestions));
      });
    },
    [dispatch]
  );

  // --- Marker Component ---

  const QuestionMarker = ({ question }) => {
    const [isResizing, setIsResizing] = useState(false);
    const [iconSize, setIconSize] = useState(question.iconSize || 40);
    const resizeStartRef = useRef({ size: 40, mouseX: 0, mouseY: 0 });

    const isDragging = draggedQuestion && draggedQuestion.id === question.id;

    // If dragging, use px. If placed, use %.
    const leftVal = isDragging ? `${draggedQuestion.x}px` : `${question.x}%`;
    const topVal = isDragging ? `${draggedQuestion.y}px` : `${question.y}%`;

    if (question.x === undefined || question.y === undefined) return null;

    const iconUrl =
      getIconUrl(question.icon) ||
      `https://ui-avatars.com/api/?name=${question.name.slice(0, 1)}&bold=true`;

    const pixelRadius = question.locationRadius
      ? Math.max(50, Math.min(200, question.locationRadius / 5))
      : 100;

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

    useEffect(() => {
      if (question.iconSize !== undefined) {
        setIconSize(question.iconSize);
      }
    }, [question.iconSize]);

    return (
      <div
        className="absolute z-20 cursor-grab"
        style={{
          left: leftVal,
          top: topVal,
          // Important: Disable transition while dragging to make it snappy
          transition: isDragging ? "none" : "left 0.1s, top 0.1s",
        }}
        onMouseDown={(e) => handleDragStart(e, question)}
      >
        {/* Radius Circle */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${-pixelRadius + 20}px`,
            top: `${-pixelRadius + 20}px`,
            width: `${pixelRadius * 2}px`,
            height: `${pixelRadius * 2}px`,
            background: colorWithOpacity(question.radiusColor, 0.1),
            border: `2px solid ${question.radiusColor || "#3B82F6"}`,
            opacity: isDragging ? "0.8" : "1",
          }}
        />

        {/* Icon */}
        <div
          className="custom-canvas-marker relative"
          style={{
            width: `${iconSize}px`,
            height: `${iconSize}px`,
            opacity: isDragging ? "0.7" : "1",
          }}
        >
          <img
            src={iconUrl}
            alt={question.iconName}
            draggable={false}
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              border: `3px solid ${question.radiusColor || "var(--color-accent)"
                }`,
              background: "white",
              padding: "2px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              cursor: isDragging ? "grabbing" : "grab",
            }}
          />
          {/* Resize Handle */}
          <div
            onMouseDown={handleResizeStart}
            style={{
              position: 'absolute',
              bottom: '-5px',
              right: '-5px',
              width: '16px',
              height: '16px',
              background: question.radiusColor || '#3B82F6',
              borderRadius: '50%',
              cursor: 'nwse-resize',
              border: '2px solid white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              zIndex: 10,
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Popup */}
        <div className="absolute left-full top-0 ml-2 bg-white p-2 rounded shadow-md w-40 text-xs hidden sm:block z-30">
          <h4 className="font-bold truncate">{question.name}</h4>
          <p className="text-gray-600">
            {isDragging
              ? "Moving..."
              : `Pos: ${parseFloat(question.x).toFixed(1)}%, ${parseFloat(
                question.y
              ).toFixed(1)}%`}
          </p>
        </div>
      </div>
    );
  };

  // --- Main Render ---

  return (
    <div className="flex flex-col h-screen bg-gray-100 relative">
      <div className="flex flex-col flex-1 overflow-hidden p-4 justify-center">
        <h1 className="absolute top-4 left-4">{playgroundName}</h1>
        <div
          ref={canvasContainerRef}
          className="shadow-2xl border-4 border-white inline-block self-center relative"
          onClick={handleCanvasClick}
          style={{
            cursor: selectedQuestion || pendingBlocklyTask ? "crosshair" : "default",
            overflow: "visible",
          }}
        >
          <img
            src={playgroundImage}
            alt="Game Map"
            className="max-w-full max-h-[85vh] block object-contain"
            onDragStart={(e) => e.preventDefault()}
          />

          {placedQuestions.map((question) => (
            <QuestionMarker key={question.id} question={question} />
          ))}
        </div>

        {/* --- Panels --- */}

        {/* Instruction Box */}
        {(selectedQuestion || pendingBlocklyTask) && (
          <div className="absolute top-4 left-4 bg-blue-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm pointer-events-none">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-blue-500 font-bold">!</span>
              </div>
              <div>
                <h3 className="font-semibold">
                  {pendingBlocklyTask ? 'Click to set in playground' : 'Place Question'}
                </h3>
                <p className="text-sm opacity-90">
                  {pendingBlocklyTask
                    ? `Place ${pendingBlocklyTask.name}`
                    : 'Click on the map'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Placed Questions List */}
        {placedQuestions.length > 0 && (
          <div className="absolute top-4 right-4 w-64 bg-white rounded-lg shadow-lg border z-50 max-h-[50vh] flex flex-col">
            <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-semibold text-sm">
                Placed ({placedQuestions.length})
              </h3>
              <button
                onClick={() =>
                  setDisplayPlacedQuestions(!displayPlacedQuestions)
                }
              >
                {displayPlacedQuestions ? (
                  <CrossIcon />
                ) : (
                  <span className="text-xs underline">Show</span>
                )}
              </button>
            </div>
            {displayPlacedQuestions && (
              <div className="overflow-y-auto flex-1 p-2">
                {placedQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="flex justify-between items-center mb-2 border-b pb-2 last:border-0"
                  >
                    <div className="truncate w-32 text-sm">{q.name}</div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removePlacedQuestion(q.id);
                      }}
                      className="text-xs text-red-500 hover:text-red-700 font-bold"
                    >
                      X
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionPlacerCanvas;
