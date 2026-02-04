import { useFormContext, useFieldArray } from "react-hook-form";
import FileUpload from "../../../components/form/FileUpload";
import OptionGroup from "../../../components/form/OptionGroup";

const AudioManager = ({ name = "audioUrls" }) => {
    const { control, setValue, watch, getValues, trigger } = useFormContext();

    const { fields, append, remove } = useFieldArray({
        control,
        name: name,
    });

    const audioTypeOptions = [
        { value: "starting", label: "Starting" },
        { value: "background", label: "Background" },
    ];

    // Get the current form values for audioUrls
    const audioUrls = watch(name) || [];

    // console.log({ audioUrls })


    // Add new audio entry
    const addAudio = () => {
        append({
            url: "",
            type: "background",
        });
    };

    // Remove audio entry
   const removeAudio = (index) => {
    // console.log("Removing index:", index);
    
    // Get ALL current form values
    const allValues = getValues();
    // Access nested property if name contains dots
    const getNestedValue = (obj, path) => {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    }
    const currentAudioUrls = getNestedValue(allValues, name) || [];
    
    // console.log("Current audioUrls:", currentAudioUrls);
    
    // Create new array without the item at index
    const newAudioUrls = currentAudioUrls.filter((_, i) => i !== index);

    
    // console.log("New audioUrls to set:", newAudioUrls);
    
    // Update the entire form state with the new array
    setValue(name, newAudioUrls);
    
    // DON'T call remove() - let setValue handle everything
    
    // Force React Hook Form to re-render
    setTimeout(() => {
        trigger(name);
    }, 0);
};


    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <label className="block font-medium text-gray-900 text-sm">
                    Audio Files
                </label>
                <button
                    type="button"
                    onClick={addAudio}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                    + Add Audio
                </button>
            </div>

            {fields.map((field, index) => {
                const currentType = audioUrls[index]?.type || "background";

                return (
                    <div
                        key={field.id}
                        className="p-4 border border-gray-200 rounded-lg space-y-3"
                    >
                        <div className="flex justify-between items-center">
                            <h3 className="font-medium text-gray-900">
                                Audio {index + 1}
                            </h3>
                            {fields.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => removeAudio(index)}
                                    className="text-red-600 hover:text-red-800 text-sm"
                                >
                                    Remove
                                </button>
                            )}
                        </div>

                        {/* Type Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Audio Type
                            </label>
                            <OptionGroup
                                name={`${name}.${index}.type`}
                                options={audioTypeOptions}
                                selected={[currentType]}
                                onChange={(values) =>
                                    setValue(
                                        `${name}.${index}.type`,
                                        values[0] || "background"
                                    )
                                }
                                type="radio"
                                _class="flex-row gap-3"
                            />
                        </div>

                        {/* Audio URL/File Upload Section */}
                        <div>

                            {/* Option 1: File Upload */}
                            <div className="mb-3">
                                <FileUpload
                                    id={`${name}.${index}.url`}
                                    name={`${name}.${index}.url`}
                                    labelName={`Select Audio File ${index + 1}`}
                                    type="audio"
                                />
                            </div>
                        </div>

                        {/* Audio Type Description */}
                        <div className="text-xs text-gray-500">
                            {currentType === "starting" ? (
                                <p>This audio will play once at the beginning</p>
                            ) : (
                                <p>This audio will loop in the background</p>
                            )}
                        </div>
                    </div>
                );
            })}

            {fields.length === 0 && (
                <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
                    <p className="text-gray-500">No audio files added yet.</p>
                    <button
                        type="button"
                        onClick={addAudio}
                        className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                    >
                        Click to add your first audio
                    </button>
                </div>
            )}


        </div>
    );
};

export default AudioManager;