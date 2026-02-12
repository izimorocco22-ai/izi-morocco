import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { formatDateToReadable } from "../../../utils/common";
import { getAllQuestions } from "../../../slices/questionSlice";
import { HeaderType } from "../../../utils/types";
import TableGrid from "../../../components/table/TableGrid";
import TooltipWrapper from "../../../components/TooltipWrapper";
import ArrowIcon from "../../../components/svgs/ArrowIcon";
import toast from "react-hot-toast";
import FormStepperButtons from "../../Tasks/components/FormStepperButtons";
import SearchBox from "../../../components/SearchBox";
import TagMultiSelect from "../../../components/TagMultiSelect";
import {
  resetApiStateFromGames,
  setSelectedQuestions,
} from "../../../slices/gameSlice";
import SelectedQuestions from "./SelectedQuestions.jsx";
import { useResetMultipleApiStates } from "../../../hooks/useResetMultipleApiStates.js";
import { useParams, useSearchParams } from "react-router-dom";
import { getSessionData, setDataInSessionStorage } from "../../../utils/sessionStorage";

const TaskDetails = ({
  curStep,
  previousStepHandler,
  nextStepHandler,
  completedSteps,
  markStepCompleted,
}) => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { getAllQuestionsApi } = useSelector((state) => state.question);
  const { data, isLoading } = getAllQuestionsApi;

  // Initialize state from URL or SessionStorage
  const [currentPage, setCurrentPage] = useState(() => {
    const fromUrl = searchParams.get("page");
    if (fromUrl) return Number(fromUrl) || 1;
    const saved = getSessionData("game_task_filters");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed?.currentPage || 1;
      } catch {
        return 1;
      }
    }
    return 1;
  });

  const [searchTerm, setSearchTerm] = useState(() => {
    const fromUrl = searchParams.get("search");
    if (fromUrl) return fromUrl;
    const saved = getSessionData("game_task_filters");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed?.searchTerm || "";
      } catch {
        return "";
      }
    }
    return "";
  });

  const [selectedTags, setSelectedTags] = useState(() => {
    const fromUrl = searchParams.get("tags");
    if (fromUrl) {
      const ids = fromUrl.split(",").filter(Boolean);
      return ids.map((id) => ({ _id: id, name: id }));
    }
    const saved = getSessionData("game_task_filters");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed?.selectedTags) ? parsed.selectedTags : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const { selectedQuestions } = useSelector((state) => state.games);
  const { id } = useParams();
  const lastParamsRef = useRef("");

  const questions = (data?.response?.docs || []).map((q) => {
    return {  
      ...q,
      tags: q.tags?.map((t) => t.name) || [],
      createdAt: formatDateToReadable(q.createdAt, false, true),
    };
  });

  // console.log({ questions });

  const totalPages = data?.response?.totalPages || 1;
  const totalRecords = data?.response?.totalDocs || 0;
  const limit = data?.response?.limit || 10;

  const handleSelect = (question) => {
    // console.log("I am handle select for this question", question);
    if (selectedQuestions.find((q) => q.id === question._id)) {
      toast.error("Task already selected");
      return;
    }

    const pureQuestion = {
      name: question.questionName,
      id: question._id,
      points: question.points,
      tags: question.tags,
      index: selectedQuestions.length + 1,
      icon: question?.icon,
      iconName: question?.iconName,
      locationRadius: question?.locationRadius,
      radiusColor: question?.radiusColor,
      isSelected: false,
    };
    dispatch(setSelectedQuestions([...selectedQuestions, pureQuestion]));
  };

  // console.log({ selectedQuestions });

  const handleSearch = (newSearchTerm) => {
    setSearchTerm(newSearchTerm);
    setCurrentPage(1);
  };

  const handleTagsChange = (newTags) => {
    setSelectedTags(newTags);
    setCurrentPage(1);
  };

  const columns = [
    { value: "questionName", name: "Question", _class: "col-span-4" },
    {
      value: "tags",
      name: "Tags",
      _class: "col-span-2",
      type: HeaderType.tooltip,
    },
    { value: "points", name: "Points" },
    { value: "answerType", name: "Ans Type", _class: "col-span-2" },
    { value: "createdAt", name: "Created At", _class: "col-span-2" },
    {
      name: "Actions",
      value: "actions",
      type: HeaderType.dynamicAction,
      actions: [
        {
          label: "Select",
          icon: (
            <TooltipWrapper
              content={"Selct Task"}
              place="right"
              className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-accent/10 cursor-pointer"
            >
              <ArrowIcon variant="dark" className="cursor-pointer" />
            </TooltipWrapper>
          ),
          onClick: (question) => handleSelect(question),
          _class: "flex w-full justify-center",
        },
      ],
    },
  ];

  useEffect(() => {
    const simplifiedTags = selectedTags.map((t) => ({
      _id: t?._id,
      name: t?.name,
    }));
    const tagIds = simplifiedTags.map((t) => t._id).filter(Boolean).join(",");
    const nextParams = {};
    nextParams.page = String(currentPage || 1);
    if (searchTerm) nextParams.search = searchTerm;
    if (tagIds) nextParams.tags = tagIds;
    const nextParamsStr = JSON.stringify(nextParams);

    if (lastParamsRef.current !== nextParamsStr) {
      setSearchParams(nextParams, { replace: true });
      lastParamsRef.current = nextParamsStr;
    }

    setDataInSessionStorage(
      "game_task_filters",
      JSON.stringify({
        searchTerm,
        selectedTags: simplifiedTags,
        currentPage,
      })
    );
  }, [searchTerm, selectedTags, currentPage, setSearchParams]);

  useEffect(() => {
    const tagIds = selectedTags.map((tag) => tag._id).join(",");
    dispatch(getAllQuestions({ page: currentPage, searchTerm, tags: tagIds }));
  }, [dispatch, currentPage, searchTerm, selectedTags]);

  useResetMultipleApiStates([
    { action: resetApiStateFromGames, stateName: "getGameQuestionsApi" },
  ]);

  return (
    <>
      <h3 className="font-semibold mb-2 text-xl">Task Details</h3>

      {/* Filters Section */}
      <div className="flex flex-col md:flex-row gap-4 w-full mb-4">
        {/* Search Box */}
        <div className="w-full md:w-1/2">
          <SearchBox
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search tasks..."
            debounceMs={500}
          />
        </div>

        {/* Tag Multi-Select */}
        <div className="w-full md:w-1/2">
          <TagMultiSelect
            selectedTags={selectedTags}
            onChange={handleTagsChange}
            placeholder="Filter by tags..."
          />
        </div>
      </div>

      <div className="w-full h-full grid grid-cols-5 gap-2">
        {/* all Tasks list */}
        <div className="col-span-3 rounded-lg">
          {/* <DisabledWrapper where={selectedQuestions.length >= 10}> */}
          <TableGrid
            data={questions}
            columns={columns}
            isCompressView
            isLoading={isLoading}
            allowPagination={true}
            currentPage={currentPage}
            totalPages={totalPages}
            totalRecords={totalRecords}
            pageLimit={limit}
            onPageChange={(newPage) => setCurrentPage(newPage)}
          />
          {/* </DisabledWrapper> */}
        </div>
        {/* selected Tasks list */}
        <div className="col-span-2 rounded-lg">
          <SelectedQuestions />
        </div>
      </div>
      <FormStepperButtons
        curStep={curStep}
        resetFormHandler={() => dispatch(setSelectedQuestions([]))}
        previousStepHandler={previousStepHandler}
        nextStepHandler={nextStepHandler}
        currentStepHandler={() => markStepCompleted(curStep)}
        isHiddenSubmitButton
        isDisabledNextButton={selectedQuestions.length === 0}
        isLoading={isLoading}
        lastStep={3}
        completedSteps={completedSteps}
      />
    </>
  );
};

export default TaskDetails;
