import mongoose from 'mongoose'


const QuestionSettingsSchema = new mongoose.Schema({



    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Questions",
        required: true
    },
    timeLimit: { type: Number },
    timeUnit: { type: String, enum: ["seconds", "minutes", "hours"], default: "seconds" },
    iconName: { type: String, default: null },
    radiusColor: { type: String },
    locationRadius: { type: Number },
    icon: { type: String, default: null },
    language: {
        type: String,
        enum: ['english', 'french', 'spanish', 'arabic'],
        default: 'english'
    },

    behaviorOption: {
        type: String,
        enum: ["remove_on_answer", "keep_until_correct", "keep_until_end"],
        required: true,
        default: "remove_on_answer"
    },


    //   durations: {
    //         deactivateOnIncorrectSeconds: {
    //             type: Number,
    //             default: null,
    //             min: 1
    //         },

    //         deactivateAfterClosingSeconds: {
    //             type: Number,
    //             default: null,
    //             min: 1
    //         }

    //     }


},



    {
        collection: "QuestionSettings",
        timestamps: true,
        versionKey: false

    }
)


export default mongoose.model("QuestionSettings", QuestionSettingsSchema)
