import { useEffect, useState, useRef } from "react";
import AntMultiSelector from "../../../components/form/AntDesign/AntMultiSelector";
import AntSearchableSelector from "../../../components/form/AntDesign/AntSearchableSelector";
import CommonInput from "../../../components/form/CommonInput";
import useApiResponseHandler from "../../../hooks/useApiResponseHandler";
import {
  createQuestion,
  getQuestionById,
  resetApiStateFromQuestion,
  updateQuestion,
} from "../../../slices/questionSlice";
import FormStepperButtons from "./FormStepperButtons";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { cn } from "../../../lib/utils";
import CheckBox from "../../../components/form/Checkbox";
import TooltipWrapper from "../../../components/TooltipWrapper";
import DeleteIcon from "../../../components/svgs/DeleteIcon";
import PlusIcon from "../../../components/svgs/PlusIcon";
import {
  getSessionData,
  setDataInSessionStorage,
} from "../../../utils/sessionStorage";
import { useParams } from "react-router-dom";
import { apiResponseType } from "../../../utils/types";
import toast from "react-hot-toast";
import { ROUTES } from "../../../routes/helper";
import useNavigateTo from "../../../hooks/useNavigateTo";
import RichTextEditor from "../../../components/ReactQuill";
import { processDeltaImages } from "../../../services/image-upload";
import { getTags } from "../../../slices/tagSlice";
import CreateUpdateTagModal from "../../Tag/modals/CreateUpdateTagModal";
import { getPuzzles } from "../../../slices/PuzzlesSlice";
import Button from "../../../components/Button";
import CreateUpdatePuzzlesModal from "../../Puzzles/components/CreateUpdatePuzzles";
import { useResetMultipleApiStates } from "../../../hooks/useResetMultipleApiStates";
import CreateUpdateQuestionSkeleton from "./CreateUpdateQuestionSkeleton";

const defaultValueForQuestion = {
  questionName: "",
  questionDescription: "",
  answerType: "text",
  correctAnswers: [],
  options: [{ text: "", isCorrect: false }],
  tags: [],
  points: 0,
  puzzle: "",
};

const answerTypes = [
  {
    value: "number",
    label: "Number",
  },
  {
    value: "text",
    label: "Text",
  },
  {
    value: "mcq",
    label: "Multiple With Single Answer",
  },
  {
    value: "multiple",
    label: "MCQ With Multiple Answers",
  },
  {
    value: "no_answer",
    label: "No Answer",
  },
  {
    value: "puzzle",
    label: "Puzzle",
  },
];

