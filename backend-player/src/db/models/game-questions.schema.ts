import mongoose from 'mongoose'

const GameQuestionsSchema = new mongoose.Schema(
  {
    game: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GameInfo',
      required: true,
      unique: true,
      index: true
    },

    questions: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Questions',
          required: true
        },
        location: {
          type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
          },
          coordinates: {
            type: [Number],
            required: true,
            validate: {
              validator: function (v: any) {
                return (
                  v.length === 2 &&
                  v[0] >= -180 &&
                  v[0] <= 180 &&
                  v[1] >= -90 &&
                  v[1] <= 90
                )
              },
              message:
                'Coordinates must be [longitude, latitude] with valid ranges'
            }
          }
        },
        radius: {
          type: Number,
          default: 0,
          min: 0,
          max: 1000
        },
        order: {
          type: Number,
          default: 0,
          min: 0
        },
        isShownOnPlayground: {
          type: Boolean,
          default: false
        },
        playgroundPosition: {
          x: { type: Number, default: 0 },
          y: { type: Number, default: 0 }
        }
      }
    ],

    blocklyJsonRules: {
      type: Object,
      required: true
    },

    blocklyXmlRules: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true,
    collection: 'GameQuestions',
    versionKey: false
  }
)

export default mongoose.model('GameQuestions', GameQuestionsSchema)
