import mongoose from 'mongoose'

export const GameStatus = {
  NOT_PLAYED: 'not_played',
  IN_PROGRESS: 'in_progress',
  FINISHED: 'finished'
}

const playedGamesSchema = new mongoose.Schema(
  {
    playerId: {
      type: String,
      required: true
    },

    gameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GameInfo',
      required: true
    },

    activationCode: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    gameStartedAt: {
      type: Date,
      required: true,
      default: new Date()
    },
    gameFinishedAt: {
      type: Date
    },
    status: {
      type: String,
      required: true,
      default: GameStatus.NOT_PLAYED,
      enum: Object.values(GameStatus)
    },
    questions: {
      type: Array
    },
    score: {
      type: Number
    },
    currentTime: {
      type: Number,
      default: 0
    },
    timerConditions: {
      type: Array
    }
  },
  {
    collection: 'GameLogs',
    timestamps: true,
    versionKey: false
  }
)

export default mongoose.model('GameLogs', playedGamesSchema)
