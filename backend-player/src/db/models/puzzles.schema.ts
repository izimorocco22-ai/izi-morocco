import mongoose from 'mongoose';

const PuzzleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users'
  }
}, {
  collection: "Puzzles",
  timestamps: true,
  versionKey: false
});

export default mongoose.model("Puzzles", PuzzleSchema);