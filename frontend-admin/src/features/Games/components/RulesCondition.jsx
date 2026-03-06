import FormStepperButtons from "../../Tasks/components/FormStepperButtons";
import DynamicGrid from "../../../components/DynamicGrid";
import { useDispatch, useSelector } from "react-redux";
import {
  resetApiStateFromGames,
  upsertGameQuestions,
} from "../../../slices/gameSlice.js";
import useApiResponseHandler from "../../../hooks/useApiResponseHandler.js";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";
import { useResetMultipleApiStates } from "../../../hooks/useResetMultipleApiStates.js";
import RuleConditionChildren1 from "./RuleConditionChildren1.jsx";
import RuleConditionChildren2 from "./RuleConditionChildren2.jsx";

const RulesCondition = ({
  curStep,
  previousStepHandler,
  nextStepHandler,
  completedSteps,
  markStepCompleted,
}) => {
  const {
    blocklyData: { blocksJson, blocksXml },
    createGameApi,
    upsertGameQuestionsApi,
    selectedQuestions,
  } = useSelector((state) => state.games);
  const dispatch = useDispatch();
  const { id } = useParams();
  const gameId = createGameApi.data?.response?._id || id;
  const { data, isLoading, status, error } = upsertGameQuestionsApi;

  const finalSubmit = () => {
    const questions = selectedQuestions.map((pq) => {
      return {
        questionId: pq.id,
        latitude: pq.lat,
        longitude: pq.lng,
        radius: pq.locationRadius || 0,
        order: pq.index,
        isPlaced: pq.isPlaced,
        isPlacedCanvas: pq.isPlacedCanvas,
        x: pq.x,
        y: pq.y,
        iconSize: pq.iconSize || 40,
        playgroundIndex: pq.playgroundIndex || 1
      };
    });
    const purePayload = {
      gameId,
      questions,
      blocklyJsonRules: blocksJson,
      blocklyXmlRules: blocksXml,
    };

    if (gameId) {
      // console.log("Payload to submit:", purePayload);
      dispatch(upsertGameQuestions(purePayload));
    } else {
      toast.error("Game ID is missing. Please complete previous steps first.");
    }
  };

  const resetHandler = () => {
    dispatch(resetApiStateFromGames("blocklyData"));
  };

  useApiResponseHandler({
    status,
    data,
    error,
    sideAction: () => markStepCompleted(curStep),
  });

  useResetMultipleApiStates([
    { action: resetApiStateFromGames, stateName: "upsertGameQuestionsApi" },
  ]);

  return (
    <>
      <h3 className="font-semibold mb-2 text-xl">Rules & Condition</h3>
      <DynamicGrid
        children1={<RuleConditionChildren1 />}
        childrend2={<RuleConditionChildren2 />}
      />

      <FormStepperButtons
        curStep={curStep}
        resetFormHandler={resetHandler}
        previousStepHandler={previousStepHandler}
        nextStepHandler={nextStepHandler}
        currentStepHandler={() => finalSubmit()}
        isLoading={isLoading}
        lastStep={3}
        completedSteps={completedSteps}
        isDisabledSubmitButton={selectedQuestions.length === 0 || !gameId}
      />
    </>
  );
};

export default RulesCondition;
