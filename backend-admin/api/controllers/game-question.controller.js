import handleError from '../utils/handleError.js';
import buildErrorObject from '../utils/buildErrorObject.js';
import buildResponse from '../utils/buildResponse.js';
import { matchedData } from 'express-validator';
import httpStatus from 'http-status';
import { GameQuestions } from '../models/game-questions.schema.js';
import GameInfo from '../models/game-info.schema.js';
import Questions from '../models/question.schema.js';
import mongoose from 'mongoose';

export const upsertGameQuestionsController = async (req, res) => {
  try {
    const validatedData = matchedData(req);
    const { gameId, questions, blocklyXmlRules, blocklyJsonRules } =
      validatedData;

    const gameExists = await GameInfo.findById(gameId);
    if (!gameExists) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'Game not found');
    }

    const questionIds = questions.map((q) => q.questionId);
    const existingQuestions = await Questions.find({
      _id: { $in: questionIds }
    });

    if (existingQuestions.length !== questionIds.length) {
      throw buildErrorObject(
        httpStatus.NOT_FOUND,
        'One or more questions not found'
      );
    }

    const uniqueQuestionIds = [
      ...new Set(questionIds.map((id) => id.toString()))
    ];
    if (uniqueQuestionIds.length !== questionIds.length) {
      throw buildErrorObject(
        httpStatus.BAD_REQUEST,
        'Duplicate questions not allowed'
      );
    }

    if (questions.length > 200) {
      throw buildErrorObject(
        httpStatus.BAD_REQUEST,
        'Maximum 200 questions allowed per game'
      );
    }

    const formattedQuestions = questions.map((q, index) => ({
      questionId: q.questionId,
      location: {
        type: 'Point',
        coordinates: [q.longitude, q.latitude]
      },
      radius: q.radius || 0,
      order: q.order ? q.order : index,
      isPlaced: q.isPlaced || false,
      isPlacedCanvas: q.isPlacedCanvas || false,
      canvasLocation: {
        type: 'Point',
        coordinates: [q.x, q.y]
      },
      iconSize: q.iconSize || 40,
      playgroundIndex: q.playgroundIndex || 1
    }));

    const existingDoc = await GameQuestions.findOne({ game: gameId });
    const isUpdate = !!existingDoc;

    const gameQuestions = await GameQuestions.findOneAndUpdate(
      { game: gameId },
      {
        game: gameId,
        questions: formattedQuestions,
        blocklyXmlRules: blocklyXmlRules,
        blocklyJsonRules: blocklyJsonRules
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    )
      .populate('questions.questionId', 'questionName answerType points tags')
      .populate('game', 'title status language')
      .lean();

    const formattedResponse = {
      _id: gameQuestions._id,
      game: gameQuestions.game,
      questions: gameQuestions.questions.map((q) => ({
        questionId: q.questionId,
        latitude: q.location.coordinates[1],
        longitude: q.location.coordinates[0],
        radius: q.radius,
        order: q.order,
        _id: q._id,
        isPlaced: q.isPlaced,
        isPacedCanvas: q.isPlacedCanvas,
        x: q.canvasLocation?.coordinates[0],
        y: q.canvasLocation?.coordinates[1],
        iconSize: q.iconSize || 40,
        playgroundIndex: q.playgroundIndex || 1
      })),
      createdAt: gameQuestions.createdAt,
      updatedAt: gameQuestions.updatedAt
    };

    const statusCode = isUpdate ? httpStatus.OK : httpStatus.CREATED;
    const message = isUpdate
      ? `${formattedQuestions.length} game questions updated successfully`
      : `${formattedQuestions.length} game questions created successfully`;

    res
      .status(statusCode)
      .json(buildResponse(statusCode, formattedResponse, message));
  } catch (err) {
    handleError(res, err);
  }
};

