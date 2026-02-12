import mongoose from 'mongoose';


const QuestionSchema = new mongoose.Schema({
  questionName: {
    type: String,
    required: true,
    trim: true
  },


  questionDescription:{
    type:Object ,
  } ,

  answerType: {
    type: String,
    required: true,
    trim: true,
    enum: ["text", "mcq", "number", "multiple", "no_answer", "puzzle", "take_photo", "record_video", "augmented_photo", "code_box"],
    default: "text"
  },

  codeBoxConfig: {
    length: { type: Number, default: 4 },
    mode: { 
      type: String, 
      enum: ['numeric', 'alpha', 'alphanumeric'], 
      default: 'alphanumeric' 
    }
  },

  options: [
    {
      text: String,
      isCorrect: { type: Boolean }
    }
  ],

  correctAnswers: { 
    type: [mongoose.Schema.Types.Mixed], 
    required: function() {
      return !['no_answer', 'puzzle', 'take_photo', 'record_video', 'augmented_photo'].includes(this.answerType);
    },
    default: []
  },

  puzzle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Puzzles",
    required: function() {
      return this.answerType === 'puzzle';
    }
  },

  puzzleAnswerText: {
    type: String,
    trim: true
  },

  points: { type: Number, required: true },

  tags: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tags"
      }
    ],
    default: []
  },

  isDeleted: {
    type: Boolean,
    default: false
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  collection: "Questions",
  timestamps: true,
  versionKey: false
});


QuestionSchema.pre('save', function(next) {
  if (['no_answer', 'take_photo', 'record_video', 'augmented_photo'].includes(this.answerType)) {
    this.correctAnswers = [];
    this.puzzle = undefined;
  }
  
  if (this.answerType === 'puzzle') {
    this.correctAnswers = [];
  }
  
  if (this.answerType !== 'puzzle') {
    this.puzzle = undefined;
  }
  
  next();
});


export default mongoose.model("Questions", QuestionSchema);