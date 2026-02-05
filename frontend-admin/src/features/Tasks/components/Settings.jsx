import React, { useEffect, useState, useRef } from "react";
import FormStepperButtons from "./FormStepperButtons";
import { FormProvider, useForm, useFieldArray } from "react-hook-form";
import FileUpload from "../../../components/form/FileUpload";
import CommonInput from "../../../components/form/CommonInput";
import ColorPickerInput from "../../../components/form/AntDesign/ColorPicker";
import { useDispatch, useSelector } from "react-redux";
import { callAPI } from "../../../services/callApi";
import {
  createSettings,
  getSettings,
  resetApiStateFromQuestion,
} from "../../../slices/questionSlice";
import AntSearchableSelector from "../../../components/form/AntDesign/AntSearchableSelector";
import useNavigateTo from "../../../hooks/useNavigateTo";
import { ROUTES } from "../../../routes/helper";
import { getSessionData, removeSessionData } from "../../../utils/sessionStorage";
import { apiResponseType } from "../../../utils/types";
import { MEDIA_URL } from "../../../utils/config";
import toast from "react-hot-toast";
import OptionGroup from "../../../components/form/OptionGroup";
import { extractFilename } from "../helper";
import { useResetMultipleApiStates } from "../../../hooks/useResetMultipleApiStates";
import { useParams } from "react-router-dom";
import SettingsSkeleton from "./SettingsSkeleton";

const timeUnits = [
  { value: "minutes", label: "minutes" },
  { value: "hours", label: "hours" },
];

const radioButtonOptions = [
  {
    label: "Remove when answered correctly/incorrectly.",
    value: "remove_on_answer",
  },
  { label: "Keep until answered correctly.", value: "keep_until_correct" },
  { label: "Keep until the end of the game.", value: "keep_until_end" },
];

const defaultSettingsValue = {
    radiusColor: "rgb(249,87,56)",
    timeLimit: "",
    timeUnit: "minutes",
    iconName: "",
    locationRadius: "",
    behaviorOption: "remove_on_answer",
    questionLogo: null,
};

