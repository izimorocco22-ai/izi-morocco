import { check } from 'express-validator';
import validateRequest from '../utils/validateRequest.js';

export const mutateQuestionSettingsValidator = [
  check('id')
    .exists()
    .withMessage('Question ID is required')
    .bail()
    .notEmpty()
    .withMessage('Question ID cannot be empty')
    .bail()
    .isMongoId()
    .withMessage('Invalid Question ID'),

  check('timeLimit')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Time limit must be a positive integer'),

  check('timeUnit')
    .optional({ nullable: true })
    .isString()
    .withMessage('Time unit must be a string')
    .trim()
    .escape()
    .isIn(['days', 'minutes', 'hours'])
    .withMessage('Invalid time unit'),

  check('iconName')
    .optional({ nullable: true })
    .isString()
    .withMessage('Icon name must be a string')
    .trim()
    .escape(),

  check('radiusColor')
    .exists()
    .withMessage('Radius color is required')
    .bail()
    .notEmpty()
    .withMessage('Radius color cannot be empty')
    .bail()
    .isString()
    .withMessage('Radius color must be a string')
    .trim()
    .escape(),

  check('locationRadius')
    .exists()
    .withMessage('Location radius is required')
    .bail()
    .notEmpty()
    .withMessage('Location radius cannot be empty')
    .bail()
    .isInt({ min: 0 })
    .withMessage('Location radius must be a non-negative number'),

  check('icon')
    .optional({ nullable: true })
    .isString()
    .withMessage('Icon must be a string')
    .trim(),

  check('behaviorOption')
    .optional({ nullable: true })
    .isIn(['remove_on_answer', 'keep_until_correct', 'keep_until_end'])
    .withMessage('Invalid behavior option'),

  // check('durations.deactivateOnIncorrectSeconds')
  //   .custom((value, { req }) => {
  //     const option = req.body.behaviorOption;
  //     if (option === 'keep_until_correct') {
  //       if (!value) {
  //         throw new Error('Deactivate duration for incorrect answer is required when behavior is "keep_until_correct"');
  //       }
  //       if (isNaN(value) || value < 1) {
  //         throw new Error('Deactivate duration must be a positive number');
  //       }
  //     }
  //     return true;
  //   }),

  // check('durations.deactivateAfterClosingSeconds')
  //   .custom((value, { req }) => {
  //     const option = req.body.behaviorOption;
  //     if (option === 'keep_until_end') {
  //       if (!value) {
  //         throw new Error('Deactivate duration after closing is required when behavior is "keep_until_end"');
  //       }
  //       if (isNaN(value) || value < 1) {
  //         throw new Error('Deactivate duration must be a positive number');
  //       }
  //     }
  //     return true;
  //   }),


  check('language')
    .optional({ nullable: true })
    .isString()
    .withMessage('Language must be a string')
    .trim()
    .isIn(['english', 'german', 'deutsch' , 'russian' , 'estonian' , 'french'])
    .withMessage('Invalid language'),

  (req, res, next) => validateRequest(req, res, next)
];


export const getQuestionSettingsValidator = [
  check('id')
    .exists()
    .withMessage('Question ID is required')
    .bail()
    .notEmpty()
    .withMessage('Question ID cannot be empty')
    .bail()
    .isMongoId()
    .withMessage('Invalid Question ID'),

  (req, res, next) => validateRequest(req, res, next)
];
