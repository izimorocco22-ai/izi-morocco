import { body, check, param, query } from 'express-validator';
import { paginationValidator } from './paginate.validator.js';
import validateRequest from '../utils/validateRequest.js';

export const createGameInfoValidator = [
  check('title')
    .exists()
    .withMessage('Title is required')
    .bail()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .bail()
    .isString()
    .withMessage('Title must be a string')
    .trim()
    .escape(),

  check('introMessage')
    .optional()
    .isObject()
    .withMessage('Intro message must be an object'),

  check('finishMessage')
    .optional()
    .isObject()
    .withMessage('Finish message must be an object'),

  check('language')
    .optional()
    .isString()
    .withMessage('Language must be a string')
    .isIn(['english', 'french', 'spanish', 'arabic'])
    .withMessage('Invalid language'),

  check('status')
    .optional()
    .isString()
    .withMessage('Status must be a string')
    .isIn(['active', 'inactive'])
    .withMessage('Invalid status'),

  check('username')
    .optional()
    .trim()
    .isString()
    .withMessage('Username must be a string')
    .notEmpty()
    .withMessage('Username cannot be empty'),

  check('password')
    .optional()
    .isString()
    .withMessage('Password must be a string')
    .notEmpty()
    .withMessage('Password cannot be empty'),

  check().custom((value, { req }) => {
    const { username, password } = req.body;
    if ((username && !password) || (!username && password)) {
      throw new Error(
        'Both username and password must be provided together, or neither should be provided'
      );
    }
    return true;
  }),

  check('timeLimit')
    .exists()
    .withMessage('Time limit is required')
    .bail()
    .isString()
    .withMessage('Time limit must be a string')
    .isIn(['no_time_limit', 'duration', 'end_time'])
    .withMessage('Invalid time limit option'),

  check('duration.unit').custom((value, { req }) => {
    const timeLimit = req.body.timeLimit;
    if (timeLimit === 'duration') {
      if (!value) {
        throw new Error(
          'Duration unit is required when time limit is "duration"'
        );
      }
      if (typeof value !== 'string') {
        throw new Error('Duration unit must be a string');
      }
      if (!['seconds', 'minutes', 'hours', 'days'].includes(value)) {
        throw new Error(
          'Duration unit must be one of: seconds, minutes, hours, days'
        );
      }
    }
    return true;
  }),

  check('duration.value').custom((value, { req }) => {
    const timeLimit = req.body.timeLimit;
    if (timeLimit === 'duration') {
      if (!value) {
        throw new Error(
          'Duration value is required when time limit is "duration"'
        );
      }
      if (isNaN(value) || value < 1) {
        throw new Error('Duration value must be a positive number');
      }
    }
    return true;
  }),

  // check('endTime').custom((value, { req }) => {
  //   const timeLimit = req.body.timeLimit;
  //   if (timeLimit === 'end_time') {
  //     if (!value) {
  //       throw new Error('End time is required when time limit is "end_time"');
  //     }
  //   }
  //   return true;
  // }),

  check('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array of ObjectIds'),

  check('tags.*')
    .optional()
    .isMongoId()
    .withMessage('Each tag must be a valid MongoDB ObjectId'),

  check('thumbnail')
    .exists()
    .withMessage('Thumbnail is required')
    .bail()
    .notEmpty()
    .withMessage('Thumbnail cannot be empty')
    .bail()
    .isString()
    .withMessage('Thumbnail must be a string')
    .trim()
    .escape(),

  check('backGroundImage')
    .optional()
    .isString()
    .withMessage('BackGround Image must be a string'),

  check('playgrounds')
    .optional()
    .isArray()
    .withMessage('Playgrounds must be an array'),

  check('playgrounds.*.name')
    .optional()
    .notEmpty()
    .withMessage('Playground name is required')
    .isString()
    .withMessage('Playground name must be a string'),

  check('playgrounds.*.image')
    .optional()
    .notEmpty()
    .withMessage('Playground image is required')
    .isString()
    .withMessage('Playground image must be a string'),

  (req, res, next) => validateRequest(req, res, next)
];

