import { body, ValidationChain } from 'express-validator'
import { Request, Response } from 'express'
import { getFieldIntoReq, setFieldsIntoLocals } from '../utils/funcations'
import err from '../utils/err'
import jwt from 'jsonwebtoken'
import { DynamicObjectType } from '../types'
import bcrypt from 'bcrypt'
import Players from '../db/models/players.schema'

export const signupSchema: ValidationChain[] = [
  body('name')
    .isString()
    .withMessage('Name must be a string')
    .bail()
    .isLength({ min: 3 })
    .withMessage('Name must be at least 3 characters'),

  body('email').isEmail().withMessage('Invalid email address'),

  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .isMobilePhone('any')
    .withMessage('Please enter a valid mobile number.'),

  body('password')
    .isString()
    .withMessage('Password must be at least 6 characters')
    .bail()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
]

// Login Schema
export const loginSchema: ValidationChain[] = [
  body('email').isEmail().withMessage('Invalid email address'),

  body('password')
    .isString()
    .withMessage('Password must be a string')
    .bail()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
]

export const forgetPasswordSchema: ValidationChain[] = [
  body('email').isEmail().withMessage('Invalid email address')
]

export const setupPasswordSchema: ValidationChain[] = [
  body('password')
    .isString()
    .withMessage('Password must be a string')
    .bail()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),

  body('confirmPassword')
    .isString()
    .withMessage('Confirm Password must be a string')
    .bail()
    .isLength({ min: 6 })
    .withMessage('Confirm Password must be at least 6 characters')
    .bail()
    .custom((confirmPassword: string, { req }) => {
      if (confirmPassword !== req.body.password) {
        throw new Error('Passwords do not match')
      }
      return true
    })
]

export const resendOTPSchema: ValidationChain[] = [
  body('email').isEmail().withMessage('Invalid email address'),
  body('reqFor')
    .isIn(['ACCOUNT_VERIFICATION', 'FORGET_PASSWORD'])
    .withMessage('Invalid request type.')
]

export const isEmailAlreadyRegistered = async (req: Request, res: Response) => {
  const email = getFieldIntoReq(req, 'email')
  const userDetails = await Players.findOne({ email })

  if (userDetails) {
    return err('Email is already registered', 'email')
  }

  return null
}

// Express-validator version for email uniqueness check
export const checkEmailUnique = body('email').custom(async (email: string) => {
  const userDetails = await Players.findOne({ email })
  if (userDetails) {
    throw new Error('Email is already registered')
  }
  return true
})

export const isTokenValid = async (req: Request, res: Response) => {
  const token = getFieldIntoReq(req, 'token')

  if (!token || typeof token !== 'string' || !token.trim()) {
    return err('Please provide a valid token.', 'token')
  }

  try {
    const tokenData = jwt.verify(
      token,
      process.env.JWT_SECRET || ''
    ) as DynamicObjectType

    if (!tokenData || !tokenData?.id) {
      return err('Invalid or expired token.', 'token')
    }

    const userData = await Players.findById(tokenData.id)

    if (!userData) {
      return err('Invalid or expired token.', 'token')
    }

    setFieldsIntoLocals(res, {
      userData
    })
  } catch (error) {
    return err('Invalid token', 'token')
  }

  return null
}

export const isPrevCurrPasswordValid = async (req: Request, res: Response) => {
  const { user } = res.locals
  const { password } = req.body

  if (user?.password) {
    const isSamePrevCurr = await bcrypt.compare(password, user?.password)

    if (isSamePrevCurr) {
      // eslint-disable-next-line quotes
      return err("You can't set previous password", 'password')
    }
  }

  return null
}
