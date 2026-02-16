import mongoose from 'mongoose'

const GameInfoSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },

    introMessage: {
        type: Object,
    },

    finishMessage: {
        type: Object,
    },

    language: {
        type: String,
        enum: ['english', 'french', 'spanish', 'arabic'],
        default: 'english'
    },

    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },



    username: {
        type: String,
    },

    password: {
        type: String,
    },

    timeLimit: {
        type: String,
        enum: [
            'no_time_limit',
            'duration',
            'end_time'
        ]
    },

    duration: {
        type: {
            unit: {
                type: String,
                enum: ['seconds', 'minutes', 'hours', 'days']
            },
            value: {
                type: Number,
                min: 1
            }
        },
        _id: false,
        default: undefined
    },

    endTime: {
        type: Date,
        default: null
    },

    tags: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tags'
        }
    ],
    isDeleted: {
        type: Boolean,
        default: false
    },

    thumbnail: {
        type: String,
        required: true
    },
    backGroundImage: {
        type: String,
        default: null
    },
    playgrounds: [{
        name: {
            type: String,
            required: true
        },
        image: {
            type: String,
            required: true
        }
    }]
}, {
    timestamps: true,
    collection: 'GameInfo',
    versionKey: false
})

GameInfoSchema.pre('validate', function (next) {
    const { timeLimit, duration, endTime } = this

    if (timeLimit === 'no_time_limit') {
        this.duration = undefined;
        this.endTime = null;
    }

    if (timeLimit === 'duration') {
        if (!duration || duration === null) {
            return next(new Error('Duration is required when timeLimit is "duration"'));
        }
        this.endTime = null;
    }

    if (timeLimit === 'end_time') {
        if (!endTime || endTime === null) {
            return next(new Error('endTime is required when timeLimit is "end_time"'));
        }
        this.duration = undefined;
    }

    next();
})

export default mongoose.model('GameInfo', GameInfoSchema)
