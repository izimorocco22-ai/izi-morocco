import { check, query } from "express-validator";
import validateRequest from "../utils/validateRequest.js";
import { paginationValidator } from "./paginate.validator.js";





export const getActivationCode = [
    check('playerId')
        .exists()
        .withMessage('Player ID is required')
        .notEmpty()
        .withMessage('Player ID cannot be empty'),


    check('gameId')
        .exists()
        .withMessage('Game ID is required')
        .notEmpty()
        .withMessage('Game ID cannot be empty'),


    check('expiresAt')
        .optional(),

    check('quantity')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Quantity must be a positive integer'),


    (req, res, next) => validateRequest(req, res, next)
]

export const getAllActivationCodesForAdminValidator = [
    ...paginationValidator,
    (req, res, next) => validateRequest(req, res, next)
]
