import mongoose from 'mongoose'


const GameActivationCodes = new mongoose.Schema({
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

    expiresAt: {
        type: Date,
        required: true
    },

    activationCodeFor: {
        type: String,
        enum: ['Admin', 'Player'],
        required: true
    }




}, {
    collection: 'GameActivationCodes',
    timestamps: true,
    versionKey: false

})



export default mongoose.model('GameActivationCodes', GameActivationCodes)