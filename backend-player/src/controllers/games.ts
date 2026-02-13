import { Request, Response } from 'express'
import GameActivation from '../db/models/game-activation.schema'
import { matchedData } from 'express-validator'
import httpStatus from 'http-status'
import GameInfo from '../db/models/game-info.schema'
import GameQuestions from '../db/models/game-questions.schema'
import mongoose from 'mongoose'
import GameLogs, { GameStatus } from '../db/models/played-game-status.schema'

// export const joinGameController = async(req: Request, res: Response) => {
//     const validatedData = matchedData(req);

//     /**
//      * Please insert the logic of game continuation after user has scanned the code previously
//      */

//     const { user } = res.locals;

//     console.log("user", user);

//     const gameActivationExists = await GameActivation.findOne({
//         playerId: user.playerId,
//         gameId: validatedData.gameId,

//     });

//     if (!gameActivationExists) {
//         return res.status(httpStatus.NOT_FOUND).json({
//             success: false,
//             message: 'No such game purchase found'
//         });
//     }

//     if (gameActivationExists.expiresAt < new Date()) {
//         return res.status(httpStatus.BAD_REQUEST).json({
//             success: false,
//             message: 'Game has expired'
//         });
//     }

//     console.log("gameActivationExists", gameActivationExists);
//     console.log("validatedData", validatedData);

//     if (gameActivationExists.activationCode !== validatedData.activationCode) {
//         return res.status(httpStatus.BAD_REQUEST).json({
//             success: false,
//             message: 'Invalid activation code'
//         });
//     }

//     const aggregationPipeline = [
//         { $match: { game: new mongoose.Types.ObjectId(validatedData.gameId) } },
//         { $unwind: { path: '$questions', preserveNullAndEmptyArrays: true } },
//         {
//             $lookup: {
//                 from: 'Questions',
//                 localField: 'questions.questionId',
//                 foreignField: '_id',
//                 as: 'questionDetails'
//             }
//         },
//         {
//             $lookup: {
//                 from: 'QuestionSettings',
//                 localField: 'questions.questionId',
//                 foreignField: 'questionId',
//                 as: 'questionSettings'
//             }
//         },
//         {
//             $lookup: {
//                 from: 'QuestionMedia',
//                 localField: 'questions.questionId',
//                 foreignField: 'questionId',
//                 as: 'questionMedia'
//             }
//         },
//         {
//             $lookup: {
//                 from: 'QuestionComment',
//                 localField: 'questions.questionId',
//                 foreignField: 'questionId',
//                 as: 'questionComments'
//             }
//         },
//         {
//             $lookup: {
//                 from: 'Tags',
//                 localField: 'questionDetails.tags',
//                 foreignField: '_id',
//                 as: 'tagsDetails'
//             }
//         },
//         {
//             $addFields: {
//                 'questions.questionDetails': { $arrayElemAt: ['$questionDetails', 0] },
//                 'questions.settings': { $arrayElemAt: ['$questionSettings', 0] },
//                 'questions.media': { $arrayElemAt: ['$questionMedia', 0] },
//                 'questions.comments': { $arrayElemAt: ['$questionComments', 0] },
//                 'questions.tags': '$tagsDetails'
//             }
//         },
//         {
//             $group: {
//                 _id: '$_id',
//                 game: { $first: '$game' },
//                 questions: { $push: '$questions' },
//                 blocklyJsonRules: { $first: '$blocklyJsonRules' },
//                 blocklyXmlRules: { $first: '$blocklyXmlRules' },
//                 createdAt: { $first: '$createdAt' },
//                 updatedAt: { $first: '$updatedAt' }
//             }
//         },
//         {
//             $lookup: {
//                 from: 'GameInfo',
//                 localField: 'game',
//                 foreignField: '_id',
//                 as: 'gameDetails'
//             }
//         },
//         {
//             $addFields: {
//                 game: {
//                     $let: {
//                         vars: { gameData: { $arrayElemAt: ['$gameDetails', 0] } },
//                         in: {
//                             _id: '$$gameData._id',
//                             title: '$$gameData.title',
//                             status: '$$gameData.status' ,
//                             backGroundImage:'$$gameData.backGroundImage',
//                             thumbnail: '$$gameData.thumbnail',
//                             duration: '$$gameData.duration',
//                             endTime: '$$gameData.endTime',
//                             timeLimit: '$$gameData.timeLimit',
//                             language: '$$gameData.language',

