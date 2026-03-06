import mongoose from 'mongoose';

const GameQuestionsSchema = new mongoose.Schema(
  {
    game: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GameInfo',
      required: true,
      unique: true
    },

    questions: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Questions',
          required: true
        },
        location: {
          type: Object, // Just a plain object, no validation
          required: false,
          default: null
        },
        radius: {
          type: Number,
          default: 0
        },
        order: {
          type: Number,
          default: 0
        },
        isPlaced: {
          type: Boolean,
          default: false
        },
        isPlacedCanvas: {
          type: Boolean,
          default: false
        },
        canvasLocation: {
          type: Object,
          required: false,
          default: null
        },
        iconSize: {
          type: Number,
          required: false,
          default: 40
        },
        playgroundIndex: {
          type: Number,
          required: false,
          default: 1
        }
      }
    ],

    blocklyJsonRules: {
      type: Object,
      required: true
    },

    blocklyXmlRules: {
      type: String,
      required: false,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'GameQuestions',
    versionKey: false
  }
);

// Only basic index on game
GameQuestionsSchema.index({ game: 1 });

GameQuestionsSchema.path('questions').validate(function (value) {
  return value.length <= 200;
}, 'Maximum 200 questions allowed per game');

GameQuestionsSchema.pre('save', function (next) {
  if (this.questions && this.questions.length > 0) {
    const questionIds = this.questions.map((q) => q.questionId.toString());
    const uniqueIds = [...new Set(questionIds)];

    if (questionIds.length !== uniqueIds.length) {
      return next(
        new Error('Duplicate questions not allowed in the same game')
      );
    }
  }
  next();
});

GameQuestionsSchema.post('save', async function (doc) {
  try {
    await GameInfo.findByIdAndUpdate(doc.game, {
      questionCount: doc.questions.length
    });
  } catch (err) {
    console.error('Error updating question count:', err);
  }
});

GameQuestionsSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    try {
      await GameInfo.findByIdAndUpdate(doc.game, {
        questionCount: 0
      });
    } catch (err) {
      console.error('Error updating question count:', err);
    }
  }
});

export const GameQuestions = mongoose.model(
  'GameQuestions',
  GameQuestionsSchema
);
