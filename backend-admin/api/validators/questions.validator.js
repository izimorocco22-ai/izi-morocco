import validateRequest from '../utils/validateRequest.js';
import { body, check, param, query } from 'express-validator';
import { paginationValidator } from './paginate.validator.js';

const validateOptionsUniqueness = (options) => {
  const texts = options.map((opt) => {
    if (opt.text === null || opt.text === undefined) {
      throw new Error('Option text is required');
    }
    return String(opt.text).trim().toLowerCase();
  });
  const uniqueTexts = new Set(texts);
  if (texts.length !== uniqueTexts.size) {
    throw new Error('Options must have unique text values');
  }
  return true;
};

const validateCorrectAnswersUniqueness = (answers) => {
  const texts = answers.map((ans) => {
    if (ans === null || ans === undefined) {
      throw new Error('Correct answer cannot be null or undefined');
    }
    return String(ans).trim().toLowerCase();
  });
  const uniqueTexts = new Set(texts);
  if (texts.length !== uniqueTexts.size) {
    throw new Error('Correct answers must be unique');
  }
  return true;
};

const validateCorrectAnswersMatchOptions = (answers, { req }) => {
  const answerType = req.body.answerType;

  if (answerType === 'text' || answerType === 'number' || answerType === 'code_box' || answerType === 'puzzle') {
    return true;
  }

  const options = req.body.options || [];
  const correctOptionTexts = options
    .filter((opt) => opt.isCorrect === true)
    .map((opt) => String(opt.text).trim().toLowerCase());

  const normalizedAnswers = answers.map((ans) =>
    String(ans).trim().toLowerCase()
  );
  const correctOptionsSet = new Set(correctOptionTexts);

  for (const answer of normalizedAnswers) {
    if (!correctOptionsSet.has(answer)) {
      throw new Error(
        'Correct answer does not match any option marked as isCorrect'
      );
    }
  }

  if (answerType === 'mcq' && correctOptionsSet.size !== 1) {
    throw new Error('Exactly one option must be correct for mcq');
  }

  if (answerType === 'multiple' && correctOptionsSet.size < 2) {
    throw new Error('At least two options must be correct for multiple');
  }

  if (normalizedAnswers.length !== correctOptionsSet.size) {
    throw new Error(
      'Number of correctAnswers must match options marked as correct'
    );
  }

  return true;
};

export const createQuestionValidator = [
  check('questionName')
    .exists()
    .withMessage('Question Name is required')
    .notEmpty()
    .withMessage('Question Name cannot be empty')
    .isString()
    .withMessage('Question Name must be a string'),

  check('questionDescription')
    .optional()
    .custom((value) => {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new Error("Question description can't be empty");
      }

      return true;
    }),

  check('answerType')
    .exists()
    .withMessage('Answer Type is required')
    .isIn(['text', 'mcq', 'number', 'multiple', 'no_answer', 'puzzle', 'take_photo', 'record_video', 'augmented_photo', 'code_box'])
    .withMessage(
      'Answer Type must be text, mcq, multiple, number, no_answer, puzzle, take_photo, record_video, augmented_photo, or code_box'
    ),

  check('points')
    .exists()
    .withMessage('Points are required')
    .isInt({ min: 0 })
    .withMessage('Points must be a positive integer'),

  check('options')
    .if((value, { req }) => ['mcq', 'multiple'].includes(req.body.answerType))
    .exists()
    .withMessage('Options are required for MCQ/Multiple')
    .isArray({ min: 2 })
    .withMessage('At least 2 options required')
    .custom(validateOptionsUniqueness),

  check('options.*.text')
    .if((value, { req }) => ['mcq', 'multiple'].includes(req.body.answerType))
    .exists()
    .withMessage('Option text is required')
    .notEmpty()
    .withMessage('Option text cannot be empty'),

  check('options.*.isCorrect')
    .if((value, { req }) => ['mcq', 'multiple'].includes(req.body.answerType))
    .exists()
    .withMessage('isCorrect is required for each option')
    .isBoolean()
    .withMessage('isCorrect must be a boolean'),

  check('options')
    .if((value, { req }) =>
      ['text', 'number', 'no_answer', 'take_photo', 'record_video', 'augmented_photo', 'code_box'].includes(req.body.answerType)
    )
    .not()
    .exists()
    .withMessage(
      'Options should not be provided for text/number/no_answer/media/code_box answer types'
    ),

  check('correctAnswers')
    .if((value, { req }) => ['no_answer', 'take_photo', 'record_video', 'augmented_photo'].includes(req.body.answerType))
    .optional()
    .isArray()
    .withMessage('correctAnswers must be an array for no_answer/media type')
    .custom((value) => {
      if (value && value.length > 0) {
        throw new Error('correctAnswers must be empty for no_answer/media type');
      }
      return true;
    }),

  check('correctAnswers')
    .if(
      (value, { req }) => !['no_answer', 'take_photo', 'record_video', 'augmented_photo'].includes(req.body.answerType)
    )
    .exists()
    .withMessage('correctAnswers are required')
    .isArray()
    .withMessage('correctAnswers must be an array with at least one element')
    .custom(validateCorrectAnswersUniqueness)
    .custom(validateCorrectAnswersMatchOptions),

  check('correctAnswers')
    .if((value, { req }) => ['text', 'number', 'code_box'].includes(req.body.answerType))
    .isArray({ min: 1, max: 1 })
    .withMessage(
      'text/number/code_box answer types must have exactly one correct answer'
    ),

  check('codeBoxConfig')
    .if((value, { req }) => req.body.answerType === 'code_box')
    .exists()
    .withMessage('Code Box configuration is required')
    .custom((value) => {
      if (typeof value !== 'object' || value === null) {
        throw new Error('Code Box configuration must be an object');
      }
      if (!value.length || typeof value.length !== 'number' || value.length < 1) {
        throw new Error('Code Box length must be a positive number');
      }
      if (!value.mode || !['numeric', 'alpha', 'alphanumeric'].includes(value.mode)) {
        throw new Error('Code Box mode must be numeric, alpha, or alphanumeric');
      }
      return true;
    }),

  check('puzzleConfig')
    .if((value, { req }) => req.body.answerType === 'puzzle')
    .optional()
    .custom((value) => {
      if (value && (typeof value !== 'object' || value === null)) {
        throw new Error('Puzzle configuration must be an object');
      }
      if (value && value.matchType && !['exact', 'domain', 'path'].includes(value.matchType)) {
        throw new Error('Puzzle match type must be exact, domain, or path');
      }
      return true;
    }),

  check('puzzle')
    .if((value, { req }) => req.body.answerType === 'puzzle')
    .exists()
    .withMessage('Puzzle ID is required for puzzle type questions')
    .isMongoId()
    .withMessage('Invalid Puzzle ID'),

  check('puzzle')
    .if((value, { req }) => req.body.answerType !== 'puzzle')
    .not()
    .exists()
    .withMessage('Puzzle should not be provided for non-puzzle answer types'),

  check('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array of ObjectIds'),

  check('tags.*')
    .optional()
    .isMongoId()
    .withMessage('Each tag must be a valid MongoDB ObjectId'),

  check('createdBy')
    .optional({ nullable: true })
    .isMongoId()
    .withMessage('Invalid user ID'),

  (req, res, next) => validateRequest(req, res, next)
];

