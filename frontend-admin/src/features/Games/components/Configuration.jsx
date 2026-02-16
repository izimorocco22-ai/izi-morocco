import React, { useMemo } from "react";
import CommonInput from "../../../components/form/CommonInput";
import AntSearchableSelector from "../../../components/form/AntDesign/AntSearchableSelector";
import AntMultiSelector from "../../../components/form/AntDesign/AntMultiSelector";
import OptionGroup from "../../../components/form/OptionGroup";
import RichTextEditor from "../../../components/ReactQuill";
import { FormProvider, useForm, useFieldArray } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState, useRef } from "react";
import { processDeltaImages } from "../../../services/image-upload";
import CreateUpdateTagModal from "../../Tag/modals/CreateUpdateTagModal";
import { getTags } from "../../../slices/tagSlice";
import {
  createGame,
  getGameInfobyId,
  updateGame,
} from "../../../slices/gameSlice";
import TagIcon from "../../../components/svgs/TagIcon";
import Button from "../../../components/Button";
import PlusIcon from "../../../components/svgs/PlusIcon";
import DeleteIcon from "../../../components/svgs/DeleteIcon";
import AntDatePicker from "../../../components/form/AntDesign/AntDatePicker";
import LabeledOptionGroup from "../../../components/LabeledOptionGroup";
import FormStepperButtons from "../../Tasks/components/FormStepperButtons";
import useApiResponseHandler from "../../../hooks/useApiResponseHandler";
import { useParams } from "react-router-dom";
import FileUpload from "../../../components/form/FileUpload";
import { callAPI } from "../../../services/callApi";
import { MEDIA_URL } from "../../../utils/config";
import { formatDate } from "../../../utils/dateAndTime";
import ConfigurationSkeleton from "./ConfigurationSkeleton";
import { getCleanImageUrl } from "../../../utils/common";

const radioButtonOptions = [
  {
    label: "Active",
    value: "active",
  },
  { label: "Inactive", value: "inactive" },
];

const defaultValues = {
  title: "",
  introMessage: {},
  finishMessage: {},
  language: "english",
  status: "active",
  username: "",
  password: "",
  timeLimit: "no_time_limit",
  duration: {
    value: "",
    unit: "minutes",
  },
  endTime: null,
  tags: [],
  thumbnail: null,
  backGroundImage: null,
  playgrounds: [],
};

