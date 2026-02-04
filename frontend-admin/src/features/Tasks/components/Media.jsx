import { FormProvider, useForm, useFieldArray } from "react-hook-form";
import FormStepperButtons from "./FormStepperButtons";
import FileUpload from "../../../components/form/FileUpload";
import CommonInput from "../../../components/form/CommonInput";
import { useDispatch, useSelector } from "react-redux";
import { callAPI } from "../../../services/callApi";
import {
  createMedia,
  getMedia,
  resetApiStateFromQuestion,
} from "../../../slices/questionSlice";
import { useEffect, useState, useRef } from "react";
import { getSessionData } from "../../../utils/sessionStorage";
import toast from "react-hot-toast";
import { MEDIA_URL } from "../../../utils/config";
import { extractFilename } from "../helper";
import { useResetMultipleApiStates } from "../../../hooks/useResetMultipleApiStates";
import MediaSkeleton from "./MediaSkeleton";
import AudioManager from "./AudioManager";

const defaultValueForMedia = {
  image: [],
  video: [],
  audioUrls: [],
  videoUrls: [],
};

const Media = ({
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
      mediaList: ids.map((id) => ({
        questionId: id,
        ...defaultValueForMedia,
      })),
    },
  });

  const {
    handleSubmit,
    formState,
    setError,
    reset,
    control,
    register,
  } = form;
  
  const { errors } = formState;
  
  const { fields } = useFieldArray({
    control,
    name: "mediaList",
  });

  const [isUploading, setIsUploading] = useState(false);
  const isNextClicked = useRef(false);

  const { createMediaApi, getMediaApi } = useSelector(
    (state) => state.question
  );
  
  const dispatch = useDispatch();

  const processAndSubmitMedia = async (mediaData) => {
      const { questionId, audioUrls, image, video, videoUrls: videoUrlsInput } = mediaData;
      
      if (!questionId) return;

      // Collect files that need uploading and keep track of their indices
      const audioFields = audioUrls || [];
      const audioFilesToUpload = [];
      const fileIndexToFieldIndex = new Map();
      let hasError = false;

      audioFields.forEach((af, idx) => {
        const val = af?.url;
        if (!val && audioFields.length < 2) {
          // If empty and it's the only one? Logic from original file seems to check length < 2
          // But here we might want to allow empty if user didn't add any.
          // Original logic: "Please Select audio first" if val is empty.
          // We can probably skip validation if empty?
          // Let's keep original logic loosely.
          // hasError = true; 
        }
        if (val instanceof File) {
          fileIndexToFieldIndex.set(audioFilesToUpload.length, idx);
          audioFilesToUpload.push(val);
        }
      });

    //   if (hasError) {
    //     throw new Error("Please Select audio first");
    //   }

      // Also collect image/video files as before
      const getFiles = (array) =>
        array?.filter((item) => item instanceof File) || [];
      const getUrls = (array) =>
        array?.filter(
          (item) => typeof item === "string" && item.startsWith("http")
        ) || [];

      const imageFiles = getFiles(image);
      const videoFiles = getFiles(video);

      const imageUrls = getUrls(image).map(extractFilename);
      const videoUrls = getUrls(video).map(extractFilename);

      const hasFilesToUpload =
        imageFiles.length > 0 ||
        videoFiles.length > 0 ||
        audioFilesToUpload.length > 0;

      let uploadedImages = [];
      let uploadedVideos = [];
      let uploadedAudios = [];

      if (hasFilesToUpload) {
        const formData = new FormData();
        imageFiles.forEach((file) => formData.append("images", file));
        videoFiles.forEach((file) => formData.append("videos", file));
        audioFilesToUpload.forEach((file) => formData.append("audios", file));

        const response = await callAPI("/upload", {
          method: "POST",
          data: formData,
          headers: { "Content-Type": "multipart/form-data" },
          suppressError: true,
        });

        if (response.error) {
             throw new Error("Upload failed");
        }

        const result = response?.data?.response || {};
        uploadedImages = result.images || [];
        uploadedVideos = result.videos || [];
        uploadedAudios = result.audios || [];
      }

      // Build final audios array as objects { url, type }
      const finalAudios = [];

      // First handle fields that had string URLs (existing uploaded or external)
      audioFields.forEach((af) => {
        const val = af?.url;
        const type = af?.type || "background";
        if (typeof val === "string") {
          // Extract filename - handle both MEDIA_URL and Cloudinary URLs
          const filename = extractFilename(val);
          finalAudios.push({ url: filename, type });
        }
      });

      // Now map uploaded audio filenames back to their original field index to preserve type
      uploadedAudios.forEach((fname, uploadIdx) => {
        const fieldIdx = fileIndexToFieldIndex.get(uploadIdx);
        const type =
          (audioFields[fieldIdx] && audioFields[fieldIdx].type) || "background";
        finalAudios.push({ url: fname, type });
      });

      const finalData = {
        images: [...imageUrls, ...uploadedImages],
        videos: [...videoUrls, ...uploadedVideos],
        audios: finalAudios,
        videoUrls: [
          videoUrlsInput && videoUrlsInput.length ? videoUrlsInput : "",
        ],
      };

      await dispatch(createMedia({ questionId, data: finalData })).unwrap();
  };

  const onSubmit = async (data) => {
    setIsUploading(true);
    try {
        const { mediaList } = data;
        
        for (const mediaData of mediaList) {
            await processAndSubmitMedia(mediaData);
        }

        toast.success("Media saved successfully");
        
        if (isNextClicked.current) {
            nextStepHandler();
            isNextClicked.current = false;
        } else {
            markStepCompleted(curStep);
        }

    } catch (err) {
        console.error("Error submitting media", err);
        if (err?.message) {
            toast.error(err.message);
        } else {
            toast.error("Failed to save media");
        }
    } finally {
        setIsUploading(false);
    }
  };

  useEffect(() => {
    const fetchMedia = async () => {
        if (ids.length === 0) return;

        try {
            const fetchedData = await Promise.all(
                ids.map(async (id) => {
                    try {
                        const result = await dispatch(getMedia(id)).unwrap();
                        return { id, data: result?.response };
                    } catch (error) {
                        return { id, data: null };
                    }
                })
            );

            const newMediaList = ids.map((id) => {
                const found = fetchedData.find(f => f.id === id);
                const response = found?.data;

                if (!response) {
                    return { questionId: id, ...defaultValueForMedia };
                }

                const normalizedAudios = (response.audios || [])
                .map((a) => {
                    if (!a) return null;
                    if (typeof a === "string") {
                    return { url: `${MEDIA_URL("video")}/${a}`, type: "background" };
                    }
                    // if object with url or filename
                    const rawUrl = a.url || a.filename || a.path || "";
                    const full = rawUrl.startsWith("http")
                    ? rawUrl
                    : `${MEDIA_URL("video")}/${rawUrl}`;
                    return { url: full, type: a.type || "background" };
                })
                .filter(Boolean);

                return {
                    questionId: id,
                    videoUrls: response.videoUrls?.[0] || "",
                    image: response.images?.map((image) => `${MEDIA_URL()}/${image}`) || [],
                    video: response.videos?.map((video) => `${MEDIA_URL("video")}/${video}`) || [],
                    audioUrls: normalizedAudios,
                };
            });

            reset({ mediaList: newMediaList });

        } catch (err) {
            console.error("Error fetching media", err);
        }
    };

    fetchMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useResetMultipleApiStates([
    { action: resetApiStateFromQuestion, stateName: "createMediaApi" },
    { action: resetApiStateFromQuestion, stateName: "getMediaApi" },
  ]);

  const handleNextStep = () => {
    isNextClicked.current = true;
  };

  return (
    <div>
      <FormProvider {...form}>
        <form action="" onSubmit={handleSubmit(onSubmit)}>
          <h3 className="font-semibold mb-2 text-xl">Media Section</h3>
          
          <div className="flex flex-col gap-6">
            {fields.map((field, index) => (
                <div key={field.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h4 className="font-medium text-lg mb-4 text-blue-600">
                        {names[index] ? `Task: ${names[index]}` : `Task ${index + 1}`}
                    </h4>
                    <div className="flex flex-col gap-4">
                        <FileUpload
                            name={`mediaList.${index}.image`}
                            multiple={true}
                            labelName={"Select Image"}
                            type="image"
                        />
                        <CommonInput
                            id={`mediaList.${index}.videoUrls`}
                            name={`mediaList.${index}.videoUrls`}
                            labelName="Video URL"
                            type="text"
                            register={register}
                            errors={errors}
                        />
                        <FileUpload
                            name={`mediaList.${index}.video`}
                            multiple={true}
                            labelName={"Select Video"}
                            type="video"
                        />
                        
                        <AudioManager name={`mediaList.${index}.audioUrls`} />
                    </div>
                </div>
            ))}
          </div>

          <FormStepperButtons
          curStep={curStep}
          previousStepHandler={previousStepHandler}
          nextStepHandler={handleNextStep}
          isLoading={isUploading}
          completedSteps={completedSteps}
          isHiddenSubmitButton={true}
          nextButtonType="submit"
        />
        </form>
      </FormProvider>
    </div>
  );
};

export default Media;