const Settings = ({
  curStep,
  previousStepHandler,
  nextStepHandler,
  completedSteps,
  markStepCompleted,
  isUpdateMode,
}) => {
  // Get IDs and Names from session storage
  const sessionIdsRaw = getSessionData("currentQuestionIds");
  let sessionIds = [];
  try {
      sessionIds = sessionIdsRaw ? JSON.parse(sessionIdsRaw) : [];
  } catch (e) {
      sessionIds = sessionIdsRaw ? [sessionIdsRaw] : [];
  }

  const singleId = getSessionData("questionId");
  
  // Normalize IDs to an array. Prioritize currentQuestionIds, fallback to single questionId.
  const ids = (Array.isArray(sessionIds) && sessionIds.length > 0) 
    ? sessionIds 
    : (singleId ? [singleId] : []);
    
  const sessionNamesRaw = getSessionData("currentQuestionNames");
  let names = [];
  try {
      names = sessionNamesRaw ? JSON.parse(sessionNamesRaw) : [];
  } catch (e) {
      names = [];
  }

  const form = useForm({
    defaultValues: {
      settingsList: ids.map((id) => ({
        questionId: id,
        ...defaultSettingsValue,
      })),
    },
  });

  const {
    register,
    handleSubmit,
    formState,
    control,
    setError,
    reset,
    watch,
  } = form;
  const { errors } = formState;

  const { fields } = useFieldArray({
    control,
    name: "settingsList",
  });

  const { createSettingsApi, getSettingsApi } = useSelector(
    (state) => state.question
  );

  const [isUploading, setIsUploading] = useState(false);
  const { id } = useParams();
  const dispatch = useDispatch();
  const goTo = useNavigateTo();

  const processAndSubmitSettings = async (settingsData) => {
      const {
        questionId,
        timeLimit,
        timeUnit,
        iconName,
        radiusColor,
        locationRadius,
        questionLogo,
        behaviorOption,
      } = settingsData;

      if (!questionId) return;

      let icon = null;
      if (typeof questionLogo !== "string" && questionLogo) {
          // Upload new logo
          const formData = new FormData();
          formData.append("images", questionLogo);

          const response = await callAPI("/upload", {
            method: "POST",
            data: formData,
            headers: { "Content-Type": "multipart/form-data" },
            suppressError: true,
          });

          if (response.error) {
              throw new Error("Logo upload failed");
          }
          
          const { images = [] } = response?.data?.response || {};
          icon = images[0];
      } else {
          // Use existing logo string
          icon = questionLogo ? extractFilename(questionLogo) : null;
      }

      await dispatch(
        createSettings({
          questionId,
          data: {
            timeLimit: timeLimit || null,
            timeUnit: timeUnit || null,
            iconName: iconName || null,
            radiusColor,
            locationRadius,
            icon,
            behaviorOption,
          },
        })
      ).unwrap();
  };

  const onSubmit = async (data) => {
    setIsUploading(true);
    try {
        const { settingsList } = data;
        
        for (const settingsData of settingsList) {
            await processAndSubmitSettings(settingsData);
        }

        toast.success("All tasks saved successfully");
        
        // Clean up session storage
        removeSessionData([
            "currentQuestionIds",
            "currentQuestionNames",
            "questionId"
        ]);

        markStepCompleted(curStep);
        goTo(ROUTES.TASKS);

    } catch (err) {
        console.error("Error submitting settings", err);
        if (err?.message) {
            toast.error(err.message);
        } else {
            toast.error("Failed to save settings");
        }
    } finally {
        setIsUploading(false);
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
        if (ids.length === 0) return;

        try {
            const fetchedData = await Promise.all(
                ids.map(async (id) => {
                    try {
                        const result = await dispatch(getSettings(id)).unwrap();
                        return { id, data: result?.response };
                    } catch (error) {
                        return { id, data: null };
                    }
                })
            );

            const newSettingsList = ids.map((id) => {
                const found = fetchedData.find(f => f.id === id);
                const response = found?.data;

                if (!response) {
                    return { questionId: id, ...defaultSettingsValue };
                }

                return {
                    questionId: id,
                    timeLimit: response.timeLimit,
                    timeUnit: response.timeUnit,
                    iconName: response.iconName,
                    radiusColor: response.radiusColor,
                    locationRadius: response.locationRadius,
                    questionLogo: response.icon
                        ? (response.icon.startsWith('http')
                            ? response.icon
                            : (response.icon.startsWith('izi_morocco/') ? `https://res.cloudinary.com/dik1l8tqu/image/upload/${response.icon}` : `${MEDIA_URL()}/${response.icon}`))
                        : null,
                    behaviorOption: response.behaviorOption || "remove_on_answer",
                };
            });

            reset({ settingsList: newSettingsList });

        } catch (err) {
            console.error("Error fetching settings", err);
        }
    };

    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useResetMultipleApiStates([
    { action: resetApiStateFromQuestion, stateName: "createSettingsApi" },
    { action: resetApiStateFromQuestion, stateName: "getSettingsApi" },
  ]);

  if (getSettingsApi.isLoading) {
    return <SettingsSkeleton />
  }

  return (
    <div>
      <FormProvider {...form}>
        <form action="" onSubmit={handleSubmit(onSubmit)}>
          <h3 className="font-semibold mb-2 text-xl">Settings Section</h3>
          
          <div className="flex flex-col gap-6">
            {fields.map((field, index) => (
                <div key={field.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    {!isUpdateMode && (
                        <h4 className="font-medium text-lg mb-4 text-blue-600">
                            {names[index] ? `Task: ${names[index]}` : `Task ${index + 1}`}
                        </h4>
                    )}
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-4">
                        <CommonInput
                            placeholder="Eg. 6"
                            labelName="Time Limit"
                            id={`settingsList.${index}.timeLimit`}
                            name={`settingsList.${index}.timeLimit`}
                            register={register}
                            type="number"
                            errors={errors}
                        />
                        <AntSearchableSelector
                            id={`settingsList.${index}.timeUnit`}
                            name={`settingsList.${index}.timeUnit`}
                            labelName="Time Unit"
                            options={timeUnits}
                            control={control}
                            errors={errors}
                        />
                        </div>
                        <FileUpload
                        name={`settingsList.${index}.questionLogo`}
                        labelName={"Question Logo"}
                        type="image"
                        />
                        <CommonInput
                        placeholder="Eg. 50 (in meters)"
                        labelName="Location Radius"
                        id={`settingsList.${index}.locationRadius`}
                        name={`settingsList.${index}.locationRadius`}
                        register={register}
                        type="number"
                        errors={errors}
                        required
                        />
                        <ColorPickerInput
                        name={`settingsList.${index}.radiusColor`}
                        errors={errors}
                        labelName="Radius Background Color"
                        control={control}
                        defaultValue={watch(`settingsList.${index}.radiusColor`)}
                        required
                        />

                        <OptionGroup
                        name={`settingsList.${index}.behaviorOption`}
                        options={radioButtonOptions}
                        register={register}
                        required={true}
                        errors={errors}
                        />
                    </div>
                </div>
            ))}
          </div>

          <FormStepperButtons
            curStep={curStep}
            previousStepHandler={previousStepHandler}
            nextStepHandler={nextStepHandler}
            isLoading={isUploading}
            completedSteps={completedSteps}
            // isDisabledNextButton={!!id} // Removed disabling logic to allow saving
          />
        </form>
      </FormProvider>
    </div>
  );
};

export default Settings;