//                         }
//                     }
//                 }
//             }
//         },
//         {
//             $project: {
//                 _id: 1,
//                 game: 1,
//                 questions: {
//                     $map: {
//                         input: '$questions',
//                         as: 'q',
//                         in: {
//                             _id: '$$q._id',
//                             question: {
//                                 $mergeObjects: [
//                                     '$$q.questionDetails',
//                                     {
//                                         tags: '$$q.tags',
//                                         icon: { $ifNull: ['$$q.settings.icon', null] },
//                                         iconName: { $ifNull: ['$$q.settings.iconName', null] },
//                                         locationRadius: { $ifNull: ['$$q.settings.locationRadius', null] },
//                                         radiusColor: { $ifNull: ['$$q.settings.radiusColor', null] }
//                                     }
//                                 ]
//                             },
//                             settings: {
//                                 timeLimit: { $ifNull: ['$$q.settings.timeLimit', null] },
//                                 timeUnit: { $ifNull: ['$$q.settings.timeUnit', 'seconds'] },
//                                 iconName: { $ifNull: ['$$q.settings.iconName', null] },
//                                 radiusColor: { $ifNull: ['$$q.settings.radiusColor', null] },
//                                 locationRadius: { $ifNull: ['$$q.settings.locationRadius', null] },
//                                 icon: { $ifNull: ['$$q.settings.icon', null] },
//                                 language: { $ifNull: ['$$q.settings.language', 'english'] },
//                                 behaviorOption: { $ifNull: ['$$q.settings.behaviorOption', 'remove_on_answer'] },
//                                 durations: { $ifNull: ['$$q.settings.durations', null] }
//                             },
//                             media: {
//                                 images: { $ifNull: ['$$q.media.images', []] },
//                                 videos: { $ifNull: ['$$q.media.videos', []] },
//                                 videoUrls: { $ifNull: ['$$q.media.videoUrls', []] },
//                                 audios: { $ifNull: ['$$q.media.audios', []] }
//                             },
//                             comments: {
//                                 hints: { $ifNull: ['$$q.comments.hints', null] },
//                                 commentsAfterCorrection: { $ifNull: ['$$q.comments.commentsAfterCorrection', null] },
//                                 commentsAfterRejection: { $ifNull: ['$$q.comments.commentsAfterRejection', null] }
//                             },
//                             latitude: { $arrayElemAt: ['$$q.location.coordinates', 1] },
//                             longitude: { $arrayElemAt: ['$$q.location.coordinates', 0] },
//                             radius: '$$q.radius',
//                             order: '$$q.order',
//                             isFinished: false,
//                             isCorrect: false,
//                             isDisplayed: false
//                         }
//                     }
//                 },
//                 blocklyJsonRules: 1,
//                 blocklyXmlRules: 1,
//                 createdAt: 1,
//                 updatedAt: 1
//             }
//         }
//     ];

//     const game = await GameQuestions.aggregate(aggregationPipeline);

//     /**
//      * we will create a new game status schema which will store game details points etc
//      */

//     if (game.length === 0) {
//         return res.status(httpStatus.NOT_FOUND).json({
//             success: false,
//             message: 'Cannot Join Game.',
//         });
//     }

