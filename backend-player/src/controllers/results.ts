import { Request, Response } from 'express'
import GameLogs from '../db/models/played-game-status.schema'
import GameActivation from '../db/models/game-activation.schema'
import { matchedData } from 'express-validator'
import httpStatus, { status } from 'http-status'
import GameInfo from '../db/models/game-info.schema'
import mongoose from 'mongoose'

const gameHistoryPipeline = (playerId: string) => [
  {
    $match: { playerId: playerId }
  },
  {
    $lookup: {
      from: 'GameInfo',
      localField: 'gameId',
      foreignField: '_id',
      as: 'g'
    }
  },
  {
    $unwind: {
      path: '$g',
      preserveNullAndEmptyArrays: true
    }
  },
  {
    $project: {
      _id: 1,
      status: 1,
      playerId: 1,
      gameId: 1,
      gameStartedAt: 1,
      gameFinishedAt: 1,
      game: {
        _id: '$g._id',
        title: '$g.title',
        language: '$g.language',
        status: '$g.status',
        timeLimit: '$g.timeLimit',
        duration: '$g.duration',
        endTime: '$g.endTime',
        thumbnailUrl: '$g.thumbnail',
        tags: '$g.tags',
        createdAt: '$g.createdAt',
        updatedAt: '$g.updatedAt'
      }
    }
  }
]
export const getSpecificPlayerPlayedGamesHistory = async (
  req: Request,
  res: Response
) => {
  const  playerId = res.locals.user.playerId
  // const { playerId } = req.params
  const gameLogData = await GameLogs.aggregate(gameHistoryPipeline(playerId))

  if (!gameLogData || gameLogData.length === 0) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      message: 'Game logs not found'
    })
  }

  return res.status(httpStatus.OK).json({
    success: true,
    message: 'Game logs retrieved successfully',
    gameLog: gameLogData
  })
}

const getPlayerGameWithQuestionsPipeline = (
  playerId: string,
  gameId: string
) => [
  { $match: { playerId: playerId, gameId: new mongoose.Types.ObjectId(gameId) } },
  // bring game info
  {
    $lookup: {
      from: 'GameInfo',
      localField: 'gameId',
      foreignField: '_id',
      as: 'g'
    }
  },
  { $unwind: { path: '$g', preserveNullAndEmptyArrays: true } },
  // lookup full question documents for all question ids present in the log
  {
    $lookup: {
      from: 'Questions',
      let: { qIds: '$questions._id' },
      pipeline: [
        { $match: { $expr: { $in: ['$_id', '$$qIds'] } } }
      ],
      as: 'questionsInfo'
    }
  },
  // lookup media for those questions
  {
    $lookup: {
      from: 'QuestionMedia',
      let: { qIds: '$questions._id' },
      pipeline: [
        { $match: { $expr: { $in: ['$questionId', '$$qIds'] } } }
      ],
      as: 'mediaInfo'
    }
  },
  // lookup comments for those questions
  {
    $lookup: {
      from: 'QuestionComment',
      let: { qIds: '$questions._id' },
      pipeline: [
        { $match: { $expr: { $in: ['$questionId', '$$qIds'] } } }
      ],
      as: 'commentsInfo'
    }
  },
  // merge each played question (player's per-question fields) with the corresponding question doc + media + comments
  {
    $addFields: {
      questionsDetailed: {
        $map: {
          input: { $ifNull: ['$questions', []] },
          as: 'pq',
          in: {
            questionId: '$$pq._id',
            latitude: '$$pq.latitude',
            longitude: '$$pq.longitude',
            radius: '$$pq.radius',
            order: '$$pq.order',
            isFinished: '$$pq.isFinished',
            isCorrect: '$$pq.isCorrect',
            isDisplayed: '$$pq.isDisplayed',
            isShownOnPlayground: '$$pq.isShownOnPlayground',
            question: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: '$questionsInfo',
                    as: 'qi',
                    cond: { $eq: ['$$qi._id', '$$pq._id'] }
                  }
                },
                0
              ]
            },
            media: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: '$mediaInfo',
                    as: 'm',
                    cond: { $eq: ['$$m.questionId', '$$pq._id'] }
                  }
                },
                0
              ]
            },
            comments: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: '$commentsInfo',
                    as: 'c',
                    cond: { $eq: ['$$c.questionId', '$$pq._id'] }
                  }
                },
                0
              ]
            }
          }
        }
      }
    }
  },
  // optional: sort questions by order if present
  {
    $addFields: {
      questionsDetailed: {
        $cond: [
          { $gt: [{ $size: '$questionsDetailed' }, 0] },
          { $sortArray: { input: '$questionsDetailed', sortBy: { order: 1 } } },
          '$questionsDetailed'
        ]
      }
    }
  },
  // final projection
  
  {
    $project: {
      _id: 1,
      activationCode: 1,
      status: 1,
      playerId: 1,
      gameId: 1,
      gameStartedAt: 1,
      gameFinishedAt: 1,
      score: 1,
      updatedAt: 1,
      createdAt: 1,
      game: {
        _id: '$g._id',
        title: '$g.title',
        language: '$g.language',
        status: '$g.status',
        timeLimit: '$g.timeLimit',
        duration: '$g.duration',
        endTime: '$g.endTime',
        thumbnailUrl: '$g.thumbnail',
        tags: '$g.tags',
        createdAt: '$g.createdAt',
        updatedAt: '$g.updatedAt'
      },
      questionsDetailed: 1
    }
  }
]

export const getPlayerGameWithQuestions = async (
  req: Request,
  res: Response
) => {
  const playerId = res.locals.user.playerId as string
  const gameId = (req.params.gameId ?? req.query.gameId) as string
  console.log(playerId, gameId)

  const gameLogData = await GameLogs.aggregate(getPlayerGameWithQuestionsPipeline(playerId, gameId))
  console.log(gameLogData)
  if (!gameLogData) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      message: 'Game log not found'
    })
  }
  return res.status(httpStatus.OK).json({
    success: true,
    message: 'Game log retrieved successfully',
    gameLog: gameLogData
  })
}
