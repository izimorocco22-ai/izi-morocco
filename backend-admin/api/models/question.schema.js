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
    // no default; field remains absent unless provided
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
  // Handle no_answer and media types
  if (['no_answer', 'take_photo', 'record_video', 'augmented_photo'].includes(this.answerType)) {
    this.correctAnswers = [];
    this.puzzle = undefined;
    this.puzzleAnswerType = undefined;
    this.puzzleAnswerText = undefined;
    this.codeBoxConfig = undefined;
    this.options = [];
  }
  
  // Handle puzzle type
  if (this.answerType === 'puzzle') {
    if (this.puzzleAnswerType === 'mcq') {
      // Keep options and correctAnswers for MCQ inside puzzle
      this.codeBoxConfig = undefined;
      this.puzzleAnswerText = undefined;
    } else if (this.puzzleAnswerType === 'code_box') {
      // Keep codeBoxConfig and correctAnswers (single code string)
      this.options = [];
      this.puzzleAnswerText = undefined;
    } else if (['text', 'number'].includes(this.puzzleAnswerType)) {
      // Store answer in puzzleAnswerText; clear other fields
      this.correctAnswers = [];
      this.options = [];
      this.codeBoxConfig = undefined;
    }
  }
  
  // Handle non-puzzle types
  if (this.answerType !== 'puzzle') {
    this.puzzle = undefined;
    this.puzzleAnswerType = undefined;
    this.puzzleAnswerText = undefined;
    
    if (this.answerType === 'code_box') {
      // Keep codeBoxConfig for code_box type
      this.options = [];
    } else if (['mcq', 'multiple'].includes(this.answerType)) {
      // Keep options for MCQ types
      this.codeBoxConfig = undefined;
    } else {
      // For text/number, clear both
      this.codeBoxConfig = undefined;
      this.options = [];
    }
  }
  
  next();
});


export default mongoose.model("Questions", QuestionSchema);
