import FormStepperButtons from "./FormStepperButtons";
import { useForm, useFieldArray } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import {
  createComment,
  getComments,
  resetApiStateFromQuestion,
} from "../../../slices/questionSlice";
import { getSessionData } from "../../../utils/sessionStorage";
import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import RichTextEditor from "../../../components/ReactQuill";
import { processDeltaImages } from "../../../services/image-upload";
import { useResetMultipleApiStates } from "../../../hooks/useResetMultipleApiStates";
import CommentsSkeleton from "./CommentsSkeleton";

const defaultValueForComments = {
  hints: {},
  commentsAfterCorrection: {},
  commentsAfterRejection: {},
};

const Comments = ({
  curStep,
  previousStepHandler,
  nextStepHandler,
  completedSteps,
  markStepCompleted,
}) => {
  // Get IDs and Names from session storage
  const sessionIds = getSessionData("currentQuestionIds");
  const singleId = getSessionData("questionId");
  
  // Normalize IDs to an array. Prioritize currentQuestionIds, fallback to single questionId.
  const ids = (Array.isArray(sessionIds) && sessionIds.length > 0) 
    ? sessionIds 
    : (singleId ? [singleId] : []);
    
  const names = getSessionData("currentQuestionNames") || [];

  const form = useForm({
    defaultValues: {
      commentsList: ids.map((id) => ({
        questionId: id,
        ...defaultValueForComments,
      })),
    },
  });
  
  const { handleSubmit, formState, setError, reset, control } = form;
  const { errors } = formState;
  const { fields } = useFieldArray({
    control,
    name: "commentsList",
  });

  const { createCommentApi, getCommentsApi } = useSelector(
    (state) => state.question
  );

  const [imageProcessingLoading, setImageProcessingLoading] = useState(false);
  const isNextClicked = useRef(false);
  const dispatch = useDispatch();

  const onSubmit = async (data) => {
    setImageProcessingLoading(true);
    try {
      const { commentsList } = data;
      
      for (const item of commentsList) {
        const { questionId, hints, commentsAfterCorrection, commentsAfterRejection } = item;
        
        // Skip if invalid questionId
        if (!questionId) continue;

        const pureData = { hints };
        
        const commentsAfterCorrectionProcessing = await processDeltaImages(
          commentsAfterCorrection
        );
        const commentsAfterRejectionProcessing = await processDeltaImages(
          commentsAfterRejection
        );
        
        pureData.commentsAfterCorrection = commentsAfterCorrectionProcessing;
        pureData.commentsAfterRejection = commentsAfterRejectionProcessing;

        // Submit each comment
        await dispatch(createComment({ questionId, data: pureData })).unwrap();
      }
      
      toast.success("Comments saved successfully");
      
      if (isNextClicked.current) {
        nextStepHandler();
        isNextClicked.current = false;
      } else {
        markStepCompleted(curStep);
      }

    } catch (err) {
      console.error("Error submitting comments", err);
      if (err?.message) {
        toast.error(err.message);
      } else {
        toast.error("Failed to save comments");
      }
    } finally {
      setImageProcessingLoading(false);
    }
  };

  // Fetch existing comments for all questions
  useEffect(() => {
    const fetchComments = async () => {
      if (ids.length === 0) return;

      try {
        const fetchedData = await Promise.all(
          ids.map(async (id) => {
            try {
              const result = await dispatch(getComments(id)).unwrap();
              return { id, data: result?.response };
            } catch (error) {
              // If 404 or not found, it's fine, we just start with empty
              return { id, data: null };
            }
          })
        );

        // Map fetched data to form values
        const newCommentsList = ids.map((id) => {
            const found = fetchedData.find(f => f.id === id);
            const data = found?.data;
            return {
                questionId: id,
                hints: data?.hints || {},
                commentsAfterCorrection: data?.commentsAfterCorrection || {},
                commentsAfterRejection: data?.commentsAfterRejection || {},
            };
        });
        
        reset({ commentsList: newCommentsList });

      } catch (err) {
        console.error("Error fetching comments", err);
      }
    };

    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 
  // We run this once on mount. IDs shouldn't change during the step.

  useResetMultipleApiStates([
    { action: resetApiStateFromQuestion, stateName: "createCommentApi" },
    { action: resetApiStateFromQuestion, stateName: "getCommentsApi" },
  ]);

  const handleNextStep = () => {
    isNextClicked.current = true;
  };

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <h3 className="font-semibold mb-2 text-xl">Comments Section</h3>
        <div className="flex flex-col gap-6">
            {fields.map((field, index) => (
                <div key={field.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h4 className="font-medium text-lg mb-4 text-blue-600">
                        {names[index] ? `Task: ${names[index]}` : `Task ${index + 1}`}
                    </h4>
                    <div className="flex flex-col gap-4">
                        <RichTextEditor
                            id={`commentsList.${index}.hints`}
                            name={`commentsList.${index}.hints`}
                            labelName="Hints"
                            control={control}
                            errors={errors}
                        />
                        <RichTextEditor
                            id={`commentsList.${index}.commentsAfterCorrection`}
                            name={`commentsList.${index}.commentsAfterCorrection`}
                            labelName="Comments After Correction"
                            control={control}
                            errors={errors}
                        />
                        <RichTextEditor
                            id={`commentsList.${index}.commentsAfterRejection`}
                            name={`commentsList.${index}.commentsAfterRejection`}
                            labelName="Comments After Rejection"
                            control={control}
                            errors={errors}
                        />
                    </div>
                </div>
            ))}
        </div>

        <FormStepperButtons
          curStep={curStep}
          previousStepHandler={previousStepHandler}
          nextStepHandler={handleNextStep}
          isLoading={imageProcessingLoading}
          completedSteps={completedSteps}
          isHiddenSubmitButton={true}
          nextButtonType="submit"
        />
      </form>
    </div>
  );
};

export default Comments;