const SingleQuestionForm = ({
  index,
  control,
  register,
  errors,
  setValue,
  getValues,
  tagsOptions,
  puzzlesOptions,
  setOpenTagModal,
  setOpenPuzzleModal,
  remove,
  isSingle,
  getPuzzlesApi,
}) => {
  const answerType = useWatch({
    control,
    name: `questions.${index}.answerType`,
  });

  const options = useWatch({
    control,
    name: `questions.${index}.options`,
  });

  const { fields, append, remove: removeOption, update } = useFieldArray({
    control,
    name: `questions.${index}.options`,
  });

  const handleCheckboxChange = (optionIndex = -1) => {
    const currentFieldValue = getValues(`questions.${index}.options`)[optionIndex];
    if (answerType === "mcq") {
      //create all fields to false and then set current to true
      fields.forEach((field, idx) => {
        if (idx !== optionIndex && field.isCorrect) {
          update(idx, { ...field, isCorrect: false });
        }
      });
    }
    update(optionIndex, {
      ...currentFieldValue,
      isCorrect: !currentFieldValue?.isCorrect,
    });
  };

  useEffect(() => {
    if (answerType === "no_answer" || answerType === "puzzle") {
      setValue(`questions.${index}.correctAnswers`, []);
    } else if (answerType === "mcq" || answerType === "multiple") {
      setValue(
        `questions.${index}.correctAnswers`,
        options?.filter((op) => op.isCorrect)?.map((op) => op.text) || []
      );
    }
  }, [answerType, options, setValue, index]);

  useEffect(() => {
    if (
      options?.length === 0 &&
      (answerType === "mcq" || answerType === "multiple")
    ) {
      setValue(`questions.${index}.options`, [{ text: "", isCorrect: false }]);
    }
  }, [answerType, options?.length, setValue, index]);

  return (
    <div className="border border-accent/20 rounded-lg p-4 bg-white shadow-sm relative">
      {!isSingle && (
        <div className="absolute top-2 right-2">
           <TooltipWrapper
              place="left"
              content="Remove Question"
              className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-red-50 cursor-pointer text-red-500"
            >
              <span onClick={() => remove(index)}>
                <DeleteIcon variant="current" />
              </span>
            </TooltipWrapper>
        </div>
      )}
      <div className="flex flex-col gap-4">
        <CommonInput
          labelName="Task Name"
          id={`questions.${index}.questionName`}
          type="text"
          name={`questions.${index}.questionName`}
          register={register}
          errors={errors}
        />
        <RichTextEditor
          name={`questions.${index}.questionDescription`}
          labelName="Task Description"
          control={control}
          errors={errors}
          toolbar="full"
          required
        />
        <AntSearchableSelector
          id={`questions.${index}.answerType`}
          name={`questions.${index}.answerType`}
          labelName="Answer Type"
          options={answerTypes}
          control={control}
          errors={errors}
          required
        />
        {(answerType === "mcq" || answerType === "multiple") && (
          <div className="border border-accent/25 rounded-lg p-4 flex flex-col gap-1">
            {errors?.questions?.[index]?.options?.message && (
              <p className="text-red-600 text-sm mb-2">
                {errors.questions[index].options.message}
              </p>
            )}
            {fields.map((field, optionIndex) => (
              <div
                key={field.id}
                className={cn("relative flex w-full items-center gap-4")}
              >
                <CommonInput
                  labelName="Question Option"
                  id={`questions.${index}.options.${optionIndex}.text`}
                  name={`questions.${index}.options.${optionIndex}.text`}
                  register={register}
                  errors={errors}
                  required
                />
                <CheckBox
                  labelName="Is Correct"
                  handleChecked={() => handleCheckboxChange(optionIndex)}
                  name={`questions.${index}.options.${optionIndex}.isCorrect`}
                  checked={!!getValues(`questions.${index}.options`)?.[optionIndex]?.isCorrect}
                />
                <div className="flex w-full gap-4">
                  <TooltipWrapper
                    content={"Add Option"}
                    place="right"
                    className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-accent/10 cursor-pointer"
                  >
                    <span
                      onClick={() => {
                        append({
                          isCorrect: false,
                          text: "",
                        });
                      }}
                      className="rounded-full h-10 w-10"
                    >
                      <PlusIcon variant="dark" />
                    </span>
                  </TooltipWrapper>

                  {/* Remove button - Only show if more than one option */}
                  {fields.length > 1 && (
                    <TooltipWrapper
                      place="right"
                      content="Remove Option"
                      className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-accent/10 cursor-pointer"
                    >
                      <span
                        onClick={() => removeOption(optionIndex)}
                        className="rounded-full h-10 w-10"
                      >
                        <DeleteIcon variant="dark" />
                      </span>
                    </TooltipWrapper>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {["number", "text"].includes(answerType) && (
          <CommonInput
            labelName="Correct Answer"
            id={`questions.${index}.correctAnswers`}
            name={`questions.${index}.correctAnswers`}
            register={register}
            errors={errors}
            required
          />
        )}
        {answerType === "puzzle" && (
          <div className="flex items-end gap-3">
            <AntSearchableSelector
              id={`questions.${index}.puzzle`}
              name={`questions.${index}.puzzle`}
              labelName="Select Puzzle"
              options={puzzlesOptions}
              control={control}
              errors={errors}
              required
              message={
                getPuzzlesApi?.status === "success"
                  ? "No puzzles available"
                  : "Loading puzzles..."
              }
            />
            <Button
              type="button"
              onClick={() => setOpenPuzzleModal(true)}
              className="h-10 min-w-max"
            >
              Add New Puzzles
            </Button>
          </div>
        )}

        <div className="flex w-full items-end justify-center h-full gap-4 cursor-pointer">
          <AntMultiSelector
            id={`questions.${index}.tags`}
            name={`questions.${index}.tags`}
            labelName="Select Tags"
            options={tagsOptions}
            control={control}
            errors={errors}
          />
          <Button
            type="button"
            className="h-10 min-w-max"
            onClick={() => setOpenTagModal((prev) => !prev)}
          >
            Add New Tags
          </Button>
        </div>

        <CommonInput
          labelName="Points"
          id={`questions.${index}.points`}
          name={`questions.${index}.points`}
          register={register}
          type="number"
          errors={errors}
          required
        />
      </div>
    </div>
  );
};

const CreateUpdateQuestion = ({
  curStep,
  previousStepHandler,
  nextStepHandler,
  completedSteps,
  markStepCompleted,
}) => {
  const form = useForm({
    // resolver: zodResolver(basicDetailsSchema),
    defaultValues: { questions: [defaultValueForQuestion] },
  });
  const { id } = useParams();
  const getQuestionId = id || getSessionData("questionId");
  const goTo = useNavigateTo();
  const isNextClicked = useRef(false);

  const {
    register,
    handleSubmit,
    formState,
    control,
    setError,
    getValues,
    watch,
    reset,
    setValue,

  } = form;
  const { errors, isDirty } = formState;
  
  const { fields: questionFields, append: appendQuestion, remove: removeQuestion } = useFieldArray({
    control,
    name: "questions",
  });

  const dispatch = useDispatch();
  const { createQuestionApi, getQuestionByIdApi, updateQuestionApi } =
    useSelector((state) => state.question);
  const { getTagsApi } = useSelector((state) => state.tag);
  const { getPuzzlesApi } = useSelector((state) => state.puzzles);
  const { data, isLoading, error, status } = createQuestionApi;
  const questionId = createQuestionApi?.data?.response?._id;
  const [imageProcessingLoading, setImageProcessingLoading] = useState(false);
  const [openTagModal, setOpenTagModal] = useState(false);
  const [openPuzzleModal, setOpenPuzzleModal] = useState(false);

  window.addEventListener('beforeunload', (e) => {
    if (isDirty) {
      e.preventDefault();
      e.returnValue = ''; // Required for most browsers
    }
  });

  const tagsOptions =
    getTagsApi?.data?.response?.docs?.map((tag) => ({
      value: tag._id,
      label: tag.name,
    })) || [];

  const puzzlesDocs =
    getPuzzlesApi?.data?.response?.docs ||
    getPuzzlesApi?.data?.docs ||
    getPuzzlesApi?.data?.response ||
    [];

  const puzzlesOptions =
    (Array.isArray(puzzlesDocs) ? puzzlesDocs : []).map((puzzle) => ({
      value: puzzle._id,
      label: `${puzzle.name} - ${puzzle.url}`,
    })) || [];

  const onSubmit = async (data) => {
    setImageProcessingLoading(true);
    
    // Helper to process a single question
    const processQuestion = async (qData) => {
        const {
            questionName,
            questionDescription,
            answerType,
            correctAnswers,
            tags,
            points,
            options,
            puzzle,
        } = qData;
        
        const pureData = { answerType, tags, points };
        if (answerType === "mcq" || answerType === "multiple") {
            pureData.options = options;
        }
        if (answerType === "puzzle") {
            pureData.puzzle = puzzle;
        }
        
        if (Array.isArray(correctAnswers)) {
            pureData.correctAnswers = correctAnswers;
        } else {
            pureData.correctAnswers = [correctAnswers];
        }

        // Process images in the rich text description (questionDescription)
        const processedDescription = await processDeltaImages(questionDescription);
        // keep title as plain text
        pureData.questionName = questionName;
        pureData.questionDescription = processedDescription;
        return pureData;
    };

    try {
        const questionsToSubmit = data.questions;
        let createdIds = [];

        if (getQuestionId) {
             // Update mode - only 1 question
             const pureData = await processQuestion(questionsToSubmit[0]);
             await dispatch(updateQuestion({
                id: getQuestionId,
                data: pureData,
             })).unwrap();
             createdIds.push(getQuestionId);
             toast.success("Question updated successfully");
             // Update session storage for consistency
             setDataInSessionStorage("currentQuestionIds", JSON.stringify(createdIds));
             
             if (isNextClicked.current) {
                nextStepHandler();
                isNextClicked.current = false;
             } else {
                markStepCompleted(curStep);
             }

        } else {
            // Create mode - handle multiple (or single)
            for (const q of questionsToSubmit) {
                const pureData = await processQuestion(q);
                const result = await dispatch(createQuestion(pureData)).unwrap();
                 // Assuming result structure matches createQuestionApi.data
                 // If the slice returns response.data directly:
                 const newId = result?.response?._id || result?._id; 
                 if (newId) {
                     createdIds.push(newId);
                 }
             }
             
             if (createdIds.length > 0) {
                 setDataInSessionStorage("currentQuestionIds", JSON.stringify(createdIds));
                 // Store names for UX in next steps
                 const names = questionsToSubmit.map(q => q.questionName);
                 setDataInSessionStorage("currentQuestionNames", JSON.stringify(names));
                 
                 toast.success(`${createdIds.length} questions created successfully`);
                
                // Navigate to next step
                if (isNextClicked.current) {
                    nextStepHandler();
                    isNextClicked.current = false;
                } else {
                    markStepCompleted(curStep);
                }
            }
        }
    } catch (err) {
        console.error("Error submitting questions", err);
        // toast is handled by api response handler for the individual failures usually, 
        // but since we used unwrap() for bulk, we might need to handle it here if it's not a standard api error
        if (err?.message) {
             toast.error(err.message);
        }
    } finally {
        setImageProcessingLoading(false);
    }
  };


  useApiResponseHandler({
    status,
    data,
    error,
    setFormError: setError,
    sideAction: () => {
      // This is called when createQuestionApi updates.
      // If we did bulk create via loop with unwrap, we handled success there.
      // But for single create, we rely on this.
      // If we have multiple questions, we should check if we are in the loop.
      // Actually, if we use unwrap() in the loop, this hook will still trigger for each dispatch.
      
      const isBulk = questionFields.length > 1;
      
      if (!isBulk) {
          if (isNextClicked.current) {
            nextStepHandler();
            isNextClicked.current = false;
          } else {
            markStepCompleted(curStep);
          }
      }
    },
  });

  useApiResponseHandler({
    status: updateQuestionApi.status,
    data: updateQuestionApi.data,
    error: updateQuestionApi.error,
    setFormError: setError,
    sideAction: () => {
      if (isNextClicked.current) {
        nextStepHandler();
        isNextClicked.current = false;
      } else {
        markStepCompleted(curStep);
      }
    },
  });

  useEffect(() => {
    if (questionId) {
      setDataInSessionStorage("questionId", questionId);
    }
  }, [questionId]);

  useEffect(() => {
    if (getQuestionId) {
      dispatch(getQuestionById(getQuestionId));
    }
  }, [getQuestionId]);

  useEffect(() => {
    if (getQuestionByIdApi.status === apiResponseType.success) {
      const response = getQuestionByIdApi.data?.response;
      setDataInSessionStorage("questionId", response?._id);
      reset({
        questions: [{
            questionName: response?.questionName,
            questionDescription: response?.questionDescription || "",
            answerType: response?.answerType,
            correctAnswers: response?.correctAnswers[0],
            tags: response?.tags?.map((tag) => tag._id) || [],
            points: response?.points,
            options: response?.options?.map((op) => ({
            text: op.text,
            isCorrect: op.isCorrect,
            })),
            // response.puzzle may be populated object or ObjectId — prefer _id if present
            puzzle: response?.puzzle?._id || response?.puzzle || "",
        }]
      });
    } else if (getQuestionByIdApi.status === apiResponseType.failed) {
      getQuestionByIdApi.error?.forEach((error) => {
        if (error.location === "params") {
          toast.error(error.msg);
        }
      });
      goTo(ROUTES.TASKS);
    }
  }, [getQuestionByIdApi.status]);

  useEffect(() => {
    dispatch(getTags());
    dispatch(getPuzzles());
    return () => {
      reset({ questions: [defaultValueForQuestion] });
    };
  }, []);

  useResetMultipleApiStates([
    { action: resetApiStateFromQuestion, stateName: "createQuestionApi" },
    { action: resetApiStateFromQuestion, stateName: "updateQuestionApi" },
    { action: resetApiStateFromQuestion, stateName: "getQuestionByIdApi" },
  ]);

  if (getQuestionByIdApi.isLoading) {
    return <CreateUpdateQuestionSkeleton />
  }

  const handleNextStep = () => {
    isNextClicked.current = true;
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <h3 className="font-semibold mb-2 text-xl">
          {getQuestionId ? "Update Question" : "Create Question"}
        </h3>
        <div className="p-4 flex flex-col gap-6">
          {questionFields.map((field, index) => (
             <SingleQuestionForm
                key={field.id}
                index={index}
                control={control}
                register={register}
                errors={errors}
                setValue={setValue}
                getValues={getValues}
                tagsOptions={tagsOptions}
                puzzlesOptions={puzzlesOptions}
                setOpenTagModal={setOpenTagModal}
                setOpenPuzzleModal={setOpenPuzzleModal}
                remove={removeQuestion}
                isSingle={questionFields.length === 1}
                getPuzzlesApi={getPuzzlesApi}
             />
          ))}

          {!getQuestionId && (
            <Button
                type="button"
                onClick={() => appendQuestion(defaultValueForQuestion)}
                className="self-center w-full md:w-auto"
                variant="outline"
            >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Another Question
            </Button>
          )}

        </div>
        <FormStepperButtons
          curStep={curStep}
          resetFormHandler={reset}
          previousStepHandler={previousStepHandler}
          nextStepHandler={handleNextStep}
          isLoading={isLoading || imageProcessingLoading}
          completedSteps={completedSteps}
          isHiddenSubmitButton={true}
          nextButtonType="submit"
          // isDisabledNextButton={!!id || (!!getQuestionId)}
        />
      </form>
      {openTagModal && (
        <CreateUpdateTagModal onClose={() => setOpenTagModal(false)} />
      )}
      {openPuzzleModal && (
        <CreateUpdatePuzzlesModal
          open={openPuzzleModal}
          onClose={() => setOpenPuzzleModal(false)}
          onSuccess={() => {
            // refresh puzzles list after successful create/update
            dispatch(getPuzzles());
          }}
        />
      )}
    </>
  );
};

export default CreateUpdateQuestion;
