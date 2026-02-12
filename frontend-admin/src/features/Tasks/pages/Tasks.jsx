import Button from "../../../components/Button";
import { cn } from "../../../lib/utils";
import useNavigateTo from "../../../hooks/useNavigateTo";
import { useEffect, useState } from "react";
import {
  getAllQuestions,
  deleteQuestion,
  cloneQuestion,
  resetApiStateFromQuestion,
} from "../../../slices/questionSlice";
import { useDispatch, useSelector } from "react-redux";
import { HeaderType } from "../../../utils/types";
import EditIcon from "../../../components/svgs/EditIcon";
import DeleteIcon from "../../../components/svgs/DeleteIcon";
import TableGrid from "../../../components/table/TableGrid";
import { formatDateToReadable } from "../../../utils/common";
import TooltipWrapper from "../../../components/TooltipWrapper";
import { ROUTES } from "../../../routes/helper";
import { ConfirmationModal } from "../../../components/ConfirmationModal";
import { toast } from "react-hot-toast";
import SearchBox from "../../../components/SearchBox";
import TagMultiSelect from "../../../components/TagMultiSelect";
import DeleteMultipleTask from "../modals/DeleteMultipleTask";
import CloneIcon from "../../../components/svgs/CloneIcon";
import useApiResponseHandler from "../../../hooks/useApiResponseHandler";
import useCooldown from "../../../hooks/useCooldown";
import DisabledWrapper from "../../../components/DisabledWrapper";
import { useResetMultipleApiStates } from "../../../hooks/useResetMultipleApiStates";
import {
  getSessionData,
  setDataInSessionStorage,
} from "../../../utils/sessionStorage";
import { useSearchParams } from "react-router-dom";
import { useRef } from "react";

