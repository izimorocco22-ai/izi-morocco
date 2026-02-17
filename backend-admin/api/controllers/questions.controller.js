import handleError from '../utils/handleError.js';
import buildErrorObject from '../utils/buildErrorObject.js';
import buildResponse from '../utils/buildResponse.js';
import { matchedData } from 'express-validator';
import httpStatus from 'http-status';
import Questions from '../models/question.schema.js';
import Tags from '../models/tags.schema.js';
import Puzzles from '../models/puzzle.schema.js';
import mongoose from 'mongoose';
import Comments from '../models/question-comments.schema.js';
import Medias from '../models/question-media.schema.js';
import Settings from '../models/questions-settings.schema.js';

export const createQuestion = async (req, res) => {
  try {
    const validatedData = matchedData(req);

    if (validatedData.tags && validatedData.tags.length > 0) {
      const existingTags = await Tags.find({
        _id: { $in: validatedData.tags },
        isDeleted: { $ne: true }
      }).select('_id');

      if (existingTags.length !== validatedData.tags.length) {
        throw buildErrorObject(
          httpStatus.BAD_REQUEST,
          'One or more tags are invalid'
        );
      }
      validatedData.tags = existingTags.map((tag) => tag._id);
    }

    if (validatedData.answerType === 'puzzle' && validatedData.puzzle) {
      const puzzleExists = await Puzzles.findOne({
        _id: validatedData.puzzle,
        isDeleted: { $ne: true }
      });

      if (!puzzleExists) {
        throw buildErrorObject(httpStatus.BAD_REQUEST, 'Puzzle not found');
      }
    }

    if (validatedData.answerType === 'no_answer') {
      validatedData.correctAnswers = [];
      validatedData.puzzle = undefined;
      validatedData.puzzleAnswerText = undefined;
    }

    if (validatedData.answerType === 'puzzle') {
      validatedData.correctAnswers = [];
    }

    if (validatedData.answerType && validatedData.answerType !== 'puzzle') {
      validatedData.puzzle = undefined;
      validatedData.puzzleAnswerText = undefined;
    }

    if (!validatedData.createdBy) {
      validatedData.createdBy = req.user?.id;
    }

    console.log('CreateQuestion: user', req.user?._id);
    console.log('CreateQuestion: validated', {
      questionName: validatedData.questionName,
      answerType: validatedData.answerType,
      puzzle: validatedData.puzzle,
      puzzleAnswerType: validatedData.puzzleAnswerType,
      puzzleAnswerText: validatedData.puzzleAnswerText,
      optionsCount: Array.isArray(validatedData.options) ? validatedData.options.length : 0,
      correctAnswers: validatedData.correctAnswers,
      codeBoxConfig: validatedData.codeBoxConfig,
      tagsCount: Array.isArray(validatedData.tags) ? validatedData.tags.length : 0,
      points: validatedData.points
    });

    validatedData.createdBy = req.user._id;

    const newQuestion = new Questions(validatedData);
    console.log('CreateQuestion: saving...');
    await newQuestion.save();
    console.log('CreateQuestion: saved', {
      _id: newQuestion._id,
      answerType: newQuestion.answerType,
      puzzle: newQuestion.puzzle,
      puzzleAnswerType: newQuestion.puzzleAnswerType,
      puzzleAnswerText: newQuestion.puzzleAnswerText,
      optionsCount: Array.isArray(newQuestion.options) ? newQuestion.options.length : 0,
      correctAnswers: newQuestion.correctAnswers,
      codeBoxConfig: newQuestion.codeBoxConfig
    });

    res
      .status(httpStatus.CREATED)
      .json(
        buildResponse(
          httpStatus.CREATED,
          newQuestion,
          'Question created successfully'
        )
      );
  } catch (err) {
    handleError(res, err);
  }
};