//     return res.status(httpStatus.OK).json({
//         success: true,
//         message: 'Game joined successfully',
//         game: game[0]
//     });
// };
const createPipelineForGameLogs = (
  gameId: string,
  playerId: string,
  activationCode?: string
) => {
  return [
    {
      $match: {
        playerId: playerId,
        gameId: new mongoose.Types.ObjectId(gameId),
        ...(activationCode ? { activationCode: activationCode } : {})
      }
    },
    { $unwind: { path: '$questions', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'GameQuestions',
        localField: 'gameId',
        foreignField: 'game',
        as: 'gameRules'
      }
    },
    { $unwind: { path: '$gameRules', preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        blocklyJsonRules: '$gameRules.blocklyJsonRules',
        blocklyXmlRules: '$gameRules.blocklyXmlRules'
      }
    },
    {
      $lookup: {
        from: 'Questions',
        localField: 'questions._id',
        foreignField: '_id',
        as: 'questionDetails'
      }
    },
    {
      $lookup: {
        from: 'QuestionSettings',
        localField: 'questions._id',
        foreignField: 'questionId',
        as: 'questionSettings'
      }
    },
    {
      $lookup: {
        from: 'QuestionMedia',
        localField: 'questions._id',
        foreignField: 'questionId',
        as: 'questionMedia'
      }
    },
    {
      $lookup: {
        from: 'QuestionComment',
        localField: 'questions._id',
        foreignField: 'questionId',
        as: 'questionComments'
      }
    },
    {
      $lookup: {
        from: 'Tags',
        localField: 'questionDetails.tags',
        foreignField: '_id',
        as: 'tagsDetails'
      }
    },
    {
      $addFields: {
        'questions.questionDetails': { $arrayElemAt: ['$questionDetails', 0] },
        'questions.settings': { $arrayElemAt: ['$questionSettings', 0] },
        'questions.media': { $arrayElemAt: ['$questionMedia', 0] },
        'questions.comments': { $arrayElemAt: ['$questionComments', 0] },
        'questions.tags': '$tagsDetails',
        'questions.isFinished': '$questions.isFinished',
        'questions.isCorrect': '$questions.isCorrect',
        'questions.isDisplayed': '$questions.isDisplayed',
        'questions.isShownOnPlayground': '$questions.isShownOnPlayground',
        'questions.latitude': '$questions.latitude',
        'questions.longitude': '$questions.longitude'
      }
    },
    {
      $lookup: {
        from: 'GameInfo',
        localField: 'gameId',
        foreignField: '_id',
        as: 'gameDetails'
      }
    },
    {
      $addFields: {
        game: {
          $let: {
            vars: { g: { $arrayElemAt: ['$gameDetails', 0] } },
            in: {
              _id: '$$g._id',
              title: '$$g.title',
              status: '$$g.status',
              backGroundImage: '$$g.backGroundImage',
              thumbnail: '$$g.thumbnail',
              duration: '$$g.duration',
              endTime: '$$g.endTime',
              timeLimit: '$$g.timeLimit',
              language: '$$g.language',
              introMessage: '$$g.introMessage',
              finishMessage: '$$g.finishMessage',
              playgroundImage: '$$g.playgroundImage',
              playgroundName: '$$g.playgroundName'
            }
          }
        }
      }
    },
    {
      $group: {
        _id: '$_id',
        game: { $first: '$game' },
        gameRules: { $first: '$gameRules' },
        questions: { $push: '$questions' },
        createdAt: { $first: '$createdAt' },
        updatedAt: { $first: '$updatedAt' },
        status: { $first: '$status' },
        blocklyJsonRules: { $first: '$blocklyJsonRules' },
        blocklyXmlRules: { $first: '$blocklyXmlRules' },
        score: { $first: '$score' },
        timerConditions: { $first: '$timerConditions' }
      }
    },
    {
      $project: {
        _id: 1,
        game: 1,
        questions: {
          $map: {
            input: '$questions',
            as: 'q',
            in: {
              _id: '$$q._id',
              question: {
                $mergeObjects: [
                  '$$q.questionDetails',
                  {
                    tags: '$$q.tags',
                    icon: { $ifNull: ['$$q.settings.icon', null] },
                    iconName: { $ifNull: ['$$q.settings.iconName', null] },
                    locationRadius: {
                      $ifNull: ['$$q.settings.locationRadius', null]
                    },
                    radiusColor: { $ifNull: ['$$q.settings.radiusColor', null] }
                  }
                ]
              },
              settings: {
                timeLimit: { $ifNull: ['$$q.settings.timeLimit', null] },
                timeUnit: { $ifNull: ['$$q.settings.timeUnit', 'seconds'] },
                iconName: { $ifNull: ['$$q.settings.iconName', null] },
                radiusColor: { $ifNull: ['$$q.settings.radiusColor', null] },
                locationRadius: {
                  $ifNull: ['$$q.settings.locationRadius', null]
                },
                icon: { $ifNull: ['$$q.settings.icon', null] },
                language: { $ifNull: ['$$q.settings.language', 'english'] },
                behaviorOption: {
                  $ifNull: ['$$q.settings.behaviorOption', 'remove_on_answer']
                },
                durations: { $ifNull: ['$$q.settings.durations', null] }
              },
              media: {
                images: { $ifNull: ['$$q.media.images', []] },
                videos: { $ifNull: ['$$q.media.videos', []] },
                videoUrls: { $ifNull: ['$$q.media.videoUrls', []] },
                audios: { $ifNull: ['$$q.media.audios', []] }
              },
              comments: {
                hints: { $ifNull: ['$$q.comments.hints', null] },
                commentsAfterCorrection: {
                  $ifNull: ['$$q.comments.commentsAfterCorrection', null]
                },
                commentsAfterRejection: {
                  $ifNull: ['$$q.comments.commentsAfterRejection', null]
                }
              },
              // latitude: { $arrayElemAt: ['$$q.location.coordinates', 1] },
              // longitude: { $arrayElemAt: ['$$q.location.coordinates', 0] },
              radius: '$$q.radius',
              order: '$$q.order',
              isFinished: '$$q.isFinished',
              isCorrect: '$$q.isCorrect',
              isDisplayed: '$$q.isDisplayed',
              isShownOnPlayground: '$$q.isShownOnPlayground',
              latitude: '$$q.latitude',
              longitude: '$$q.longitude'
            }
          }
        },
        blocklyJsonRules: 1,
        blocklyXmlRules: 1,
        createdAt: 1,
        updatedAt: 1,
        status: 1,
        score: { $ifNull: ['$score', 0] },
        timerConditions: { $ifNull: ['$timerConditions', []] }
      }
    }
  ]
}
export const joinGameController = async (req: Request, res: Response) => {
  const validatedData = matchedData(req)
  const { user } = res.locals
  var gameDataToSend = null
  // console.dir(createPipelineForGameLogs(validatedData.gameId, user.playerId), {
  //   depth: null
  // })
  const gameStatus = await GameLogs.aggregate(
    createPipelineForGameLogs(
      validatedData.gameId,
      user.playerId,
      validatedData?.activationCode
    )
  )
  if (gameStatus[0] && gameStatus[0].status === GameStatus.FINISHED) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: 'Game has already finished.'
    })
  }
  const activations = await GameActivation.find({ playerId: user.playerId })

  if (!activations || activations.length === 0) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      message: 'No game purchases found'
    })
  }
  console.log({ activations, playerId: user.playerId })

  const activation = activations.find(
    (a) =>
      a.gameId.toString() === validatedData.gameId &&
      a.activationCode === validatedData.activationCode
  )

  if (!activation) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: 'Invalid activation or game not purchased'
    })
  }

  if (activation.expiresAt < new Date()) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: 'Game has expired'
    })
  }

  const aggregationPipeline = [
    { $match: { game: new mongoose.Types.ObjectId(validatedData.gameId) } },
    { $unwind: { path: '$questions', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'Questions',
        localField: 'questions.questionId',
        foreignField: '_id',
        as: 'questionDetails'
      }
    },
    {
      $lookup: {
        from: 'QuestionSettings',
        localField: 'questions.questionId',
        foreignField: 'questionId',
        as: 'questionSettings'
      }
    },
    {
      $lookup: {
        from: 'QuestionMedia',
        localField: 'questions.questionId',
        foreignField: 'questionId',
        as: 'questionMedia'
      }
    },
    {
      $lookup: {
        from: 'QuestionComment',
        localField: 'questions.questionId',
        foreignField: 'questionId',
        as: 'questionComments'
      }
    },
    {
      $lookup: {
        from: 'Tags',
        localField: 'questionDetails.tags',
        foreignField: '_id',
        as: 'tagsDetails'
      }
    },
    {
      $addFields: {
        'questions.questionDetails': { $arrayElemAt: ['$questionDetails', 0] },
        'questions.settings': { $arrayElemAt: ['$questionSettings', 0] },
        'questions.media': { $arrayElemAt: ['$questionMedia', 0] },
        'questions.comments': { $arrayElemAt: ['$questionComments', 0] },
        'questions.tags': '$tagsDetails'
      }
    },
    {
      $group: {
        _id: '$_id',
        game: { $first: '$game' },
        questions: { $push: '$questions' },
        blocklyJsonRules: { $first: '$blocklyJsonRules' },
        blocklyXmlRules: { $first: '$blocklyXmlRules' },
        createdAt: { $first: '$createdAt' },
        updatedAt: { $first: '$updatedAt' },
        score: { $first: '$score' },
        timerConditions: { $first: '$timerConditions' }
      }
    },
    {
      $lookup: {
        from: 'GameInfo',
        localField: 'game',
        foreignField: '_id',
        as: 'gameDetails'
      }
    },
    {
      $addFields: {
        game: {
          $let: {
            vars: { g: { $arrayElemAt: ['$gameDetails', 0] } },
            in: {
              _id: '$$g._id',
              title: '$$g.title',
              status: '$$g.status',
              backGroundImage: '$$g.backGroundImage',
              thumbnail: '$$g.thumbnail',
              duration: '$$g.duration',
              endTime: '$$g.endTime',
              timeLimit: '$$g.timeLimit',
              language: '$$g.language',
              introMessage: '$$g.introMessage',
              finishMessage: '$$g.finishMessage',
              playgroundImage: '$$g.playgroundImage',
              playgroundName: '$$g.playgroundName'
            }
          }
        }
      }
    },
    {
      $addFields: {
        gameLog: {
          $let: {
            vars: { g: { $arrayElemAt: ['$gameLogs', 0] } },
            in: {
              _id: '$$g._id',
              playerId: '$$g.playerId',
              gameId: '$$g.gameId',
              lastAccessedAt: '$$g.lastAccessedAt',
              status: '$$g.status',
              gameStartedAt: '$$g.gameStartedAt',
              activationCode: '$$g.activationCode'
            }
          }
        }
      }
    },
    {
      $project: {
        _id: 1,
        game: 1,
        questions: {
          $map: {
            input: '$questions',
            as: 'q',
            in: {
              _id: '$$q._id',
              question: {
                $mergeObjects: [
                  '$$q.questionDetails',
                  {
                    tags: '$$q.tags',
                    icon: { $ifNull: ['$$q.settings.icon', null] },
                    iconName: { $ifNull: ['$$q.settings.iconName', null] },
                    locationRadius: {
                      $ifNull: ['$$q.settings.locationRadius', null]
                    },
                    radiusColor: { $ifNull: ['$$q.settings.radiusColor', null] }
                  }
                ]
              },
              settings: {
                timeLimit: { $ifNull: ['$$q.settings.timeLimit', null] },
                timeUnit: { $ifNull: ['$$q.settings.timeUnit', 'seconds'] },
                iconName: { $ifNull: ['$$q.settings.iconName', null] },
                radiusColor: { $ifNull: ['$$q.settings.radiusColor', null] },
                locationRadius: {
                  $ifNull: ['$$q.settings.locationRadius', null]
                },
                icon: { $ifNull: ['$$q.settings.icon', null] },
                language: { $ifNull: ['$$q.settings.language', 'english'] },
                behaviorOption: {
                  $ifNull: ['$$q.settings.behaviorOption', 'remove_on_answer']
                },
                durations: { $ifNull: ['$$q.settings.durations', null] }
              },
              media: {
                images: { $ifNull: ['$$q.media.images', []] },
                videos: { $ifNull: ['$$q.media.videos', []] },
                videoUrls: { $ifNull: ['$$q.media.videoUrls', []] },
                audios: { $ifNull: ['$$q.media.audios', []] }
              },
              comments: {
                hints: { $ifNull: ['$$q.comments.hints', null] },
                commentsAfterCorrection: {
                  $ifNull: ['$$q.comments.commentsAfterCorrection', null]
                },
                commentsAfterRejection: {
                  $ifNull: ['$$q.comments.commentsAfterRejection', null]
                }
              },
              latitude: { $arrayElemAt: ['$$q.location.coordinates', 1] },
              longitude: { $arrayElemAt: ['$$q.location.coordinates', 0] },
              radius: '$$q.radius',
              order: '$$q.order',
              isFinished: false,
              isCorrect: false,
              isDisplayed: false,
              isShownOnPlayground: false
            }
          }
        },
        blocklyJsonRules: 1,
        blocklyXmlRules: 1,
        createdAt: 1,
        updatedAt: 1,
        score: { $ifNull: ['$score', 0] },
        timerConditions: { $ifNull: ['$timerConditions', []] }
      }
    }
  ]
  // console.log(gameStatus[0])
  console.dir({ aggregationPipeline }, { depth: null })
  if (
    gameStatus[0] !== undefined &&
    gameStatus[0]?.status === GameStatus.IN_PROGRESS
  ) {
    gameDataToSend = gameStatus[0]
  } else {
    const game = await GameQuestions.aggregate(aggregationPipeline)
    // console.log('Entered here')
    if (game.length === 0) {
      return res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: 'Cannot Join Game.'
      })
    }
    gameDataToSend = game[0]
  }

  return res.status(httpStatus.OK).json({
    success: true,
    message: 'Game joined successfully',
    game: gameDataToSend
  })
}