export const updateGameInfoValidator = [
  param('id')
    .exists()
    .withMessage('Game ID is required')
    .bail()
    .notEmpty()
    .withMessage('Game ID cannot be empty')
    .bail()
    .isMongoId()
    .withMessage('Invalid Game ID'),

  check('title')
    .optional()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .bail()
    .isString()
    .withMessage('Title must be a string')
    .trim()
    .escape(),

  check('introMessage')
    .optional()
    .isObject()
    .withMessage('Intro message must be an object'),

  check('finishMessage')
    .optional()
    .isObject()
    .withMessage('Finish message must be an object'),

  check('language')
    .optional()
    .isString()
    .withMessage('Language must be a string')
    .bail()
    .isIn(['english', 'french', 'spanish', 'arabic'])
    .withMessage('Invalid language'),

  check('status')
    .optional()
    .isString()
    .withMessage('Status must be a string')
    .bail()
    .isIn(['active', 'inactive'])
    .withMessage('Invalid status'),

  check('username')
    .optional()
    .trim()
    .isString()
    .withMessage('Username must be a string')
    .bail()
    .notEmpty()
    .withMessage('Username cannot be empty'),

  check('password')
    .optional()
    .isString()
    .withMessage('Password must be a string')
    .bail()
    .notEmpty()
    .withMessage('Password cannot be empty'),

  check('_').custom((value, { req }) => {
    const { username, password } = req.body;
    if ((username && !password) || (!username && password)) {
      throw new Error(
        'Both username and password must be provided together, or neither should be provided'
      );
    }
    return true;
  }),

  check('timeLimit')
    .optional()
    .isString()
    .withMessage('Time limit must be a string')
    .bail()
    .isIn(['no_time_limit', 'duration', 'end_time'])
    .withMessage('Invalid time limit option'),

  check('duration.unit')
    .optional()
    .custom((value, { req }) => {
      const timeLimit = req.body.timeLimit;

      if (timeLimit === 'duration') {
        if (!value) {
          throw new Error(
            'Duration unit is required when time limit is "duration"'
          );
        }
        if (typeof value !== 'string') {
          throw new Error('Duration unit must be a string');
        }
        if (!['seconds', 'minutes', 'hours', 'days'].includes(value)) {
          throw new Error(
            'Duration unit must be one of: seconds, minutes, hours, days'
          );
        }
      }

      return true;
    }),

  check('duration.value')
    .optional()
    .custom((value, { req }) => {
      const timeLimit = req.body.timeLimit;

      if (timeLimit === 'duration') {
        if (!value && value !== 0) {
          throw new Error(
            'Duration value is required when time limit is "duration"'
          );
        }
        if (typeof value !== 'number' || value < 1) {
          throw new Error('Duration value must be a positive number');
        }
      }

      return true;
    }),

  // check('endTime')
  //   .optional()
  //   .custom((value, { req }) => {
  //     const timeLimit = req.body.timeLimit;

  //     if (timeLimit === 'end_time') {
  //       if (!value) {
  //         throw new Error('End time is required when time limit is "end_time"');
  //       }
  //       const endTime = new Date(value);
  //       if (isNaN(endTime.getTime())) {
  //         throw new Error('End time must be a valid date');
  //       }
  //       if (endTime <= new Date()) {
  //         throw new Error('End time must be in the future');
  //       }
  //     }

  //     return true;
  //   }),

  check('tags').optional().isArray().withMessage('Tags must be an array'),

  check('tags.*')
    .optional()
    .isMongoId()
    .withMessage('Each tag must be a valid MongoDB ObjectId'),

  check('thumbnail')
    .optional()
    .notEmpty()
    .withMessage('Thumbnail cannot be empty')
    .bail()
    .isString()
    .withMessage('Thumbnail must be a string')
    .bail(),

  check('backGroundImage')
    .optional({ nullable: true })
    .isString()
    .withMessage('Background image must be a string')
    .bail(),

  check('playgrounds')
    .optional()
    .isArray()
    .withMessage('Playgrounds must be an array'),

  check('playgrounds.*.name')
    .optional()
    .notEmpty()
    .withMessage('Playground name is required')
    .isString()
    .withMessage('Playground name must be a string'),

  check('playgrounds.*.image')
    .optional()
    .notEmpty()
    .withMessage('Playground image is required')
    .isString()
    .withMessage('Playground image must be a string'),

  (req, res, next) => validateRequest(req, res, next)
];

export const getGameInfoByIdValidator = [
  param('id')
    .exists()
    .withMessage('Game ID is required')
    .bail()
    .notEmpty()
    .withMessage('Game ID cannot be empty')
    .bail()
    .isMongoId()
    .withMessage('Invalid Game ID'),

  (req, res, next) => validateRequest(req, res, next)
];

export const getAllGamesValidator = [
  ...paginationValidator,

  query('status')
    .optional()
    .isString()
    .withMessage('Status must be a string')
    .isIn(['active', 'inactive', 'all'])
    .withMessage('Invalid status'),

  query('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array of ObjectIds'),

  query('tags.*')
    .optional()
    .isMongoId()
    .withMessage('Each tag must be a valid MongoDB ObjectId'),

  query('updatedAt')
    .optional()
    .isString()
    .withMessage('updatedAt must be a string')
    .isIn(['1', '-1', 'asc', 'desc'])
    .withMessage('Invalid updatedAt'),

  query('language')
    .optional()
    .isString()
    .withMessage('Language must be a string')
    .isIn(['english', 'french', 'spanish', 'arabic'])
    .withMessage('Invalid language'),

  (req, res, next) => validateRequest(req, res, next)
];

export const togggleActiveStatus = [
  param('id')
    .exists()
    .withMessage('Game ID is required')
    .bail()
    .notEmpty()
    .isMongoId()
    .withMessage('Game ID should be a valid MongoId'),

  (req, res, next) => validateRequest(req, res, next)
];

export const validateDeleteGame = [
  param('id')
    .exists()
    .withMessage('Game ID is required')
    .bail()
    .isMongoId()
    .withMessage('Game ID should be a valid MongoId'),

  (req, res, next) => validateRequest(req, res, next)
];