export const editQuestion = async (req, res) => {
  try {
    const validatedData = matchedData(req);
    const { id } = validatedData;

    console.log('EditQuestion: validated', {
      id,
      questionName: validatedData.questionName,
      answerType: validatedData.answerType,
      puzzle: validatedData.puzzle,
      puzzleAnswerType: validatedData.puzzleAnswerType,
      puzzleAnswerText: validatedData.puzzleAnswerText,
      optionsCount: Array.isArray(validatedData.options) ? validatedData.options.length : undefined,
      correctAnswers: validatedData.correctAnswers,
      codeBoxConfig: validatedData.codeBoxConfig,
      points: validatedData.points
    });

    const question = await Questions.findById(id);

    if (!question) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'Question not found');
    }

    if (question.isDeleted === true) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'Question is deleted');
    }

    if (validatedData.tags && validatedData.tags.length > 0) {
      const existingTags = await Tags.find({
        _id: { $in: validatedData.tags },
        isDeleted: { $ne: true }
      }).select('_id');

      if (existingTags.length !== validatedData.tags.length) {
        throw buildErrorObject(
          httpStatus.BAD_REQUEST,
          'One or more tags are invalid'
        );
      }
      validatedData.tags = existingTags.map((tag) => tag._id);
    }

    if (validatedData.answerType === 'puzzle' && validatedData.puzzle) {
      const puzzleExists = await Puzzles.findOne({
        _id: validatedData.puzzle,
        isDeleted: { $ne: true }
      });

      if (!puzzleExists) {
        throw buildErrorObject(httpStatus.BAD_REQUEST, 'Puzzle not found');
      }
    }

    if (validatedData.answerType === 'no_answer') {
      validatedData.correctAnswers = [];
      validatedData.puzzle = undefined;
      validatedData.puzzleAnswerText = undefined;
    }

    if (validatedData.answerType === 'puzzle') {
      validatedData.correctAnswers = [];
    }

    if (validatedData.answerType && validatedData.answerType !== 'puzzle') {
      validatedData.puzzle = undefined;
      validatedData.puzzleAnswerText = undefined;
    }

    Object.assign(question, validatedData);
    console.log('EditQuestion: saving...', { id: question._id });
    await question.save();
    console.log('EditQuestion: saved', {
      _id: question._id,
      answerType: question.answerType,
      puzzle: question.puzzle,
      puzzleAnswerType: question.puzzleAnswerType,
      puzzleAnswerText: question.puzzleAnswerText,
      optionsCount: Array.isArray(question.options) ? question.options.length : 0,
      correctAnswers: question.correctAnswers,
      codeBoxConfig: question.codeBoxConfig
    });

    res
      .status(httpStatus.OK)
      .json(
        buildResponse(httpStatus.OK, question, 'Question updated successfully')
      );
  } catch (err) {
    handleError(res, err);
  }
};

// export const getQuestions = async (req, res) => {
//   try {
//     const validatedData = matchedData(req);
//     let { page = 1, limit = 10, search = '', answerType, tags } = validatedData;

//     page = Number(page) || 1;
//     limit = Number(limit) || 10;
//     if (limit > 50) limit = 50;

//     const filter = { isDeleted: { $ne: true } };

//     if (search) {
//       filter.questionName = { $regex: search, $options: 'i' };
//     }

//     if (answerType) {
//       filter.answerType = answerType;
//     }

//     if (tags) {
//       filter.tags = tags;
//     }

//     const [total, questions] = await Promise.all([
//       Questions.countDocuments(filter),
//       Questions.find(filter)
//         .skip((page - 1) * limit)
//         .limit(limit)
//         .sort({ createdAt: -1 })
//         .populate('tags')
//         .populate('puzzle')
//         .populate('createdBy', 'name email')
//         .lean()
//     ]);

//     const response = {
//       docs: questions,
//       totalDocs: total,
//       limit: limit,
//       page: page,
//       totalPages: Math.ceil(total / limit),
//       hasNextPage: page * limit < total,
//       hasPrevPage: page > 1
//     };

//     res.status(httpStatus.OK).json(
//       buildResponse(httpStatus.OK, response, 'Questions fetched successfully')
//     );
//   } catch (err) {
//     handleError(res, err);
//   }
// };