export const editQuestionValidator = [
  param('id')
    .exists()
    .withMessage('Question ID is required')
    .isMongoId()
    .withMessage('Invalid Question ID'),

  check('questionName')
    .exists()
    .withMessage('Question Name is required')
    .notEmpty()
    .withMessage('Question Name cannot be empty')
    .isString()
    .withMessage('Question Name must be a string'),

  check('questionDescription')
    .optional()
    .custom((value) => {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new Error('Question description must be an object');
      }

      return true;
    }),

  check('answerType')
    .optional()
    .isIn(['text', 'mcq', 'number', 'multiple', 'no_answer', 'puzzle', 'take_photo', 'record_video', 'augmented_photo', 'code_box'])
    .withMessage(
      'Answer Type must be text, mcq, multiple, number, no_answer, puzzle, take_photo, record_video, augmented_photo, or code_box'
    ),

  check('points')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Points must be a positive integer'),

  check('options').optional().isArray().withMessage('Options must be an array'),

  check('correctAnswers')
    .optional()
    .isArray()
    .withMessage('correctAnswers must be an array'),

  check('puzzle').optional().isMongoId().withMessage('Invalid Puzzle ID'),

  check('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array of ObjectIds'),

  check('tags.*')
    .optional()
    .isMongoId()
    .withMessage('Each tag must be a valid MongoDB ObjectId'),

  (req, res, next) => validateRequest(req, res, next)
];

export const deleteQuestionValidator = [
  param('id')
    .exists()
    .withMessage('Question ID is required')
    .isMongoId()
    .withMessage('Invalid Question ID'),

  (req, res, next) => validateRequest(req, res, next)
];
export const deleteQuestionsValidator = [
  body('ids')
    .isArray({ min: 1 })
    .exists()
    .withMessage('Question ID is required')
    .isMongoId()
    .withMessage('Invalid Question ID'),

  (req, res, next) => validateRequest(req, res, next)
];

export const getQuestionsValidator = [
  ...paginationValidator,

  query('answerType')
    .optional()
    .isIn(['text', 'mcq', 'number', 'multiple', 'no_answer', 'puzzle', 'take_photo', 'record_video', 'augmented_photo', 'code_box'])
    .withMessage('Invalid answer type'),

  query('tags')
    .optional()
    .isString()
    .withMessage('Tags must be a string')
    .bail()
    .matches(/^[0-9a-fA-F]{24}(,[0-9a-fA-F]{24})*$/)
    .withMessage('Tags must be comma-separated valid MongoDB IDs'),

  (req, res, next) => validateRequest(req, res, next)
];

export const getQuestionByIdValidator = [
  param('id')
    .exists()
    .withMessage('Question ID is required')
    .isMongoId()
    .withMessage('Invalid Question ID'),

  (req, res, next) => validateRequest(req, res, next)
];
