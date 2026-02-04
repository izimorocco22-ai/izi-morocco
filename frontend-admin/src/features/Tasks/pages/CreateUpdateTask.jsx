import React, { useEffect, useState } from "react";
import {
  getSessionData,
  removeSessionData,
  setDataInSessionStorage,
} from "../../../utils/sessionStorage";
import Steps from "../components/Steps";
import CreateUpdateQuestion from "../components/CreateUpdateQuestion";
import Comments from "../components/Comments";
import Media from "../components/Media";
import Settings from "../components/Settings";
import toast from "react-hot-toast";

const CreateUpdateTask = () => {
  const [currentStep, setCurrentStep] = useState(
    parseInt(getSessionData("cs") || "1")
  );
  const [completedSteps, setCompletedSteps] = useState(
    JSON.parse(getSessionData("state") || "[]")
  );

  const steps = [
    {
      id: 1,
      title: "Question Details",
    },
    {
      id: 2,
      title: "Comments Details",
    },
    {
      id: 3,
      title: "Media Details",
    },
    // {
    //   id: 4,
    //   title: "Qr Code Details",
    // },
    {
      id: 4,
      title: "Settings",
    },
  ];
  const totalSteps = steps.length;

  const goToNextStep = () => {
    if (currentStep < totalSteps) {
      // Add the current step to completedSteps before moving forward
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      setCurrentStep(currentStep + 1);
      setDataInSessionStorage("cs", (currentStep + 1).toString());
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setDataInSessionStorage("cs", (currentStep - 1).toString());
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
      setDataInSessionStorage("cs", targetStep.toString());
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
        removeSessionData([
          "cs",
          "questionId",
          "currentQuestionIds",
          "currentQuestionNames",
        ]);
      }
    }
  };

  useEffect(() => {
    return () => {
      removeSessionData([
        "cs",
        "questionId",
        "currentQuestionIds",
        "currentQuestionNames",
      ]);
    };
  }, []);

  return (
    <div className="common-page">
      <h1 className="text-2xl font-bold">Task Management</h1>
      <Steps
        steps={steps}
        curStep={currentStep}
        goToSpecificStep={goToSpecificStep}
      />

      {currentStep === 1 && (
        <CreateUpdateQuestion
          previousStepHandler={goToPreviousStep}
          nextStepHandler={goToNextStep}
          completedSteps={completedSteps}
          curStep={currentStep}
          markStepCompleted={markStepCompleted}
        />
      )}
      {currentStep === 2 && (
        <Comments
          previousStepHandler={goToPreviousStep}
          nextStepHandler={goToNextStep}
          completedSteps={completedSteps}
          curStep={currentStep}
          markStepCompleted={markStepCompleted}
        />
      )}
      {currentStep === 3 && (
        <Media
          previousStepHandler={goToPreviousStep}
          nextStepHandler={goToNextStep}
          completedSteps={completedSteps}
          curStep={currentStep}
          markStepCompleted={markStepCompleted}
        />
      )}
      {/* {currentStep === 4 && (
        <QrCode
          previousStepHandler={goToPreviousStep}
          nextStepHandler={goToNextStep}
          completedSteps={completedSteps}
          curStep={currentStep}
          markStepCompleted={markStepCompleted}
        />
      )} */}
      {currentStep === 4 && (
        <Settings
          previousStepHandler={goToPreviousStep}
          completedSteps={completedSteps}
          curStep={currentStep}
          markStepCompleted={markStepCompleted}
        />
      )}
    </div>
  );
};

export default CreateUpdateTask;
