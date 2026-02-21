import { Request, Response } from 'express'
import Team from '../db/models/team.schema'
import httpStatus from 'http-status'

export const createTeam = async (req: Request, res: Response) => {
  const { user } = res.locals as any
  const { name } = req.body as { name?: string }

  if (!name || !name.trim()) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: 'Team name is required'
    })
  }

  const trimmedName = name.trim()

  const existingForUser = await Team.findOne({ ownerPlayerId: user.playerId })
  if (existingForUser) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: 'You have already created a team'
    })
  }

  const existingByName = await Team.findOne({
    name: { $regex: new RegExp(`^${trimmedName}$`, 'i') }
  })

  if (existingByName) {
    return res.status(httpStatus.CONFLICT).json({
      success: false,
      message: 'Team name already taken'
    })
  }

  const team = await Team.create({
    name: trimmedName,
    ownerPlayerId: user.playerId
  })

  return res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Team created successfully',
    data: team
  })
}

export const getMyTeam = async (req: Request, res: Response) => {
  const { user } = res.locals as any

  const team = await Team.findOne({ ownerPlayerId: user.playerId }).lean()

  if (!team) {
    return res.status(httpStatus.OK).json({
      success: true,
      message: 'No team found',
      data: null
    })
  }

  return res.status(httpStatus.OK).json({
    success: true,
    message: 'Team fetched successfully',
    data: team
  })
}