export const getQuestions = async (req, res) => {
  try {
    const validatedData = matchedData(req);
    // Use req.query directly for search and tags to avoid potential issues with matchedData
    // in complex validator chains, while still using validated defaults.
    const search = req.query.search || validatedData.search || '';
    const tagAsString = req.query.tags || validatedData.tags || '';
    let {
      page = 1,
      limit = 10,
      answerType
    } = validatedData;

    console.log('--- Request Query:', req.query);
    console.log('--- Validated Data:', validatedData);

    const tags = tagAsString && typeof tagAsString === 'string'
      ? tagAsString.split(',').map((tag) => tag.trim()).filter(Boolean)
      : [];

    console.log({ search, tags });

    page = Number(page) || 1;
    limit = Number(limit) || 10;
    if (limit > 50) limit = 50;

    const matchFilter = { isDeleted: { $ne: true } };

    if (search) {
      matchFilter.questionName = { $regex: search, $options: 'i' };
    }

    if (answerType) {
      matchFilter.answerType = answerType;
    }

    if (tags && tags.length > 0) {
      const objectTags = tags.map((tag) => new mongoose.Types.ObjectId(tag));

      matchFilter.tags = {
        $in: objectTags
      };
    }

    const aggregationPipeline = [
      { $match: matchFilter },
      {
        $lookup: {
          from: 'QuestionSettings',
          localField: '_id',
          foreignField: 'questionId',
          as: 'settings'
        }
      },
      {
        $addFields: {
          icon: {
            $ifNull: [{ $arrayElemAt: ['$settings.icon', 0] }, null]
          },
          iconName: {
            $ifNull: [{ $arrayElemAt: ['$settings.iconName', 0] }, null]
          },
          locationRadius: {
            $ifNull: [{ $arrayElemAt: ['$settings.locationRadius', 0] }, null]
          },
          radiusColor: {
            $ifNull: [{ $arrayElemAt: ['$settings.radiusColor', 0] }, null]
          }
        }
      },
      { $project: { settings: 0 } },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [
            { $skip: (page - 1) * limit },
            { $limit: limit },
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
                from: 'Puzzles',
                localField: 'puzzle',
                foreignField: '_id',
                as: 'puzzle'
              }
            },
            {
              $lookup: {
                from: 'Users',
                localField: 'createdBy',
                foreignField: '_id',
                as: 'createdByData'
              }
            },
            {
              $addFields: {
                puzzle: { $arrayElemAt: ['$puzzle', 0] },
                createdBy: {
                  $cond: {
                    if: { $gt: [{ $size: '$createdByData' }, 0] },
                    then: {
                      $let: {
                        vars: { user: { $arrayElemAt: ['$createdByData', 0] } },
                        in: {
                          _id: '$$user._id',
                          name: '$$user.name',
                          email: '$$user.email'
                        }
                      }
                    },
                    else: '$createdBy'
                  }
                }
              }
            },
            {
              $project: {
                createdByData: 0
              }
            }
          ]
        }
      }
    ];

    const result = await Questions.aggregate(aggregationPipeline);

    const total = result[0]?.metadata[0]?.total || 0;
    const questions = result[0]?.data || [];

    const response = {
      docs: questions,
      totalDocs: total,
      limit: limit,
      page: page,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1
    };

    res
      .status(httpStatus.OK)
      .json(
        buildResponse(httpStatus.OK, response, 'Questions fetched successfully')
      );
  } catch (err) {
    handleError(res, err);
  }
};

export const getQuestionById = async (req, res) => {
  try {
    const validatedData = matchedData(req);

    const question = await Questions.findById(validatedData.id)
      .populate('tags')
      .populate('puzzle')
      .populate('createdBy', 'name email');

    if (!question) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'Question not found');
    }

    if (question.isDeleted === true) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'Question is deleted');
    }

    res
      .status(httpStatus.OK)
      .json(
        buildResponse(httpStatus.OK, question, 'Question fetched successfully')
      );
  } catch (err) {
    handleError(res, err);
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    const validatedData = matchedData(req);

    const question = await Questions.findById(validatedData.id);

    if (!question) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'Question not found');
    }

    if (question.isDeleted === true) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'Question already deleted');
    }

    question.isDeleted = true;
    await question.save();

    res
      .status(httpStatus.OK)
      .json(buildResponse(httpStatus.OK, 'Question deleted successfully'));
  } catch (err) {
    handleError(res, err);
  }
};