export const updateGameLogsController = async (req: Request, res: Response) => {
  try {
    const validatedData = matchedData(req)
    const { user } = res.locals

    const gameLogData = await GameLogs.findOne(validatedData)
    var options = {
      new: true,
      upsert: false
    }

    if (!gameLogData) {
      options.upsert = true
    }

    if (gameLogData && gameLogData.status === GameStatus.FINISHED) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Cannot update a finished game'
      })
    }

    const formattedQuestions = req.body?.questions.map((q: any) => ({
      ...q,
      _id: mongoose.Types.ObjectId.isValid(q._id)
        ? new mongoose.Types.ObjectId(q._id)
        : q._id // leave as-is if not valid ObjectId (e.g. temp string)
    }))

    await GameLogs.findOneAndUpdate(
      {
        gameId: validatedData.gameId,
        playerId: user.playerId,
        activationCode: validatedData.activationCode
      },
      {
        $set: {
          questions: formattedQuestions || [],
          status: req?.body?.status || GameStatus.IN_PROGRESS,
          gameFinishedAt:
            req?.body?.status === GameStatus.FINISHED ? new Date() : null,
          updatedAt: new Date(),
          score: req.body?.score || 0,
          timerConditions: req.body?.timerConditions || []
        }
      },
      options
    )

    return res.status(httpStatus.OK).json({
      success: true,
      message: 'Game Log updated successfully'
    })
  } catch (error) {
    console.error('Error in updateGameLogsController:', error)
    // return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
    //   success: false,
    //   message: 'An error occurred while updating game logs'
    // })
  }
}