export const getGameQuestionsController = async (req, res) => {
  try {
    const { gameId } = matchedData(req);

    const gameExists = await GameInfo.findById(gameId);
    if (!gameExists) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'Game not found');
    }

    const aggregationPipeline = [
      { $match: { game: new mongoose.Types.ObjectId(gameId) } },
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
          from: 'Tags',
          localField: 'questionDetails.tags',
          foreignField: '_id',
          as: 'tagsDetails'
        }
      },
      {
        $addFields: {
          'questions.questionDetails': {
            $arrayElemAt: ['$questionDetails', 0]
          },
          'questions.settings': { $arrayElemAt: ['$questionSettings', 0] },
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
          updatedAt: { $first: '$updatedAt' }
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
              vars: { gameData: { $arrayElemAt: ['$gameDetails', 0] } },
              in: {
                _id: '$$gameData._id',
                title: '$$gameData.title',
                status: '$$gameData.status'
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
                      radiusColor: {
                        $ifNull: ['$$q.settings.radiusColor', null]
                      }
                    }
                  ]
                },
                latitude: { $arrayElemAt: ['$$q.location.coordinates', 1] },
                longitude: { $arrayElemAt: ['$$q.location.coordinates', 0] },
                radius: '$$q.radius',
                order: '$$q.order',
                isPlaced: '$$q.isPlaced',
                isPlacedCanvas: '$$q.isPlacedCanvas',
                x: { $arrayElemAt: ['$$q.canvasLocation.coordinates', 1] },
                y: { $arrayElemAt: ['$$q.canvasLocation.coordinates', 0] },
                iconSize: { $ifNull: ['$$q.iconSize', 40] },
                playgroundIndex: { $ifNull: ['$$q.playgroundIndex', 1] }
              }
            }
          },
          blocklyJsonRules: 1,
          blocklyXmlRules: 1,
          createdAt: 1,
          updatedAt: 1
        }
      }
    ];

    const result = await GameQuestions.aggregate(aggregationPipeline);

    if (!result || result.length === 0) {
      return res
        .status(httpStatus.OK)
        .json(
          buildResponse(
            httpStatus.OK,
            { game: gameId, questions: [] },
            'No questions found for this game'
          )
        );
    }

    const gameQuestions = result[0];

    const formattedResponse = {
      _id: gameQuestions._id,
      game: gameQuestions.game,
      questions: gameQuestions.questions.sort((a, b) => a.order - b.order),
      blocklyJsonRules: gameQuestions.blocklyJsonRules,
      blocklyXmlRules: gameQuestions.blocklyXmlRules,
      createdAt: gameQuestions.createdAt,
      updatedAt: gameQuestions.updatedAt
    };

    res
      .status(httpStatus.OK)
      .json(
        buildResponse(
          httpStatus.OK,
          formattedResponse,
          'Game questions retrieved successfully'
        )
      );
  } catch (err) {
    handleError(res, err);
  }
};