export const deleteMultipleQuestions = async (req, res) => {
  try {
    const validatedData = matchedData(req);
    console.log({ validatedData });

    const { ids } = validatedData;
    console.log({ ids });

    // Check if any questions exist with the provided IDs that are NOT deleted
    const existingQuestions = await Questions.find({
      _id: { $in: ids },
      isDeleted: { $ne: true } // isDeleted is not true (includes false, null, undefined)
    });

    console.log({ existingQuestions });

    if (existingQuestions.length === 0) {
      throw buildErrorObject(
        httpStatus.NOT_FOUND,
        'No active questions found with the provided IDs'
      );
    }

    // Soft delete all valid questions
    const result = await Questions.updateMany(
      {
        _id: { $in: ids },
        isDeleted: { $ne: true } // Update only questions that are not already deleted
      },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date()
        }
      }
    );

    // Check how many questions were actually deleted
    if (result.modifiedCount === 0) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'No questions were deleted');
    }

    res
      .status(httpStatus.OK)
      .json(
        buildResponse(
          httpStatus.OK,
          `Successfully deleted ${result.modifiedCount} question(s)`
        )
      );
  } catch (error) {
    handleError(res, error);
  }
};

export const cloneQuestion = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const validatedData = matchedData(req);
    const questionId = validatedData.id;

    // Fetch original data
    const question = await Questions.findById(questionId).session(session);
    const comments = await Comments.find({
      questionId,
      isDeleted: { $ne: true }
    }).session(session);

    const medias = await Medias.find({
      questionId,
      isDeleted: { $ne: true }
    }).session(session);

    const settings = await Settings.findOne({
      questionId,
      isDeleted: { $ne: true }
    }).session(session);

    console.log({ question, comments, medias, settings });

    if (!question) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'Question not found');
    }

    if (question.isDeleted === true) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'Question is deleted');
    }

    // Clone question (main document)
    const clonedQuestionData = {
      ...question.toObject(),
      _id: new mongoose.Types.ObjectId(),
      questionName: `${question.questionName} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false
    };
    delete clonedQuestionData.__v; // Remove version key

    const clonedQuestion = new Questions(clonedQuestionData);
    await clonedQuestion.save({ session });

    // Clone comments
    const clonedComments = comments.map((comment) => ({
      ...comment.toObject(),
      _id: new mongoose.Types.ObjectId(),
      questionId: clonedQuestion._id,
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false
    }));

    if (clonedComments.length > 0) {
      await Comments.insertMany(clonedComments, { session });
    }

    // Clone medias
    const clonedMedias = medias.map((media) => ({
      ...media.toObject(),
      _id: new mongoose.Types.ObjectId(),
      questionId: clonedQuestion._id,
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false
    }));

    if (clonedMedias.length > 0) {
      await Medias.insertMany(clonedMedias, { session });
    }

    // Clone settings
    if (settings) {
      const clonedSettingsData = {
        ...settings.toObject(),
        _id: new mongoose.Types.ObjectId(),
        questionId: clonedQuestion._id,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false
      };
      delete clonedSettingsData.__v;

      const clonedSettings = new Settings(clonedSettingsData);
      await clonedSettings.save({ session });
    }

    // Commit transaction
    await session.commitTransaction();

    res.status(httpStatus.CREATED).json(
      buildResponse(
        httpStatus.CREATED,
        {
          clonedQuestionId: clonedQuestion._id,
          message: 'Question cloned successfully with all related data'
        },
        'Question cloned successfully'
      )
    );
  } catch (err) {
    // Abort transaction on error
    await session.abortTransaction();
    handleError(res, err);
  } finally {
    // End session
    session.endSession();
  }
};
