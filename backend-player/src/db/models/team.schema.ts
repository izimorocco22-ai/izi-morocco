import mongoose from 'mongoose'

const TeamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    ownerPlayerId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    members: {
      type: [String],
      default: []
    }
  },
  {
    collection: 'Teams',
    timestamps: true,
    versionKey: false
  }
)

export default mongoose.model('Teams', TeamSchema)
