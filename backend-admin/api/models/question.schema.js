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
    length: { type: Number },
    mode: { 
      type: String, 
      enum: ['numeric', 'alpha', 'alphanumeric']
    },
    _id: false,
    default: undefined
  },
  
  puzzleAnswerType: {
    type: String,
    enum: ['code_box', 'number', 'text', 'mcq'],
    default: null
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
    if (this.puzzleAnswerType === 'mcq') {
      // keep options/correctAnswers for single-answer MCQ inside puzzle
      this.codeBoxConfig = undefined;
    } else if (this.puzzleAnswerType === 'code_box') {
      // use codeBoxConfig; keep correctAnswers (single code string), clear options
      this.options = [];
    } else {
      // text or number: store as text in puzzleAnswerText; clear options/correctAnswers/codeBox
      this.correctAnswers = [];
      this.options = [];
      this.codeBoxConfig = undefined;
    }
  }
  
  if (this.answerType !== 'puzzle') {
    this.puzzle = undefined;
    if (this.answerType !== 'code_box') {
      this.codeBoxConfig = undefined;
    }
  }
  
  
  next();
});


export default mongoose.model("Questions", QuestionSchema);