function Configuration({
  curStep,
  previousStepHandler,
  nextStepHandler,
  completedSteps,
  markStepCompleted,
}) {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { getTagsApi } = useSelector((state) => state.tag);
  const { createGameApi, getGameInfobyIdApi, updateGameApi } = useSelector(
    (state) => state.games
  );
  const { data, isLoading, error, status } = createGameApi;
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [imageProcessingLoading, setImageProcessingLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const isNextClicked = useRef(false);
  const gameData = getGameInfobyIdApi?.data?.response;

  const tags = useMemo(() => {
    return getTagsApi?.data?.response?.docs || getTagsApi?.data || [];
  }, [getTagsApi]);

  // React Hook Form setup
  const form = useForm({ defaultValues });
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    setError,
    reset,
    formState: { errors },
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "playgrounds",
  });

  // Watch form values
  const watchedValues = watch();

  const handleRichTextChange = (field, delta) => {
    // Store raw delta content without processing images
    // Images will be processed only during form submission
    setValue(field, delta);
  };

  const handleTagModalClose = () => {
    setIsTagModalOpen(false);
    dispatch(getTags());
  };

  // Prepare tag options for AntSearchableSelector
  const tagOptions = useMemo(() => {
    if (!tags || !Array.isArray(tags)) {
      return [];
    }
    return tags.map((tag) => ({
      value: tag._id,
      label: tag.name,
    }));
  }, [tags]);

  const onSubmit = async (data) => {
    console.log("form submitted", data);
    const {
      title,
      introMessage,
      finishMessage,
      language,
      status,
      timeLimit,
      duration,
      endTime,
      tags,
      thumbnail,
      backGroundImage,
      playgrounds,
    } = data;

    setImageProcessingLoading(true);
    const processedIntroMessage = await processDeltaImages(introMessage);
    const processedFinishMessage = await processDeltaImages(finishMessage);
    setImageProcessingLoading(false);

    const extractFilename = (url) => {
      if (typeof url !== "string") return url;
      if (!url.includes("/")) return url;

      // Handle Cloudinary URLs
      if (url.includes("cloudinary.com")) {
        return url;
      }

      // Handle MEDIA_URL prefixed paths
      if (url.includes(MEDIA_URL())) {
        return url.replace(MEDIA_URL(), "").replace(/^\//, "");
      }

      return url;
    };

    // Handle image uploads
    let thumbnailFilename = null;
    let backGroundImageFilename = null;

    const filesToUpload = [];
    if (thumbnail instanceof File) {
      filesToUpload.push({ file: thumbnail, type: "thumbnail" });
    } else if (typeof thumbnail === "string") {
      thumbnailFilename = extractFilename(thumbnail);
    }

    if (backGroundImage instanceof File) {
      filesToUpload.push({ file: backGroundImage, type: "backGroundImage" });
    } else if (typeof backGroundImage === "string") {
      backGroundImageFilename = extractFilename(backGroundImage);
    }

    const processedPlaygrounds = [];
    if (playgrounds && Array.isArray(playgrounds)) {
      playgrounds.forEach((pg, index) => {
        let pgImage = pg.image;
        let pgImageFilename = null;

        if (pgImage instanceof File) {
          filesToUpload.push({ file: pgImage, type: `playground_${index}` });
        } else if (typeof pgImage === "string") {
          pgImageFilename = extractFilename(pgImage);
        }

        processedPlaygrounds.push({
          name: pg.name,
          image: pgImageFilename, // Placeholder if file, actual if string
        });
      });
    }

    // Upload new files if any
    if (filesToUpload.length > 0) {
      const formData = new FormData();
      filesToUpload.forEach(({ file }) => {
        formData.append("images", file);
      });

      setIsUploading(true);
      const response = await callAPI("/upload", {
        method: "POST",
        data: formData,
        headers: { "Content-Type": "multipart/form-data" },
        suppressError: true,
      });
      setIsUploading(false);

      if (!response.error && response?.data?.response) {
        const uploadedImages = response.data.response.images || [];
        let uploadIndex = 0;

        filesToUpload.forEach(({ type }) => {
          if (type === "thumbnail" && uploadedImages[uploadIndex]) {
            thumbnailFilename = uploadedImages[uploadIndex];
          } else if (
            type === "backGroundImage" &&
            uploadedImages[uploadIndex]
          ) {
            backGroundImageFilename = uploadedImages[uploadIndex];
          } else if (type.startsWith("playground_")) {
            const pgIndex = parseInt(type.split("_")[1]);
            if (processedPlaygrounds[pgIndex] && uploadedImages[uploadIndex]) {
              processedPlaygrounds[pgIndex].image = uploadedImages[uploadIndex];
            }
          }
          uploadIndex++;
        });
      }
    }

    const formattedData = {
      title: title,
      language,
      status,
      timeLimit,
      ...(timeLimit === "end_time" && {
        endTime: endTime,
      }),
      ...(timeLimit === "duration" && {
        duration: {
          unit: duration?.unit || "minutes",
          value: parseInt(data.duration?.value) || 0,
        },
      }),
      ...(processedIntroMessage && {
        introMessage: processedIntroMessage,
      }),
      ...(processedFinishMessage && {
        finishMessage: processedFinishMessage,
      }),
      ...(thumbnailFilename && {
        thumbnail: thumbnailFilename,
      }),
      ...(backGroundImageFilename && {
        backGroundImage: backGroundImageFilename,
      }),
      playgrounds: processedPlaygrounds,
      // Ensure tags is an array of tag IDs (strings)
      tags: Array.isArray(tags) ? tags.filter((t) => t) : [],
    };

    if (id) {
      dispatch(updateGame({ gameData: formattedData, gameId: id }));
    } else {
      dispatch(createGame(formattedData));
    }
  };

  useApiResponseHandler({
    status,
    data,
    error,
    setFormError: setError,
    sideAction: () => {
      if (isNextClicked.current) {
        nextStepHandler();
        isNextClicked.current = false;
      }
      markStepCompleted(curStep);
    },
  });

  // console.log({ error });

  useApiResponseHandler({
    status: updateGameApi.status,
    data: updateGameApi.data,
    error: updateGameApi.error,
    setFormError: setError,
    sideAction: () => {
      if (isNextClicked.current) {
        nextStepHandler();
        isNextClicked.current = false;
      }
      markStepCompleted(curStep);
    },
  });

  useEffect(() => {
    dispatch(getTags());
  }, [dispatch]);

  useEffect(() => {
    if (id) {
      dispatch(getGameInfobyId(id));
    }
  }, [id]);

  useEffect(() => {
    // console.log({ gameData });
    if (gameData && id) {
      const {
        title,
        introMessage,
        finishMessage,
        language,
        status,
        timeLimit,
        duration,
        endTime,
        tags,
        backGroundImage,
        thumbnail,
        playgroundImage,
        playgroundName,
        playgrounds,
      } = gameData;

      // Handle backward compatibility for playgrounds
      let initialPlaygrounds = [];
      if (playgrounds && Array.isArray(playgrounds) && playgrounds.length > 0) {
        initialPlaygrounds = playgrounds.map((pg) => {
            const pgUrl = getCleanImageUrl(pg.image);
            if (pgUrl) console.log(`Configuration Playground Image:`, pgUrl, 'Original:', pg.image);
            return {
                name: pg.name,
                image: pgUrl,
            };
        });
      } else if (playgroundImage && playgroundName) {
        const pgUrl = getCleanImageUrl(playgroundImage);
        if (pgUrl) console.log(`Configuration Legacy Playground Image:`, pgUrl, 'Original:', playgroundImage);
        
        initialPlaygrounds = [
          {
            name: playgroundName,
            image: pgUrl,
          },
        ];
      }

      const thumbnailSrc = getCleanImageUrl(thumbnail);
      if (thumbnailSrc) console.log(`Configuration Thumbnail:`, thumbnailSrc, 'Original:', thumbnail);

      const bgSrc = getCleanImageUrl(backGroundImage);
      if (bgSrc) console.log(`Configuration Background:`, bgSrc, 'Original:', backGroundImage);

      const pureData = {
        title,
        introMessage,
        finishMessage,
        language,
        status,
        timeLimit,
        duration,
        endTime: formatDate(endTime, "dd-MM-yyyy HH:mm:ss"),
        // normalize tags to an array of tag IDs for AntMultiSelector (which stores values)
        tags: tags?.map((t) => t._id) || [],
        thumbnail: thumbnailSrc,
        backGroundImage: bgSrc,
        playgrounds: initialPlaygrounds,
      };
      reset(pureData);
    }
  }, [gameData]);



  if (getGameInfobyIdApi.isLoading) {
    return <ConfigurationSkeleton />
  }

  const handleNextStep = () => {
    isNextClicked.current = true;
  };

  return (
    <>
      <FormProvider
        {...{
          register,
          handleSubmit,
          control,
          setValue,
          watch,
          setError,
          reset,
          formState: { errors },
        }}
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <h3 className="font-semibold mb-2 text-xl">Game Configuration</h3>
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm">
            <div className="flex flex-col gap-4">
              <CommonInput
                labelName="Title"
                name="title"
                register={register}
                errors={errors}
                required={true}
                placeholder="Game Title"
                validation={{
                  required: "Game title is required",
                  minLength: {
                    value: 1,
                    message: "Title cannot be empty",
                  },
                }}
              />

              <FileUpload
                name="thumbnail"
                labelName="Game Thumbnail"
                type="image"
                required
                errors={errors}
              />

              <FileUpload
                name="backGroundImage"
                labelName="Game Background Image"
                type="image"
                required={false}
              />

              <div className="flex flex-col gap-4 border p-4 rounded-lg bg-gray-50">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">
                    Playgrounds
                  </label>
                  <Button
                    type="button"
                    variant="light"
                    onClick={() => append({ name: "", image: null })}
                    className="flex items-center gap-2 text-xs relative z-10"
                  >
                    <PlusIcon className="w-4 h-4" /> Add Playground
                  </Button>
                </div>

                {fields.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-4 p-4 border rounded bg-white relative"
                  >
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700 z-10"
                    >
                      <DeleteIcon className="w-5 h-5" />
                    </button>

                    <CommonInput
                      labelName={`Playground Name ${index + 1}`}
                      name={`playgrounds.${index}.name`}
                      register={register}
                      errors={errors}
                      required={true}
                      placeholder="Playground Name"
                      validation={{ required: "Playground name is required" }}
                    />

                    <FileUpload
                      name={`playgrounds.${index}.image`}
                      labelName={`Playground Image ${index + 1}`}
                      type="image"
                      required={true}
                      errors={errors}
                    />
                  </div>
                ))}
                {fields.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No playgrounds added yet.
                  </p>
                )}
              </div>

              <RichTextEditor
                name="introMessage"
                control={control}
                placeholder="Message which is shown when player start"
                // height="150px"
                onChange={(delta) =>
                  handleRichTextChange("introMessage", delta)
                }
                labelName="Intro Message"
              />

              <RichTextEditor
                name="finishMessage"
                control={control}
                placeholder="Message which is shown when player finishes"
                // height="150px"
                onChange={(delta) =>
                  handleRichTextChange("finishMessage", delta)
                }
                labelName="Finish Message"
              />
              <div className="flex w-full items-end justify-center h-full gap-4 cursor-pointer">
                <AntMultiSelector
                  id="tags"
                  name="tags"
                  labelName="Select Tags"
                  options={tagOptions}
                  control={control}
                  errors={errors}
                  required
                />
                <span
                  onClick={() => {
                    setIsTagModalOpen((prev) => !prev);
                  }}
                >
                  <TagIcon variant="dark" />
                </span>
              </div>

              <AntSearchableSelector
                labelName="Language"
                name="language"
                control={control}
                options={[
                  { value: "english", label: "English" },
                  { value: "french", label: "French" },
                  { value: "spanish", label: "Spanish" },
                  { value: "arabic", label: "Arabic" },
                ]}
                placeholder="Select Language"
                required={true}
              />
              <OptionGroup
                labelName="Time limit"
                name="timeLimit"
                options={[
                  { value: "no_time_limit", label: "No time limit" },
                  { value: "duration", label: "Duration" },
                  { value: "end_time", label: "End time" },
                ]}
                selected={[watchedValues.timeLimit]}
                onChange={(value) => setValue("timeLimit", value[0])}
                type="radio"
                register={register}
                required={true}
              />

              {/* Duration Input */}
              {watchedValues.timeLimit === "duration" && (
                <div className="flex items-center gap-4">
                  <CommonInput
                    labelName="Duration Value"
                    name="duration.value"
                    register={register}
                    type="number"
                    errors={errors}
                    placeholder="50"
                    required
                  />
                  <AntSearchableSelector
                    labelName="Duration Unit"
                    name="duration.unit"
                    control={control}
                    options={[
                      { value: "seconds", label: "Seconds" },
                      { value: "minutes", label: "Minutes" },
                      { value: "hours", label: "Hours" },
                      { value: "days", label: "Days" },
                    ]}
                    placeholder="Select Duration Unit"
                    required
                  />
                </div>
              )}

              {/* End Time Input */}
              {watchedValues.timeLimit === "end_time" && (
                <AntDatePicker
                  id="endTime"
                  name="endTime"
                  label="End Time"
                  control={control}
                  errors={errors}
                  showTime={true}
                  required
                  placeholder="Select End Time"
                />
              )}
              <LabeledOptionGroup
                name="status"
                labelName={"Status"}
                options={radioButtonOptions}
                register={register}
                required={true}
                errors={errors}
              />
            </div>
          </div>

          <FormStepperButtons
            curStep={curStep}
            resetFormHandler={reset}
            previousStepHandler={previousStepHandler}
            nextStepHandler={handleNextStep}
            isLoading={isLoading || imageProcessingLoading || isUploading}
            completedSteps={completedSteps}
            lastStep={3}
            nextButtonType="submit"
            isHiddenSubmitButton={true}
            // isDisabledNextButton={!id}
          />
        </form>
      </FormProvider>

      {/* Tag Creation Modal */}
      {isTagModalOpen && (
        <CreateUpdateTagModal
          isOpen={isTagModalOpen}
          onClose={handleTagModalClose}
          mode="create"
        />
      )}
    </>
  );
}

export default Configuration;
