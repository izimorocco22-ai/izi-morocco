import { useSortable } from "@dnd-kit/sortable";
import { useDispatch, useSelector } from "react-redux";
import { useRef, useCallback } from "react";
import {
  setSelectedQuestionFromQuestions,
  setSelectedQuestions,
} from "../../../slices/gameSlice";
import { createSettings } from "../../../slices/questionSlice";
import TooltipWrapper from "../../../components/TooltipWrapper";
import CrossIcon from "../../../components/svgs/CrossIcon";
import TooltipForTags from "../../../components/TooltipForTags";
import CommonInput from "../../../components/form/CommonInput";
import CheckBox from "../../../components/form/Checkbox";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "../../../lib/utils";
import DisabledWrapper from "../../../components/DisabledWrapper";

// Sortable row for each field
export default function SortableField({
  id,
  name,
  points,
  tags,
  index,
  handleRemove,
  locationRadius,
  isSelected,
  isPlaced,
  withSelection,
}) {
  const { selectedQuestions } = useSelector((state) => state.games);
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const dispatch = useDispatch();
  const debounceRef = useRef(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const debouncedUpdateSettings = useCallback((val) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      dispatch(createSettings({ questionId: id, data: { locationRadius: val } }));
    }, 1000);
  }, [dispatch, id]);

  const handleCheckboxChange = (index = -1) => {
    const updatedQuestions = selectedQuestions.map((field) => {
      return {
        ...field,
        isSelected: field.index === index ? true : false,
      };
    });
    dispatch(setSelectedQuestions(updatedQuestions));
    dispatch(setSelectedQuestionFromQuestions());
  };

  const handleRadiusChange = (val) => {
    const updatedQuestions = selectedQuestions.map((field) => {
      if (field.id === id) {
        return {
          ...field,
          locationRadius: val,
        };
      }
      return field;
    });
    dispatch(setSelectedQuestions(updatedQuestions));
    debouncedUpdateSettings(val);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "grid grid-cols-12 bg-white rounded-md border border-accent/50 text-xs lg:text-sm items-center justify-center",
        isPlaced ? "opacity-75" : ""
      )}
    >
      <div
        {...attributes}
        {...(isPlaced ? {} : listeners)}
        className={cn(
          "flex items-center col-span-1 p-2",
          isPlaced ? "cursor-not-allowed" : "cursor-grab"
        )}
      >
        <span className="bg-accent/20 rounded-full flex h-5 w-5 items-center justify-center">
          {index}
        </span>
      </div>

      <div className={cn(withSelection ? "col-span-2" : "col-span-4", "p-2")}>
        {name.length > 15 ? name.slice(0, 15) + "..." : name || "N/A"}
      </div>
      <TooltipForTags data={tags} _class="col-span-2 p-2" />
      <div className="col-span-2 p-2">{points ?? "N/A"}</div>
      <div className="col-span-2 p-2">
        <CommonInput
          type="number"
          isCompress
          value={locationRadius || 0}
          onChange={handleRadiusChange}
        />
      </div>
      {withSelection && (
        <div className="col-span-1 p-2">
          <CheckBox
            handleChecked={() => handleCheckboxChange(index)}
            name={`questions.${index}.isSelected`}
            checked={isSelected}
            disabled={isPlaced}
          />
        </div>
      )}
      {withSelection && (
        <div className="col-span-1 p-2">
          {isPlaced ? (
            <div className="flex justify-center">
              <span className="bg-green-100 text-green-600 rounded-full p-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </div>
          ) : (
            <div className="flex justify-center">
              <span className="bg-gray-100 text-gray-400 rounded-full p-1">
                <div className="h-4 w-4" />
              </span>
            </div>
          )}
        </div>
      )}
      <div
        className="col-span-1 p-2 cursor-pointer flex justify-center"
        onClick={() => handleRemove(id)}
      >
        <CrossIcon className="text-red-500 hover:text-red-700 transition-colors" />
      </div>
    </div>
  );
}