export const getGamesController = async (req: Request, res: Response) => {
  const validatedData = matchedData(req)
  const page = Math.max(1, parseInt(validatedData.page)) || 1
  const limit = Math.max(1, Math.min(100, parseInt(validatedData.limit))) || 100
  const skip = (page - 1) * limit
  const searchTerm = validatedData.search?.trim() || ''

  const pipeline: any[] = [
    { $match: { status: 'active', isDeleted: { $ne: true } } },
    {
      $lookup: {
        from: 'Tags',
        localField: 'tags',
        foreignField: '_id',
        as: 'tags'
      }
    },
    {
      $lookup: {
        from: 'GameLogs',
        localField: '_id',
        foreignField: 'gameId',
        as: 'gameLogs'
      }
    }
  ]

  if (searchTerm) {
    const regex = new RegExp(searchTerm, 'i')
    pipeline.push({
      $match: {
        $or: [{ title: regex }, { 'tags.name': regex }]
      }
    })
  }

  pipeline.push(
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        _id: 1,
        title: 1,
        thumbnail: 1,
        timeLimit: 1,
        duration: 1,
        endTime: 1,
        language: 1,
        tags: { _id: 1, name: 1 },
        gameLogs: { status: 1, updatedAt: 1 }
      }
    }
  )

  const [games, totalDocsResult] = await Promise.all([
    GameInfo.aggregate(pipeline),
    GameInfo.aggregate([
      { $match: { status: 'active', isDeleted: { $ne: true } } },
      {
        $lookup: {
          from: 'Tags',
          localField: 'tags',
          foreignField: '_id',
          as: 'tags'
        }
      },
      ...(searchTerm
        ? [
            {
              $match: {
                $or: [
                  { title: new RegExp(searchTerm, 'i') },
                  { 'tags.name': new RegExp(searchTerm, 'i') }
                ]
              }
            }
          ]
        : []),
      { $count: 'totalDocs' }
    ])
  ])

  const totalDocs =
    totalDocsResult.length > 0 ? totalDocsResult[0].totalDocs : 0
  const totalPages = Math.ceil(totalDocs / limit)

  if (!games || games.length === 0) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      message: 'No active games found'
    })
  }

  return res.status(httpStatus.OK).json({
    success: true,
    message: 'Active games retrieved successfully',
    data: {
      docs: games,
      totalDocs,
      limit,
      page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  })
}

