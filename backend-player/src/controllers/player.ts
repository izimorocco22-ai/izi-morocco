import { Request, Response } from 'express'
import { removeExtraFieldFormObject } from '../utils/funcations'
import Player from '../db/models/players.schema'
import Team from '../db/models/team.schema'
import GameLogs from '../db/models/played-game-status.schema'
import TempStorage from '../db/models/tempStorage.schema'
import GameActivation from '../db/models/game-activation.schema'
import { isReviewEmail } from '../utils/reviewAccount'
import mongoDB from '../db'
import { generateUUID } from '../utils/uuid'
import bcrypt from 'bcrypt'
import { base64ToBuffer, uploadFromBuffer } from '../utils/fileuplode'

export const viewPlayer = async (req: Request, res: Response) => {
  const user = res.locals.user

  delete user.password
  delete user._id

  return res.status(200).json({
    success: true,
    message: 'User details fetched successfully',
    data: {
      ...user
    }
  })
}

export const editPlayer = async (req: Request, res: Response) => {
  const { name, phone, profileImage } = req.body
  const { user } = res.locals

  const updateData = {
    name,
    phone,
    profileImage
  }

  const pureUpdateData = removeExtraFieldFormObject(
    updateData,
    ['name', 'phone', 'profileImage'],
    true,
    [false]
  )

  if (Object.keys(pureUpdateData).length) {
    await Player.updateOne(
      { playerId: user.playerId },
      { ...pureUpdateData, updatedAt: new Date() }
    )
  }

  res.status(200).json({
    success: true,
    message: 'Member details updated successfully'
  })
}

export const deleteUser = async (req: Request, res: Response) => {
  const { userId } = req.params

  await Player.updateOne({ playerId: userId }, { isDeleted: true })

  res.status(200).json({
    success: true,
    message: 'Family member deleted successfully'
  })
}

// Permanently delete the signed-in player and the data tied to them
// (App Store guideline 5.1.1(v)). Activation codes are kept: they are issued
// by the admin and freeing them would allow a used code to be reused.
export const deleteMyAccount = async (req: Request, res: Response) => {
  const { playerId, email } = res.locals.user

  // Exception: the App Store review account is re-created with a new id on
  // its next login, so release its codes or the reviewer can't play again.
  if (isReviewEmail(email)) {
    await GameActivation.updateMany(
      { claimedBy: playerId },
      { $unset: { claimedBy: '' } }
    )
  }

  await Promise.all([
    // A team can't outlive its owner; members just leave the team
    Team.deleteOne({ ownerPlayerId: playerId }),
    Team.updateMany({ members: playerId }, { $pull: { members: playerId } }),
    GameLogs.deleteMany({ playerId }),
    TempStorage.deleteMany({
      key: {
        $in: [`accountVerification_${playerId}`, `forgetPassword_${playerId}`]
      }
    })
  ])
  await Player.deleteOne({ playerId })

  return res.status(200).json({
    success: true,
    message: 'Account deleted successfully'
  })
}