export const getAllGameQuestionsController = async (req, res) => {
  try {
    const validatedData = matchedData(req);

    const page = Math.max(1, parseInt(validatedData.page)) || 1;
    const limit =
      Math.max(1, Math.min(100, parseInt(validatedData.limit))) || 10;
    const skip = (page - 1) * limit;

    const matchFilter = {};

    if (validatedData.gameId) {
      matchFilter.gameId = validatedData.gameId;
    }

    const sortOrder = validatedData.sortBy === 'asc' ? 1 : -1;
    const sortField = validatedData.sortField || 'createdAt';

    const aggregationPipeline = [
      { $match: matchFilter },
      { $sort: { [sortField]: sortOrder } },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [
            { $skip: skip },
            { $limit: limit },
            // Unwind questions array to process each question
            {
              $unwind: { path: '$questions', preserveNullAndEmptyArrays: true }
            },
            // Lookup question details
            {
              $lookup: {
                from: 'Questions',
                localField: 'questions.questionId',
                foreignField: '_id',
                as: 'questionDetails'
              }
            },
            // Lookup question settings
            {
              $lookup: {
                from: 'QuestionSettings',
                localField: 'questions.questionId',
                foreignField: 'questionId',
                as: 'questionSettings'
              }
            },
            // Lookup tags
            {
              $lookup: {
                from: 'Tags',
                localField: 'questionDetails.tags',
                foreignField: '_id',
                as: 'tagsDetails'
              }
            },
            // Add fields from lookups
            {
              $addFields: {
                'questions.questionDetails': {
                  $arrayElemAt: ['$questionDetails', 0]
                },
                'questions.settings': {
                  $arrayElemAt: ['$questionSettings', 0]
                },
                'questions.tags': '$tagsDetails'
              }
            },
            // Group back to original structure
            {
              $group: {
                _id: '$_id',
                gameId: { $first: '$gameId' },
                questions: { $push: '$questions' },
                createdAt: { $first: '$createdAt' },
                updatedAt: { $first: '$updatedAt' }
              }
            },
            // Lookup game details
            {
              $lookup: {
                from: 'Games',
                localField: 'gameId',
                foreignField: '_id',
                as: 'game'
              }
            },
            {
              $addFields: {
                game: { $arrayElemAt: ['$game', 0] }
              }
            },
            // Project final structure
            {
              $project: {
                _id: 1,
                game: {
                  _id: '$game._id',
                  title: '$game.title',
                  status: '$game.status',
                  language: '$game.language'
                },
                questions: {
                  $map: {
                    input: '$questions',
                    as: 'q',
                    in: {
                      _id: '$$q._id',
                      questionId: {
                        _id: '$$q.questionDetails._id',
                        questionName: '$$q.questionDetails.questionName',
                        answerType: '$$q.questionDetails.answerType',
                        points: '$$q.questionDetails.points',
                        tags: '$$q.tags',
                        icon: { $ifNull: ['$$q.settings.icon', null] },
                        iconName: { $ifNull: ['$$q.settings.iconName', null] },
                        locationRadius: {
                          $ifNull: ['$$q.settings.locationRadius', null]
                        },
                        radiusColor: {
                          $ifNull: ['$$q.settings.radiusColor', null]
                        }
                      },
                      latitude: {
                        $arrayElemAt: ['$$q.location.coordinates', 1]
                      },
                      longitude: {
                        $arrayElemAt: ['$$q.location.coordinates', 0]
                      },
                      radius: '$$q.radius',
                      order: '$$q.order'
                    }
                  }
                },
                createdAt: 1,
                updatedAt: 1
              }
            }
          ]
        }
      }
    ];

    const result = await GameQuestions.aggregate(aggregationPipeline);

    const totalDocs = result[0]?.metadata[0]?.total || 0;
    const totalPages = Math.ceil(totalDocs / limit);
    const gameQuestions = result[0]?.data || [];

    // Sort questions by order
    const formattedGameQuestions = gameQuestions.map((gq) => ({
      ...gq,
      questions: gq.questions.sort((a, b) => a.order - b.order)
    }));

    const response = {
      docs: formattedGameQuestions,
      totalDocs,
      limit,
      page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };

    res
      .status(httpStatus.OK)
      .json(
        buildResponse(
          httpStatus.OK,
          response,
          'Game questions retrieved successfully'
        )
      );
  } catch (err) {
    handleError(res, err);
  }
};

export const getNearbyQuestionsController = async (req, res) => {
  try {
    const validatedData = matchedData(req);
    const { latitude, longitude, maxDistance, gameId } = validatedData;

    const filter = {
      'questions.location': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: maxDistance || 1000
        }
      }
    };

    if (gameId) {
      filter.game = gameId;
    }

    const nearbyGameQuestions = await GameQuestions.find(filter)
      .populate('questions.questionId')
      .populate('game', 'title status')
      .lean();

    const formattedQuestions = [];

    nearbyGameQuestions.forEach((gq) => {
      gq.questions.forEach((q) => {
        const distance = calculateDistance(
          latitude,
          longitude,
          q.location.coordinates[1],
          q.location.coordinates[0]
        );

        if (distance <= (maxDistance || 1000)) {
          formattedQuestions.push({
            gameId: gq.game,
            questionId: q.questionId,
            latitude: q.location.coordinates[1],
            longitude: q.location.coordinates[0],
            radius: q.radius,
            order: q.order,
            distance: Math.round(distance),
            _id: q._id
          });
        }
      });
    });

    formattedQuestions.sort((a, b) => a.distance - b.distance);

    res
      .status(httpStatus.OK)
      .json(
        buildResponse(
          httpStatus.OK,
          formattedQuestions,
          'Nearby questions retrieved successfully'
        )
      );
  } catch (err) {
    handleError(res, err);
  }
};

export const deleteGameQuestionsController = async (req, res) => {
  try {
    const { gameId } = matchedData(req);

    const gameExists = await GameInfo.findById(gameId);
    if (!gameExists) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'Game not found');
    }

    const result = await GameQuestions.deleteOne({ game: gameId });

    if (result.deletedCount === 0) {
      throw buildErrorObject(
        httpStatus.NOT_FOUND,
        'No game questions found to delete'
      );
    }

    res
      .status(httpStatus.OK)
      .json(
        buildResponse(httpStatus.OK, {}, 'Game questions deleted successfully')
      );
  } catch (err) {
    handleError(res, err);
  }
};

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
