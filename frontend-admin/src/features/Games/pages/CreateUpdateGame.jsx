import toast from "react-hot-toast";
import Steps from "../../Tasks/components/Steps";
import Configuration from "../components/Configuration";
import { useEffect, useMemo, useState } from "react";
import RulesCondition from "../components/RulesCondition";
import TaskDetails from "../components/TaskDetails";
import useNavigateTo from "../../../hooks/useNavigateTo";
import { useDispatch, useSelector } from "react-redux";
import {
  getGameQuestions,
  resetApiStateFromGames,
  setBlocklyData,
  setSelectedQuestions,
} from "../../../slices/gameSlice";
import { useParams } from "react-router-dom";
import { useResetMultipleApiStates } from "../../../hooks/useResetMultipleApiStates";

const steps = [
  {
    id: 1,
    title: "Configuration",
    path: "configuration",
  },
  {
    id: 2,
    title: "Tasks Details",
    path: "task-details",
  },
  {
    id: 3,
    title: "Rules & Conditions",
    path: "rules-condition",
  },
];

export default function CreateUpdateGame() {
  const dispatch = useDispatch();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const { id } = useParams();
  const { getGameQuestionsApi } = useSelector((state) => state.games);
  // eslint-disable-next-line no-unused-vars
  const { data, isLoading, status, error } = getGameQuestionsApi;

  const getQuestionsData = useMemo(() => {
    return (
      data?.response?.questions?.map((q) => {
        const { _id, questionName, points, tags, icon, iconName, radiusColor } =
          q.question;
        return {
          id: _id,
          name: questionName,
          points,
          tags: tags?.map((t) => t.name) || [],
          index: q.order,
          icon: icon,
          iconName: iconName,
          locationRadius: q.radius,
          radiusColor: radiusColor,
          isSelected: false,
          isPlaced: q.isPlaced || false,
          lng: q.longitude,
          lat: q.latitude,
          isPlacedCanvas: q.isPlacedCanvas || false,
          x: q.x,
          y: q.y,
        };
      }) || []
    );
  }, [data]);

  const getBlocklyXmlRules = useMemo(() => {
    return data?.response?.blocklyXmlRules || null;
  }, [data]);
  const getBlocklyJSONRules = useMemo(() => {
    return data?.response?.blocklyJsonRules || null;
  }, [data]);

  const totalSteps = steps.length;
  const goTo = useNavigateTo();

  const goToNextStep = () => {
    if (currentStep < totalSteps) {
      // Add the current step to completedSteps before moving forward
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
    }
  };

  const goToSpecificStep = (targetStep) => {
    // console.log({ targetStep, currentStep });
    if (targetStep === currentStep) return;
    else if (
      // eslint-disable-next-line no-constant-binary-expression, no-constant-condition
      true ||
      targetStep < currentStep ||
      completedSteps.includes(targetStep - 1)
    ) {
      setCurrentStep(targetStep);
    } else {
      toast.error(
        `Please fill & Submit ${
          steps.find((step) => step.id === currentStep)?.title
        } first.`
      );
    }
  };

  const markStepCompleted = (stepId) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
      if (stepId === totalSteps) {
        // Optionally navigate to success page or games list
        setTimeout(() => {
          goTo("/games");
        }, 2000);
      }
    }
  };

  useEffect(() => {
    if (id) {
      dispatch(getGameQuestions(id));
    }
  }, [id]);

  useEffect(() => {
    if (getQuestionsData && getQuestionsData.length > 0) {
      dispatch(setSelectedQuestions(getQuestionsData));
    }
  }, [getQuestionsData]);

  useEffect(() => {
    if (getBlocklyXmlRules) {
      dispatch(
        setBlocklyData({
          blocksXml: getBlocklyXmlRules,
          blocksJson: getBlocklyJSONRules,
        })
      );
    }
  }, [getBlocklyXmlRules, getBlocklyJSONRules]);

  useResetMultipleApiStates([
    { action: resetApiStateFromGames, stateName: "createGameApi" },
    { action: resetApiStateFromGames, stateName: "updateGameApi" },
    { action: resetApiStateFromGames, stateName: "getGameInfoApi" },
    { action: resetApiStateFromGames, stateName: "getGameInfobyId" },
    { action: resetApiStateFromGames, stateName: "selectedQuestions" },
    { action: resetApiStateFromGames, stateName: "selectedQuestion" },
    { action: resetApiStateFromGames, stateName: "blocklyData" },
  ]);

  return (
    <div className="common-page">
      <h1 className="text-2xl font-bold">Game Management</h1>
      <Steps
        steps={steps}
        curStep={currentStep}
        goToSpecificStep={goToSpecificStep}
      />

      {currentStep === 1 && (
        <Configuration
          previousStepHandler={goToPreviousStep}
          nextStepHandler={goToNextStep}
          completedSteps={completedSteps}
          curStep={currentStep}
          markStepCompleted={markStepCompleted}
        />
      )}
      {currentStep === 2 && (
        <TaskDetails
          previousStepHandler={goToPreviousStep}
          nextStepHandler={goToNextStep}
          completedSteps={completedSteps}
          curStep={currentStep}
          markStepCompleted={markStepCompleted}
        />
      )}
      {currentStep === 3 && (
        <RulesCondition
          previousStepHandler={goToPreviousStep}
          nextStepHandler={goToNextStep}
          completedSteps={completedSteps}
          curStep={currentStep}
          markStepCompleted={markStepCompleted}
        />
      )}
    </div>
  );
}