export const gameReverseController = async (req: Request, res: Response) => {
  const validatedData = matchedData(req)
  const { gameId, playerId } = validatedData
  const gameLogData = await GameLogs.findOne({
    gameId: gameId,
    playerId: playerId
  })
  if (!gameLogData) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      message: 'Game logs not found'
    })
  }
  const formattedQuestions = gameLogData?.questions.map((q: any) => ({
    ...q,
    ...{
      isDisplayed: false,
      isShownOnPlayground: false,
      isFinished: false,
      isCorrect: false
    }
  }))
  await GameLogs.findOneAndUpdate(
    {
      gameId: gameId,
      playerId: playerId
    },
    {
      $set: {
        questions: formattedQuestions || [],
        status: GameStatus.IN_PROGRESS,
        gameStartedAt: new Date(),
        gameFinishedAt:
          req?.body?.status === GameStatus.FINISHED ? new Date() : null
      }
    }
  )

  return res.status(httpStatus.OK).json({
    success: true,
    message: 'Game log retrieved successfully',
    gameLog: gameLogData
  })
}

export const getSpecificPlayerPlayedGamesHistory = async (
  req: Request,
  res: Response
) => {
  const { playerId } = req.params
  const gameLogData = await GameLogs.find({
    playerId: playerId
  })

  if (!gameLogData) {
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