const Tasks = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const goTo = useNavigateTo();
  const dispatch = useDispatch();
  const { getAllQuestionsApi, cloneQuestionApi } = useSelector(
    (state) => state.question
  );
  const { data, isLoading } = getAllQuestionsApi;
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteQuestionId, setDeleteQuestionId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [saveCooldown, triggerSaveCooldown] = useCooldown(2000);
  const lastParamsRef = useRef("");

  const questions = (data?.response?.docs || []).map((q) => {
    return {
      ...q,
      createdAt: formatDateToReadable(q.createdAt, false, true),
    };
  });

  const totalPages = data?.response?.totalPages || 1;
  const totalRecords = data?.response?.totalDocs || 0;
  const limit = data?.response?.limit || 10;

  const handleEdit = (id) => {
    goTo(`${ROUTES.UPDATE_TASK.replace(":id", id)}`);
  };

  const handleDeleteClick = (id) => {
    setDeleteQuestionId(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteQuestionId) return;
    try {
      await dispatch(deleteQuestion(deleteQuestionId)).unwrap();
      toast.success("Question deleted successfully");
      setShowDeleteConfirm(false);
      setDeleteQuestionId(null);
      const tagIds = selectedTags.map((tag) => tag._id).join(",");
      dispatch(
        getAllQuestions({ page: currentPage, searchTerm, tags: tagIds })
      );
    } catch (error) {
      toast.error(error?.message || "Failed to delete question");
    }
  };

  const handleSearch = (newSearchTerm) => {
    setSearchTerm(newSearchTerm);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleTagsChange = (newTags) => {
    setSelectedTags(newTags);
    setCurrentPage(1); // Reset to first page on tag filter change
  };

  const handleCloneClick = (id) => {
    triggerSaveCooldown();
    dispatch(cloneQuestion(id));
  };

  useResetMultipleApiStates([
    { action: resetApiStateFromQuestion, stateName: "cloneQuestionApi" },
  ]);

  useEffect(() => {
    const initSearch = searchParams.get("search") || "";
    const initTagsCSV = searchParams.get("tags") || "";
    const initPage = Number(searchParams.get("page") || "1");
    if (initSearch || initTagsCSV || initPage !== 1) {
      setSearchTerm(initSearch);
      setCurrentPage(initPage);
      const ids = initTagsCSV ? initTagsCSV.split(",").filter(Boolean) : [];
      const restoredTags = ids.map((id) => ({ _id: id, name: id }));
      setSelectedTags(restoredTags);
      return;
    }
    const saved = getSessionData("tasks_filters");
    if (saved) {
      let parsed = null;
      try {
        parsed = JSON.parse(saved);
      } catch {
        parsed = null;
      }
      if (parsed) {
        setSearchTerm(parsed?.searchTerm || "");
        setCurrentPage(parsed?.currentPage || 1);
        const restoredTags =
          Array.isArray(parsed?.selectedTags) ? parsed.selectedTags : [];
        setSelectedTags(restoredTags);
      }
    }
  }, []);

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
      "tasks_filters",
      JSON.stringify({
        searchTerm,
        selectedTags: simplifiedTags,
        currentPage,
      })
    );
  }, [searchTerm, selectedTags, currentPage, setSearchParams]);

  const columns = [
    { value: "questionName", name: "Task", _class: "col-span-2" },
    {
      value: "tags",
      name: "Tags",
      _class: "col-span-2",
      type: HeaderType.tags,
    },
    {
      value: "points",
      name: "Points",
      _class: "col-span-1",
      type: HeaderType.number,
    },
    {
      value: "icon",
      name: "Icon",
      _class: "col-span-1",
      type: HeaderType.icon,
    },
    {
      value: "radiusColor",
      name: "Radius Color",
      _class: "col-span-2",
      type: HeaderType.color,
    },
    {
      value: "correctAnswers",
      name: "Correct Answers",
      _class: "col-span-1",
      type: HeaderType.array,
    },
    {
      value: "createdAt",
      name: "Created At",
      _class: "col-span-1",
      type: HeaderType.date,
    },
    {
      name: "Actions",
      value: "actions",
      type: HeaderType.dynamicAction,
      actions: [
        {
          label: "Edit",
          icon: (
            <TooltipWrapper
              content={"Edit Question"}
              place="right"
              className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-accent/10 cursor-pointer"
            >
              <EditIcon />
            </TooltipWrapper>
          ),
          onClick: (row) => handleEdit(row._id),
        },
        {
          label: "Delete",
          icon: (
            <TooltipWrapper
              content={"Delete Question"}
              place="right"
              className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-accent/10 cursor-pointer"
            >
              <DeleteIcon />
            </TooltipWrapper>
          ),
          onClick: (row) => handleDeleteClick(row._id),
        },
        {
          label: "Clone",
          icon: (
            <DisabledWrapper where={saveCooldown}>
              <TooltipWrapper
                content={"Clone Task"}
                place="right"
                className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-accent/10 cursor-pointer"
              >
                <CloneIcon />
              </TooltipWrapper>
            </DisabledWrapper>
          ),
          onClick: (row) => handleCloneClick(row._id),
        },
      ],
    },
  ];

  useEffect(() => {
    const tagIds = selectedTags.map((tag) => tag._id).join(",");
    console.log({ tagIds });
    dispatch(getAllQuestions({ page: currentPage, searchTerm, tags: tagIds }));
  }, [dispatch, currentPage, searchTerm, selectedTags]);

  useApiResponseHandler({
    status: cloneQuestionApi.status,
    data: cloneQuestionApi.data,
    error: cloneQuestionApi.error,
    sideAction: () => {
      const tagIds = selectedTags.map((tag) => tag._id).join(",");
      dispatch(
        getAllQuestions({ page: currentPage, searchTerm, tags: tagIds })
      );
    },
  });

  return (
    <div className="common-page flex flex-col gap-4">
      <div
        className={cn(
          "common-page",
          "flex flex-row justify-between items-center"
        )}
      >
        <h1 className="text-2xl font-bold">Task Management</h1>
        <div className="flex gap-4">
          <Button onClick={() => goTo("/tasks/create")}>Create Task</Button>
          <Button onClick={() => setIsDeleteMode((prev) => !prev)}>
            Delete Multiple Task
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="flex flex-col md:flex-row gap-4 w-full">
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

      <TableGrid
        data={questions}
        columns={columns}
        isCompressView={false}
        isLoading={isLoading}
        allowPagination={true}
        currentPage={currentPage}
        totalPages={totalPages}
        totalRecords={totalRecords}
        pageLimit={limit}
        onPageChange={(newPage) => setCurrentPage(newPage)}
      />

      {showDeleteConfirm && (
        <ConfirmationModal
          onClose={() => {
            setShowDeleteConfirm(false);
            setDeleteQuestionId(null);
          }}
          onConfirm={handleDeleteConfirm}
          title="Delete Question"
          content="Are you sure you want to delete this question? This action cannot be undone."
          primaryButtonName="Delete"
        />
      )}
      {isDeleteMode && (
        <DeleteMultipleTask
          questions={questions}
          onClose={() => setIsDeleteMode(false)}
          allowPagination={true}
          currentPage={currentPage}
          totalPages={totalPages}
          totalRecords={totalRecords}
          pageLimit={limit}
          onPageChange={(newPage) => setCurrentPage(newPage)}
        />
      )}
    </div>
  );
};

export default Tasks;
